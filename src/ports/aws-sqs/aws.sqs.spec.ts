import * as crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { SQS } from 'aws-sdk'
import { AWSSqsConfig } from '@config'
import { queueRepository } from './index'
import { EClassError } from '@utils'
import { throwCustomError } from '@utils/errors'

/**
 * jest invocation for aws-sdk
 */
jest.mock('aws-sdk')
jest.mock('../../utils/errors')

; (throwCustomError as any).mockImplementation((error: Error) => {
  // eslint-disable-next-line functional/no-throw-statement
  throw error
})

/**
 * function/constants  for  test suite
 */
const randomString = (size = 21): string => {
  return crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}

const toMD5 = (str: string): string => {
  return crypto
    .createHash('md5')
    .update(str)
    .digest().toString('base64')
}

const sqsMockObject = {
  sendMessage: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      MD5OfMessageBody: toMD5(randomString()),
      MD5OfMessageAttributes: toMD5(randomString()),
      MD5OfMessageSystemAttributes: toMD5(randomString()),
      MessageId: uuidv4(),
      SequenceNumber: 123,
      $response: {
        requestId: uuidv4()
      }
    })
  }),
  deleteMessage: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      $response: {
        error: null,
        retryCount: 0,
        requestId: uuidv4()
      }
    })
  }),
  receiveMessage: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Messages: [{
        MessageId: uuidv4(),
        ReceiptHandle: uuidv4(),
        MD5OfBody: toMD5(randomString()),
        Body: JSON.stringify({
          [randomString()]: randomString()
        }),
        Attributes: randomString(),
        MD5OfMessageAttributes: toMD5(randomString())
      }],
      $response: {
        requestId: uuidv4()
      }
    })
  })
}
const messagePayload = { id: 1 }

/**
 * end of constants for test suite
 */

/**
 * begin of the test suite
 */
describe('sendMessage', () => {
  const methodPath = 'ports.aws-sqs.sendMessage'
  beforeEach(() => {
    (SQS as any).mockReset()
  })

  test('basic send', async () => {
    (SQS as any).mockImplementation(() => sqsMockObject)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    const result = await queueRepositoryInstanteFn.sendMessage(messagePayload)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('operationResult')
    expect(result).toHaveProperty('value')
    expect(result.value).toHaveProperty('id')
    expect(result.operationResult.MessageId).not.toHaveLength(0)
    expect(sqs.sendMessage).toHaveBeenCalled()
    expect(sqs.sendMessage).toHaveBeenCalledWith({
      QueueUrl: 'queueUrl',
      MessageBody: JSON.stringify(messagePayload)
    })
  })

  test('basic Send with no message Id', async () => {
    const throwMessage = 'No message id response'
    const sqsMockObjectWithOutId = {
      sendMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          $response: {
            requestId: uuidv4()
          }
        })
      })
    }

    ; (SQS as any).mockImplementation(() => sqsMockObjectWithOutId)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const queueRepositoryInstanteFn = queueRepository<any>(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.sendMessage(messagePayload))
      .rejects.toEqual(new Error(throwMessage))
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
  })

  test('basic Send with throw', async () => {
    const throwMessage = 'mock error'
    const sqsMockObjectWithThrow = {
      sendMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error(throwMessage))
      })
    }

    ; (SQS as any).mockImplementation(() => sqsMockObjectWithThrow)
    const sqs = new SQS({
      region: 'us-east-1'
    })
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.sendMessage(messagePayload))
      .rejects.toEqual(new Error(throwMessage))
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
  })

  test('basic Send with reject response', async () => {
    const throwMessage = 'SHORT_UNIQUE_ERROR_CODE: message content'
    const sqsMockObjectWithThrow = {
      sendMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue({
          $response: {
            error: {
              code: 'SHORT_UNIQUE_ERROR_CODE',
              message: 'message content'
            },
            retryCount: 0,
            requestId: uuidv4()
          }
        })
      })
    }

    ; (SQS as any).mockImplementation(() => sqsMockObjectWithThrow)
    const sqs = new SQS({
      region: 'us-east-1'
    })
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.sendMessage(messagePayload))
      .rejects.toEqual(new Error(throwMessage))
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
  })
})

