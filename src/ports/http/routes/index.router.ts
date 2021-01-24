import { Router } from 'express'
import { response } from './utils'
import { LoggerInstance } from '@ports/logger'
import controllers from '@ports/http/controllers'

const router = Router()

/**
 * @description Define the index routes.
 *
 * @function
 * @param {LoggerInstance} logger instance of logger
 * @param {AdapterFacade} adapter instantiated adapter
 * @returns {Router}
 */

export const indexRouter = (logger: LoggerInstance): Router => {
  /**
   * ping
   */
  router.all('/ping', (_, res) => response(controllers.index.ping(logger)(), res))

  return router
}
