import { Todo } from '@models'
import * as utils from '@utils'
import { EClassError, throwCustomError } from '@utils/errors'
import { DynamoDB } from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { remapPrefixVariables } from './aws.dynamo'
import { databaseRepository } from './index'

/**
 * jest invocation for aws-sdk
 */
jest.mock('aws-sdk')
jest.mock('../../utils/errors')

; (throwCustomError as any).mockImplementation((error: Error) => {
  // eslint-disable-next-line functional/no-throw-statement
  throw error
})

const dynamo = new DynamoDB.DocumentClient()
const tableName = 'mockTable'
const repoInstance = databaseRepository<Todo>(dynamo, 'mockTable')

const dynamoMockObject = {
  get: (Params: any) => jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Item: {
        id: Params.Key.id,
        description: 'mockResult'
      }
    })
  }),
  put: (Params: any) => jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue(Params.Item)
  }),
  update: (Params: any) => jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Attributes: {
        id: Params.Key.id,
        description: 'mockResult'
      }
    })
  }),
  delete: (Params: any) => jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Item: {
        id: Params.Key.id,
        description: 'mockResult'
      }
    })
  })
}

describe('getDocument', () => {
  beforeEach(() => {
    (DynamoDB.DocumentClient as any).mockReset()
  })
  const methodPath = 'ports.aws-dynamo.getDocument'
  test('default case', async () => {
    (dynamo.get as any).mockImplementationOnce((Params: any) => dynamoMockObject.get(Params)())
    const newId = uuidv4()

    const result = await repoInstance.getDocument({ id: newId })

    expect(result.value).toMatchObject({
      id: newId,
      description: 'mockResult'
    })
    expect(dynamo.get).toHaveBeenCalled()
    expect(dynamo.get).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })

  test('error', async () => {
    const throwMessage = 'invalid id'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    ; (dynamo.get as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error(throwMessage))
    }))
    const newId = uuidv4()
    await expect(repoInstance.getDocument({ id: newId })).rejects.toEqual(new Error(throwMessage))
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(dynamo.get).toHaveBeenCalled()
    expect(dynamo.get).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })

  test('null result.Item', async () => {
    (dynamo.get as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Item: null })
    }))
    const newId = uuidv4()

    const result = await repoInstance.getDocument({ id: newId })

    expect(result.value).toBe(null)
    expect(dynamo.get).toHaveBeenCalled()
    expect(dynamo.get).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })

  test('undefined result.Item', async () => {
    (dynamo.get as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Item: undefined })
    }))
    const newId = uuidv4()

    const result = await repoInstance.getDocument({ id: newId })

    expect(result.value).toBeNull()
    expect(dynamo.get).toHaveBeenCalled()
    expect(dynamo.get).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })
})

describe('putDocument', () => {
  beforeEach(() => {
    (DynamoDB.DocumentClient as any).mockReset()
  })
  const methodPath = 'ports.aws-dynamo.putDocument'
  test('default case', async () => {
    (dynamo.put as any).mockImplementationOnce((Params: any) => dynamoMockObject.put(Params)())
    const newId = uuidv4()

    const result = await repoInstance.putDocument({
      id: newId,
      description: 'mockResult'
    })

    await expect(result.value).toMatchObject({
      id: newId,
      description: 'mockResult'
    })
    expect(dynamo.put).toHaveBeenCalled()
    expect(dynamo.put).toHaveBeenCalledWith({
      Item: {
        id: newId,
        description: 'mockResult'
      },
      TableName: tableName
    })
  })

  test('error', async () => {
    const throwMessage = 'invalid entry'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    ; (dynamo.put as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error(throwMessage))
    }))
    const newId = uuidv4()

    await expect(repoInstance.putDocument({
      id: newId,
      description: 'mockResult'
    })).rejects.toEqual(new Error(throwMessage))
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(dynamo.put).toHaveBeenCalled()
    expect(dynamo.put).toHaveBeenCalledWith({
      Item: {
        id: newId,
        description: 'mockResult'
      },
      TableName: tableName
    })
  })
})

describe('updateDocument', () => {
  beforeEach(() => {
    (DynamoDB.DocumentClient as any).mockReset()
  })
  const methodPath = 'ports.aws-dynamo.updateDocument'
  test('default case', async () => {
    (dynamo.update as any).mockImplementationOnce((Params: any) => dynamoMockObject.update(Params)())
    const id = uuidv4()

    const result = await repoInstance.updateDocument(
      {
        id
      },
      'description := :description',
      { description: 'mockResult' }
    )

    expect(result.value).toMatchObject({
      id,
      description: 'mockResult'
    })
    expect(dynamo.update).toHaveBeenCalled()
    expect(dynamo.update).toHaveBeenCalledWith({
      Key: { id },
      TableName: tableName,
      UpdateExpression: 'description := :description',
      ExpressionAttributeValues: remapPrefixVariables({ description: 'mockResult' }),
      ReturnValues: 'ALL_NEW'
    })
  })

  test('undefined result.Attributes', async () => {
    (dynamo.update as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Attributes: undefined })
    }))
    const id = uuidv4()

    const result = await repoInstance.updateDocument(
      {
        id
      },
      'description := :description',
      { description: 'mockAttributes' }
    )

    expect(result.value).toEqual({})
  })

  test('error', async () => {
    const throwMessage = 'invalid entry'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    ; (dynamo.update as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error(throwMessage))
    }))
    const newId = uuidv4()

    await expect(repoInstance.updateDocument(
      {
        id: newId
      },
      'description := :description',
      { description: 'mockResult' }
    )).rejects.toEqual(new Error(throwMessage))
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(dynamo.update).toHaveBeenCalled()
    expect(dynamo.update).toHaveBeenCalledWith({
      Key: { id: newId },
      TableName: tableName,
      UpdateExpression: 'description := :description',
      ExpressionAttributeValues: remapPrefixVariables({ description: 'mockResult' }),
      ReturnValues: 'ALL_NEW'
    })
  })
})

describe('deleteDocument', () => {
  beforeEach(() => {
    (DynamoDB.DocumentClient as any).mockReset()
  })
  const methodPath = 'ports.aws-dynamo.deleteDocument'
  test('default case', async () => {
    (dynamo.delete as any).mockImplementationOnce((Params: any) => dynamoMockObject.delete(Params)())
    const newId = uuidv4()

    const result = await repoInstance.deleteDocument({ id: newId })

    expect(result.value).toBeNull()
    expect(dynamo.delete).toHaveBeenCalled()
    expect(dynamo.delete).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })

  test('error', async () => {
    const throwMessage = 'invalid id'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    ; (dynamo.delete as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error(throwMessage))
    }))
    const newId = uuidv4()

    await expect(repoInstance.deleteDocument({ id: newId })).rejects.toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(dynamo.delete).toHaveBeenCalled()
    expect(dynamo.delete).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })
})

describe('remapPrevixVariables', () => {
  test('default case', () => {
    const remmaped = remapPrefixVariables({ a: 'a' })
    expect(remmaped).toMatchObject({ ':a': 'a' })
  })

  test('empty', () => {
    const remmaped = remapPrefixVariables({})
    expect(remmaped).toMatchObject({})
  })
})
