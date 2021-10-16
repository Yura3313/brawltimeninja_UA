import { computed, useContext, Ref } from '@nuxtjs/composition-api'
import { SliceValue } from '~/klicker'

export default function useTopNTitle(i18nPrefix: string, sliceRef: Ref<SliceValue>, id: Ref<string|number|undefined>) {
  const { app: { i18n } } = useContext()

  return computed(() => {
    const mode = sliceRef?.value?.mode?.[0]
    const map = sliceRef?.value?.map?.[0]

    if (mode == undefined) {
      return i18n.t(i18nPrefix + '.long') as string
    }
    if (map == undefined) {
      return i18n.t(i18nPrefix + '.for.mode', {
        mode: i18n.t('mode.' + mode) as string,
      }) as string
    }
    return i18n.t(i18nPrefix + '.for.map', {
      mode: i18n.t('mode.' + mode) as string,
      map: i18n.t('map.' + id.value) as string,
    }) as string
  })
}