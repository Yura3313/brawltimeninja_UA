import { Plugin } from '@nuxt/types'

// TODO for some reason, requests hang when LRU caching is active

// see https://github.com/nuxt/http/pull/105
const plugin: Plugin = function (context) {
  const { $http } = context
  const cache = (<any>context.ssrContext)?.cache

  const noopLoading = {
    finish: () => { },
    start: () => { },
    fail: () => { },
    set: () => { }
  }

  const $loading = () => {
    const $nuxt = typeof window !== 'undefined' && (<any>window).__NUXT__
    return ($nuxt && $nuxt.$loading && $nuxt.$loading.set) ? $nuxt.$loading : noopLoading
  }

  let currentRequests = 0

  $http.onRequest(req => {
    if (cache != undefined && cache.get(req.url)) {
      console.log('cache hit', req.url)
      return cache.get(req.url)
    }
    console.log('cache miss', req.url)
    currentRequests++
  })

  $http.onResponse((req, opts, res) => {
    if (cache != undefined) {
      let maxAge = res.headers.get('cache-control')?.replace(/.*max-age=([0-9]+)/, '$1')
      if (req.url.startsWith('https://cube.brawltime.ninja')) {
        maxAge = '600'
      }

      if (maxAge != undefined) {
        console.log('caching for', maxAge)
        cache.set(req.url, res, {
          ttl: parseInt(maxAge) * 100 / 2,
        })
      } else {
        console.log('bypass cache')
      }
    }

    currentRequests--
    if (currentRequests <= 0) {
      currentRequests = 0
      $loading().finish()
    }
  })

  $http.onError(() => {
    currentRequests--

    $loading().fail()
    $loading().finish()
  })
}

export default plugin
