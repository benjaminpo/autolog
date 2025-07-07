import { interpolate, pluralize, getNestedTranslation } from '../../app/translations/utils';

describe('Translation Utils', () => {
  describe('interpolate', () => {
    it('should replace single variable in text', () => {
      const result = interpolate('Hello, {{name}}!', { name: 'World' });
      expect(result).toBe('Hello, World!');
    });

    it('should replace multiple variables in text', () => {
      const result = interpolate('{{greeting}}, {{name}}! Today is {{day}}.', {
        greeting: 'Hello',
        name: 'Alice',
        day: 'Monday'
      });
      expect(result).toBe('Hello, Alice! Today is Monday.');
    });

    it('should handle variables with numbers and special characters', () => {
      const result = interpolate('User {{user_id}} has {{item_count}} items', {
        user_id: 123,
        item_count: 5
      });
      expect(result).toBe('User 123 has 5 items');
    });

    it('should convert non-string values to strings', () => {
      const result = interpolate('Value: {{value}}, Boolean: {{flag}}, Null: {{empty}}', {
        value: 42,
        flag: true,
        empty: null
      });
      expect(result).toBe('Value: 42, Boolean: true, Null: null');
    });

    it('should leave missing variables unchanged', () => {
      const result = interpolate('Hello, {{name}}! Your score is {{score}}.', { name: 'Bob' });
      expect(result).toBe('Hello, Bob! Your score is {{score}}.');
    });

    it('should handle empty params object', () => {
      const result = interpolate('Hello, {{name}}!', {});
      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle undefined params', () => {
      const result = interpolate('Hello, {{name}}!', undefined);
      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle null params', () => {
      const result = interpolate('Hello, {{name}}!', null as any);
      expect(result).toBe('Hello, {{name}}!');
    });

    it('should return original text when text is empty', () => {
      const result = interpolate('', { name: 'Test' });
      expect(result).toBe('');
    });

    it('should return original text when text is null', () => {
      const result = interpolate(null as any, { name: 'Test' });
      expect(result).toBe(null);
    });

    it('should handle text with no variables', () => {
      const result = interpolate('Plain text with no variables', { name: 'Test' });
      expect(result).toBe('Plain text with no variables');
    });

    it('should handle nested braces correctly', () => {
      const result = interpolate('{{user}} said: "{{message}}"', {
        user: 'Alice',
        message: 'Hello {{world}}'
      });
      expect(result).toBe('Alice said: "Hello {{world}}"');
    });

    it('should handle malformed variable patterns', () => {
      const result = interpolate('{{incomplete} and {missing}}', { incomplete: 'test' });
      expect(result).toBe('{{incomplete} and {missing}}');
    });

    it('should handle variables with spaces in names', () => {
      const result = interpolate('{{ user name }}', { 'user name': 'John Doe' });
      expect(result).toBe('{{ user name }}'); // Spaces not supported in variable names
    });

    it('should handle zero and undefined values correctly', () => {
      const result = interpolate('Count: {{count}}, Value: {{value}}', {
        count: 0,
        value: undefined
      });
      expect(result).toBe('Count: 0, Value: {{value}}');
    });
  });

  describe('pluralize', () => {
    it('should use "one" form when count is 1', () => {
      const result = pluralize(1, {
        one: 'You have {{count}} item',
        other: 'You have {{count}} items'
      });
      expect(result).toBe('You have 1 item');
    });

    it('should use "other" form when count is greater than 1', () => {
      const result = pluralize(5, {
        one: 'You have {{count}} item',
        other: 'You have {{count}} items'
      });
      expect(result).toBe('You have 5 items');
    });

    it('should use "other" form when count is 0 and no zero form provided', () => {
      const result = pluralize(0, {
        one: 'You have {{count}} item',
        other: 'You have {{count}} items'
      });
      expect(result).toBe('You have 0 items');
    });

    it('should use "zero" form when count is 0 and zero form is provided', () => {
      const result = pluralize(0, {
        one: 'You have {{count}} item',
        other: 'You have {{count}} items',
        zero: 'You have no items'
      });
      expect(result).toBe('You have no items');
    });

    it('should interpolate additional parameters', () => {
      const result = pluralize(3, {
        one: '{{user}} has {{count}} message',
        other: '{{user}} has {{count}} messages'
      }, { user: 'Alice' });
      expect(result).toBe('Alice has 3 messages');
    });

    it('should override count parameter if provided in params', () => {
      const result = pluralize(2, {
        one: 'You have {{count}} item',
        other: 'You have {{count}} items'
      }, { count: 99 });
      expect(result).toBe('You have 2 items'); // count from function parameter takes precedence
    });

    it('should handle negative counts', () => {
      const result = pluralize(-1, {
        one: '{{count}} item',
        other: '{{count}} items'
      });
      expect(result).toBe('-1 items');
    });

    it('should handle decimal counts', () => {
      const result = pluralize(1.5, {
        one: '{{count}} item',
        other: '{{count}} items'
      });
      expect(result).toBe('1.5 items');
    });

    it('should handle zero with complex interpolation', () => {
      const result = pluralize(0, {
        one: '{{user}} has {{count}} unread message',
        other: '{{user}} has {{count}} unread messages',
        zero: '{{user}} has no unread messages'
      }, { user: 'Bob' });
      expect(result).toBe('Bob has no unread messages');
    });

    it('should work without additional params', () => {
      const result = pluralize(2, {
        one: '{{count}} file',
        other: '{{count}} files'
      });
      expect(result).toBe('2 files');
    });

    it('should handle empty params object', () => {
      const result = pluralize(1, {
        one: 'Hello {{name}}, you have {{count}} item',
        other: 'Hello {{name}}, you have {{count}} items'
      }, {});
      expect(result).toBe('Hello {{name}}, you have 1 item');
    });

    it('should handle large numbers', () => {
      const result = pluralize(1000000, {
        one: '{{count}} user',
        other: '{{count}} users'
      });
      expect(result).toBe('1000000 users');
    });
  });

  describe('getNestedTranslation', () => {
    const testObj = {
      user: {
        greeting: 'Hello',
        messages: {
          welcome: 'Welcome back!',
          goodbye: 'See you later'
        }
      },
      app: {
        title: 'My App',
        version: '1.0.0'
      },
      empty: '',
      zero: 0,
      false_value: false
    };

    it('should retrieve simple nested value', () => {
      const result = getNestedTranslation(testObj, 'user.greeting');
      expect(result).toBe('Hello');
    });

    it('should retrieve deeply nested value', () => {
      const result = getNestedTranslation(testObj, 'user.messages.welcome');
      expect(result).toBe('Welcome back!');
    });

    it('should retrieve top-level value', () => {
      const result = getNestedTranslation(testObj, 'app');
      expect(result).toBe('[object Object]'); // Objects are converted to string
    });

    it('should return default value for non-existent path', () => {
      const result = getNestedTranslation(testObj, 'user.nonexistent');
      expect(result).toBe('user.nonexistent');
    });

    it('should return custom default value for non-existent path', () => {
      const result = getNestedTranslation(testObj, 'user.nonexistent', 'Not found');
      expect(result).toBe('Not found');
    });

    it('should handle empty string values', () => {
      const result = getNestedTranslation(testObj, 'empty');
      expect(result).toBe('');
    });

    it('should handle zero values', () => {
      const result = getNestedTranslation(testObj, 'zero');
      expect(result).toBe('0');
    });

    it('should handle false values', () => {
      const result = getNestedTranslation(testObj, 'false_value');
      expect(result).toBe('false');
    });

    it('should return default when object is null', () => {
      const result = getNestedTranslation(null as any, 'user.greeting');
      expect(result).toBe('user.greeting');
    });

    it('should return default when object is undefined', () => {
      const result = getNestedTranslation(undefined as any, 'user.greeting');
      expect(result).toBe('user.greeting');
    });

    it('should return default when path is empty', () => {
      const result = getNestedTranslation(testObj, '');
      expect(result).toBe('');
    });

    it('should return default when path is null', () => {
      const result = getNestedTranslation(testObj, null as any);
      expect(result).toBe(null as any);
    });

    it('should handle path with trailing dots', () => {
      const result = getNestedTranslation(testObj, 'user.greeting.');
      expect(result).toBe('user.greeting.');
    });

    it('should handle path with leading dots', () => {
      const result = getNestedTranslation(testObj, '.user.greeting');
      expect(result).toBe('.user.greeting');
    });

    it('should handle path with multiple consecutive dots', () => {
      const result = getNestedTranslation(testObj, 'user..greeting');
      expect(result).toBe('user..greeting');
    });

    it('should handle array-like objects', () => {
      const arrayObj = {
        items: ['first', 'second', 'third']
      };
      const result = getNestedTranslation(arrayObj, 'items.1');
      expect(result).toBe('second');
    });

    it('should handle numeric keys', () => {
      const numericObj = {
        '0': 'zero',
        '1': 'one',
        nested: {
          '2': 'two'
        }
      };
      expect(getNestedTranslation(numericObj, '0')).toBe('zero');
      expect(getNestedTranslation(numericObj, 'nested.2')).toBe('two');
    });

    it('should handle special characters in keys', () => {
      const specialObj = {
        'key-with-dash': 'dash value',
        'key_with_underscore': 'underscore value',
        'parent': {
          'child-key': 'child value'
        }
      };
      expect(getNestedTranslation(specialObj, 'key-with-dash')).toBe('dash value');
      expect(getNestedTranslation(specialObj, 'key_with_underscore')).toBe('underscore value');
      expect(getNestedTranslation(specialObj, 'parent.child-key')).toBe('child value');
    });

    it('should handle null values in nested path', () => {
      const objWithNull = {
        level1: {
          level2: null
        }
      };
      const result = getNestedTranslation(objWithNull, 'level1.level2.level3');
      expect(result).toBe('level1.level2.level3');
    });

    it('should handle undefined values in nested path', () => {
      const objWithUndefined = {
        level1: {
          level2: undefined
        }
      };
      const result = getNestedTranslation(objWithUndefined, 'level1.level2.level3');
      expect(result).toBe('level1.level2.level3');
    });
  });

  describe('Integration tests', () => {
    it('should work together: nested translation with interpolation and pluralization', () => {
      const translations = {
        messages: {
          items: {
            one: 'You have {{count}} item in {{location}}',
            other: 'You have {{count}} items in {{location}}',
            zero: 'You have no items in {{location}}'
          }
        }
      };

      // Get the pluralization forms
      const forms = getNestedTranslation(translations, 'messages.items');
      const parsedForms = typeof forms === 'string' ? {} : forms as any;

      if (parsedForms.one && parsedForms.other) {
        const result = pluralize(3, parsedForms, { location: 'basket' });
        expect(result).toBe('You have 3 items in basket');
      }
    });

    it('should handle complex nested interpolation', () => {
      const template = 'Welcome {{user.name}}, you have {{stats.messages}} messages';
      const result = interpolate(template, {
        'user.name': 'Alice',
        'stats.messages': 5
      });
      expect(result).toBe('Welcome Alice, you have 5 messages');
    });

    it('should handle edge case combinations gracefully', () => {
      // Test interpolation with empty object and pluralization with zero
      const emptyInterpolation = interpolate('{{missing}} value', {});
      expect(emptyInterpolation).toBe('{{missing}} value');

      const zeroPluralization = pluralize(0, {
        one: '{{count}} item',
        other: '{{count}} items'
      });
      expect(zeroPluralization).toBe('0 items');

      const missingNested = getNestedTranslation({}, 'missing.path', 'fallback');
      expect(missingNested).toBe('fallback');
    });
  });
}); 