/* eslint-disable functional/no-throw-statement */
/* eslint-disable functional/no-conditional-statement */
import R from 'ramda'

export enum EClassError {
  INTERNAL = 'INTERNAL',
  USER_ERROR = 'USER_ERROR'
}

export type CustomError = {
  readonly name: string
  readonly message: string
  readonly stack?: string
  readonly internalName: EClassError
  readonly method: string
}

const isCustomErrorInstance = (value?: any): value is CustomError => R.not(R.isNil(value)) &&
  typeof R.prop('name', value) === 'string' &&
  typeof R.prop('message', value) === 'string' &&
  (R.isNil(R.prop('stack', value)) || typeof R.prop('stack', value) === 'string') &&
  typeof R.prop('internalName', value) === 'string' &&
  typeof R.prop('method', value) === 'string'

export const customErrorFactory = (error: Error, methodPath: string, classError: EClassError): CustomError => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  internalName: classError,
  method: methodPath
})

export const throwCustomError = <E extends Error>(error: E, methodPath: string, classError: EClassError): never => {
  if (isCustomErrorInstance(error)) {
    throw error
  }

  throw customErrorFactory(error, methodPath, classError)
}
