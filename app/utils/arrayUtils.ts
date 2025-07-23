// Shared array utility functions
export function removeDuplicates<T>(array: T[]): T[] {
  if (!Array.isArray(array)) return [];
  return [...new Set(array)];
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array) || size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function getUniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
