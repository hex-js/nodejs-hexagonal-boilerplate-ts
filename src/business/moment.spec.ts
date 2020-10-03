import { EClassError } from '@utils'
import * as utils from '@utils'
import { getDateFormatted, isValidEntry, momentWithTz, toISOString } from './moment'

describe('moment timezone', () => {
  const methodPath = 'business.moment.momentWithTz'
  test('invalid entry', () => {
    const localTimezone = 'America/Sao_Paulo'
    const testDateString = 'INVALID'
    const spyFn = jest.spyOn(utils, 'throwCustomError')

    expect(() => {
      momentWithTz(testDateString, localTimezone)
    }).toThrow(`invalid dateTime entry, got "${testDateString}"`)
    // throws correct message
    expect(spyFn).toHaveBeenCalledWith(new Error(`invalid dateTime entry, got "${testDateString}"`), methodPath, EClassError.INTERNAL)
  })

  test('date fixed with local timezone', () => {
    const hourMinutes = 60
    const localOffset = -3
    const localTimezone = 'America/Sao_Paulo'
    const testDateString = '2020-06-01T12:00:00Z'
    const testDateLocal = momentWithTz(testDateString, localTimezone)

    expect(testDateLocal.utcOffset()).toBe(localOffset * hourMinutes)
    expect(testDateLocal.month()).toBe(5)
    expect(testDateLocal.date()).toBe(1)
    expect(testDateLocal.year()).toBe(2020)
  })

  test('format date fixed with local timezone', () => {
    const localTimezone = 'America/Sao_Paulo'
    const testDateString = '2020-06-01T12:00:00Z'
    const testDateLocal = momentWithTz(testDateString, localTimezone)

    expect(getDateFormatted(testDateLocal)).toBe('202006010900')
  })

  test('date fixed with UTC timezone', () => {
    const config = {
      timezone: 'Etc/UTC'
    }
    const testDateString = '2020-06-01T12:00:00Z'

    const hourMinutes = 60
    const utcOffset = 0
    const testDateUTC = momentWithTz(testDateString, config.timezone)

    expect(testDateUTC.utcOffset()).toBe(utcOffset * hourMinutes)
    expect(testDateUTC.month()).toBe(5)
    expect(testDateUTC.date()).toBe(1)
    expect(testDateUTC.year()).toBe(2020)
  })

  test('format date fixed with UTC timezone', () => {
    const config = {
      timezone: 'Etc/UTC'
    }
    const testDateString = '2020-06-01T12:00:00Z'
    const testDateUTC = momentWithTz(testDateString, config.timezone)

    expect(getDateFormatted(testDateUTC)).toBe('202006011200')
  })

  test('format date fixed with UTC timezone using isoString', () => {
    const config = {
      timezone: 'Etc/UTC'
    }
    const testDateString = '2020-06-01T12:00:00Z'
    const testDateUTC = momentWithTz(testDateString, config.timezone)

    expect(toISOString(testDateUTC)).toBe('2020-06-01T12:00:00.000+00:00')
  })

  test('format now date with UTC timezone', () => {
    const config = {
      timezone: 'Etc/UTC'
    }

    expect(toISOString(undefined, config.timezone)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}$/)
  })

  test('date now with local timezone', () => {
    const hourMinutes = 60
    const localOffset = -3
    const testDateNowConfigured = momentWithTz()

    /***
     * disclaimer this scenario can be intermitent because the call of date now is called 2 times in differente moments in milliseconds, the precision of format is in minutes
     */
    const testDateNowCompare = new Date()

    expect(testDateNowConfigured.utcOffset()).toBe(localOffset * hourMinutes)
    expect(testDateNowConfigured.month()).toBe(testDateNowCompare.getMonth())
    expect(testDateNowConfigured.date()).toBe(testDateNowCompare.getDate())
    expect(testDateNowConfigured.year()).toBe(testDateNowCompare.getFullYear())
  })

  test('format date now with local timezone', () => {
    const testDateNowConfigured = momentWithTz()
    /***
     * disclaimer this scenario can be intermitent because the call of date now is called 2 times in differente moments in milliseconds, the precision of format is in minutes
     */
    const testDateNowCompare = new Date()

    expect(getDateFormatted(testDateNowConfigured)).toBe(`${testDateNowCompare.getFullYear()}${(testDateNowCompare.getMonth() + 1).toString().padStart(2, '0')}${testDateNowCompare.getDate().toString().padStart(2, '0')}${testDateNowCompare.getHours().toString().padStart(2, '0')}${testDateNowCompare.getMinutes().toString().padStart(2, '0')}`)
  })

  test('date now with local timezone and moment with entry param', () => {
    const testDateNowCompare = new Date()
    const testDateNowConfiguredWithDateEntry = momentWithTz(testDateNowCompare)
    const hourMinutes = 60
    const localOffset = -3

    expect(testDateNowConfiguredWithDateEntry.utcOffset()).toBe(localOffset * hourMinutes)
    expect(testDateNowConfiguredWithDateEntry.month()).toBe(testDateNowCompare.getMonth())
    expect(testDateNowConfiguredWithDateEntry.date()).toBe(testDateNowCompare.getDate())
    expect(testDateNowConfiguredWithDateEntry.year()).toBe(testDateNowCompare.getFullYear())
  })

  test('format date now with local timezone and moment with entry param', () => {
    const testDateNowCompare = new Date()
    const testDateNowConfiguredWithDateEntry = momentWithTz(testDateNowCompare)

    expect(getDateFormatted(testDateNowConfiguredWithDateEntry)).toBe(`${testDateNowCompare.getFullYear()}${(testDateNowCompare.getMonth() + 1).toString().padStart(2, '0')}${testDateNowCompare.getDate().toString().padStart(2, '0')}${testDateNowCompare.getHours().toString().padStart(2, '0')}${testDateNowCompare.getMinutes().toString().padStart(2, '0')}`)
  })

  test('date now with UTC timezone', () => {
    const config = {
      timezone: 'Etc/UTC'
    }
    const testDateNowCompare = new Date()
    const testDateNowUTC = momentWithTz(null, config.timezone)
    const hourMinutes = 60
    const localOffset = 0

    expect(testDateNowUTC.utcOffset()).toBe(localOffset * hourMinutes)
    expect(testDateNowUTC.month()).toBe(testDateNowCompare.getUTCMonth())
    expect(testDateNowUTC.date()).toBe(testDateNowCompare.getUTCDate())
    expect(testDateNowUTC.year()).toBe(testDateNowCompare.getUTCFullYear())
  })
})

describe('isValidEntry', () => {
  test('invalid entry', () => {
    expect(isValidEntry('INVALID')).toBe(false)
  })

  test('valid entry', () => {
    expect(isValidEntry('2020-01-01')).toBe(true)
  })
})
