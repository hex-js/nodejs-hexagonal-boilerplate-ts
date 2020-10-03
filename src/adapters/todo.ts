import { DynamoRepositoryInstance } from '@ports/state-machines'
import { CreateTodoInput, MutateTodoInput, Todo } from '@models'
import {
  EClassError,
  throwCustomError
} from '@utils'
import { validateUpdateTodo, validateCreateTodo, validateDeleteTodo } from '@business/todo'
import { EscribaLogger } from '@ports/logger'

export type TodoAdapterInstance = {
  getTodo: (id: string) => Promise<Todo | null>
  createTodo: (params: CreateTodoInput, user: string) => Promise<Todo>
  updateTodo: (id: string, params: MutateTodoInput, user: string) => Promise<Todo>
  deleteTodo: (id: string, user: string) => Promise<Todo>
}

/**
 * @description Todo adapter factory
 * @memberof adapters
 * @function
 * @param {EscribaLogger} escriba instance of escriba logger
 * @param {DynamoRepositoryInstance<Todo>} repository state-machine database methods
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
 * @param {DynamoRepositoryInstance<Todo>} repository - State-machine database methods.
 */
const getTodo = (repository: DynamoRepositoryInstance<Todo>) => async (id: string) => {
  const methodPath = 'adapters.todo.getTodo'
  try {
    return await repository.getDocument({ id })
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Create todo in the DynamoDB.
 * @function
 * @param {EscribaLogger} escriba instance of escriba
 * @param {DynamoRepositoryInstance<Todo>} repository state-machine database methods
 */
const createTodo = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>) => async (params: CreateTodoInput, user: string) => {
  const methodPath = 'adapters.todo.createTodo'
  try {
    const documentInserted = await repository
      .putDocument(
        validateCreateTodo(
          params,
          user
        )
      )

    escriba.info(methodPath, {
      action: 'TASK_CREATED',
      method: methodPath,
      data: { documentInserted }
    })

    return documentInserted
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description Update todo in the DynamoDB.
 * @function
 * @throws {CustomError}
 * @param {EscribaLogger} escriba instance of escriba
 * @param {DynamoRepositoryInstance<Todo>} repository state-machine database methods
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
    const task = await repository.updateDocument(
      { id },
      UpdateExpression,
      ExpressionAttributeValues
    )

    // log report data
    escriba.info(methodPath, {
      action: 'TASK_UPDATED',
      method: methodPath,
      data: task
    })

    // return updated item
    return {
      ...currObject,
      ...task
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
 * @param {DynamoRepositoryInstance<Todo>} repository state-machine database methods
 */
const deleteTodo = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>) => async (id: string, user: string) => {
  const methodPath = 'adapters.todo.deleteTodo'
  try {
    const currObject = validateDeleteTodo(await getTodo(repository)(id), user)
    await repository.deleteDocument({ id })

    // log report data
    escriba.info(methodPath, {
      action: 'TASK_DELETED',
      method: methodPath,
      data: currObject
    })

    return currObject
  } catch (error) {
    return throwCustomError(error, methodPath, EClassError.INTERNAL)
  }
}
