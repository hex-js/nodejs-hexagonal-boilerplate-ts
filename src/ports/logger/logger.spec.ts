import { handleLogger } from './logger'

const appName = 'test-logger-app'
const envName = String(process.env.NODE_ENV)
const logger = handleLogger(appName, envName)

describe('basic usage', () => {
  test('info', () => {
    const spyFn = jest.spyOn(logger.logger, 'info').mockImplementation()
    const method = 'basic.info'
    const message = 'baisc info message'
    logger.info(method, message)

    expect(spyFn).toBeCalledWith(message, expect.objectContaining({
      from: {
        appName,
        envName,
        method
      },
      id: expect.any(String)
    }))
  })

  test('error', () => {
    const spyFn = jest.spyOn(logger.logger, 'info').mockImplementation()
    const method = 'basic.error'
    const message = 'baisc error message'
    logger.error(method, message)

    expect(spyFn).toBeCalledWith(message, expect.objectContaining({
      from: {
        appName,
        envName,
        method
      },
      id: expect.any(String)
    }))
  })
})
