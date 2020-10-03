import { momentConfig } from '@config'
import { EClassError, throwCustomError } from '@utils'
import _tzMoment, { Moment, MomentInput } from 'moment-timezone'
import R from 'ramda'

const moment: typeof _tzMoment = require('moment-timezone/builds/moment-timezone-with-data')

/**
 * @description Moment with timezone local
 * @param {MomentInput} [dta]
 * @param {string} [timezone=momentConfig.timezone]
 * @return {Moment} moment with timezone configure
 */
export const momentWithTz = (dta?: MomentInput, timezone: string = momentConfig.timezone): Moment => {
  if (R.not(R.isNil(dta)) && !isValidEntry(dta)) {
    return throwCustomError(new Error(`invalid dateTime entry, got "${dta}"`), 'business.moment.momentWithTz', EClassError.INTERNAL)
  }
  return (R.isNil(dta) ? moment() : moment(dta)).tz(timezone)
}

/**
 * @description Get the current time formated with 'YYYYMMDDHHmm'
 * @param {Moment} dta
 * @return {string} String datetime with format
 */
export const getDateFormatted = (dta: Moment): string => {
  return dta.format('YYYYMMDDHHmm')
}

/**
 * @description Moment with timezone local in iso8601
 * @param {Moment} [dta]
 * @param {string} [timezone=momentConfig.timezone]
 * @return {string} iso8601 string date time with timezone defined
 */
export const toISOString = (dta?: Moment, timezone: string = momentConfig.timezone): string => {
  return (R.isNil(dta) ? momentWithTz(null, timezone) : dta).toISOString(true)
}

/**
 * @description return if entry string is a valid iso8601 data
 * @param {MomentInput} [dta]
 * @return {boolean} is valid?
 */
export const isValidEntry = (dta: MomentInput): boolean => {
  return moment(dta, moment.ISO_8601).isValid()
}
