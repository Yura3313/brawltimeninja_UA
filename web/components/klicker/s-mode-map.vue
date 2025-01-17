<template>
  <div>
    <b-fake-select @open="lightboxOpen = true">
      <template v-slot:preview>
        <span class="w-full text-left">
          {{ mode != undefined ? $t('mode.' + mode) : $t('option.all-modes') }} - {{ map != undefined ? mapName : $t('option.all-maps') }}
        </span>
      </template>
    </b-fake-select>

    <b-lightbox
      v-model="lightboxOpen"
      class="top-14 lg:top-20 bottom-14 lg:bottom-0 h-[calc(100vh-2*3.5rem)] lg:h-[calc(100vh-5rem)] overscroll-contain"
    >
      <b-card
        class="w-full overflow-y-auto overscroll-contain"
        :elevation="0"
      >
        <template v-slot:content>
          <events-roll
            v-if="allEventsAndSummaries != undefined"
            :events="allEventsAndSummaries"
            :mode-filter-default="mode"
          >
            <template v-slot="{ event }">
              <event-picture-card
                v-if="!event.key.startsWith('all')"
                :mode="event.mode"
                :map="event.map"
                :id="event.id"
                :class="{
                  'bg-primary-400 rounded-2xl': mode == event.mode && map == event.map,
                }"
                @click.capture.prevent.stop="onSelectModeMap({ mode: event.mode, map: event.map })"
              ></event-picture-card>
              <event-card
                v-else-if="event.key != 'all'"
                :mode="event.mode"
                :class="{
                  'bg-primary-400 rounded-2xl': mode == event.mode && map == 'all',
                }"
                nobackground
                @click.capture.prevent.stop="onSelectModeMap({ mode: event.mode })"
              >
                <template v-slot:preview></template>
                <template v-slot:content>
                  <p class="pt-4 h-full flex flex-col justify-center items-center">
                    {{ $t('option.all-maps') }}
                  </p>
                </template>
              </event-card>
              <b-card
                v-else
                :class="{
                  'bg-primary-400 rounded-2xl': mode == 'all' && map == 'all',
                }"
                @click.capture.prevent="onSelectModeMap({})"
              >
                <template v-slot:content>
                  <p class="pt-4 h-full flex flex-col justify-center items-center">
                    {{ $t('option.all-modes') }} - {{ $t('option.all-maps') }}
                  </p>
                </template>
              </b-card>
            </template>
          </events-roll>
        </template>
      </b-card>
    </b-lightbox>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { SliceValue, SliceValueUpdateListener } from '@schneefux/klicker/types'
import { getMapName } from '~/composables/map'
import { BFakeSelect, BLightbox } from '@schneefux/klicker/components'
import { EventMetadata } from '~/plugins/klicker.service'
import { useAllEvents } from '@/composables/dimension-values'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  components: {
    BFakeSelect,
    BLightbox,
  },
  props: {
    modelValue: {
      type: Object as PropType<SliceValue>,
      required: true
    },
    onInput: {
      type: Function as PropType<SliceValueUpdateListener>,
      required: true
    },
  },
  setup(props) {
    const i18n = useI18n()

    const mode = computed(() => (props.modelValue.mode ?? [])[0])
    const map = computed(() => (props.modelValue.map ?? [])[0])

    const allEvents = useAllEvents()
    const allEventsAndSummaries = computed<EventMetadata[]>(() => {
      const modes = [...new Set(allEvents.value.map(e => e.mode))]
      return (<EventMetadata[]>[]).concat(
        [{
          key: 'all',
          id: '0',
          map: i18n.t('option.all-modes'),
          mode: 'all',
          powerplay: false,
          metrics: {},
        }],
        modes.map(m => ({
          key: `all-${m}`,
          id: '0',
          map: i18n.t('option.all-maps'),
          mode: m,
          powerplay: false,
          metrics: {},
        })),
        allEvents.value,
      )
    })

    const mapName = computed(() => {
      const map = (props.modelValue.map ?? [])[0]
      if (map == undefined) {
        return ''
      }

      const mode = (props.modelValue.mode ?? [])[0]
      if (mode == undefined) {
        return ''
      }

      if (allEvents.value.length == 0) {
        return map
      }

      const mapRecord = allEvents.value.find(e => e.map == map && e.mode == mode)
      if (mapRecord == undefined) {
        return map
      }

      return getMapName(mapRecord.id, map)
    })

    const onSelectModeMap = (value: { mode?: string, map?: string }) => {
      props.onInput({
        mode: value.mode != undefined ? [value.mode] : [],
        map: value.map != undefined ? [value.map] : [],
      })
      lightboxOpen.value = false
    }

    const lightboxOpen = ref(false)

    return {
      mode,
      map,
      onSelectModeMap,
      allEventsAndSummaries,
      lightboxOpen,
      mapName,
    }
  },
})
</script>
