import { defineStore } from 'pinia'
import { tagToId, totalBrawlers } from '~/lib/util'
import { Player } from '~/model/Api'

interface StoredPlayer {
  tag: string
  name: string
}

interface State {
  featuredPlayers: StoredPlayer[]
  totalBrawlers: number
  player: Player|undefined
  playerTotals: PlayerTotals|undefined
}

export interface PlayerTotals {
  picks: number
  winRate: number
  trophyChange: number
}

export const useBrawlstarsStore = defineStore('brawlstars', {
  state: (): State => ({
    featuredPlayers: [ {
        tag: 'V8LLPPC',
        name: 'xXcuzMePlisThXx',
      }, {
        tag: 'VLQPVPY',
        name: 'Hyra',
      }, {
        tag: '2YC9RVYQC',
        name: 'NaVi | Cubick',
      }, {
        tag: '8LQ9JR82',
        name: 'BGT | Eqwaak',
      }, {
        tag: 'QRUQQLV0',
        name: 'CG |Nukleo',
      } ],
    totalBrawlers: totalBrawlers,
    player: undefined,
    playerTotals: undefined,
  }),
  actions: {
    async loadPlayer(tag: string) {
      this.player = await this.api.player.byTag.query(tag)

      const battleData = await this.klicker.query({
        cubeId: 'battle',
        dimensionsIds: [],
        metricsIds: ['picks', 'winRate', 'trophyChange'],
        slices: {
          playerId: [tagToId(tag)],
        },
        sortId: 'picks',
      }).catch(() => ({
        data: [{
          metricsRaw: {
            picks: 0,
          },
        }],
      }))

      if (battleData.data[0].metricsRaw.picks as number > 0) {
        this.playerTotals = battleData.data[0].metricsRaw as PlayerTotals
      } else {
        // calculate player totals from battle log
        const picks = this.player.battles.length
        const trophyChanges = this.player.battles
          .map((battle) => battle.trophyChange)
          .filter((trophyChange): trophyChange is number => trophyChange != undefined)
        const trophyChange = trophyChanges.length == 0 ?
          0 : trophyChanges.reduce((sum, t) => sum + t, 0) / trophyChanges.length
        const winRate = this.player.battles.length == 0 ?
          0 : this.player.battles.filter((battle) => battle.victory).length / this.player.battles.length

        this.playerTotals = {
          picks,
          trophyChange,
          winRate,
        }
      }
    },
  },
})

