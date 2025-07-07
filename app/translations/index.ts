// Translation exports

import en from './en';
import zh from './zh';
import { interpolate, pluralize, getNestedTranslation } from './utils';

// Define language options
export type Language = 'en' | 'zh';

// Define stronger typing for translations
export type TranslationKey = string; // Changed from keyof typeof en to support nested keys
export type TranslationType = Record<string, unknown>; // More flexible type to support both flat and namespaced structures

// Define TranslationFunction type for string interpolation
export type TranslationFunction = (
  key: TranslationKey,
  params?: Record<string, unknown>
) => string;

// Define PluralFunction type for pluralization
export type PluralFunction = (
  count: number,
  key: TranslationKey,
  params?: Record<string, unknown>
) => string;

// Extended translation object type with utility functions
export interface EnhancedTranslationType extends TranslationType {
  _: TranslationFunction;
  _p: PluralFunction;
}

// Create enhanced translations with utility functions
function enhanceTranslations<T>(translations: T): T & {
  _: TranslationFunction;
  _p: PluralFunction;
} {
  const enhanced = {
    ...translations,

    // String interpolation function
    _: function(key: TranslationKey, params?: Record<string, unknown>): string {
      const text = getNestedTranslation(this, key, key);
      return interpolate(text, params);
    },

    // Pluralization function
    _p: function(count: number, key: TranslationKey, params?: Record<string, unknown>): string {
      const forms = getNestedTranslation(this, key, undefined);
      if (!forms || typeof forms !== 'object') {
        return String(count);
      }

      // Select the right plural form based on count
      return pluralize(count, forms as { one: string; other: string; zero?: string }, params);
    }
  };

  return enhanced as T & { _: TranslationFunction; _p: PluralFunction };
}

// Export translations object with proper typing and enhanced functionality
const translations: Record<Language, EnhancedTranslationType> = {
  en: enhanceTranslations(en),
  zh: enhanceTranslations(zh)
};

export default translations;
