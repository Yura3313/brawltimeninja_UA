<template>
  <b-card :title="brawlerName">
    <template v-slot:content>
      <div class="flex flex-col items-center">
        <media-img
          :path="'/brawlers/' + brawlerId + '/model'"
          :alt="brawlerName"
          clazz="h-48 object-contain"
          size="400"
        ></media-img>

        <c-query
          :query="query"
          :filter="filter"
        >
          <template v-slot="data">
            <v-kv-table
              v-bind="data"
              class="mt-8 w-full"
            ></v-kv-table>
          </template>
        </c-query>
      </div>
    </template>
  </b-card>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { CQuery, VKvTable } from '@schneefux/klicker/components'
import { MetaGridEntry } from '@schneefux/klicker/types'

export default defineComponent({
  components: {
    CQuery,
    VKvTable,
  },
  props: {
    brawlerId: {
      type: String,
      required: true
    },
    brawlerName: {
      type: String,
      required: true
    },
  },
  setup(props) {
    const query = computed(() => ({
      cubeId: 'map',
      metricsIds: ['winRate', 'useRate', 'picks'],
      dimensionsIds: ['brawler'],
      sortId: 'winRate',
      slices: {},
    }))

    const filter = computed(() => (e: MetaGridEntry) => e.dimensionsRaw.brawler.brawler == props.brawlerName.toUpperCase())

    return {
      query,
      filter,
    }
  },
})
</script>
