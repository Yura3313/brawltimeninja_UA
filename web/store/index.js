import { exception, event } from 'vue-analytics'
import payload from './payload.json'

// TODO copied from backend
const capitalize = str => str.replace(/(?:^|\s)\S/g, a => a.toUpperCase())
export const capitalizeWords = str => str.split(' ').map(w => capitalize(w)).join(' ')

export function induceAdsIntoArray(array, adSlots, adFrequency) {
  return array.reduce((agg, element, index, self) => {
    const lastSlotIndex = Math.floor(index / adFrequency) + 1
    if (index === self.length - 1 && lastSlotIndex < adSlots.length) {
      const ad = {
        adSlot: adSlots[lastSlotIndex],
        id: 'ad-last',
      }
      return agg.concat(element, ad)
    }

    const slotIndex = Math.floor(index / adFrequency)
    if (index % adFrequency === adFrequency - 1 && slotIndex < adSlots.length) {
      const ad = {
        adSlot: adSlots[slotIndex],
        id: `ad-${index}`,
      }
      return agg.concat(ad, element)
    }

    return agg.concat(element)
  }, [])
}

export function formatMode(mode) {
  const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  const capitalize = str => str.replace(/(?:^|\s)\S/g, a => a.toUpperCase())
  return camelToSnakeCase(mode)
    .split('_')
    .map(w => capitalize(w))
    .join(' ')
}

// TODO duplicated in backend - move this to a lib
const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
export function modeToBackgroundId(modeCamelCase) {
  const mode = camelToSnakeCase(modeCamelCase)
  if (mode === 'big_game') {
    return 'bossfight'
  }
  if (mode.endsWith('showdown')) {
    return 'showdown'
  }
  return mode.replace('_', '')
}

export const camelToKebab = (s) =>
  s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

export const metaStatMaps = {
  labels: {
    trophies: 'Trophies',
    spTrophies: 'with Star Power',
    trophyChange: 'this season',
    winRate: '3v3 Win Rate',
    rank1Rate: 'SD Win Rate',
    level: 'Avg. Level',
    starRate: 'Star Player',
    pickRate: 'Pick Rate',
    pickRate_boss: 'Boss Pick Rate',
    duration: 'Duration',
    duration_boss: 'Boss Duration',
    rank: 'Avg. Rank',
    rank1: 'Wins recorded',
    wins: 'Wins recorded',
  },
  labelsShort: {
    trophies: 'Trophies',
    spTrophies: 'with Star Power',
    trophyChange: 'this season',
    winRate: 'Won',
    rank1Rate: 'SD Won',
    level: 'Level',
    starRate: 'Stars',
    pickRate: 'Picked',
    duration: 'Duration',
    rank: 'Rank',
    rank1: 'Rank 1',
    wins: 'Wins',
  },
  icons: {
    trophies: 'trophy',
    spTrophies: 'starpower',
    trophyChange: 'trophy',
    winRate: '📈',
    rank1Rate: '📈',
    level: '🏅',
    starRate: '⭐',
    pickRate: '👇',
    pickRate_boss: '👇',
    duration: '⏰',
    duration_boss: '⏰',
    rank: 'leaderboards',
    rank1: '🏅',
    wins: '🏅',
  },
  formatters: {
    trophies: n => Math.round(n),
    spTrophies: n => Math.round(n),
    trophyChange: n => n <= 0 ? Math.round(n) : `+${Math.round(n)}`,
    winRate: n => `${Math.round(100 * n)}%`,
    rank1Rate: n => `${Math.round(100 * n)}%`,
    starRate: n => `${Math.round(100 * n)}%`,
    pickRate: n => `${Math.round(100 * n)}%`,
    pickRate_boss: n => `${Math.round(100 * n)}%`,
    duration: n => `${Math.floor(n / 60)}:${Math.floor(n % 60).toString().padStart(2, '0')}`,
    duration_boss: n => `${Math.floor(n / 60)}:${Math.floor(n % 60).toString().padStart(2, '0')}`,
    rank: n => n === null ? 'N/A' : n.toFixed(2),
    level: n => n.toFixed(2),
    rank1: n => n,
    wins: n => n,
  },
  propPriority: ['wins', 'rank1', 'duration', 'pickRate'],
}

export const state = () => ({
  version: undefined,
  // fill the store from the payload in static build
  blog: payload.blog,
  featuredPlayers: payload.featuredPlayers,
  tagPattern: '^[0289PYLQGRJCUV]{3,}$',
  lastPlayers: [],
  player: {
    tag: '',
    modes: [],
    heroes: [],
  },
  currentEvents: [],
  currentEventsLoaded: false,
  upcomingEvents: [],
  upcomingEventsLoaded: false,
  leaderboard: [],
  leaderboardLoaded: false,
  brawlerMeta: [],
  brawlerMetaLoaded: false,
  mapMeta: [],
  mapMetaLoaded: false,
  mapMetaSlicesLoaded: [],
  bestByEvent: {},
  starpowerMeta: [],
  starpowerMetaLoaded: false,
  modeMeta: [],
  modeMetaLoaded: false,
  cookiesAllowed: false,
  adsAllowed: false,
  adsEnabled: true,
  installBannerDismissed: false,
  totalBrawlers: 33,
  bsuArticles: [],
  bsuArticlesLoaded: false,
  isApp: false,
  installPrompt: undefined,
})

