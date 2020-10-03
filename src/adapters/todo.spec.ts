import { getDocument, putDocument, updateDocument, deleteDocument } from '@ports/state-machines/aws.dynamo'
import todoAdapterFactory from './todo'
import { ETodoStatus, EPriority } from '@models'
import { validateUpdateTodo } from '@business/todo'
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { EClassError, throwCustomError } from '@utils'

/** mock error generation to validate signature */
jest.mock('@utils')

; (throwCustomError as any).mockImplementation((error: Error) => {
  throw error
})

// this adapter will mock all methods from aws.dynamo port
jest.mock('@ports/state-machines/aws.dynamo')

// mock escriba calls
const escribaMock = {
  info: jest.fn((args) => (args)).mockReturnValue(undefined)
}

// mock repository structure to test your elements
const repositoryMock = {
  getDocument,
  putDocument,
  updateDocument,
  deleteDocument
}

// mock instantiated adapter
const adapterInstiated = todoAdapterFactory(escribaMock as any, repositoryMock as any)

describe('getTodo', () => {
  const methodPath = 'adapters.todo.getTodo'
  beforeEach(() => {
    (getDocument as any).mockReset()
  })

  const now = moment().toISOString()
  const getDocumentMock = (args: any) => jest.fn().mockResolvedValue({
    id: args.id,
    taskOrder: 0,
    taskDescription: 'mocktaskDescription',
    taskOwner: 'owner',
    taskStatus: ETodoStatus.IN_PROGRESS,
    taskPriority: EPriority.MODERATE,
    creationDate: now,
    updatedAt: now
  })

  const newId = uuidv4()

  test('default case', async () => {
    (repositoryMock.getDocument as any).mockImplementationOnce((args: any) => getDocumentMock(args)())

    await expect(adapterInstiated.getTodo(newId))
      .resolves.toMatchObject({
        id: newId,
        taskOrder: 0,
        taskDescription: 'mocktaskDescription',
        taskOwner: 'owner',
        taskStatus: ETodoStatus.IN_PROGRESS,
        taskPriority: EPriority.MODERATE
      })
    expect(getDocument).toHaveBeenCalled()
    expect(getDocument).toHaveBeenLastCalledWith({ id: newId })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid id'
    const getDocumentErrorMock = (args: any) => {
      jest.fn(args)
      return jest.fn().mockRejectedValue(new Error(throwMessage))
    }
    ; (repositoryMock.getDocument as any).mockImplementationOnce((args: any) => getDocumentErrorMock(args)())
    await expect(adapterInstiated.getTodo(newId)).rejects.toThrow(throwMessage)
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(getDocument).toHaveBeenCalled()
    expect(getDocument).toHaveBeenLastCalledWith({ id: newId })
  })
})

describe('createTodo', () => {
  const methodPath = 'adapters.todo.createTodo'
  beforeEach(() => {
    (putDocument as any).mockReset()
  })

  const putDocumentMock = (args: any) => jest.fn().mockResolvedValue(args)

  const newData = {
    taskOrder: 0,
    taskDescription: 'testDescription',
    taskPriority: EPriority.HIGH
  }

  test('default case', async () => {
    (repositoryMock.putDocument as any).mockImplementationOnce((args: any) => putDocumentMock(args)())
    const insertedData = await adapterInstiated.createTodo(newData, 'owner')

    expect(insertedData).toMatchObject({
      ...newData,
      taskStatus: ETodoStatus.NEW,
      taskOwner: 'owner'
    })
    expect(putDocument).toHaveBeenCalled()
    expect(putDocument).toHaveBeenLastCalledWith(insertedData)
    expect(escribaMock.info).toHaveBeenCalled()
    expect(escribaMock.info).toHaveBeenCalledWith('adapters.todo.createTodo', {
      action: 'TASK_CREATED',
      method: methodPath,
      data: { documentInserted: insertedData }
    })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid data'
    const putDocumentErrorMock = (args: any) => {
      jest.fn(args)
      return jest.fn().mockRejectedValue(new Error(throwMessage))
    }
    ; (repositoryMock.putDocument as any).mockImplementationOnce((args: any) => putDocumentErrorMock(args)())
    await expect(adapterInstiated.createTodo(newData, 'owner')).rejects.toThrow(throwMessage)
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(putDocument).toHaveBeenCalled()
  })

  test('throw error with invalid data (business validation)', async () => {
    (repositoryMock.putDocument as any).mockImplementationOnce((args: any) => putDocumentMock(args)())
    await expect(adapterInstiated.createTodo({} as any, 'owner')).rejects.toThrow()
    expect(putDocument).not.toHaveBeenCalled()
  })
})

