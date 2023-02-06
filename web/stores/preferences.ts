import { ref, computed, onMounted, watch } from 'vue'
import { defineStore } from 'pinia'
import { event, optIn } from 'vue-gtag'
import { setIsPwa, setIsTwa } from '@/composables/app'

interface StoredPlayer {
  tag: string
  name: string
}

export interface PlayerTotals {
  picks: number
  winRate: number
  trophyChange: number
}

export const usePreferencesStore = defineStore('preferences', () => {
  const version = ref<number>()
  const lastPlayers = ref<StoredPlayer[]>([])
  const userTag = ref<string>() // personal tag (last searched)
  const personalityTestResult = ref<string>()
  const cookiesAllowed = ref<boolean>()
  const adsAllowed = ref<boolean>()
  const installBannerDismissed = ref(false)

  const state = {
    version,
    lastPlayers,
    userTag,
    personalityTestResult,
    cookiesAllowed,
    adsAllowed,
    installBannerDismissed,
  }

  const consentPopupVisible = computed(() =>
    !import.meta.env.SSR && (cookiesAllowed.value == undefined || adsAllowed.value == undefined))

  function addLastPlayer(player: StoredPlayer) {
    const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

    const newLastPlayers = [clone(player), ...lastPlayers.value]
      .filter((player, index, arr) => index == arr.findIndex(p => p.tag == player.tag)) // unique
    lastPlayers.value = newLastPlayers.slice(0, 4)
  }

  function withdrawConsent() {
    cookiesAllowed.value = undefined
    adsAllowed.value = undefined
  }

  // sync with localstorage
  onMounted(() => {
    const data = JSON.parse(localStorage.getItem('brawlstars-ninja') || '{}')
    for (const key in state) {
      if (key in data) {
        state[key as keyof typeof state].value = data[key]
      }
    }
    // v10: migration to pinia-plugin-persistedstate
    version.value = 10
  })

  watch([...Object.values(state)], () => {
    if (state.version.value == undefined) {
      // load first
      return
    }

    const data: any = {}
    for (const key in state) {
      data[key] = state[key as keyof typeof state].value
    }
    localStorage.setItem('brawlstars-ninja', JSON.stringify(data))
  })

  function hideAds() {
    if (!import.meta.env.SSR && 'adsbygoogle' in window) {
      (<any>window).adsbygoogle.pauseAdRequests = 1
      const sheet = document.createElement('style')
      sheet.type = 'text/css'
      sheet.innerText = '.adswrapper { display: none; }'
      document.head.appendChild(sheet)
    }
  }

  async function enableAds() {
    if (adsAllowed.value && !import.meta.env.SSR) {
      // update consent preferences
      if ('adsbygoogle' in window) {
        (<any>window).adsbygoogle.pauseAdRequests = 0
      }
      optIn()

      // track some meta data
      // play store allows only 1 ad/page - TWA is detected via referrer
      const isPwa = window.matchMedia('(display-mode: standalone)').matches
      const isTwa = document.referrer.startsWith('android-app')

      setIsPwa(isPwa)
      setIsTwa(isTwa)

      event('branch_dimension', {
        'branch': import.meta.env.VITE_BRANCH || '',
        'non_interaction': true,
      })
      event('is_pwa_dimension', {
        'is_pwa': isPwa,
        'non_interaction': true,
      })
      event('is_twa_dimension', {
        'is_twa': isTwa,
        'non_interaction': true,
      })
    }
  }

  watch(adsAllowed, (value) => {
    if (value) {
      enableAds()
    } else {
      hideAds()
    }
  })

  return {
    ...state,
    consentPopupVisible,
    addLastPlayer,
    withdrawConsent,
  }
})