export const getters = {
  playerRank(state) {
    if (state.player.tag === '' || !state.leaderboardLoaded) {
      return 0
    }

    return state.leaderboard
      .map(({ tag }) => tag)
      .indexOf(state.player.tag) + 1
  },
  topBrawlers(state) {
    const props = Object.keys(metaStatMaps.labels)
    const max = {}

    state.brawlerMeta.forEach((entry) => {
      props.forEach((prop) => {
        if ((!(prop in max) || max[prop].stats[prop] < entry.stats[prop]) &&
          entry.stats[prop] !== undefined && entry.stats[prop] !== 0) {
          max[prop] = entry
        }
      })
    })

    return max
  },
  isInstallable(state) {
    const isAndroid = process.client && /android/i.test(navigator.userAgent)
    return state.installPrompt !== undefined || (!state.isApp && isAndroid)
  },
}

/**
 * Get brawlers by event: {
 *  [eventId]: [
 *    brawler id,
 *    brawler name,
 *    brawler stats,
 *    sort prop
 *  ] }
 * sorted by the preferred prop according to propPriority
 */
function getBestByEvent(state) {
  return [...Object.entries(state.mapMeta)]
    .reduce((top5, [eventId, entry]) => ({
      ...top5,
      [eventId]: [...Object.entries(entry.brawlers)]
        .map(([brawlerId, brawler]) => ({
          id: brawlerId,
          name: brawler.name,
          stats: brawler.stats,
          sortProp: metaStatMaps.propPriority.find(prop => prop in brawler.stats),
        }))
        .sort((brawler1, brawler2) => brawler2.stats[brawler2.sortProp] - brawler1.stats[brawler1.sortProp])
    }), {})
}

export const mutations = {
  setBlog(state, blog) {
    state.blog = blog
  },
  setFeaturedPlayers(state, featuredPlayers) {
    state.featuredPlayers = featuredPlayers
  },
  setPlayer(state, player) {
    state.player = player
  },
  addLastPlayer(state, player) {
    if (state.lastPlayers.some(({ tag }) => player.tag === tag)) {
      return
    }
    const clone = obj => JSON.parse(JSON.stringify(obj))

    state.lastPlayers = [clone(player), ...state.lastPlayers.slice(0, 4)]
  },
  setCurrentEvents(state, currentEvents) {
    state.currentEvents = currentEvents
    state.currentEventsLoaded = true
  },
  setUpcomingEvents(state, upcomingEvents) {
    state.upcomingEvents = upcomingEvents
    state.upcomingEventsLoaded = true
  },
  setLeaderboard(state, leaderboard) {
    state.leaderboard = leaderboard
    state.leaderboardLoaded = true
  },
  setBrawlerMeta(state, meta) {
    state.brawlerMeta = meta
    state.brawlerMetaLoaded = true
  },
  setMapMeta(state, meta) {
    state.mapMeta = meta
    state.bestByEvent = getBestByEvent(state)

    state.mapMetaLoaded = true
  },
  setStarpowerMeta(state, meta) {
    state.starpowerMeta = meta
    state.starpowerMetaLoaded = true
  },
  addMapMetaSlice(state, metaSlice) {
    state.mapMeta = {
      ...state.mapMeta,
      ...metaSlice,
    }
    state.bestByEvent = getBestByEvent(state)
  },
  setMapMetaSliceLoaded(state, sliceName) {
    state.mapMetaSlicesLoaded.push(sliceName)
  },
  setModeMeta(state, meta) {
    state.modeMeta = meta
    state.modeMetaLoaded = true
  },
  allowAds(state) {
    state.adsAllowed = true
  },
  disallowAds(state) {
    state.adsAllowed = false
  },
  enableAds(state) {
    state.adsEnabled = true
  },
  disableAds(state) {
    state.adsEnabled = false
  },
  allowCookies(state) {
    state.cookiesAllowed = true
  },
  clearCookieSettings(state) {
    state.adsAllowed = false
    state.cookiesAllowed = false
  },
  dismissInstallBanner(state) {
    state.installBannerDismissed = true
  },
  setBsuArticles(state, articles) {
    state.bsuArticles = articles
    state.bsuArticlesLoaded = true
  },
  setIsApp(state) {
    state.isApp = true
  },
  setInstallPrompt(state, prompt) {
    state.installPrompt = prompt
  },
  clearInstallPrompt(state) {
    state.installPrompt = undefined
  },
}

