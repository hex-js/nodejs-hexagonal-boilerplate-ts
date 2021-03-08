import { LoggerInstance } from '@ports/logger'

/**
 * @description Get Task by id
 *
 * @param {LoggerInstance} logger instance of logger
 */
export const ping = (logger: LoggerInstance) => async (): Promise<string> => {
  logger.info('api.controller.index.ping', 'send result ping')
  return 'pong'
}
