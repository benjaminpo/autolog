// Shared validation helpers for forms
export function validateEmailString(email: string): string {
  if (!email) return 'Email is required';
  // Use a safer regex pattern that avoids catastrophic backtracking
  // This pattern uses atomic groups and possessive quantifiers conceptually
  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return 'Invalid email format';
  return '';
}

export function validatePasswordString(password: string): string {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
}

export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

export function validateMinValue(value: number, minValue: number): boolean {
  return value >= minValue;
}

export function validateMaxValue(value: number, maxValue: number): boolean {
  return value <= maxValue;
}
