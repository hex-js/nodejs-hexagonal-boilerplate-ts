/**
 * Type of value is empty
 */
export type None = null

/**
 * Empty value
 */
export const none: None = null

/**
 * Monad type:
 *  @property {T|None} value Maybe has value: Some (Value is a type T) or None (empty value)
 *  @method map apply function with value of this
 *  @method toString result string of monad value
 */
export type Maybe<T> = {
  readonly value: T | None
  readonly map: <A>(fn: (arg: T) => A) => Maybe<A>
  readonly toString: () => string
}

export const Some = <T>(value: T | None): Maybe<T> => ({
  get value (): T | None {
    return value
  },
  map: <A>(fn: (arg: T) => A): Maybe<A> => {
    if (!value) {
      return Some<A>(none)
    }
    return Some<A>(fn(value))
  },
  toString: () => {
    const result = value ? `Some(${value})` : 'None'
    return `Maybe: ${result}`
  }
})
