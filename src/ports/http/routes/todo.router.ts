import { AdapterFacade } from '@adapters'
import { Router } from 'express'
import { response } from './utils'
import { EscribaLogger } from '@ports/logger'
import controllers from '@ports/http/controllers'

const router = Router()

/**
 * @description Define the todo routes.
 *
 * @function
 * @param {EscribaLogger} escriba instance of escriba
 * @param {AdapterFacade} adapter instantiated adapter
 * @returns {Router}
 */

export const todoRouter = (escriba: EscribaLogger, adapter: AdapterFacade): Router => {
  /**
   * get task with existing id
   */
  router.get('/:id', (req, res) => response(controllers.todo.getTodo(escriba, adapter)(req), res))

  /**
   * create task with existing id
   */
  router.post('/', (req, res) => response(controllers.todo.createTodo(escriba, adapter)(req), res))

  /**
   * update task with existing id
   */
  router.put('/:id', (req, res) => response(controllers.todo.updateTodo(escriba, adapter)(req), res))

  /**
   * delete task with existing id
   */
  router.delete('/:id', (req, res) => response(controllers.todo.deleteTodo(escriba, adapter)(req), res))

  return router
}
