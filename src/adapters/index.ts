import { DynamoRepositoryInstance } from '@ports/aws-dynamo'
import { Todo } from '@models'
import todoAdapterFactory, { TodoAdapterInstance } from './todo'
import { EscribaLogger } from '@ports/logger'

export type AdapterFacade = {
  readonly todo: TodoAdapterInstance
}

/**
 * @description dynamo repository for state machine
 *
 * @function
 * @param {Logger} escriba - Instance of escriba.
 * @param {DynamoRepositoryInstance} repository repository instatiated
 */
export const adapter = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>): AdapterFacade => ({
  todo: todoAdapterFactory(escriba, repository)
})
