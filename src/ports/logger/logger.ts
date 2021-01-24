import cuid from 'cuid'
import { loggerConf } from '@config'
import pino, { Logger, LoggerOptions, DestinationStream } from 'pino'

/**
 * xDevel microservices - logger functions
 *
 * the objetive of this js module is
 *
 * - easy to test
 * - easy to inject mock in more than one level
 * - immutability and functional programming patterns
 */

export type LoggerInstance = {
  readonly logger: Logger
  readonly info: (method: string, message: any) => void
  readonly error: (method: string, message: any) => void
}

/**
 * instantiate logger elements for middleware
 *
 * @param {string} appName - application name
 * @returns {Logger}
 */
const configureLogger = (appName: string, loggerConstructor: (optionsOrStream?: LoggerOptions | DestinationStream) => Logger, config?: LoggerOptions | DestinationStream): Logger => {
  const logger = loggerConstructor({
    ...config,
    name: appName
  })
  return logger
}

/**
 * Configure logger for all handlers.
 *
 * @memberof ports/logger
 * @param {string} appName - name of application
 * @param {string} envName - environment of the application
 */
const handleLogger = (appName: string, envName: string): LoggerInstance => {
  const logger = configureLogger(appName, pino, loggerConf)
  const info = (method: string, message: any): void => logger.info(message, { id: cuid(), from: { appName, method, envName } })
  const error = (method: string, message: any): void => logger.info(message, { id: cuid(), from: { appName, method, envName } })

  return {
    logger,
    info,
    error
  }
}

export { handleLogger }
