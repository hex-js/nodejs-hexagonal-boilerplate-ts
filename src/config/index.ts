import { config } from 'dotenv'
import R from 'ramda'
import { getEnv } from './environments'

config()

/**
 * general aws configuration
 * @memberof config
 */
const AWSConfig = {
  accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
  secretAccessKey: getEnv('AWS_ACCESS_SECRET_KEY'),
  region: getEnv('AWS_REGION'),
  profile: getEnv('AWS_PROFILE')
}

/**
 * aws dynamodb configuration
 * @memberof config
 */
const AWSDynamoConfig = R.merge(
  AWSConfig,
  {
    region: getEnv('AWS_DYNAMO_REGION'),
    apiVersion: getEnv('AWS_DYNAMO_API_VERSION', '2012-08-10'),
    endpoint: getEnv('AWS_DYNAMO_ENDPOINT')
  }
)

/**
 * aws sqs configuration
 * @memberof config
 */
const AWSSqsConfig = R.merge(
  AWSConfig,
  {
    region: getEnv('AWS_SQS_REGION', 'us-west-2'),
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
    region: getEnv('AWS_SQS_REGION', 'us-west-2'),
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
  envName: getEnv('NODE_ENV'),
  todo: {
    tableName: getEnv('AWS_DYNAMO_TODO_TABLE_NAME', 'todos'),
    queueUrl: getEnv('AWS_SQS_TODO_QUEUE_NAME', 'todo')
  }
}

/**
 * logger configuration fixed for all jobs
 * @memberof config
 */
const escribaConf = {
  sensitiveConf: {
    password: {
      paths: ['message.password'],
      pattern: /\w.*/g,
      replacer: '*'
    }
  },
  log4jsConf: {
    appenders: {
      out: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '[%d] %m'
        }
      }
    },
    categories: {
      default: {
        appenders: [
          'out'
        ],
        level: 'info'
      }
    }
  }
}

export {
  appConfig,
  AWSConfig,
  AWSDynamoConfig,
  AWSS3Config,
  AWSSqsConfig,
  escribaConf,
  envProdName,
  momentConfig
}
