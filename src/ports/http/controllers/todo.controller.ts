import R from 'ramda'
import { Request } from 'express'
import { LoggerInstance } from '@ports/logger'
import { AdapterFacade } from '@adapters'
import { Todo } from '@models'
import { EClassError, throwCustomError } from '@utils'

/**
 * @description Get Task by id
 *
 * @param {LoggerInstance} logger instance of logger
 * @param {AdapterFacade} adapter adapter instantiated
 * @returns {ControllerTodoReturn}
 */
export const getTodo = (logger: LoggerInstance, adapter: AdapterFacade) => async (req: Request): Promise<Todo> => {
  const methodPath = 'api.controllers.todo.getTodo'
  try {
    /**
     * disclaimer : the user in production environment,
     * user will be sent by the midlleware authentication who call the method on http
     */
    const todo = await adapter.todo.getTodo(req.params.id)
    if (R.isNil(todo)) {
      return throwCustomError(new Error('id not found'), methodPath, EClassError.USER_ERROR)
    }
    return todo
  } catch (error) {
    logger.error(methodPath, error)
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Create Task
 *
 * @param {LoggerInstance} logger instance of logger
 * @param {AdapterFacade} adapter adapter instantiated
 */
export const createTodo = (logger: LoggerInstance, adapter: AdapterFacade) => async (req: Request) => {
  const methodPath = 'api.controller.todo.createTodo'
  try {
    /**
     * TODO validate body
     */

    /**
     * disclaimer : the user in production environment,
     * user will be sent by the midlleware authentication who call the method on http
     */
    const todo = await adapter.todo.createTodo(req.body.data, req.body.user)
    return todo
  } catch (error) {
    logger.error(methodPath, error)
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Update Task
 *
 * @param {LoggerInstance} logger instance of logger
 * @param {AdapterFacade} adapter adapter instantiated
 */
export const updateTodo = (logger: LoggerInstance, adapter: AdapterFacade) => async (req: Request) => {
  const methodPath = 'api.controller.todo.updateTodo'
  try {
    /**
     * TODO validate body
     */

    /**
     * disclaimer : the user in production environment,
     * user will be sent by the midlleware authentication who call the method on http
     */
    const todo = await adapter.todo.updateTodo(req.params.id, req.body.data, req.body.user)
    return todo
  } catch (error) {
    logger.error(methodPath, error)
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Delete Task
 *
 * @param {LoggerInstance} logger instance of logger
 * @param {AdapterFacade} adapter adapter instantiated
 */
export const deleteTodo = (logger: LoggerInstance, adapter: AdapterFacade) => async (req: Request) => {
  const methodPath = 'api.controller.todo.deleteTodo'
  try {
    /**
     * disclaimer : the user in production environment,
     * user will be sent by the midlleware authentication who call the method on http
     */
    const todo = await adapter.todo.deleteTodo(req.params.id, req.body.user)
    return todo
  } catch (error) {
    logger.error(methodPath, error)
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}
