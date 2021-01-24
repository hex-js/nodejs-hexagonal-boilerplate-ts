import { validateCreateTodo, validateDeleteTodo, validateUpdateTodo } from '@business/todo'
import { EPriority, ETodoStatus } from '@models'
import { EClassError, throwCustomError } from '@utils/errors'
import moment from 'moment'
import { v4 as uuidV4 } from 'uuid'
import todoAdapterFactory from './todo'

/** mock error generation to validate signature */
jest.mock('@utils/errors')
jest.mock('@business/todo')

; (throwCustomError as any).mockImplementation((error: Error) => {
  // eslint-disable-next-line functional/no-throw-statement
  throw error
})

; (validateCreateTodo as any).mockImplementation((args: any) => ({ ...args, taskStatus: ETodoStatus.NEW, taskOwner: 'owner' }))

; (validateUpdateTodo as any).mockImplementation((args: any) => ({ ...args }))

; (validateDeleteTodo as any).mockImplementation((args: any) => ({ ...args }))

// mock logger calls
const loggerMock = {
  info: jest.fn((args) => (args)).mockReturnValue(undefined)
}

const now = moment().toISOString()

// mock repository structure to test your elements
const repositoryMock = {
  getDocument: async (args: any) => ({
    value: {
      id: args.id,
      taskOrder: 0,
      taskDescription: 'mocktaskDescription',
      taskOwner: 'owner',
      taskStatus: ETodoStatus.IN_PROGRESS,
      taskPriority: EPriority.MODERATE,
      creationDate: now,
      updatedAt: now
    }
  }),
  putDocument: async (args: any) => ({
    value: {
      ...args,
      taskStatus: ETodoStatus.NEW,
      taskOwner: 'owner'
    }
  })
}

// mock instantiated adapter
const adapterInstance = todoAdapterFactory(loggerMock as any, repositoryMock as any)

describe('getTodo', () => {
  const methodPath = 'adapters.todo.getTodo'

  const newId = uuidV4()

  test('default case', async () => {
    const getDocumentSpy = jest.spyOn(repositoryMock, 'getDocument')
    await expect(adapterInstance.getTodo(newId))
      .resolves.toMatchObject({
        id: newId,
        taskOrder: 0,
        taskDescription: 'mocktaskDescription',
        taskOwner: 'owner',
        taskStatus: ETodoStatus.IN_PROGRESS,
        taskPriority: EPriority.MODERATE
      })
    expect(getDocumentSpy).toHaveBeenCalled()
    expect(getDocumentSpy).toHaveBeenLastCalledWith({ id: newId })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid id'
    const getDocumentErrorMock = jest.fn().mockRejectedValue(new Error(throwMessage))
    const adapterInstanceWithError = todoAdapterFactory(loggerMock as any, { getDocument: getDocumentErrorMock } as any)
    await expect(adapterInstanceWithError.getTodo(newId)).rejects.toThrow(throwMessage)
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(getDocumentErrorMock).toHaveBeenCalled()
    expect(getDocumentErrorMock).toHaveBeenLastCalledWith({ id: newId })
  })
})

describe('createTodo', () => {
  const methodPath = 'adapters.todo.createTodo'
  const newData = {
    id: uuidV4(),
    taskOrder: 0,
    taskDescription: 'testDescription',
    taskPriority: EPriority.HIGH
  }

  test('default case', async () => {
    const putDocumentSpy = jest.spyOn(repositoryMock, 'putDocument')
    const insertedData = await adapterInstance.createTodo(newData, 'owner')

    expect(insertedData).toMatchObject({
      ...newData,
      taskStatus: ETodoStatus.NEW,
      taskOwner: 'owner'
    })
    expect(validateCreateTodo).toHaveBeenCalled()
    expect(validateCreateTodo).toHaveBeenCalledWith(newData, 'owner')
    expect(putDocumentSpy).toHaveBeenCalled()
    expect(putDocumentSpy).toHaveBeenLastCalledWith({ ...newData, taskStatus: ETodoStatus.NEW, taskOwner: 'owner' })
    expect(loggerMock.info).toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenCalledWith('adapters.todo.createTodo', {
      action: 'TASK_CREATED',
      method: methodPath,
      data: { value: insertedData }
    })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid data'
    const putDocumentErrorMock = jest.fn().mockRejectedValue(new Error(throwMessage))
    const adapterInstanceWithError = todoAdapterFactory(loggerMock as any, { putDocument: putDocumentErrorMock } as any)
    await expect(adapterInstanceWithError.createTodo(newData, 'owner')).rejects.toThrow(throwMessage)

    // throws correct message
    expect(validateCreateTodo).toHaveBeenCalled()
    expect(validateCreateTodo).toHaveBeenCalledWith(newData, 'owner')
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(putDocumentErrorMock).toHaveBeenCalled()
    expect(putDocumentErrorMock).toHaveBeenCalledWith({ ...newData, taskStatus: ETodoStatus.NEW, taskOwner: 'owner' })
  })
})

