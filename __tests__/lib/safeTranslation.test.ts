import { getSafeTranslation, createSafeTranslator } from '../../app/translations/safeTranslation'

describe('safeTranslation', () => {
  describe('getSafeTranslation', () => {
    const mockTranslations = {
      welcome: 'Welcome to the app',
      user: {
        name: 'John Doe',
        profile: {
          bio: 'Software Developer'
        }
      },
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      numberValue: 42,
      booleanValue: true,
      arrayValue: ['item1', 'item2']
    }

    it('should return translation string when key exists and value is string', () => {
      const result = getSafeTranslation(mockTranslations, 'welcome', 'Default')
      expect(result).toBe('Welcome to the app')
    })

    it('should return default value when key does not exist', () => {
      const result = getSafeTranslation(mockTranslations, 'nonexistent', 'Default')
      expect(result).toBe('Default')
    })

    it('should return default value when translation value is an object', () => {
      const result = getSafeTranslation(mockTranslations, 'user', 'Default')
      expect(result).toBe('Default')
    })

    it('should return default value when translation value is null', () => {
      const result = getSafeTranslation(mockTranslations, 'nullValue', 'Default')
      expect(result).toBe('Default')
    })

    it('should return default value when translation value is undefined', () => {
      const result = getSafeTranslation(mockTranslations, 'undefinedValue', 'Default')
      expect(result).toBe('Default')
    })

    it('should return default value when translation value is a number', () => {
      const result = getSafeTranslation(mockTranslations, 'numberValue', 'Default')
      expect(result).toBe('Default')
    })

    it('should return default value when translation value is a boolean', () => {
      const result = getSafeTranslation(mockTranslations, 'booleanValue', 'Default')
      expect(result).toBe('Default')
    })

    it('should return default value when translation value is an array', () => {
      const result = getSafeTranslation(mockTranslations, 'arrayValue', 'Default')
      expect(result).toBe('Default')
    })

    it('should return empty string when translation is empty string', () => {
      const result = getSafeTranslation(mockTranslations, 'emptyString', 'Default')
      expect(result).toBe('')
    })

    it('should use key as default when no default value provided', () => {
      const result = getSafeTranslation(mockTranslations, 'nonexistent')
      expect(result).toBe('nonexistent')
    })

    it('should handle null translations object', () => {
      const result = getSafeTranslation(null as any, 'welcome', 'Default')
      expect(result).toBe('Default')
    })

    it('should handle undefined translations object', () => {
      const result = getSafeTranslation(undefined as any, 'welcome', 'Default')
      expect(result).toBe('Default')
    })

    it('should handle empty translations object', () => {
      const result = getSafeTranslation({}, 'welcome', 'Default')
      expect(result).toBe('Default')
    })

    it('should handle special characters in keys', () => {
      const specialTranslations = {
        'key.with.dots': 'Dotted key',
        'key-with-dashes': 'Dashed key',
        'key_with_underscores': 'Underscored key',
        'key with spaces': 'Spaced key'
      }

      expect(getSafeTranslation(specialTranslations, 'key.with.dots', 'Default')).toBe('Dotted key')
      expect(getSafeTranslation(specialTranslations, 'key-with-dashes', 'Default')).toBe('Dashed key')
      expect(getSafeTranslation(specialTranslations, 'key_with_underscores', 'Default')).toBe('Underscored key')
      expect(getSafeTranslation(specialTranslations, 'key with spaces', 'Default')).toBe('Spaced key')
    })

    it('should handle unicode and emoji in translation values', () => {
      const unicodeTranslations = {
        chinese: '你好',
        arabic: 'مرحبا',
        emoji: '👋 Hello 🌟',
        mixed: 'Hello 世界 🌍'
      }

      expect(getSafeTranslation(unicodeTranslations, 'chinese', 'Default')).toBe('你好')
      expect(getSafeTranslation(unicodeTranslations, 'arabic', 'Default')).toBe('مرحبا')
      expect(getSafeTranslation(unicodeTranslations, 'emoji', 'Default')).toBe('👋 Hello 🌟')
      expect(getSafeTranslation(unicodeTranslations, 'mixed', 'Default')).toBe('Hello 世界 🌍')
    })
  })

  describe('createSafeTranslator', () => {
    const mockTranslations = {
      greeting: 'Hello there',
      nested: {
        value: 'Should not be returned'
      },
      emptyString: '',
      numberValue: 123
    }

    it('should create a function that safely gets translations', () => {
      const getText = createSafeTranslator(mockTranslations)
      
      expect(typeof getText).toBe('function')
      expect(getText('greeting')).toBe('Hello there')
    })

    it('should return default value for non-string translations', () => {
      const getText = createSafeTranslator(mockTranslations)
      
      expect(getText('nested', 'Default')).toBe('Default')
      expect(getText('numberValue', 'Default')).toBe('Default')
    })

    it('should return key as default when no default provided', () => {
      const getText = createSafeTranslator(mockTranslations)
      
      expect(getText('nonexistent')).toBe('nonexistent')
    })

    it('should handle empty string translations', () => {
      const getText = createSafeTranslator(mockTranslations)
      
      expect(getText('emptyString', 'Default')).toBe('')
    })

    it('should work with custom default values', () => {
      const getText = createSafeTranslator(mockTranslations)
      
      expect(getText('missing', 'Custom Default')).toBe('Custom Default')
    })

    it('should handle null translations object', () => {
      const getText = createSafeTranslator(null as any)
      
      expect(getText('anything', 'Default')).toBe('Default')
    })

    it('should handle undefined translations object', () => {
      const getText = createSafeTranslator(undefined as any)
      
      expect(getText('anything', 'Default')).toBe('Default')
    })

    it('should handle empty translations object', () => {
      const getText = createSafeTranslator({})
      
      expect(getText('anything', 'Default')).toBe('Default')
    })

    it('should maintain state between calls', () => {
      const getText = createSafeTranslator(mockTranslations)
      
      expect(getText('greeting')).toBe('Hello there')
      expect(getText('greeting')).toBe('Hello there') // Should be consistent
      expect(getText('missing', 'Default')).toBe('Default')
    })

    it('should handle multiple translator instances', () => {
      const translations1 = { key: 'Value 1' }
      const translations2 = { key: 'Value 2' }
      
      const getText1 = createSafeTranslator(translations1)
      const getText2 = createSafeTranslator(translations2)
      
      expect(getText1('key')).toBe('Value 1')
      expect(getText2('key')).toBe('Value 2')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle very long translation keys', () => {
      const longKey = 'a'.repeat(1000)
      const translations = { [longKey]: 'Long key value' }
      
      const result = getSafeTranslation(translations, longKey, 'Default')
      expect(result).toBe('Long key value')
    })

    it('should handle very long translation values', () => {
      const longValue = 'x'.repeat(10000)
      const translations = { key: longValue }
      
      const result = getSafeTranslation(translations, 'key', 'Default')
      expect(result).toBe(longValue)
    })

    it('should handle circular object references safely', () => {
      const circularObj: any = { key: 'safe value' }
      circularObj.self = circularObj
      
      const result = getSafeTranslation(circularObj, 'key', 'Default')
      expect(result).toBe('safe value')
      
      const circularResult = getSafeTranslation(circularObj, 'self', 'Default')
      expect(circularResult).toBe('Default')
    })

    it('should handle prototype pollution safely', () => {
      const translations = Object.create(null)
      translations.safe = 'Safe value'
      
      const result = getSafeTranslation(translations, 'safe', 'Default')
      expect(result).toBe('Safe value')
    })

    it('should handle symbols as keys', () => {
      const symbolKey = Symbol('test')
      const translations = { [symbolKey]: 'Symbol value' }
      
      // JavaScript actually allows symbol keys to work, so this will return the value
      const result = getSafeTranslation(translations, symbolKey as any, 'Default')
      expect(result).toBe('Symbol value')
    })

    it('should handle functions as translation values', () => {
      const translations = {
        func: () => 'Function result',
        arrow: () => 'Arrow function result'
      }
      
      expect(getSafeTranslation(translations, 'func', 'Default')).toBe('Default')
      expect(getSafeTranslation(translations, 'arrow', 'Default')).toBe('Default')
    })

    it('should handle Date objects as translation values', () => {
      const translations = {
        date: new Date('2024-01-15'),
        dateString: new Date('2024-01-15').toString()
      }
      
      expect(getSafeTranslation(translations, 'date', 'Default')).toBe('Default')
      expect(getSafeTranslation(translations, 'dateString', 'Default')).toBe(new Date('2024-01-15').toString())
    })
  })
}) 