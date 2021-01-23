import { EClassError, throwCustomError } from '@utils'
import Joi from 'joi'
import R from 'ramda'
import { v4 as uuidv4 } from 'uuid'
import { CreateTodoInput, EPriority, ETodoStatus, MutateTodoInput, MutateTodoOutput, Todo } from '../models'
import { toISOString } from './moment'

const todoSchema = Joi.object<Todo>({
  taskOrder: Joi
    .number()
    .integer()
    .min(0),
  taskDescription: Joi
    .string()
    .required(),
  taskOwner: Joi
    .string()
    .required(),
  taskPriority: Joi
    .string()
    .valid(...Object.values(EPriority)),
  taskStatus: Joi
    .string()
    .valid(...Object.values(ETodoStatus)),
  id: Joi.string().required(),
  createdAt: Joi.string().isoDate(),
  updatedAt: Joi.string().isoDate()
})

/**
 * @description Validate a Todo event on creation
 * @function
 * @param {CreateTodoInput} [data] imput data for create task
 * @param {string} [owner] owner of the task
 * @returns {Todo}
 */
export const validateCreateTodo = (data?: CreateTodoInput, owner?: string): Todo => {
  const createdAt = toISOString()
  const updatedAt = createdAt
  const methodPath = 'business.todo.validateCreateTodo'

  if (R.isEmpty(data) || R.isNil(data)) {
    return throwCustomError(new Error('invalid entry on field data, missing information'), methodPath, EClassError.USER_ERROR)
  }

  if (R.isNil(owner)) {
    return throwCustomError(new Error('owner is missing'), methodPath, EClassError.USER_ERROR)
  }

  const todo: Todo = {
    // default values if is missing
    taskOrder: 0,
    taskPriority: EPriority.LOW,
    taskStatus: ETodoStatus.NEW,
    ...data,
    // information from system
    taskOwner: owner,
    createdAt,
    updatedAt,
    id: uuidv4()
  }

  const validation = todoSchema.validate(todo)

  if (validation.error) {
    return throwCustomError(validation.error, methodPath, EClassError.USER_ERROR)
  }

  return todo
}

/**
 * @description Validate a Todo event on update
 * @function
 * @param {MutateTodoInput} [data] update task input
 * @param {Todo} [originalData] current task data
 * @param {string} [owner] owner of the task
 * @returns {MutateTodoOutput}
 */
export const validateUpdateTodo = (data?: MutateTodoInput | null, originalData?: Todo | null, owner?: string): MutateTodoOutput => {
  const updatedAt = toISOString()
  const methodPath = 'business.todo.validateUpdateTodo'
  const allowedMutate = ['taskOrder', 'taskDescription', 'taskStatus', 'taskPriority']

  if (R.isNil(originalData)) {
    return throwCustomError(new Error('no data for this id'), methodPath, EClassError.USER_ERROR)
  }

  if (R.isEmpty(data) || R.isNil(data) || R.keys(data).some(key => !R.find(allowed => key === allowed, allowedMutate))) {
    return throwCustomError(new Error('invalid entry on field data, missing information or invalid properties'), methodPath, EClassError.USER_ERROR)
  }

  if (R.isNil(owner)) {
    return throwCustomError(new Error('owner is missing'), methodPath, EClassError.USER_ERROR)
  }

  const todo: Todo = {
    ...originalData,
    ...data,
    updatedAt
  }

  const validation = todoSchema.validate(todo)

  if (validation.error) {
    return throwCustomError(validation.error, methodPath, EClassError.USER_ERROR)
  }

  return ['taskOwner', 'id', 'createdAt']
    .reduce(
      (reducedData, field) => R.dissoc(field, reducedData),
      todo
    )
}

/**
 * @description Validate a Todo event on delete
 * @function
 * @param {Todo} [originalData] current task data
 * @param {string} [owner] owner of the task
 * @returns {Todo}
 */
export const validateDeleteTodo = (originalData?: Todo | null, owner?: string): Todo => {
  const methodPath = 'business.todo.validateDeleteTodo'
  if (R.isNil(originalData)) {
    return throwCustomError(new Error('no data for this id'), methodPath, EClassError.USER_ERROR)
  }

  if (R.isNil(owner)) {
    return throwCustomError(new Error('owner is missing'), methodPath, EClassError.USER_ERROR)
  }

  return originalData
}
