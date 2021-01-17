import { ModelBase } from './base'
/**
 * @description Enum for ETodoStatus values.
 * @export
 * @enum {number}
 */
export enum ETodoStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_TRANSMISSION = 'WAITING_TRANSMISSION',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED'
}

/**
 * @description Enum for EPriority values.
 * @export
 * @enum {number}
 */
export enum EPriority {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export type UserID = string

export type Todo = ModelBase & {
  readonly taskOrder: number
  readonly taskDescription: string
  readonly taskOwner: UserID
  readonly taskStatus: ETodoStatus
  readonly taskPriority: EPriority
}

export type CreateTodoInput = {
  readonly taskDescription: string
  readonly taskPriority?: EPriority
}

export type MutateTodoInput = {
  readonly taskOrder?: number
  readonly taskDescription?: string
  readonly taskStatus?: ETodoStatus
  readonly taskPriority?: EPriority
}

export type MutateTodoOutput = {
  readonly taskDescription: string
  readonly taskStatus: ETodoStatus
  readonly taskPriority: EPriority
  readonly updatedAt: string
}
