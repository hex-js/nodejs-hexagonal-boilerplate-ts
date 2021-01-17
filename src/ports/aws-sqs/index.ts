import { AWSError, Response, SQS } from 'aws-sdk'

import { deleteMessage, receiveMessage, sendMessage, SQSMessageResult } from './aws.sqs'

export type SQSRepositoryInstance<T> = {
  readonly sendMessage: <A = T>(body: A) => Promise<SQSMessageResult<A, SQS.SendMessageResult>>
  readonly receiveMessage: <A = T>(visibilityTimeout?: number, waitTimeSeconds?: number) => Promise<SQSMessageResult<readonly (A | null)[], SQS.ReceiveMessageResult>>
  readonly deleteMessage: (receiptHandle: string) => Promise<{ readonly operationResult: { readonly $response: Response<{}, AWSError> }}>
}

export const queueRepository = <T>(sqs: SQS, queueUrl: string, maxNumberOfMessages?: number): SQSRepositoryInstance<T> => ({
  sendMessage: sendMessage<T>(sqs, queueUrl),
  receiveMessage: receiveMessage<T>(sqs, queueUrl, maxNumberOfMessages),
  deleteMessage: deleteMessage(sqs, queueUrl)
})