export const actions = {
  async nuxtServerInit({ commit }) {
    if (process.static) {
      return
    }

    // overwrite generated (possibly empty) payload
    // with current API data when running on server
    await Promise.all([
      this.$axios.$get('/api/blog').then(blog => commit('setBlog', blog)),
      this.$axios.$get('/api/featured-players').then(players => commit('setFeaturedPlayers', players)),
    ])
  },
  async loadPlayer({ state, commit }, playerTag) {
    if (playerTag === state.player.tag) {
      return
    }

    const player = await this.$axios.$get(`/api/player/${playerTag}`)
    commit('setPlayer', player)
  },
  async refreshPlayer({ state, commit }) {
    const player = await this.$axios.$get(`/api/player/${state.player.tag}`)
    commit('setPlayer', player)
  },
  async loadCurrentEvents({ state, commit }) {
    if (state.currentEventsLoaded) {
      return
    }

    try {
      const currentEvents = await this.$axios.$get('/api/current-events')
      commit('setCurrentEvents', currentEvents)
    } catch (error) {
      // not critical, ignore
      exception('cannot get events: ' + error.message)
      console.error('cannot get current events:', error.message)
    }
  },
  async loadUpcomingEvents({ state, commit }) {
    if (state.upcomingEventsLoaded) {
      return
    }

    try {
      const upcomingEvents = await this.$axios.$get('/api/upcoming-events')
      commit('setUpcomingEvents', upcomingEvents)
    } catch (error) {
      // not critical, ignore
      exception('cannot get upcoming events: ' + error.message)
      console.error('cannot get upcoming events:', error.message)
    }
  },
  async loadLeaderboard({ state, commit }) {
    if (state.leaderboardLoaded) {
      return
    }

    try {
      const leaderboard = await this.$axios.$get('/api/leaderboard/hours')
      commit('setLeaderboard', leaderboard)
    } catch (error) {
      // not critical, ignore
      exception('cannot get leaderboard: ' + error.message)
      console.error('cannot get leaderboard:', error.message)
    }
  },
  async loadBrawlerMeta({ state, commit }) {
    if (state.brawlerMetaLoaded) {
      return
    }

    try {
      const meta = await this.$axios.$get('/api/meta/brawler')
      commit('setBrawlerMeta', meta)
    } catch (error) {
      // not critical, ignore
      exception('cannot get brawler meta: ' + error.message)
      console.error('cannot get brawler meta:', error.message)
    }
  },
  async loadMapMeta({ state, commit }) {
    if (state.mapMetaLoaded) {
      return
    }

    try {
      const meta = await this.$axios.$get('/api/meta/map')
      commit('setMapMeta', meta)
    } catch (error) {
      // not critical, ignore
      exception('cannot get map meta: ' + error.message)
      console.error('cannot get map meta:', error.message)
    }
  },
  async loadMapMetaSlice({ state, commit }, sliceName) {
    if (state.mapMetaLoaded ||
        state.mapMetaSlicesLoaded.includes(sliceName)) {
      return
    }

    try {
      const meta = await this.$axios.$get('/api/meta/map?' + sliceName)
      commit('addMapMetaSlice', meta)
      commit('setMapMetaSliceLoaded', sliceName)
    } catch (error) {
      // not critical, ignore
      exception('cannot get map meta slice: ' + error.message)
      console.error('cannot get map meta slice:', error.message)
    }
  },
  async loadCurrentMeta({ dispatch }) {
    await dispatch('loadCurrentEvents')
    await dispatch('loadMapMetaSlice', 'current')
  },
  async loadStarpowerMeta({ state, commit }) {
    if (state.starpowerMetaLoaded) {
      return
    }

    try {
      const meta = await this.$axios.$get('/api/meta/starpower')
      commit('setStarpowerMeta', meta)
    } catch (error) {
      // not critical, ignore
      exception('cannot get starpower meta: ' + error.message)
      console.error('cannot get starpower meta:', error.message)
    }
  },
  async loadModeMeta({ state, commit }) {
    if (state.modeMetaLoaded) {
      return
    }

    try {
      const meta = await this.$axios.$get('/api/meta/mode')
      commit('setModeMeta', meta)
    } catch (error) {
      // not critical, ignore
      exception('cannot get mode meta: ' + error.message)
      console.error('cannot get mode meta:', error.message)
    }
  },
  async loadBsuArticles({ state, commit }) {
    if (state.bsuArticlesLoaded) {
      return
    }

    try {
      const meta = await this.$axios.$get('/api/partners/bsu')
      commit('setBsuArticles', meta)
    } catch (error) {
      // not critical, ignore
      exception('cannot get bsu articles: ' + error.message)
      console.error('cannot get bsu articles:', error.message)
    }
  },
  async install({ state, commit }) {
    const pwaSupported = state.installPrompt !== undefined
    if (!pwaSupported) {
      const referrer = '&referrer=utm_source%3Dwebsite%26utm_medium%3Dfallback'
      event('app', 'redirect_store', 'fallback')
      window.open('https://play.google.com/store/apps/details?id=xyz.schneefux.brawltimeninja' + referrer, '_blank')
    } else {
      state.installPrompt.prompt()
      const choice = await state.installPrompt.userChoice
      event('app', 'prompt', choice.outcome)
      commit('clearInstallPrompt')
    }
  },
}
