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
  taskOrder: number
  taskDescription: string
  taskOwner: UserID
  taskStatus: ETodoStatus
  taskPriority: EPriority
}

export type CreateTodoInput = {
  taskDescription: string
  taskPriority?: EPriority
}

export type MutateTodoInput = {
  taskOrder?: number
  taskDescription?: string
  taskStatus?: ETodoStatus
  taskPriority?: EPriority
}

export type MutateTodoOutput = {
  taskDescription: string
  taskStatus: ETodoStatus
  taskPriority: EPriority
  updatedAt: string
}
