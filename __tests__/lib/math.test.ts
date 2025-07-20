describe('Math utilities', () => {
  describe('number validation', () => {
    it('should validate positive numbers', () => {
      const isPositive = (num: number) => num > 0

      expect(isPositive(1)).toBe(true)
      expect(isPositive(0.1)).toBe(true)
      expect(isPositive(100)).toBe(true)
      expect(isPositive(0)).toBe(false)
      expect(isPositive(-1)).toBe(false)
    })

    it('should validate numeric strings', () => {
      const isNumericString = (str: string) => !isNaN(Number(str)) && !isNaN(parseFloat(str))

      expect(isNumericString('123')).toBe(true)
      expect(isNumericString('123.45')).toBe(true)
      expect(isNumericString('0')).toBe(true)
      expect(isNumericString('abc')).toBe(false)
      expect(isNumericString('')).toBe(false)
    })

    it('should format currency values', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(amount)
      }

      expect(formatCurrency(100)).toBe('$100.00')
      expect(formatCurrency(123.45)).toBe('$123.45')
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('date utilities', () => {
    it('should validate date strings', () => {
      const isValidDate = (dateString: string) => {
        const date = new Date(dateString)
        return !isNaN(date.getTime())
      }

      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('2024-12-31')).toBe(true)
      expect(isValidDate('invalid-date')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })

    it('should format dates consistently', () => {
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]
      }

      const testDate = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(testDate)).toBe('2024-01-15')
    })

    it('should calculate date differences', () => {
      const daysBetween = (date1: Date, date2: Date) => {
        const diffTime = Math.abs(date2.getTime() - date1.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-15')

      expect(daysBetween(date1, date2)).toBe(14)
    })
  })

  describe('string utilities', () => {
    it('should capitalize strings correctly', () => {
      const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      }

      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
      expect(capitalize('tEST')).toBe('Test')
      expect(capitalize('')).toBe('')
    })

    it('should trim and clean strings', () => {
      const cleanString = (str: string) => {
        return str.trim().replace(/\s+/g, ' ')
      }

      expect(cleanString('  hello   world  ')).toBe('hello world')
      expect(cleanString('test\n\nstring')).toBe('test string')
      expect(cleanString('  ')).toBe('')
    })

    it('should generate slugs from strings', () => {
      const slugify = (str: string) => {
        return str
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^((-+)|(-+))$/g, '')
      }

      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test String!')).toBe('test-string')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })
  })

  describe('array utilities', () => {
    it('should filter unique values', () => {
      const getUniqueValues = <T>(arr: T[]) => [...new Set(arr)]

      expect(getUniqueValues([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(getUniqueValues(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
      expect(getUniqueValues([])).toEqual([])
    })

    it('should group array items', () => {
      const groupBy = <T>(arr: T[], keyFn: (item: T) => string) => {
        return arr.reduce((groups, item) => {
          const key = keyFn(item)
          groups[key] = groups[key] || []
          groups[key].push(item)
          return groups
        }, {} as Record<string, T[]>)
      }

      const items = [
        { category: 'fuel', amount: 50 },
        { category: 'maintenance', amount: 100 },
        { category: 'fuel', amount: 75 }
      ]

      const grouped = groupBy(items, item => item.category)

      expect(grouped.fuel).toHaveLength(2)
      expect(grouped.maintenance).toHaveLength(1)
    })

    it('should calculate array statistics', () => {
      const calculateStats = (numbers: number[]) => {
        if (numbers.length === 0) return { sum: 0, avg: 0, min: 0, max: 0 }

        const sum = numbers.reduce((a, b) => a + b, 0)
        const avg = sum / numbers.length
        const min = Math.min(...numbers)
        const max = Math.max(...numbers)

        return { sum, avg, min, max }
      }

      const stats = calculateStats([10, 20, 30, 40, 50])

      expect(stats.sum).toBe(150)
      expect(stats.avg).toBe(30)
      expect(stats.min).toBe(10)
      expect(stats.max).toBe(50)
    })
  })
})
