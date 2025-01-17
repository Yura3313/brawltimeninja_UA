<template>
  <event-card
    :mode="mode"
    :map="map"
    :id="id"
  >
    <template
      v-if="end != undefined"
      v-slot:infobar
    >
      <p class="text-right">
        <client-only>
          {{ $t('time.ends-in', { time: timeTillEnd }) }}
        </client-only>
      </p>
    </template>

    <template v-slot:content>
      <div class="h-full flex flex-col justify-center">
        <brawler-kv-card
          :brawler-name="brawlerName"
          :slices="slices"
        ></brawler-kv-card>
      </div>
    </template>
  </event-card>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useDateFnLocale } from '~/composables/date-fns'

export default defineComponent({
  props: {
    mode: {
      // camel case
      type: String,
      required: true
    },
    map: {
      type: String,
      required: true
    },
    id: {
      type: [String, Number],
      required: true
    },
    brawlerName: {
      type: String,
      required: true
    },
    end: {
      type: String,
    },
  },
  setup(props) {
    const { locale } = useDateFnLocale()
    const timeTillEnd = computed(() => {
      if (props.end == undefined) {
        return ''
      }
      return formatDistanceToNow(parseISO(props.end), {
        locale: locale.value,
      })
    })

    const slices = computed(() => ({
      map: [props.map],
      mode: [props.mode],
    }))

    return {
      timeTillEnd,
      slices,
    }
  },
})
</script>
