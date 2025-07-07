/**
 * Translation utility functions for string interpolation and pluralization
 */

/**
 * Replaces variables in a translation string with values from params object
 * Example: interpolate("Hello, {{name}}!", { name: "World" }) => "Hello, World!"
 */
export function interpolate(text: string, params?: Record<string, unknown>): string {
  if (!params || !text) return text;

  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/**
 * Handles pluralization based on count parameter
 * Example: pluralize(2, { one: "{{count}} item", other: "{{count}} items" }, { count: 2 })
 *          => "2 items"
 */
export function pluralize(
  count: number,
  forms: { one: string; other: string; zero?: string },
  params?: Record<string, unknown>
): string {
  // Determine which form to use based on count
  let form: string;
  if (count === 0 && forms.zero) {
    form = forms.zero;
  } else if (count === 1) {
    form = forms.one;
  } else {
    form = forms.other;
  }

  // Ensure count is passed in params
  const mergedParams = { ...params, count };

  // Interpolate variables
  return interpolate(form, mergedParams);
}

/**
 * Deep getter for nested translation keys
 * Example: getNestedTranslation({ user: { greeting: "Hello" } }, "user.greeting") => "Hello"
 */
export function getNestedTranslation(obj: Record<string, unknown>, path: string, defaultValue: string = path): string {
  if (!obj || !path) return defaultValue;

  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === undefined || result === null) return defaultValue;
    result = (result as Record<string, unknown>)[key];
  }

  return result !== undefined ? String(result) : defaultValue;
}
