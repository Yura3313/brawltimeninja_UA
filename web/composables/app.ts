import { computed, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'
import { useRouter } from 'vue-router'
import { useLocalePath } from './compat'
import { usePreferencesStore } from '@/stores/preferences'

export function useIsApp() {
  const isPwa = ref<boolean>()
  const isTwa = ref<boolean>()

  onMounted(() => {
    // track some meta data
    // play store allows only 1 ad/page - TWA is detected via referrer
    isPwa.value = window.matchMedia('(display-mode: standalone)').matches
    isTwa.value = document.referrer.startsWith('android-app')
  })

  const isApp = computed(() => isPwa.value || isTwa.value)

  return {
    isApp,
    isPwa,
    isTwa,
  }
}


function detectAndroid() {
  return /android/i.test(navigator.userAgent)
}

function detectIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
}

export function useInstall(source: string) {
  const store = usePreferencesStore()
  const localePath = useLocalePath()
  const { isApp } = useIsApp()

  const installable = computed(() => {
    if (isApp.value) {
      return false
    }
    if (import.meta.env.SSR) {
      return false
    }
    if (installPrompt.value !== undefined) {
      return true
    }
    return detectAndroid() || detectIOS()
  })

  const install = async () => {
    const pwaSupported = installPrompt.value !== undefined
    if (pwaSupported) {
      installPrompt.value.prompt()
      const choice = await installPrompt.value.userChoice
      event('prompt', {
        'event_category': 'app',
        'event_label': choice.outcome,
      })
      clearInstallPrompt()
      return
    }

    if (detectAndroid()) {
      const referrer = '&referrer=utm_source%3Dwebsite%26utm_medium%3Dfallback'
      event('redirect_store', {
        'event_category': 'app',
        'event_label': 'fallback',
      })
      window.open('https://play.google.com/store/apps/details?id=xyz.schneefux.brawltimeninja' + referrer, '_blank')
      return
    }

    if (detectIOS()) {
      const router = useRouter()
      event('redirect_guide', {
        'event_category': 'app',
        'event_label': 'ios',
      })
      router.push(localePath('/install/ios'))
      return
    }
  }

  const dismissInstall = () => {
    event('dismiss', {
      'event_category': 'app',
      'event_label': `install_${source}`,
    })
    store.installBannerDismissed = true
    clearInstallPrompt()
  }
  const clickInstall = async () => {
    event('click', {
      'event_category': 'app',
      'event_label': `install_${source}`,
    })
    await install()
  }

  const installDismissed = computed(() => store.installBannerDismissed)

  return {
    install,
    installDismissed,
    installable,
    dismissInstall,
    clickInstall,
  }
}

const installPrompt = ref<any>()

export function setInstallPrompt(prompt: any) {
  installPrompt.value = prompt
}

export function useInstallPromptListeners() {
  if (!import.meta.env.SSR) {
    const installed = () => event('install', {
      'event_category': 'app',
      'event_label': 'install',
    })

    window.addEventListener('appinstalled', installed)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    })
  }
}

export function clearInstallPrompt() {
  installPrompt.value = undefined
}
