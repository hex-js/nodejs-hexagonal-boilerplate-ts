import cuid from 'cuid'
import escriba from 'escriba'
import { configure as log4jsConfigure, Logger } from 'log4js'
import { escribaConf } from '@config'

/**
 * xDevel microservices - escriba functions
 *
 * the objetive of this js module is
 *
 * - easy to test
 * - easy to inject mock in more than one level
 * - immutability and functional programming patterns
 */

export type EscribaLogger = {
  logger: Logger
  info: (method: string, message: any) => void
  error: (method: string, message: any) => void
}

/**
 * instantiate logger elements for middleware
 *
 * @param {Logger} log4jsLogger - funciont getLogger from log4js vendor
 * @param {*} escribaConstructor - function for construct escriba instance
 * @param {*} sensitiveConf - json for sensitive properties from escriba
 * @param {string} appName - application name
 * @returns {Logger}
 */
const configureLogger = (log4jsLogger: Logger, escribaConstructor: any, sensitiveConf: any, appName: string): Logger => {
  const escribaConfig = {
    loggerEngine: log4jsLogger,
    service: appName,
    sensitive: sensitiveConf
  }

  const { logger } = escribaConstructor(escribaConfig)

  return logger
}

/**
 * Configure logger for all handlers.
 *
 * @memberof ports/logger
 * @param {string} appName - name of application
 * @param {string} envName - environment of the application
 */
const handleLogger = (appName: string, envName: string): EscribaLogger => {
  const logger = configureLogger(log4jsConfigure(escribaConf.log4jsConf).getLogger(), escriba, escribaConf.sensitiveConf, appName)
  const info = (method: string, message: any) => logger.info(message, { id: cuid(), from: { appName, method, envName } })
  const error = (method: string, message: any) => logger.info(message, { id: cuid(), from: { appName, method, envName } })

  return {
    logger,
    info,
    error
  }
}

export { handleLogger }
