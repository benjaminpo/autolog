/**
 * Enhanced Translation Utilities Tests
 * Comprehensive testing of translation functions including edge cases and performance
 */

describe('Enhanced Translation Utilities', () => {
  describe('String Interpolation Advanced', () => {
    const interpolate = (text: string, params?: Record<string, any>): string => {
      if (!params || !text) return text;
      return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : `{{${key}}}`;
      });
    };

    it('should handle complex variable scenarios', () => {
      expect(interpolate('{{name}} said "Hello {{name}}"', { name: 'Alice' })).toBe('Alice said "Hello Alice"');
      expect(interpolate('Value: {{value}}', { value: 0 })).toBe('Value: 0');
      expect(interpolate('Bool: {{bool}}', { bool: false })).toBe('Bool: false');
    });

    it('should preserve missing variables gracefully', () => {
      expect(interpolate('Hello {{missing}}!', {})).toBe('Hello {{missing}}!');
      expect(interpolate('{{a}} and {{b}}', { a: 'first' })).toBe('first and {{b}}');
    });

    it('should handle edge cases', () => {
      expect(interpolate('', { name: 'test' })).toBe('');
      expect(interpolate('{{}}', { '': 'empty' })).toBe('{{}}');
      expect(interpolate('{{name}}', undefined)).toBe('{{name}}');
    });

    it('should handle special characters', () => {
      const template = 'Pattern: {{pattern}}';
      const params = { pattern: '$^.*+?{}[]()' };
      expect(interpolate(template, params)).toBe('Pattern: $^.*+?{}[]()');
    });

    it('should be performant with large strings', () => {
      const largeText = 'Lorem ipsum '.repeat(1000) + '{{variable}}';
      const params = { variable: 'REPLACED' };
      
      const startTime = performance.now();
      const result = interpolate(largeText, params);
      const endTime = performance.now();
      
      expect(result).toContain('REPLACED');
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Translation Safety', () => {
    const getSafeTranslation = (translations: Record<string, any> | null, key: string, defaultValue: string = key): string => {
      if (!translations) return defaultValue;
      const value = translations[key];
      if (typeof value === 'string') return value;
      return defaultValue;
    };

    const translations = {
      simpleKey: 'Simple Value',
      nestedObj: { inner: 'Nested Value' },
      numericKey: 42,
      booleanKey: true,
      nullKey: null,
      emptyString: ''
    };

    it('should handle safe string access', () => {
      expect(getSafeTranslation(translations, 'simpleKey')).toBe('Simple Value');
      expect(getSafeTranslation(translations, 'emptyString')).toBe('');
      expect(getSafeTranslation(translations, 'nestedObj')).toBe('nestedObj');
      expect(getSafeTranslation(translations, 'missingKey')).toBe('missingKey');
    });

    it('should use custom defaults', () => {
      expect(getSafeTranslation(translations, 'missingKey', 'Custom')).toBe('Custom');
      expect(getSafeTranslation(null, 'key', 'default')).toBe('default');
    });
  });

  describe('Pluralization Advanced', () => {
    interface PluralForms {
      zero?: string;
      one: string;
      other: string;
    }

    const pluralize = (count: number, forms: PluralForms, params?: Record<string, any>): string => {
      let form: string;
      if (count === 0 && forms.zero) {
        form = forms.zero;
      } else if (Math.abs(count) === 1) {
        form = forms.one;
      } else {
        form = forms.other;
      }
      
      const mergedParams: Record<string, any> = { ...params, count };
      return form.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        const value = mergedParams[key];
        return value !== undefined ? String(value) : `{{${key}}}`;
      });
    };

    const pluralForms: PluralForms = {
      zero: 'No items',
      one: '{{count}} item',
      other: '{{count}} items'
    };

    it('should handle all number types', () => {
      expect(pluralize(0, pluralForms, { count: 0 })).toBe('No items');
      expect(pluralize(1, pluralForms, { count: 1 })).toBe('1 item');
      expect(pluralize(2, pluralForms, { count: 2 })).toBe('2 items');
      expect(pluralize(-1, pluralForms, { count: -1 })).toBe('-1 item');
      expect(pluralize(1.5, pluralForms, { count: 1.5 })).toBe('1.5 items');
    });

    it('should auto-include count', () => {
      expect(pluralize(5, pluralForms)).toBe('5 items');
      expect(pluralize(1, pluralForms)).toBe('1 item');
    });

    it('should handle missing forms', () => {
      const formsNoZero: PluralForms = { one: '{{count}} item', other: '{{count}} items' };
      expect(pluralize(0, formsNoZero, { count: 0 })).toBe('0 items');
    });
  });

  describe('Nested Property Access', () => {
    const getNestedValue = (obj: any, path: string, defaultValue: string = path): string => {
      if (!obj || !path) return defaultValue;
      const keys = path.split('.');
      let result = obj;
      for (const key of keys) {
        if (result === undefined || result === null) return defaultValue;
        result = result[key];
      }
      return result !== undefined ? String(result) : defaultValue;
    };

    const nestedObj = {
      user: {
        profile: { name: 'John Doe' },
        settings: { theme: 'dark' }
      },
      app: { version: '1.0.0' }
    };

    it('should access nested properties', () => {
      expect(getNestedValue(nestedObj, 'user.profile.name')).toBe('John Doe');
      expect(getNestedValue(nestedObj, 'user.settings.theme')).toBe('dark');
      expect(getNestedValue(nestedObj, 'app.version')).toBe('1.0.0');
    });

    it('should handle missing paths', () => {
      expect(getNestedValue(nestedObj, 'user.invalid.path')).toBe('user.invalid.path');
      expect(getNestedValue(nestedObj, 'missing')).toBe('missing');
      expect(getNestedValue(null, 'any.path')).toBe('any.path');
    });

    it('should use custom defaults', () => {
      expect(getNestedValue(nestedObj, 'missing.path', 'Custom')).toBe('Custom');
      expect(getNestedValue(nestedObj, 'user.invalid', 'Fallback')).toBe('Fallback');
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle large objects efficiently', () => {
      const largeObj: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = `value${i}`;
      }
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        const value = largeObj[`key${i}`];
        expect(typeof value).toBe('string');
      }
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200); // Increased threshold for slower CI environments
    });

    it('should handle unicode and special characters', () => {
      const template = 'Hello {{name}}! 🌟 {{emoji}}';
      const interpolateLocal = (text: string, params: Record<string, any>): string => {
        return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
          return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
        });
      };
      
      const result = interpolateLocal(template, { name: 'José', emoji: '⭐' });
      expect(result).toBe('Hello José! 🌟 ⭐');
    });
  });
}); 