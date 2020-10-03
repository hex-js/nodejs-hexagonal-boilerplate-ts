import { SQS, AWSError } from 'aws-sdk'
import R from 'ramda'
import { throwCustomError, EClassError } from '@utils'

export type SQSReceiveMessage<T> = {
  Body?: T | null
  MessageId?: string
  ReceiptHandle?: string
  MD5OfBody?: string
  Attributes?: SQS.MessageSystemAttributeMap
  MD5OfMessageAttributes?: string
  MessageAttributes?: SQS.MessageBodyAttributeMap
}

export type SQSDeleteMessage = {
  error: AWSError | void
  retryCount: number
  requestId: string
}

/**
 * @description Send the message to sqs.
 * @function
 * @throws {CustomError}
 * @param {SQS} sqs instance of SQS sdk from aws.
 * @param {string} queueUrl url from sqs queue service from aws.
 */
export const sendMessage = <T>(sqs: SQS, queueUrl: string) => async (body: T): Promise<string> => {
  const methodPath = 'ports.state-machines.aws.sqs.sendMessage'
  try {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body)
    }
    const result = await sqs.sendMessage(params).promise()

    if (typeof result.MessageId === 'undefined') {
      throw new Error('No message id response!')
    }

    return result.MessageId
  } catch (rejectResponse) {
    if (rejectResponse instanceof Error) {
      return throwCustomError(rejectResponse, methodPath, EClassError.INTERNAL)
    }
    return throwCustomError(new Error(`${rejectResponse.$response.error.code}: ${rejectResponse.$response.error.message}`), methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description receive the messages from sqs.
 * @function
 * @throws {CustomError}
 * @param {SQS} sqs instance of SQS sdk from aws.
 * @param {string} queueUrl url from sqs queue service from aws.
 * @param {number} [maxNumberOfMessages=1] max messages received from call command.
 */
export const receiveMessage = <T>(sqs: SQS, queueUrl: string, maxNumberOfMessages: number = 1) => async (visibilityTimeout: number = 20, waitTimeSeconds: number = 10): Promise<SQSReceiveMessage<T>[]> => {
  const methodPath = 'ports.state-machines.aws.sqs.receiveMessage'
  try {
    const messagesReceived = await sqs.receiveMessage({
      QueueUrl: queueUrl,
      VisibilityTimeout: visibilityTimeout,
      MaxNumberOfMessages: maxNumberOfMessages,
      WaitTimeSeconds: waitTimeSeconds
    }).promise()

    if (typeof messagesReceived.Messages === 'undefined' || R.isEmpty(messagesReceived.Messages)) {
      throw new Error('No messages received')
    }

    return messagesReceived.Messages.map(message => ({
      ...message,
      Body: typeof message.Body !== 'undefined' ? JSON.parse(message.Body) as T : null
    }))
  } catch (rejectResponse) {
    if (rejectResponse instanceof Error) {
      return throwCustomError(rejectResponse, methodPath, EClassError.INTERNAL)
    }
    return throwCustomError(new Error(`${rejectResponse.$response.error.code}: ${rejectResponse.$response.error.message}`), methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description delete the message from sqs queue.
 * @memberof ports/state-machines
 * @async
 * @function
 * @throws {CustomError}
 * @param {SQS} sqs instance of SQS sdk from aws.
 * @param {string} queueUrl url from sqs queue service from aws.
 * @returns {deleteMessageReturn}
 */
export const deleteMessage = (sqs: SQS, queueUrl: string) => async (receiptHandle: string): Promise<SQSDeleteMessage> => {
  const methodPath = 'ports.state-machines.aws.sqs.deleteMessage'

  try {
    const params = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    }
    const result = await sqs.deleteMessage(params).promise()

    return {
      error: result.$response.error,
      retryCount: result.$response.retryCount,
      requestId: result.$response.requestId
    }
  } catch (rejectResponse) {
    if (rejectResponse instanceof Error) {
      return throwCustomError(rejectResponse, methodPath, EClassError.INTERNAL)
    }
    return throwCustomError(new Error(`${rejectResponse.$response.error.code}: ${rejectResponse.$response.error.message}`), methodPath, EClassError.INTERNAL)
  }
}
