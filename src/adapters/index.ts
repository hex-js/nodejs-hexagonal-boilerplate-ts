import { DynamoRepositoryInstance } from '@ports/aws-dynamo'
import { Todo } from '@models'
import todoAdapterFactory, { TodoAdapterInstance } from './todo'
import { LoggerInstance } from '@ports/logger'

export type AdapterFacade = {
  readonly todo: TodoAdapterInstance
}

/**
 * @description dynamo repository for state machine
 *
 * @function
 * @param {Logger} logger - Instance of logger.
 * @param {DynamoRepositoryInstance} repository repository instatiated
 */
export const adapter = (logger: LoggerInstance, repository: DynamoRepositoryInstance<Todo>): AdapterFacade => ({
  todo: todoAdapterFactory(logger, repository)
})