describe('receiveMessage', () => {
  const methodPath = 'ports.aws-sqs.receiveMessage'
  beforeEach(() => {
    (SQS as any).mockReset()
  })

  test('basic call', async () => {
    (SQS as any).mockImplementation(() => sqsMockObject)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const visibilityTimeout = 10
    const waitTimeSeconds = 5
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    const result = await queueRepositoryInstanteFn.receiveMessage(10, 5)
    expect(result.value).toHaveLength(1)
    expect(sqs.receiveMessage).toHaveBeenCalled()
    expect(sqs.receiveMessage).toHaveBeenCalledWith(expect.objectContaining({
      MaxNumberOfMessages: 10,
      QueueUrl: 'queueUrl',
      VisibilityTimeout: visibilityTimeout,
      WaitTimeSeconds: waitTimeSeconds
    }))
  })

  test('basic call with default values', async () => {
    (SQS as any).mockImplementation(() => sqsMockObject)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const queueRepositoryInstanteFn = queueRepository<any>(sqs, 'queueUrl')
    const result = await queueRepositoryInstanteFn.receiveMessage()
    expect(result.value).toHaveLength(1)
    expect(sqs.receiveMessage).toHaveBeenCalled()
    expect(sqs.receiveMessage).toHaveBeenCalledWith(expect.objectContaining({
      MaxNumberOfMessages: 1,
      QueueUrl: 'queueUrl',
      VisibilityTimeout: 20,
      WaitTimeSeconds: 10
    }))
  })

  test('basic call without body', async () => {
    (SQS as any).mockImplementation(() => ({
      receiveMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Messages: [{
            MessageId: uuidv4(),
            ReceiptHandle: uuidv4(),
            MD5OfBody: toMD5(randomString()),
            Body: undefined,
            Attributes: randomString(),
            MD5OfMessageAttributes: toMD5(randomString())
          }],
          $response: {
            requestId: uuidv4()
          }
        })
      })
    }))
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const queueRepositoryInstanteFn = queueRepository<any>(sqs, 'queueUrl')
    const result = await queueRepositoryInstanteFn.receiveMessage()
    expect(result.value).toHaveLength(1)
    expect(sqs.receiveMessage).toHaveBeenCalled()
    expect(sqs.receiveMessage).toHaveBeenCalledWith(expect.objectContaining({
      MaxNumberOfMessages: 1,
      QueueUrl: 'queueUrl',
      VisibilityTimeout: 20,
      WaitTimeSeconds: 10
    }))
  })

  test('basic call with reject response', async () => {
    const throwMessage = 'SHORT_UNIQUE_ERROR_CODE: message content'
    const sqsMockObjectThrow = {
      receiveMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue({
          $response: {
            error: {
              code: 'SHORT_UNIQUE_ERROR_CODE',
              message: 'message content'
            },
            retryCount: 0,
            requestId: uuidv4()
          }
        })
      })
    }
    ; (SQS as any).mockImplementation(() => sqsMockObjectThrow)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const visibilityTimeout = 10
    const waitTimeSeconds = 5
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.receiveMessage(10, 5))
      .rejects.toThrow(throwMessage)
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(sqs.receiveMessage).toHaveBeenCalled()
    expect(sqs.receiveMessage).toHaveBeenCalledWith(expect.objectContaining({
      MaxNumberOfMessages: 10,
      QueueUrl: 'queueUrl',
      VisibilityTimeout: visibilityTimeout,
      WaitTimeSeconds: waitTimeSeconds
    }))
  })

  test('basic call with no message received', async () => {
    const sqsMockObjectEmpty = {
      receiveMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Messages: [],
          $response: {
            requestId: uuidv4()
          }
        })
      })
    }
    ; (SQS as any).mockImplementation(() => sqsMockObjectEmpty)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const visibilityTimeout = 10
    const waitTimeSeconds = 5
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.receiveMessage(10, 5))
      .rejects.toThrow('No message response')
    expect(sqs.receiveMessage).toHaveBeenCalled()
    expect(sqs.receiveMessage).toHaveBeenCalledWith(expect.objectContaining({
      MaxNumberOfMessages: 10,
      QueueUrl: 'queueUrl',
      VisibilityTimeout: visibilityTimeout,
      WaitTimeSeconds: waitTimeSeconds
    }))
  })
})

describe('deleteMessage', () => {
  const methodPath = 'ports.aws-sqs.deleteMessage'
  beforeEach(() => {
    (SQS as any).mockReset()
  })

  test('basic call', async () => {
    (SQS as any).mockImplementation(() => sqsMockObject)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const handlerId = randomString()
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    const result = await queueRepositoryInstanteFn.deleteMessage(handlerId)
    expect(result.operationResult).toBeDefined()
    expect(result.operationResult.$response).toBeDefined()
    expect(result.operationResult.$response.requestId).toBeDefined()
    expect(result.operationResult.$response).toMatchObject({ error: null, retryCount: 0 })
    expect(sqs.deleteMessage).toHaveBeenCalled()
    expect(sqs.deleteMessage).toHaveBeenCalledWith({
      QueueUrl: 'queueUrl',
      ReceiptHandle: handlerId
    })
  })

  test('reject call', async () => {
    const rejectMock = {
      deleteMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue({
          $response: {
            error: {
              code: 'SHORT_UNIQUE_ERROR_CODE',
              message: 'message content'
            },
            retryCount: 0,
            requestId: uuidv4()
          }
        })
      })
    }
    ; (SQS as any).mockImplementation(() => rejectMock)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const handlerId = randomString()
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.deleteMessage(handlerId))
      .rejects.toThrow('SHORT_UNIQUE_ERROR_CODE: message content')
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error('SHORT_UNIQUE_ERROR_CODE: message content'), methodPath, EClassError.INTERNAL)
    expect(sqs.deleteMessage).toHaveBeenCalled()
    expect(sqs.deleteMessage).toHaveBeenCalledWith({
      QueueUrl: 'queueUrl',
      ReceiptHandle: handlerId
    })
  })

  test('throw call', async () => {
    const throwMessage = 'custom error'
    const rejectMock = {
      deleteMessage: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error(throwMessage))
      })
    }
    ; (SQS as any).mockImplementation(() => rejectMock)
    const sqs = new SQS({
      region: AWSSqsConfig.region,
      apiVersion: AWSSqsConfig.apiVersion
    })
    const handlerId = randomString()
    const queueRepositoryInstanteFn = queueRepository(sqs, 'queueUrl', 10)
    await expect(queueRepositoryInstanteFn.deleteMessage(handlerId))
      .rejects.toThrow(throwMessage)
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(sqs.deleteMessage).toHaveBeenCalled()
    expect(sqs.deleteMessage).toHaveBeenCalledWith({
      QueueUrl: 'queueUrl',
      ReceiptHandle: handlerId
    })
  })
})
