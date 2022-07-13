import z from 'zod'
import { createRouter } from '../context'
import { idType } from '../schema/types'
import BrawlstarsService from '../services/BrawlstarsService'

const brawlstarsService = new BrawlstarsService()

export const rankingsRouter = createRouter()
  .query('clubsByCountry', {
    input: z.object({
      country: z.string(), // TODO use enum?
    }),
    async resolve({ input, ctx }) {
      ctx.res?.set('Cache-Control', 'public, max-age=300')
      return await brawlstarsService.getClubRanking(input.country)
    },
  })
  .query('playersByCountryAndBrawler', {
    input: z.object({
      country: z.string(),
      brawlerId: idType,
    }), // TODO use enum?
    async resolve({ input, ctx }) {
      ctx.res?.set('Cache-Control', 'public, max-age=300')
      return await brawlstarsService.getBrawlerRanking(input.country, input.brawlerId)
    },
  })
  .query('playersByCountry', {
    input: z.object({
      country: z.string(),
    }),
    async resolve({ input, ctx }) {
      ctx.res?.set('Cache-Control', 'public, max-age=300')
      return await brawlstarsService.getPlayerRanking(input.country)
    },
  })