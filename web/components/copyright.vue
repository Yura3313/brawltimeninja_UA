<template>
  <div>
    <p>
      &#169; 2018 - 2023 Brawl Time Ninja
      ({{ releaseVersion }})
      <span v-if="$i18n.locale != 'en'">
        &mdash; {{ $t('footer.translated-by') }} {{ $t('translators') }}
      </span>
    </p>
    <div class="mt-2 flex justify-center items-center gap-x-2">
      <span class="my-1">{{ $t('footer.support-me') }}</span>
      <b-button
        :secondary="!light"
        :light="light"
        href="https://discord.gg/uYfgznq"
        tag="a"
        xs
      >Discord</b-button>
      <b-button
        :secondary="!light"
        :light="light"
        href="https://twitter.com/brawltimeninja"
        tag="a"
        xs
      >Twitter</b-button>
      <b-button
        v-if="!isApp"
        :secondary="!light"
        :light="light"
        href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=Y9TKS7F2E2A2E"
        tag="a"
        xs
      >PayPal</b-button>
    </div>
    <p class="mt-2 text-xs leading-tight">
      This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it. For more information see Supercell's Fan Content Policy: www.supercell.com/fan-content-policy.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useIsApp } from '~/composables/app'

export default defineComponent({
  props: {
    light: {
      type: Boolean,
      default: false
    },
  },
  setup() {
    const { isApp } = useIsApp()

    return {
      isApp,
      releaseVersion: import.meta.env.VITE_GIT_REV.substring(0, 7)
    }
  },
})
</script>
