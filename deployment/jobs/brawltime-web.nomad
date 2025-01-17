variable "sentry_dsn" {}
variable "github_user" {}
variable "github_token" {}
variable "brawlstars_email" {}
variable "brawlstars_password" {}
variable "brawlapi_token" {}

# git hash or "latest"
variable "tag" {}

variable "domain" {
  default = "brawltime.ninja"
}

job "brawltime-web" {
  datacenters = ["dc1"]

  constraint {
    attribute = "${node.class}"
    value = "worker"
  }

  update {
    max_parallel = 1
    canary = 1
    min_healthy_time = "10s"
    healthy_deadline = "5m"
    auto_revert = true
    auto_promote = true
  }

  group "web" {
    count = 4

    scaling {
      enabled = true
      min = 1
      max = 16

      policy {
        check "high_cpu" {
          source = "nomad-apm"
          group = "cpu-allocated"
          query = "avg_cpu-allocated"
          query_window = "10m"

          strategy "threshold" {
            upper_bound = 100
            lower_bound = 80
            within_bounds_trigger = 1
            delta = 1
          }
        }

        check "low_cpu" {
          source = "nomad-apm"
          group = "cpu-allocated"
          query = "avg_cpu-allocated"
          query_window = "10m"

          strategy "threshold" {
            upper_bound = 20
            lower_bound = 0
            within_bounds_trigger = 1
            delta = -1
          }
        }
      }
    }

    network {
      port "http" {}
    }

    service {
      name = "brawltime-web"
      port = "http"

      tags = [
        "traefik.enable=true",
        "traefik.http.routers.brawltime-web.rule=Host(`${var.domain}`)",
        "traefik.http.routers.brawltime-web-www.rule=Host(`www.${var.domain}`)",
      ]

      check {
        type = "http"
        path = "/health"
        interval = "10s"
        timeout  = "5s"

        check_restart {
          limit = 5
        }
      }
    }

    task "create-api-token" {
      lifecycle {
        hook = "prestart"
      }

      driver = "exec"

      # dynamically register token for current allocation and public IP address
      config {
        command = "/bin/bash"
        args = ["-e", "${NOMAD_TASK_DIR}/create_apikey.sh"]
      }

      template {
        data = <<-EOF
          EMAIL="${var.brawlstars_email}"
          PASSWORD="${var.brawlstars_password}"
        EOF
        destination = "secrets/credentials.env"
        env = true
      }

      template {
        data = file("./bin/create_apikey.sh")
        destination = "local/create_apikey.sh"
      }

      resources {
        cpu = 16
        memory = 32
      }
    }

    task "web" {
      driver = "docker"

      env {
        HOST = "0.0.0.0"
        PORT = "${NOMAD_PORT_http}"
        NODE_ENVIRONMENT = "production"
        NODE_OPTIONS = "--max-old-space-size=${NOMAD_MEMORY_MAX_LIMIT}"

        CUBE_URL = "https://cube.${var.domain}"
        MEDIA_URL = "https://media.${var.domain}"
        MANAGER_URL = "https://manager.${var.domain}"
        RENDER_URL = "https://render.${var.domain}"
        MYSQL_DATABASE = "brawltime"
        MYSQL_USER = "brawltime"
        MYSQL_PASSWORD = "brawltime"
        TRACKING_EXPIRE_AFTER_DAYS = "14"
        TRACKING_REFRESH_MINUTES = "1440"

        SENTRY_DSN = "${var.sentry_dsn}"
        DD_AGENT_HOST = "${attr.unique.network.ip-address}"

        ADSENSE_PUBID = "ca-pub-6856963757796636"
        QUANTCAST_CHOICE_ID = "Zj670A0xwScEY"
        GA4_ID = "G-8GGHZC6QR2"
        UA_ID = "UA-137233906-1"
        OPTIMIZE_ID = "OPT-PWZ78LC"
        PLAYWIRE_RAMP_PUBLISHER_ID = "1024864"
        PLAYWIRE_RAMP_SITE_ID = "74021"
        PLAYWIRE_RAMP_GA4_ID = "G-YBE993Z5SQ"
      }

      # FIXME containers do not respect host's DNS settings
      # https://github.com/hashicorp/nomad/issues/12894
      template {
        data = <<-EOF
          CLICKHOUSE_HOST = "{{ with service "clickhouse" }}{{ with index . 0 }}{{ .Address }}{{ end }}{{ end }}"
          MYSQL_HOST = "{{ with service "mariadb" }}{{ with index . 0 }}{{ .Address }}{{ end }}{{ end }}"
        EOF
        destination = "secrets/db.env"
        env = true
      }

      template {
        data = <<-EOF
          BRAWLSTARS_TOKEN="{{ key (printf "brawlstars-token/alloc-%s" (env "NOMAD_ALLOC_ID")) }}"
          BRAWLAPI_TOKEN="${var.brawlapi_token}"
        EOF
        destination = "secrets/brawlstars.env"
        env = true
      }

      config {
        image = "ghcr.io/schneefux/brawltime-web:${var.tag}"
        ports = ["http"]
        extra_hosts = [
          "${var.domain}:10.0.0.2",
          "cube.${var.domain}:10.0.0.2",
          "media.${var.domain}:10.0.0.2",
          "manager.${var.domain}:10.0.0.2",
          "render.${var.domain}:10.0.0.2"
        ]

        auth {
          username = "${var.github_user}"
          password = "${var.github_token}"
        }
      }

      resources {
        cpu = 1280
        memory = 768
        memory_max = 1536
      }
    }
  }
}
