import express, { json as expressJson, urlencoded as expressUrlEncoded } from 'express'
import { config as AWSConfig, DynamoDB } from 'aws-sdk'
import { databaseRepository } from '@ports/state-machines'
import { adapter } from '@adapters'
import { appConfig, AWSDynamoConfig } from '@config'
import { getRoutes } from './routes'
import { handleLogger } from '@ports/logger'
import { Todo } from '@models'

// setting app
const app = express()
// Escriba
const escriba = handleLogger(appConfig.appName, appConfig.envName)

// AWS Dynamo configuration.
AWSConfig.update(AWSDynamoConfig)
const dynamo = new DynamoDB.DocumentClient()

// inject repositories
const databaseRepoInstance = databaseRepository<Todo>(dynamo, appConfig.todo.tableName)
const adapterInstance = adapter(escriba, databaseRepoInstance)

app.use(expressJson({ limit: '50mb' }))
app.use(expressUrlEncoded({ extended: false }))

// Routes
const routes = getRoutes(escriba, adapterInstance)
app.use('/api/v1', routes.index)
app.use('/api/v1/todos', routes.todo)

export default app
