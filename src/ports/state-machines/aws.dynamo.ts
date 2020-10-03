import { DynamoDB } from 'aws-sdk'
import { EClassError, throwCustomError } from '@utils'
import R from 'ramda'

/**
 * @description Get a document on table TableName in the DynamoDB.
 * @param {DynamoDB.DocumentClient} dynamo instance of Dynamo SDK for aws (DocumentClient)
 * @param {string} tableName name of table in DynamoDB
 */
export const getDocument = <T>(dynamo: DynamoDB.DocumentClient, tableName: string) => async (key: DynamoDB.DocumentClient.Key): Promise<T | null> => {
  try {
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: tableName,
      Key: key
    }

    const result = await dynamo.get(params).promise()

    return R.not(R.isNil(result.Item)) ? result.Item as T : null
  } catch (error) {
    return throwCustomError(error, 'state-machines.aws.dynamo.getDocument', EClassError.INTERNAL)
  }
}

/**
 * Update document in the DynamoDB.
 *
 * @function
 * @param {DynamoDB.DocumentClient} dynamo instance of Dynamo SDK for aws (DocumentClient)
 * @param {string} tableName name of table in DynamoDB
 */
export const putDocument = <T>(dynamo: DynamoDB.DocumentClient, tableName: string) => async (item: DynamoDB.DocumentClient.PutItemInputAttributeMap): Promise<T> => {
  try {
    const params = {
      TableName: tableName,
      Item: item
    }

    await dynamo.put(params).promise()

    return params.Item as T
  } catch (error) {
    return throwCustomError(error, 'state-machines.aws.dynamo.putDocument', EClassError.INTERNAL)
  }
}

/**
 * @description Update document in the DynamoDB.
 * @param {DynamoDB.DocumentClient} dynamo instance of Dynamo SDK for aws (DocumentClient)
 * @param {string} tableName name of table in DynamoDB
 */
export const updateDocument = <T>(dynamo: DynamoDB.DocumentClient, tableName: string) => async (key: DynamoDB.DocumentClient.Key, updateExpression: DynamoDB.DocumentClient.UpdateExpression, expressionAttributeValues: DynamoDB.DocumentClient.ExpressionAttributeValueMap): Promise<Partial<T>> => {
  try {
    const params = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: remapPrevixVariables(expressionAttributeValues),
      ReturnValues: 'ALL_NEW'
    }

    const output = await dynamo.update(params).promise()

    return (output.Attributes || {}) as Partial<T>
  } catch (error) {
    return throwCustomError(error, 'state-machines.aws.dynamo.updateDocument', EClassError.INTERNAL)
  }
}

/**
 * @description Delete a document on table TableName in the DynamoDB.
 * @param {DynamoDB.DocumentClient} dynamo instance of Dynamo SDK for aws (DocumentClient)
 * @param {string} tableName name of table in DynamoDB
 */
export const deleteDocument = (dynamo: DynamoDB.DocumentClient, tableName: string) => async (key: DynamoDB.DocumentClient.Key): Promise<void> => {
  try {
    const params = {
      TableName: tableName,
      Key: key
    }

    await dynamo.delete(params).promise()
  } catch (error) {
    return throwCustomError(error, 'state-machines.aws.dynamo.deleteDocument', EClassError.INTERNAL)
  }
}

/**
 * @description Add ":" in all variables in prefix remaping the object
 * @param {Object} obj object param in ExpressionAttributeValues
 */
export const remapPrevixVariables = <T extends { [key: string]: any }>(obj: T) => {
  return Object
    .keys(obj).reduce((prev, curr) => {
      return { ...prev, [`:${curr}`]: obj[curr] }
    }, {} as Exclude<T, keyof T>)
}
