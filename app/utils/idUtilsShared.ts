// Shared ID utility functions
export function getObjectId(obj: any): string {
  if (!obj) return '';
  if (typeof obj._id === 'object' && obj._id && typeof obj._id.toString === 'function') {
    return obj._id.toString();
  }
  return obj._id || obj.id || '';
}

export function normalizeId(obj: any): any {
  if (!obj) return obj;
  const id = getObjectId(obj);
  return { ...obj, id, _id: obj._id };
}

export function normalizeIds(arr: any[]): any[] {
  if (!Array.isArray(arr)) return arr;
  return arr.map(normalizeId);
}

export function removeDuplicateIds<T extends Record<string, unknown>>(objects: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const obj of objects) {
    const id = getObjectId(obj);
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(obj);
    }
  }
  return result;
}
