describe('Testing Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const testString = 'Hello World'
    expect(testString.toLowerCase()).toBe('hello world')
    expect(testString.length).toBe(11)
  })

  it('should handle array operations', () => {
    const testArray = [1, 2, 3, 4, 5]
    expect(testArray.length).toBe(5)
    expect(testArray.includes(3)).toBe(true)
    expect(testArray.filter(n => n > 3)).toEqual([4, 5])
  })

  it('should handle async operations', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('async result'), 10)
      })
    }

    const result = await asyncFunction()
    expect(result).toBe('async result')
  })
}) 