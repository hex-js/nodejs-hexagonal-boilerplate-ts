import { adapter } from '@adapters'
import { appConfig, AWSDynamoConfig } from '@config'
import { Todo } from '@models'
import { databaseRepository } from '@ports/aws-dynamo'
import { handleLogger } from '@ports/logger'
import { EClassError, throwCustomError } from '@utils'
import { AppSyncResolverEvent, Context } from 'aws-lambda'
import AWS from 'aws-sdk'

type ResolversMap<T> = {
  readonly [key: string]: () => Promise<T | null>
}

/**
 * Todo handler.
 * more about: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
 *
 * @memberof ports/aws/lambda
 * @param {AppSyncResolverEvent<any>} event event object information from lambda (https://docs.aws.amazon.com/pt_br/lambda/latest/dg/with-s3.html)
 * @param {*} circuit breaker function
 */
export const handler = async (event: AppSyncResolverEvent<any> & { readonly field: string }, context: Context): Promise<any> => {
  const appName = 'todo'
  const isProduction = process.env.ENV_NAME === 'production'
  const envName = isProduction ? 'production' : 'staging'

  // Logger configuration.
  const logger = handleLogger(appName, envName)

  // AWS Dynamo configuration.
  AWS.config.update(AWSDynamoConfig)
  const dynamo = new AWS.DynamoDB.DocumentClient()

  // inject repositories
  const databaseRepoInstance = databaseRepository<Todo>(dynamo, appConfig.todo.tableName)
  const adapterInstance = adapter(logger, databaseRepoInstance)

  const getTodo = async (): Promise<Todo | null> => {
    try {
      const { id } = event.arguments
      const result = await adapterInstance.todo.getTodo(id)
      logger.info('handler.get', `Get the task: ${id}`)
      return result
    } catch (error) {
      logger.error('handler.generate', { ...error })
      return throwCustomError(error, 'ports.aws-lambda.todo.getTodo', EClassError.INTERNAL)
    }
  }

  const createTodo = async (): Promise<Todo> => {
    try {
      const { user } = event.arguments
      const result = await adapterInstance.todo.createTodo(event.arguments.data, user)
      logger.info('handler.generate', `Generated the task: ${result.id}`)
      return result
    } catch (error) {
      logger.error('handler.generate', { ...error })
      return throwCustomError(error, 'ports.aws-lambda.todo.createTodo', EClassError.INTERNAL)
    }
  }

  const updateTodo = async (): Promise<Todo> => {
    try {
      const { id, user } = event.arguments
      const result = await adapterInstance.todo.updateTodo(id, event.arguments.data, user)
      logger.info('handler.generate', `Generated the task: ${result.id}`)
      return result
    } catch (error) {
      logger.error('handler.generate', { ...error })
      return throwCustomError(error, 'ports.aws-lambda.todo.updateTodo', EClassError.INTERNAL)
    }
  }

  const deleteTodo = async (): Promise<Todo> => {
    try {
      const { id, user } = event.arguments
      const result = await adapterInstance.todo.deleteTodo(id, user)
      logger.info('handler.get', `Delete the task: ${id}`)
      return result
    } catch (error) {
      logger.error('handler.generate', { ...error })
      return throwCustomError(error, 'ports.aws-lambda.todo.deleteTodo', EClassError.INTERNAL)
    }
  }

  const resolvers: ResolversMap<Todo> = {
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo
  }

  if (Object.keys(resolvers).indexOf(event.field) === -1) {
    return throwCustomError(new Error(`No resolver for ${event.field}`), 'ports.aws-lambda.todo', EClassError.INTERNAL)
  }

  logger.info('handler', `Function "${context.functionName}" running - ID: ${context.awsRequestId}`)

  const output = await resolvers[event.field]()

  return output
}
