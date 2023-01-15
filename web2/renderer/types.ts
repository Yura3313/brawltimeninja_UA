export type { PageContextServer }
export type { PageContextClient }
export type { PageContext }
export type { PageProps }
export type { Config }

import { DehydratedState } from '@tanstack/vue-query'
import type { PageContextBuiltIn } from 'vite-plugin-ssr'
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router'
import type { ComponentPublicInstance } from 'vue'
import type { Locale } from '../locales'

type PageProps = Record<string, unknown>

interface Config {
  mediaUrl: string
  cubeUrl: string
  managerUrl: string
  renderUrl: string
  optimizeId: string
  ga4Id: string
  uaId: string
  adsensePubid: string
}

type Page = ComponentPublicInstance // https://stackoverflow.com/questions/63985658/how-to-type-vue-instance-out-of-definecomponent-in-vue-3/63986086#63986086

export type PageContextCustom = {
  Page: Page
  pageProps: PageProps
  exports: {
    Layout?: ComponentPublicInstance
  }
  locale: Locale
  vueQueryState: DehydratedState
  urlPathname: string
  urlParsed: {
    origin: null | string
    pathname: string
    pathnameOriginal: string
    search: Record<string, string>
    searchAll: Record<string, string[]>
    searchOriginal: null | string
    hash: string
    hashOriginal: null | string
  }
  errorWhileRendering?: Error
  config: Config
  redirectTo: { status: number, url: string }
  validated: null | boolean
}

type PageContextServer = PageContextBuiltIn<Page> & PageContextCustom
type PageContextClient = PageContextBuiltInClient<Page> & PageContextCustom

type PageContext = PageContextClient | PageContextServer
