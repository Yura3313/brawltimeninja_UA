<template>
  <b-page :title="$t('brawlers.title')">
    <p class="mt-4 prose dark:prose-invert">
      {{ $t('brawlers.description') }}
    </p>

    <brawlers-roll
      class="mt-8"
    ></brawlers-roll>

    <ad
      ad-slot="6446102315"
      first
    ></ad>

    <b-page-section
      :title="$t('tier-list.all.title')"
      v-observe-visibility="{
        callback: makeVisibilityCallback('widget'),
        once: true,
      }"
    >
      <mode-map-jumper></mode-map-jumper>

      <p class="mt-4 prose dark:prose-invert">
        {{ $t('tier-list.brawler.description') }}
      </p>

      <map-views
        ga-category="brawler"
        class="mt-8"
      ></map-views>
    </b-page-section>

    <ad
      ad-slot="7838173054"
      lazy
    ></ad>
  </b-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ObserveVisibility } from 'vue-observe-visibility'
import { useTrackScroll } from '~/composables/gtag'
import { useCacheHeaders, useMeta } from '~/composables/compat'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  directives: {
    ObserveVisibility,
  },
  setup() {
    const i18n = useI18n()

    useCacheHeaders()
    useMeta(() => ({
      title: i18n.t('brawlers.meta.title'),
      meta: [
        { hid: 'description', name: 'description', content: i18n.t('brawlers.meta.description') },
      ]
    }))

    const { makeVisibilityCallback } = useTrackScroll('brawler_meta')

    return {
      makeVisibilityCallback,
    }
  },
})
</script>
