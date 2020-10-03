import { DynamoDB, SQS } from 'aws-sdk'
import { deleteDocument, getDocument, putDocument, updateDocument } from './aws.dynamo'
import { deleteMessage, receiveMessage, sendMessage, SQSDeleteMessage, SQSReceiveMessage } from './aws.sqs'

export type DynamoRepositoryInstance<T> = {
  updateDocument: (key: DynamoDB.DocumentClient.Key, updateExpression: string, expressionAttributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap) => Promise<Partial<T>>
  getDocument: (key: DynamoDB.DocumentClient.Key) => Promise<T|null>
  putDocument: (item: DynamoDB.DocumentClient.PutItemInputAttributeMap) => Promise<T>
  deleteDocument: (key: DynamoDB.DocumentClient.Key) => Promise<void>
}

export type SQSRepositoryInstance<T> = {
  sendMessage: (body: T) => Promise<string>
  receiveMessage: (visibilityTimeout?: number, waitTimeSeconds?: number) => Promise<SQSReceiveMessage<T>[]>
  deleteMessage: (receiptHandle: string) => Promise<SQSDeleteMessage>
}

export const databaseRepository = <T>(dynamo: DynamoDB.DocumentClient, tableName: string): DynamoRepositoryInstance<T> => {
  return {
    updateDocument: updateDocument<T>(dynamo, tableName),
    getDocument: getDocument<T>(dynamo, tableName),
    putDocument: putDocument<T>(dynamo, tableName),
    deleteDocument: deleteDocument(dynamo, tableName)
  }
}

export const queueRepository = <T>(sqs: SQS, queueUrl: string, maxNumberOfMessages?: number): SQSRepositoryInstance<T> => {
  return {
    sendMessage: sendMessage<T>(sqs, queueUrl),
    receiveMessage: receiveMessage<T>(sqs, queueUrl, maxNumberOfMessages),
    deleteMessage: deleteMessage(sqs, queueUrl)
  }
}
