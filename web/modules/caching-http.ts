import { Module } from '@nuxt/types'
import LRU from 'lru-cache'

const module: Module = function CachingHttpModule() {
  const cache = new LRU({
    max: 1000,
    ttl: 1000 * 60 * 5,
  })

  this.nuxt.hook('render:before', renderer => {
    const renderRoute = renderer.renderRoute.bind(renderer)
    renderer.renderRoute = (route, context) => {
      context.cache = cache
      return renderRoute(route, context)
    }
  })
}

export default module