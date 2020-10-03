export class CustomError extends Error {
  readonly name: string
  readonly message: string
  readonly stack: string
  readonly internalName: string
  readonly method: string

  /**
   * Creates an instance of CustomError.
   * @param {Error} err
   * @param {string} methodPath
   * @param {string} classError
   * @memberof CustomError
   */
  constructor (err: Error, methodPath: string, classError: string) {
    super()
    const { name, message, stack } = err
    this.name = name
    this.message = message
    this.stack = stack || ''
    this.internalName = classError
    this.method = methodPath
  }
}

export enum EClassError {
  INTERNAL = 'INTERNAL',
  USER_ERROR = 'USER_ERROR'
}

export const throwCustomError = (error: Error, methodPath: string, classError: string) => {
  if (error instanceof CustomError) {
    throw error
  }
  throw new CustomError(error, methodPath, classError)
}
