import { EscribaLogger } from '@ports/logger'
import { AdapterFacade } from '@adapters'
import { indexRouter } from './index.router'
import { todoRouter } from './todo.router'

/**
 * @description Get route definitions.
 *
 * @function
 * @param {EscribaLogger} escriba instance of escriba
 * @param {AdapterFacade} adapter instantiated adapter
 */
export const getRoutes = (escriba: EscribaLogger, adapter: AdapterFacade) => {
  return {
    index: indexRouter(escriba),
    todo: todoRouter(escriba, adapter)
  }
}
