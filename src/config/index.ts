import R from 'ramda'
import { getEnv } from './environments'

/**
 * general aws configuration
 * @memberof config
 */
const AWSConfig = {
  accessKeyId: getEnv('AWS_ACCESS_KEY_ID', 'dummy'),
  secretAccessKey: getEnv('AWS_ACCESS_SECRET_KEY', 'dummy'),
  region: getEnv('AWS_REGION', 'us-east-1'),
  profile: getEnv('AWS_PROFILE', 'localstack')
}

/**
 * aws dynamodb configuration
 * @memberof config
 */
const AWSDynamoConfig = R.merge(
  AWSConfig,
  {
    region: getEnv('AWS_DYNAMO_REGION', 'us-east-1'),
    apiVersion: getEnv('AWS_DYNAMO_API_VERSION', '2012-08-10'),
    endpoint: getEnv('AWS_DYNAMO_ENDPOINT', 'http://localhost:4566')
  }
)

/**
 * aws sqs configuration
 * @memberof config
 */
const AWSSqsConfig = R.merge(
  AWSConfig,
  {
    region: getEnv('AWS_SQS_REGION', 'us-east-1'),
    apiVersion: getEnv('AWS_SQS_API_VERSION', '2012-11-05')
  }
)

/**
 * aws s3 configuration
 * @memberof config
 */
const AWSS3Config = R.merge(
  AWSConfig,
  {
    region: getEnv('AWS_SQS_REGION', 'us-east-1'),
    apiVersion: getEnv('AWS_S3_API_VERSION', '2006-03-01')
  }
)

/**
 * moment configuration
 * @memberof config
 */
const momentConfig = {
  timezone: getEnv('TIMEZONE', 'America/Sao_Paulo')
}

const envProdName = 'production'

/**
 * general application configuration
 * @memberof config
 */
const appConfig = {
  appName: getEnv('APP_NAME', 'hexagonal-boilerplate'),
  isProduction: getEnv('NODE_ENV') === envProdName,
  envName: getEnv('NODE_ENV', 'development'),
  todo: {
    tableName: getEnv('AWS_DYNAMO_TODO_TABLE_NAME', 'todos'),
    queueUrl: getEnv('AWS_SQS_TODO_QUEUE_NAME', 'todo')
  }
}

/**
 * logger configuration fixed for all jobs
 * @memberof config
 */
const loggerConf = {}

export {
  appConfig,
  AWSConfig,
  AWSDynamoConfig,
  AWSS3Config,
  AWSSqsConfig,
  loggerConf,
  envProdName,
  momentConfig
}