describe('updateTodo', () => {
  const methodPath = 'adapters.todo.updateTodo'
  const now = moment().toISOString()
  const data = {
    id: uuidV4(),
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

  const resultUpdate = {
    ...data,
    ...updatedData
  }

  const getDocument = jest.fn().mockResolvedValue({ value: data })
  const updateDocument = jest.fn().mockResolvedValue({ value: resultUpdate })
  const adapterInstanceUpdate = todoAdapterFactory(loggerMock as any, { getDocument, updateDocument } as any)

  test('default case', async () => {
    const updatedTodo = await adapterInstanceUpdate.updateTodo(data.id, resultUpdate, 'updateOwner')
    expect(updatedTodo).toMatchObject(updatedData)
    const updateExpression = `
    set taskOrder = :taskOrder,
        taskDescription = :taskDescription,
        taskStatus = :taskStatus,
        taskPriority = :taskPriority,
        updatedAt = :updatedAt
    `

    expect(updateDocument).toHaveBeenCalled()
    expect(updateDocument).toHaveBeenCalledWith({ id: data.id }, updateExpression, expect.objectContaining(updatedData))
    expect(loggerMock.info).toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenCalledWith('adapters.todo.updateTodo', {
      action: 'TASK_UPDATED',
      method: methodPath,
      data: expect.objectContaining({ value: resultUpdate })
    })
  })

  test('throw error', async () => {
    const throwMessage = 'invalid data'
    const updateDocumenttErrorMock = jest.fn().mockRejectedValue(new Error(throwMessage))
    const adapterInstanceWithError = todoAdapterFactory(loggerMock as any, { getDocument, updateDocument: updateDocumenttErrorMock } as any)

    await expect(adapterInstanceWithError.updateTodo(data.id, updatedData, 'ownerUpdateError')).rejects.toThrow()
    // throws correct message
    expect(getDocument).toHaveBeenCalled()
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(updateDocumenttErrorMock).toHaveBeenCalled()
  })

  test('without id found', async () => {
    const throwMessage = 'item not found'
    const getDocumentReturnNull = jest.fn().mockReturnValue({ value: null })
    const adapterInstanceWithError = todoAdapterFactory(loggerMock as any, { getDocument: getDocumentReturnNull, updateDocument } as any)

    await expect(adapterInstanceWithError.updateTodo(data.id, updatedData, 'ownerUpdateError')).rejects.toThrow()
    // throws correct message
    expect(getDocumentReturnNull).toHaveBeenCalled()
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(updateDocument).not.toHaveBeenCalled()
  })
})

describe('deleteTodo', () => {
  const methodPath = 'adapters.todo.deleteTodo'
  const now = moment().toISOString()
  const newData = {
    id: uuidV4(),
    taskOrder: 0,
    taskDescription: 'testDescriptionUpdate',
    taskPriority: EPriority.HIGH,
    taskStatus: ETodoStatus.NEW,
    taskOwner: 'owner',
    creationData: now,
    updatedAt: now
  }

  const getDocument = jest.fn().mockResolvedValue({ value: newData })
  const deleteDocument = jest.fn().mockResolvedValue({ value: null })

  test('default case', async () => {
    const adapterInstanceDelete = todoAdapterFactory(loggerMock as any, { getDocument, deleteDocument } as any)
    const deletedTodo = await adapterInstanceDelete.deleteTodo(newData.id, 'deleteOwner')
    expect(deletedTodo).toMatchObject(newData)
    expect(getDocument).toHaveBeenCalled()
    expect(getDocument).toHaveBeenCalledWith({ id: newData.id })
    expect(deleteDocument).toHaveBeenCalled()
    expect(deleteDocument).toHaveBeenCalledWith({ id: newData.id })
    expect(loggerMock.info).toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenCalledWith('adapters.todo.deleteTodo', {
      action: 'TASK_DELETED',
      method: methodPath,
      data: expect.objectContaining({ value: newData })
    })
  })

  test('throw error', async () => {
    const throwMessage = 'no data for this id'
    const getDocument = jest.fn().mockResolvedValue({ value: null })
    const adapterInstanceError = todoAdapterFactory(loggerMock as any, { getDocument, deleteDocument } as any)

    await expect(adapterInstanceError.deleteTodo(newData.id, 'deleteOwner')).rejects.toThrow()
    // throws correct message
    expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.INTERNAL)
    expect(getDocument).toHaveBeenCalled()
    expect(getDocument).toHaveBeenCalledWith({ id: newData.id })
  })
})
