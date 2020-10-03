import { EscribaLogger } from '@ports/logger'

/**
 * @description Get Task by id
 *
 * @param {EscribaLogger} escriba instance of escriba
 */
export const ping = (escriba: EscribaLogger) => async (): Promise<string> => {
  escriba.info('api.controller.index.ping', 'send result ping')
  return 'pong'
}
