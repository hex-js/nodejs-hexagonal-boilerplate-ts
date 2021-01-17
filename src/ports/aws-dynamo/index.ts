import { DynamoDB } from 'aws-sdk'
import { deleteDocument, getDocument, putDocument, updateDocument, DynamoResult } from './aws.dynamo'

export { DynamoResult } from './aws.dynamo'

export type DynamoRepositoryInstance<T> = {
  readonly updateDocument: (key: DynamoDB.DocumentClient.Key, updateExpression: string, expressionAttributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap) => Promise<DynamoResult<Partial<T>, DynamoDB.DocumentClient.UpdateItemOutput>>
  readonly getDocument: (key: DynamoDB.DocumentClient.Key) => Promise<DynamoResult<T | null, DynamoDB.DocumentClient.GetItemOutput>>
  readonly putDocument: (item: DynamoDB.DocumentClient.PutItemInputAttributeMap) => Promise<DynamoResult<T, DynamoDB.DocumentClient.UpdateItemOutput>>
  readonly deleteDocument: (key: DynamoDB.DocumentClient.Key) => Promise<DynamoResult<null, DynamoDB.DocumentClient.DeleteItemOutput>>
}

export const databaseRepository = <T>(dynamo: DynamoDB.DocumentClient, tableName: string): DynamoRepositoryInstance<T> => ({
  updateDocument: updateDocument<T>(dynamo, tableName),
  getDocument: getDocument<T>(dynamo, tableName),
  putDocument: putDocument<T>(dynamo, tableName),
  deleteDocument: deleteDocument(dynamo, tableName)
})
