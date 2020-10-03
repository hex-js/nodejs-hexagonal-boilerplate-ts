import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Todo } from '@models'
import { databaseRepository } from './index'
import { remapPrevixVariables } from './aws.dynamo'
import { v4 as uuidv4 } from 'uuid'
import { EClassError } from '@utils'
import * as utils from '@utils'

/**
 * jest invocation for aws-sdk
 */
jest.mock('aws-sdk/clients/dynamodb')

const dynamo = new DocumentClient()
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
    (DocumentClient as any).mockReset()
  })
  const methodPath = 'state-machines.aws.dynamo.getDocument'
  test('default case', async () => {
    (dynamo.get as any).mockImplementationOnce((Params: any) => dynamoMockObject.get(Params)())
    const newId = uuidv4()

    await expect(repoInstance.getDocument({ id: newId }))
      .resolves.toMatchObject({
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
    await expect(repoInstance.getDocument({ id: newId })).rejects.toThrow(throwMessage)
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

    await expect(repoInstance.getDocument({ id: newId })).resolves.toBe(null)
    expect(dynamo.get).toHaveBeenCalled()
    expect(dynamo.get).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })

  test('undefined result.Item', async () => {
    (dynamo.get as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Item: undefined })
    }))
    const newId = uuidv4()

    await expect(repoInstance.getDocument({ id: newId })).resolves.toBe(null)
    expect(dynamo.get).toHaveBeenCalled()
    expect(dynamo.get).toHaveBeenCalledWith({ Key: { id: newId }, TableName: tableName })
  })
})

describe('putDocument', () => {
  beforeEach(() => {
    (DocumentClient as any).mockReset()
  })
  const methodPath = 'state-machines.aws.dynamo.putDocument'
  test('default case', async () => {
    (dynamo.put as any).mockImplementationOnce((Params: any) => dynamoMockObject.put(Params)())
    const newId = uuidv4()

    await expect(repoInstance.putDocument({
      id: newId,
      description: 'mockResult'
    }))
      .resolves.toMatchObject({
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
    })).rejects.toThrow(throwMessage)
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
    (DocumentClient as any).mockReset()
  })
  const methodPath = 'state-machines.aws.dynamo.updateDocument'
  test('default case', async () => {
    (dynamo.update as any).mockImplementationOnce((Params: any) => dynamoMockObject.update(Params)())
    const id = uuidv4()

    await expect(repoInstance.updateDocument(
      {
        id
      },
      'description := :description',
      { description: 'mockResult' }
    ))
      .resolves.toMatchObject({
        id,
        description: 'mockResult'
      })
    expect(dynamo.update).toHaveBeenCalled()
    expect(dynamo.update).toHaveBeenCalledWith({
      Key: { id },
      TableName: tableName,
      UpdateExpression: 'description := :description',
      ExpressionAttributeValues: remapPrevixVariables({ description: 'mockResult' }),
      ReturnValues: 'ALL_NEW'
    })
  })

  test('undefined result.Attributes', async () => {
    (dynamo.update as any).mockImplementationOnce(jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Attributes: undefined })
    }))
    const id = uuidv4()

    await expect(repoInstance.updateDocument(
      {
        id
      },
      'description := :description',
      { description: 'mockAttributes' }
    )).resolves.toEqual({})
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
    )).rejects.toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(dynamo.update).toHaveBeenCalled()
    expect(dynamo.update).toHaveBeenCalledWith({
      Key: { id: newId },
      TableName: tableName,
      UpdateExpression: 'description := :description',
      ExpressionAttributeValues: remapPrevixVariables({ description: 'mockResult' }),
      ReturnValues: 'ALL_NEW'
    })
  })
})

describe('deleteDocument', () => {
  beforeEach(() => {
    (DocumentClient as any).mockReset()
  })
  const methodPath = 'state-machines.aws.dynamo.deleteDocument'
  test('default case', async () => {
    (dynamo.delete as any).mockImplementationOnce((Params: any) => dynamoMockObject.delete(Params)())
    const newId = uuidv4()

    await expect(repoInstance.deleteDocument({ id: newId }))
      .resolves.toBeUndefined()
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
    const remmaped = remapPrevixVariables({ a: 'a' })
    expect(remmaped).toMatchObject({ ':a': 'a' })
  })

  test('empty', () => {
    const remmaped = remapPrevixVariables({})
    expect(remmaped).toMatchObject({})
  })
})
