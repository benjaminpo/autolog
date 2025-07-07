// Helper utility for safely accessing translation keys
// This prevents React rendering errors when a translation key returns an object instead of a string

/**
 * Safely gets a translation string from a translation object
 * Falls back to the provided default if the translation is missing or not a string
 *
 * @param translations The translations object
 * @param key The translation key to retrieve
 * @param defaultValue Default value to show if translation is missing or not a string
 * @returns A string that is safe to use in React components
 */
export function getSafeTranslation(
  translations: Record<string, unknown>,
  key: string,
  defaultValue: string = key
): string {
  if (!translations) {
    return defaultValue;
  }

  const value = translations[key];

  // Only return the value if it's a string
  if (typeof value === 'string') {
    return value;
  }

  return defaultValue;
}

/**
 * Creates a function that can be used to safely access translations
 *
 * @param translations The translations object
 * @returns A function that safely gets translation strings
 */
export function createSafeTranslator(translations: Record<string, unknown>) {
  return function getText(key: string, defaultValue: string = key): string {
    return getSafeTranslation(translations, key, defaultValue);
  };
}
