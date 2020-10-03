import { Router } from 'express'
import { response } from './utils'
import { EscribaLogger } from '@ports/logger'
import controllers from '@ports/http/controllers'

const router = Router()

/**
 * @description Define the index routes.
 *
 * @function
 * @param {EscribaLogger} escriba instance of escriba
 * @param {AdapterFacade} adapter instantiated adapter
 * @returns {Router}
 */

export const indexRouter = (escriba: EscribaLogger): Router => {
  /**
   * ping
   */
  router.all('/ping', (_, res) => response(controllers.index.ping(escriba)(), res))

  return router
}
