import { AdapterFacade } from '@adapters'
import { Router } from 'express'
import { response } from './utils'
import { LoggerInstance } from '@ports/logger'
import controllers from '@ports/http/controllers'

const router = Router()

/**
 * @description Define the todo routes.
 *
 * @function
 * @param {LoggerInstance} logger instance of logger
 * @param {AdapterFacade} adapter instantiated adapter
 * @returns {Router}
 */

export const todoRouter = (logger: LoggerInstance, adapter: AdapterFacade): Router => {
  /**
   * get task with existing id
   */
  router.get('/:id', (req, res) => response(controllers.todo.getTodo(logger, adapter)(req), res))

  /**
   * create task with existing id
   */
  router.post('/', (req, res) => response(controllers.todo.createTodo(logger, adapter)(req), res))

  /**
   * update task with existing id
   */
  router.put('/:id', (req, res) => response(controllers.todo.updateTodo(logger, adapter)(req), res))

  /**
   * delete task with existing id
   */
  router.delete('/:id', (req, res) => response(controllers.todo.deleteTodo(logger, adapter)(req), res))

  return router
}
