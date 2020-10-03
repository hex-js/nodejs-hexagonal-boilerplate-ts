import { validateCreateTodo, validateUpdateTodo, validateDeleteTodo } from './todo'
import { EPriority, ETodoStatus } from '@models'
import { EClassError } from '@utils'
import * as utils from '@utils'
import R from 'ramda'

describe('validateCreateTodo', () => {
  const methodPath = 'business.todo.validateCreateTodo'
  const validateCaseDefault = {
    taskDescription: 'test'
  }

  test('validate default case', () => {
    expect(validateCreateTodo(validateCaseDefault, 'testUser')).toMatchObject({
      ...validateCaseDefault,
      taskStatus: ETodoStatus.NEW,
      taskOwner: 'testUser',
      taskPriority: EPriority.LOW,
      taskOrder: 0
    })
  })

  const validateCasePriorityInvalid = {
    taskOrder: 1,
    taskDescription: 'test',
    taskPriority: 'INVALID' as any
  }

  test('validate invalid taskPriority', () => {
    const throwMessage = `invalid value for priority: got ${validateCasePriorityInvalid.taskPriority}`
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateCreateTodo(validateCasePriorityInvalid, 'testUser')
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  const validateNullDescription: any = {
    taskOrder: 1
  }

  test('validate null description on create', () => {
    const throwMessage = 'invalid entry on field data, missing information about taskDescription'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateCreateTodo(validateNullDescription, 'testUser')
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  const validateNullData: any = null

  test('validate null data on create', () => {
    const throwMessage = 'invalid entry on field data, missing information'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateCreateTodo(validateNullData, 'testUser')
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate null user on create', () => {
    const throwMessage = 'owner is missing'
    expect(() => {
      validateCreateTodo(validateCaseDefault)
    }).toThrow(throwMessage)
    // throws correct message
    // expect(throwCustomError).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })
})

describe('validateUpdateTodo', () => {
  const methodPath = 'business.todo.validateUpdateTodo'
  const defaultOriginalData = validateCreateTodo({
    taskPriority: EPriority.HIGH,
    taskDescription: 'updateDefault'
  }, 'owner')

  const validateCaseDefaultUpdate = {
    ...R.pick(['taskOrder', 'taskDescription', 'taskStatus', 'taskPriority'], defaultOriginalData),
    taskStatus: ETodoStatus.IN_PROGRESS
  }

  test('validate null user on update', () => {
    const throwMessage = 'owner is missing'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateUpdateTodo(validateCaseDefaultUpdate, defaultOriginalData)
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate null originalData on update', () => {
    const throwMessage = 'no data for this id'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateUpdateTodo(validateCaseDefaultUpdate)
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate data when is null for update', () => {
    const throwMessage = 'invalid entry on field data, missing information or invalid properties'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateUpdateTodo(null, defaultOriginalData, 'testUser')
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate data when is invalid for update', () => {
    const throwMessage = 'invalid entry on field data, missing information or invalid properties'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateUpdateTodo({ notValid: true } as any, defaultOriginalData, 'testUser')
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate normal update', () => {
    const validateCaseNormal = {
      ...R.pick(['taskOrder'], defaultOriginalData),
      taskDescription: 'new description',
      taskStatus: ETodoStatus.IN_PROGRESS,
      taskPriority: EPriority.MODERATE
    }
    const updatedData = validateUpdateTodo(validateCaseNormal, defaultOriginalData, 'testUser')
    expect(updatedData)
      .toMatchObject({
        taskDescription: 'new description',
        taskStatus: ETodoStatus.IN_PROGRESS,
        taskPriority: EPriority.MODERATE
      })

    expect(updatedData.updatedAt)
      .not.toBe(null)
    expect(updatedData)
      .not.toHaveProperty('taskOwner')
    expect(updatedData)
      .not.toHaveProperty('id')
  })
})

describe('validateDeleteTodo', () => {
  const methodPath = 'business.todo.validateDeleteTodo'
  const spyFn = jest.spyOn(utils, 'throwCustomError')
  const defaultOriginalData = validateCreateTodo({
    taskPriority: EPriority.HIGH,
    taskDescription: 'deleteDefault'
  }, 'owner')

  test('validate null user on delete', () => {
    const throwMessage = 'owner is missing'
    expect(() => {
      validateDeleteTodo(defaultOriginalData)
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate null originalData on update', () => {
    const throwMessage = 'no data for this id'
    const spyFn = jest.spyOn(utils, 'throwCustomError')
    expect(() => {
      validateDeleteTodo(null, 'deleteUser')
    }).toThrow(throwMessage)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(throwMessage), methodPath, EClassError.USER_ERROR)
  })

  test('validate normal delete', () => {
    expect(validateDeleteTodo(defaultOriginalData, 'testUser')).toMatchObject(defaultOriginalData)
  })
})
