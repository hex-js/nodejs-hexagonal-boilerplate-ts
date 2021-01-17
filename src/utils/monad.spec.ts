import { Maybe, Some, none } from './monad'

describe('Monad', () => {
  test('Some', () => {
    const two: Maybe<number> = Some(2)
    const addFn = (n: number): number => n + 1

    expect(two).toHaveProperty('value')
    expect(two).toHaveProperty('map')
    expect(two).toHaveProperty('toString')
    expect(two.value).toBe(2)
    expect(two.toString()).toBe('Maybe: Some(2)')
    expect(two.map(addFn).value).toBe(3)
  })

  test('None', () => {
    const two = Some<number>(none)
    const addFn = (n: number): number => n + 1
    const twoAdded = two.map(addFn)

    expect(twoAdded).toHaveProperty('value')
    expect(twoAdded).toHaveProperty('map')
    expect(twoAdded).toHaveProperty('toString')
    expect(twoAdded.value).toBe(none)
    expect(twoAdded.toString()).toBe('Maybe: None')
  })

  test('Complex case', () => {
    type User = {
      readonly name: string
      readonly age: number
      readonly dateOfBirth: Date
    }
    const user: User = { name: ' Tester ', age: 26, dateOfBirth: new Date(1995, 1, 1) }
    const someUser = Some(user)
    const anotherUser = Some<User>(null)

    const trimName = (user: User): string => user.name.trim()
    const getAgeByBirthDate = (user: User): number => Math.abs(new Date(new Date(2021, 1, 1).getTime() - user.dateOfBirth.getTime()).getFullYear() - 1970)

    expect(someUser.map(trimName).value).toBe('Tester')
    expect(anotherUser.map(trimName).value).toBe(none)

    expect(someUser.map(getAgeByBirthDate).value).toBe(26)
    expect(anotherUser.map(getAgeByBirthDate).value).toBe(none)
  })
})
