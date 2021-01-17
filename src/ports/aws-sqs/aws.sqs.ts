import { SQS, AWSError, Response } from 'aws-sdk'
import R from 'ramda'
import { throwCustomError, EClassError } from '@utils'
import { PromiseResult } from 'aws-sdk/lib/request'

export type SQSMessageResult<T, U> = {
  readonly operationResult: PromiseResult<U, AWSError>
  readonly value: T | null
}

/**
 * @description Send the message to sqs.
 * @function
 * @throws {CustomError}
 * @param {SQS} sqs instance of SQS sdk from aws.
 * @param {string} queueUrl url from sqs queue service from aws.
 */
export const sendMessage = <T>(sqs: SQS, queueUrl: string) => async <A = T>(body: A): Promise<SQSMessageResult<A, SQS.SendMessageResult>> => {
  const methodPath = 'ports.aws-sqs.sendMessage'
  try {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body)
    }
    const operationResult = await sqs.sendMessage(params).promise()
    const value = { ...body }

    if (typeof operationResult.MessageId === 'undefined') {
      return throwCustomError(new Error('No message id response'), methodPath, EClassError.INTERNAL)
    }

    return {
      operationResult,
      value
    }
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
export const receiveMessage = <T>(sqs: SQS, queueUrl: string, maxNumberOfMessages: number = 1) => async <A = T>(visibilityTimeout: number = 20, waitTimeSeconds: number = 10): Promise<SQSMessageResult<readonly (A | null)[], SQS.ReceiveMessageResult>> => {
  const methodPath = 'ports.aws-sqs.receiveMessage'
  try {
    const operationResult = await sqs.receiveMessage({
      QueueUrl: queueUrl,
      VisibilityTimeout: visibilityTimeout,
      MaxNumberOfMessages: maxNumberOfMessages,
      WaitTimeSeconds: waitTimeSeconds
    }).promise()

    if (typeof operationResult.Messages === 'undefined' || R.isEmpty(operationResult.Messages)) {
      return throwCustomError(new Error('No message response'), methodPath, EClassError.INTERNAL)
    }

    const value = operationResult.Messages.map(message => typeof message.Body !== 'undefined' ? JSON.parse(message.Body) as A : null)

    return {
      operationResult,
      value
    }
  } catch (rejectResponse) {
    if (rejectResponse instanceof Error) {
      return throwCustomError(rejectResponse, methodPath, EClassError.INTERNAL)
    }
    return throwCustomError(new Error(`${rejectResponse.$response.error.code}: ${rejectResponse.$response.error.message}`), methodPath, EClassError.INTERNAL)
  }
}

/**
 * @description delete the message from sqs queue.
 * @memberof ports/aws-sqs
 * @async
 * @function
 * @throws {CustomError}
 * @param {SQS} sqs instance of SQS sdk from aws.
 * @param {string} queueUrl url from sqs queue service from aws.
 * @returns {deleteMessageReturn}
 */
export const deleteMessage = (sqs: SQS, queueUrl: string) => async (receiptHandle: string): Promise<{ readonly operationResult: { readonly $response: Response<{}, AWSError> }}> => {
  const methodPath = 'ports.aws-sqs.deleteMessage'

  try {
    const params = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    }
    const operationResult = await sqs.deleteMessage(params).promise()

    return {
      operationResult
    }
  } catch (rejectResponse) {
    if (rejectResponse instanceof Error) {
      return throwCustomError(rejectResponse, methodPath, EClassError.INTERNAL)
    }
    return throwCustomError(new Error(`${rejectResponse.$response.error.code}: ${rejectResponse.$response.error.message}`), methodPath, EClassError.INTERNAL)
  }
}
