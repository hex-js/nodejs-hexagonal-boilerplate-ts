import { DynamoRepositoryInstance } from '@ports/aws-dynamo'
import { CreateTodoInput, MutateTodoInput, Todo } from '@models'
import {
  EClassError,
  throwCustomError
} from '@utils'
import { validateUpdateTodo, validateCreateTodo, validateDeleteTodo } from '@business/todo'
import { EscribaLogger } from '@ports/logger'

export type TodoAdapterInstance = {
  readonly getTodo: (id: string) => Promise<Todo | null>
  readonly createTodo: (params: CreateTodoInput, user: string) => Promise<Todo>
  readonly updateTodo: (id: string, params: MutateTodoInput, user: string) => Promise<Todo>
  readonly deleteTodo: (id: string, user: string) => Promise<Todo>
}

/**
 * @description Todo adapter factory
 * @memberof adapters
 * @function
 * @param {EscribaLogger} escriba instance of escriba logger
 * @param {DynamoRepositoryInstance<Todo>} repository Dynamo database methods
 */
const todoAdapterFactory = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>): TodoAdapterInstance => ({
  getTodo: getTodo(repository),
  createTodo: createTodo(escriba, repository),
  updateTodo: updateTodo(escriba, repository),
  deleteTodo: deleteTodo(escriba, repository)
})

export default todoAdapterFactory

/**
 * @description Handler function to get todo data by id .
 * @memberof adapters
 * @function
 * @param {DynamoRepositoryInstance<Todo>} repository - Dynamo database methods.
 */
const getTodo = (repository: DynamoRepositoryInstance<Todo>) => async (id: string) => {
  const methodPath = 'adapters.todo.getTodo'
  try {
    const result = await repository.getDocument({ id })
    return result.value
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Create todo in the DynamoDB.
 * @function
 * @param {EscribaLogger} escriba instance of escriba
 * @param {DynamoRepositoryInstance<Todo>} repository Dynamo database methods
 */
const createTodo = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>) => async (params: CreateTodoInput, user: string) => {
  const methodPath = 'adapters.todo.createTodo'
  try {
    const result = await repository
      .putDocument(
        validateCreateTodo(
          params,
          user
        )
      )

    escriba.info(methodPath, {
      action: 'TASK_CREATED',
      method: methodPath,
      data: { ...result }
    })

    return { ...result.value }
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Update todo in the DynamoDB.
 * @function
 * @throws {CustomError}
 * @param {EscribaLogger} escriba instance of escriba
 * @param {DynamoRepositoryInstance<Todo>} repository Dynamo database methods
 */
const updateTodo = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>) => async (id: string, params: MutateTodoInput, user: string): Promise<Todo> => {
  const methodPath = 'adapters.todo.updateTodo'
  try {
    const currObject = await getTodo(repository)(id)

    if (!currObject) {
      return throwCustomError(new Error('item not found'), methodPath, EClassError.USER_ERROR)
    }

    const ExpressionAttributeValues = validateUpdateTodo(params, currObject, user)

    const UpdateExpression = `
    set taskOrder = :taskOrder,
        taskDescription = :taskDescription,
        taskStatus = :taskStatus,
        taskPriority = :taskPriority,
        updatedAt = :updatedAt
    `
    // send report to existing todo previous created
    const result = await repository.updateDocument(
      { id },
      UpdateExpression,
      ExpressionAttributeValues
    )

    // log report data
    escriba.info(methodPath, {
      action: 'TASK_UPDATED',
      method: methodPath,
      data: result
    })

    // return updated item
    return {
      ...currObject,
      ...result.value
    }
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description delete todo in the DynamoDB.
 * @function
 * @throws {CustomError}
 * @param {EscribaLogger} escriba instance of escriba
 * @param {DynamoRepositoryInstance<Todo>} repository Dynamo database methods
 */
const deleteTodo = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>) => async (id: string, user: string) => {
  const methodPath = 'adapters.todo.deleteTodo'
  try {
    const currentObj = await getTodo(repository)(id)

    if (!currentObj) {
      return throwCustomError(new Error('no data for this id'), methodPath, EClassError.USER_ERROR)
    }

    const todo = validateDeleteTodo(currentObj, user)

    const result = await repository.deleteDocument({ id })

    // log report data
    escriba.info(methodPath, {
      action: 'TASK_DELETED',
      method: methodPath,
      data: {
        ...result,
        value: {
          ...todo
        }
      }
    })

    return todo
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}