describe('updateTodo', () => {
  const methodPath = 'adapters.todo.updateTodo'
  beforeEach(() => {
    (updateDocument as any).mockReset()
    ; (getDocument as any).mockReset()
  })

  const now = moment().toISOString()

  const newData = {
    id: uuidv4(),
    taskOrder: 0,
    taskDescription: 'testDescriptionUpdate',
    taskPriority: EPriority.HIGH,
    taskStatus: ETodoStatus.NEW,
    taskOwner: 'owner',
    createdAt: now,
    updatedAt: now
  }

  const updatedData = {
    taskPriority: EPriority.LOW,
    taskStatus: ETodoStatus.IN_PROGRESS
  }

  const getDocumentMock = jest.fn().mockResolvedValue(newData)
  const updatedTodoMock = validateUpdateTodo(updatedData, newData, 'updateOwner')
  const updateDocumentMock = (key: any, updateExpression: any, expressionAttributeValues: any) => {
    jest.fn({ key, updateExpression, expressionAttributeValues } as any)
    return jest.fn().mockResolvedValue(updatedTodoMock)
  }

  test('default case', async () => {
    (repositoryMock.updateDocument as any).mockImplementationOnce((key: any, updateExpression: any, expressionAttributeValues: any) => updateDocumentMock(key, updateExpression, expressionAttributeValues)())
    ; (repositoryMock.getDocument as any).mockImplementationOnce(getDocumentMock)
    const updatedTodo = await adapterInstiated.updateTodo(newData.id, updatedData, 'updateOwner')
    expect(updatedTodo).toMatchObject(updatedTodoMock)
    const updateExpression = `
    set taskOrder = :taskOrder,
        taskDescription = :taskDescription,
        taskStatus = :taskStatus,
        taskPriority = :taskPriority,
        updatedAt = :updatedAt
    `
    expect(getDocument).toHaveBeenCalled()
    expect(updateDocument).toHaveBeenCalled()
    expect(updateDocument).toHaveBeenCalledWith({ id: newData.id }, updateExpression, expect.objectContaining(updatedData))
    expect(escribaMock.info).toHaveBeenCalled()
    expect(escribaMock.info).toHaveBeenCalledWith('adapters.todo.updateTodo', {
      action: 'TASK_UPDATED',
      method: methodPath,
      data: expect.objectContaining(updatedData)
    })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid data'
    const updateDocumentMockError = (key: any, updateExpression: any, expressionAttributeValues: any) => {
      jest.fn({ key, updateExpression, expressionAttributeValues } as any)
      return jest.fn().mockRejectedValue(new Error(throwMessage))
    }
    ; (repositoryMock.updateDocument as any).mockImplementationOnce((key: any, updateExpression: any, expressionAttributeValues: any) => updateDocumentMockError(key, updateExpression, expressionAttributeValues)())
    ; (repositoryMock.getDocument as any).mockImplementationOnce(getDocumentMock)

    await expect(adapterInstiated.updateTodo(newData.id, updatedData, 'ownerUpdateError')).rejects.toThrow()
    // throws correct message
    expect(getDocument).toHaveBeenCalled()
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(updateDocument).toHaveBeenCalled()
  })

  test('without id found', async () => {
    const throwMessage = 'item not found'
    const updateDocumentMockError = (key: any, updateExpression: any, expressionAttributeValues: any) => {
      jest.fn({ key, updateExpression, expressionAttributeValues } as any)
      return jest.fn().mockRejectedValue(new Error(throwMessage))
    }
    ; (repositoryMock.updateDocument as any).mockImplementationOnce((key: any, updateExpression: any, expressionAttributeValues: any) => updateDocumentMockError(key, updateExpression, expressionAttributeValues)())
    ; (repositoryMock.getDocument as any).mockImplementationOnce(() => null)

    await expect(adapterInstiated.updateTodo(newData.id, updatedData, 'ownerUpdateError')).rejects.toThrow()
    // throws correct message
    expect(getDocument).toHaveBeenCalled()
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(updateDocument).not.toHaveBeenCalled()
  })

  test('throw error with invalid data (business validation)', async () => {
    (repositoryMock.updateDocument as any).mockImplementationOnce((key: any, updateExpression: any, expressionAttributeValues: any) => updateDocumentMock(key, updateExpression, expressionAttributeValues)())
    ; (repositoryMock.getDocument as any).mockImplementationOnce(getDocumentMock)

    await expect(adapterInstiated.updateTodo(newData.id, {}, 'ownerUpdateErrorValidation')).rejects.toThrow()
    expect(updateDocument).not.toHaveBeenCalled()
  })
})

describe('deleteTodo', () => {
  const methodPath = 'adapters.todo.deleteTodo'
  beforeEach(() => {
    (deleteDocument as any).mockReset()
  })

  const now = moment().toISOString()
  const newData = {
    id: uuidv4(),
    taskOrder: 0,
    taskDescription: 'testDescriptionUpdate',
    taskPriority: EPriority.HIGH,
    taskStatus: ETodoStatus.NEW,
    taskOwner: 'owner',
    creationData: now,
    updatedAt: now
  }

  const deleteDocumentMock = (args: any) => {
    jest.fn(args)
    return jest.fn().mockResolvedValue(newData)
  }
  const getDocumentMock = jest.fn().mockResolvedValue(newData)

  test('default case', async () => {
    (repositoryMock.deleteDocument as any).mockImplementationOnce((args: any) => deleteDocumentMock(args)())
    ; (repositoryMock.getDocument as any).mockImplementationOnce(getDocumentMock)
    const deletedTodo = await adapterInstiated.deleteTodo(newData.id, 'deleteOwner')
    expect(deletedTodo).toMatchObject(newData)
    expect(deleteDocument).toHaveBeenCalled()
    expect(deleteDocument).toHaveBeenCalledWith({ id: newData.id })
    expect(escribaMock.info).toHaveBeenCalled()
    expect(escribaMock.info).toHaveBeenCalledWith('adapters.todo.deleteTodo', {
      action: 'TASK_DELETED',
      method: methodPath,
      data: deletedTodo
    })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid id'
    const deleteDocumentErrorMock = (args: any) => {
      jest.fn(args)
      return jest.fn().mockRejectedValue(new Error(throwMessage))
    }
    (repositoryMock.deleteDocument as any).mockImplementationOnce((args: any) => deleteDocumentErrorMock(args)())
    ; (repositoryMock.getDocument as any).mockImplementationOnce(getDocumentMock)

    await expect(adapterInstiated.deleteTodo(newData.id, 'deleteOwner')).rejects.toThrow()
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(getDocument).toHaveBeenCalled()
    expect(getDocument).toHaveBeenCalledWith({ id: newData.id })
  })
})
