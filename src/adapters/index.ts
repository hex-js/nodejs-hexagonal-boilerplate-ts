import { DynamoRepositoryInstance } from '@ports/state-machines'
import { Todo } from '@models'
import todoAdapterFactory, { TodoAdapterInstance } from './todo'
import { EscribaLogger } from '@ports/logger'

export type AdapterFacade = {
  todo: TodoAdapterInstance
}

/**
 * @description dynamo repository for state machine
 *
 * @function
 * @param {Logger} escriba - Instance of escriba.
 * @param {DynamoRepositoryInstance} repository repository instatiated
 */
export const adapter = (escriba: EscribaLogger, repository: DynamoRepositoryInstance<Todo>) => ({
  todo: todoAdapterFactory(escriba, repository)
})
