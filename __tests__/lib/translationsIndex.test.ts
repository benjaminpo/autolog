import translations, { Language } from '../../app/translations/index';

describe('Translations Index', () => {
  describe('translations object structure', () => {
    it('should have both en and zh translations', () => {
      expect(translations).toHaveProperty('en');
      expect(translations).toHaveProperty('zh');
    });

    it('should have enhanced functionality on both languages', () => {
      expect(typeof translations.en._).toBe('function');
      expect(typeof translations.en._p).toBe('function');
      expect(typeof translations.zh._).toBe('function');
      expect(typeof translations.zh._p).toBe('function');
    });

    it('should contain the original translation data', () => {
      expect(translations.en).toHaveProperty('title');
      expect(translations.zh).toHaveProperty('title');
    });
  });

  describe('enhanced translation function (_)', () => {
    it('should return translation for existing keys', () => {
      const result = translations.en._('title');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return the key itself for non-existent keys', () => {
      const result = translations.en._('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('should support string interpolation', () => {
      const result = translations.en._('title', { name: 'Test' });
      expect(typeof result).toBe('string');
    });

    it('should handle nested translation keys', () => {
      const result = translations.en._('app.title');
      expect(typeof result).toBe('string');
    });

    it('should handle empty parameters', () => {
      const result = translations.en._('title', {});
      expect(typeof result).toBe('string');
    });

    it('should handle null parameters', () => {
      const result = translations.en._('title', null as any);
      expect(typeof result).toBe('string');
    });

    it('should handle undefined parameters', () => {
      const result = translations.en._('title');
      expect(typeof result).toBe('string');
    });

    it('should work with Chinese translations', () => {
      const result = translations.zh._('title');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('enhanced pluralization function (_p)', () => {
    it('should return string representation for non-existent plural forms', () => {
      const result = translations.en._p(5, 'nonexistent.plural');
      expect(result).toBe('5');
    });

    it('should handle count of 0', () => {
      const result = translations.en._p(0, 'nonexistent.plural');
      expect(result).toBe('0');
    });

    it('should handle count of 1', () => {
      const result = translations.en._p(1, 'nonexistent.plural');
      expect(result).toBe('1');
    });

    it('should handle large counts', () => {
      const result = translations.en._p(1000, 'nonexistent.plural');
      expect(result).toBe('1000');
    });

    it('should handle negative counts', () => {
      const result = translations.en._p(-5, 'nonexistent.plural');
      expect(result).toBe('-5');
    });

    it('should handle decimal counts', () => {
      const result = translations.en._p(2.5, 'nonexistent.plural');
      expect(result).toBe('2.5');
    });

    it('should work with Chinese translations', () => {
      const result = translations.zh._p(3, 'nonexistent.plural');
      expect(result).toBe('3');
    });

    it('should handle pluralization with parameters', () => {
      const result = translations.en._p(2, 'nonexistent.plural', { location: 'store' });
      expect(result).toBe('2');
    });

    it('should handle actual plural forms if available', () => {
      // Test that the pluralization function returns count as string when no valid plural forms exist
      const result = translations.en._p(1, 'nonexistent.plural');
      expect(result).toBe('1');
      
      const resultMany = translations.en._p(5, 'nonexistent.plural'); 
      expect(resultMany).toBe('5');
    });
  });

  describe('Language type', () => {
    it('should include en and zh as valid languages', () => {
      const enLang: Language = 'en';
      const zhLang: Language = 'zh';
      
      expect(enLang).toBe('en');
      expect(zhLang).toBe('zh');
    });
  });

  describe('enhanced translations immutability', () => {
    it('should not mutate original translation objects', () => {
      const originalEn = { ...translations.en };
      const originalZh = { ...translations.zh };

      translations.en._('title');
      translations.en._p(1, 'title');
      translations.zh._('title');
      translations.zh._p(1, 'title');

      expect(translations.en.title).toBe(originalEn.title);
      expect(translations.zh.title).toBe(originalZh.title);
    });

    it('should have consistent enhanced functions across language switches', () => {
      const enTranslateFunc = translations.en._;
      const enPluralFunc = translations.en._p;
      const zhTranslateFunc = translations.zh._;
      const zhPluralFunc = translations.zh._p;

      expect(typeof enTranslateFunc).toBe('function');
      expect(typeof enPluralFunc).toBe('function');
      expect(typeof zhTranslateFunc).toBe('function');
      expect(typeof zhPluralFunc).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle malformed translation keys gracefully', () => {
      expect(() => translations.en._('')).not.toThrow();
      expect(() => translations.en._('.')).not.toThrow();
      expect(() => translations.en._('..')).not.toThrow();
      expect(() => translations.en._('..key')).not.toThrow();
      expect(() => translations.en._('key..')).not.toThrow();
    });

    it('should handle malformed pluralization keys gracefully', () => {
      expect(() => translations.en._p(1, '')).not.toThrow();
      expect(() => translations.en._p(1, '.')).not.toThrow();
      expect(() => translations.en._p(1, '..')).not.toThrow();
    });

    it('should handle extreme parameter values', () => {
      expect(() => translations.en._('title', { circular: {} })).not.toThrow();
      expect(() => translations.en._p(Infinity, 'title')).not.toThrow();
      expect(() => translations.en._p(NaN, 'title')).not.toThrow();
    });
  });

  describe('integration with nested translation utilities', () => {
    it('should properly integrate with getNestedTranslation', () => {
      const result = translations.en._('deeply.nested.key.that.does.not.exist');
      expect(result).toBe('deeply.nested.key.that.does.not.exist');
    });

    it('should properly integrate with interpolation', () => {
      (translations.en as any).testInterpolation = 'Hello {{name}}!';
      
      const result = translations.en._('testInterpolation', { name: 'World' });
      expect(result).toBe('Hello World!');

      delete (translations.en as any).testInterpolation;
    });

    it('should properly integrate with pluralization utilities', () => {
      const mockNonObjectPlural = 'simple string';
      (translations.en as any).simpleString = mockNonObjectPlural;

      const result = translations.en._p(5, 'simpleString');
      expect(result).toBe('5');

      delete (translations.en as any).simpleString;
    });
  });
}); 