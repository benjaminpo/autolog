import { 
  getObjectId, 
  normalizeId, 
  normalizeIds, 
  getUserId, 
  hasSameId, 
  removeDuplicateIds, 
  findById, 
  createIdMap, 
  findCarById, 
  getCarNameById, 
  validateVehicle
} from '../../app/lib/idUtils';

describe('ID Utils Extended Tests', () => {
  describe('getObjectId edge cases', () => {
    it('should handle null input', () => {
      expect(getObjectId(null as any)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(getObjectId(undefined as any)).toBe('');
    });

    it('should handle empty object', () => {
      expect(getObjectId({})).toBe('');
    });

    it('should handle object with false _id', () => {
      expect(getObjectId({ _id: false })).toBe('');
    });

    it('should handle object with 0 _id', () => {
      expect(getObjectId({ _id: 0 })).toBe('');
    });

    it('should handle object with empty string _id', () => {
      expect(getObjectId({ _id: '' })).toBe('');
    });

    it('should handle object with null _id and valid id', () => {
      expect(getObjectId({ _id: null, id: 'valid-id' })).toBe('valid-id');
    });

    it('should handle ObjectId-like object with toString method', () => {
      const mockObjectId = { toString: () => '507f1f77bcf86cd799439011' };
      expect(getObjectId({ _id: mockObjectId })).toBe('507f1f77bcf86cd799439011');
    });

    it('should handle number _id', () => {
      expect(getObjectId({ _id: 12345 })).toBe('12345');
    });

    it('should handle number id when no _id', () => {
      expect(getObjectId({ id: 67890 })).toBe('67890');
    });

    it('should handle object with both null _id and null id', () => {
      expect(getObjectId({ _id: null, id: null })).toBe('');
    });
  });

  describe('normalizeId comprehensive tests', () => {
    it('should handle null input', () => {
      expect(normalizeId(null)).toBe(null);
    });

    it('should handle undefined input', () => {
      expect(normalizeId(undefined)).toBe(undefined);
    });

    it('should handle object with only _id', () => {
      const obj = { _id: 'test-id', name: 'test' };
      const result = normalizeId(obj);
      expect(result.id).toBe('test-id');
      expect(result._id).toBe('test-id');
      expect(result.name).toBe('test');
    });

    it('should handle object with only id', () => {
      const obj = { id: 'test-id', name: 'test' };
      const result = normalizeId(obj);
      expect(result.id).toBe('test-id');
      expect(result._id).toBe('test-id');
      expect(result.name).toBe('test');
    });

    it('should handle object with both _id and id', () => {
      const obj = { _id: 'mongo-id', id: 'client-id', name: 'test' };
      const result = normalizeId(obj);
      expect(result._id).toBe('mongo-id');
      expect(result.id).toBe('client-id');
      expect(result.name).toBe('test');
    });

    it('should handle ObjectId-like _id', () => {
      const mockObjectId = { toString: () => '507f1f77bcf86cd799439011' };
      const obj = { _id: mockObjectId, name: 'test' };
      const result = normalizeId(obj);
      expect(result.id).toBe('507f1f77bcf86cd799439011');
      expect(result._id).toBe(mockObjectId);
    });

    it('should not mutate original object', () => {
      const obj = { _id: 'test-id', name: 'test' };
      const result = normalizeId(obj);
      expect(obj).not.toHaveProperty('id');
      expect(result).toHaveProperty('id');
    });
  });

  describe('normalizeIds comprehensive tests', () => {
    it('should handle null input', () => {
      expect(normalizeIds(null as any)).toBe(null);
    });

    it('should handle undefined input', () => {
      expect(normalizeIds(undefined as any)).toBe(undefined);
    });

    it('should handle non-array input', () => {
      const nonArray = { _id: 'test' } as any;
      expect(normalizeIds(nonArray)).toBe(nonArray);
    });

    it('should handle empty array', () => {
      expect(normalizeIds([])).toEqual([]);
    });

    it('should handle array with null items', () => {
      const result = normalizeIds([{ _id: 'test1' }, null as any, { _id: 'test2' }]);
      expect(result).toHaveLength(3);
      expect(result![0]).toHaveProperty('id', 'test1');
      expect(result![1]).toBe(null);
      expect(result![2]).toHaveProperty('id', 'test2');
    });

    it('should handle array with undefined items', () => {
      const result = normalizeIds([{ _id: 'test1' }, undefined as any, { _id: 'test2' }]);
      expect(result).toHaveLength(3);
      expect(result![0]).toHaveProperty('id', 'test1');
      expect(result![1]).toBe(undefined);
      expect(result![2]).toHaveProperty('id', 'test2');
    });

    it('should normalize all valid objects in array', () => {
      const input = [
        { _id: 'mongo1', data: 'test1' },
        { id: 'client1', data: 'test2' },
        { _id: 'mongo2', id: 'client2', data: 'test3' }
      ];
      const result = normalizeIds(input);
      
      expect(result![0]).toEqual({ _id: 'mongo1', id: 'mongo1', data: 'test1' });
      expect(result![1]).toEqual({ id: 'client1', _id: 'client1', data: 'test2' });
      expect(result![2]).toEqual({ _id: 'mongo2', id: 'client2', data: 'test3' });
    });
  });

  describe('getUserId comprehensive tests', () => {
    it('should handle null user', () => {
      expect(getUserId(null)).toBe('');
    });

    it('should handle undefined user', () => {
      expect(getUserId(undefined)).toBe('');
    });

    it('should handle user with string id', () => {
      expect(getUserId({ id: 'user-123' })).toBe('user-123');
    });

    it('should handle user with string _id', () => {
      expect(getUserId({ _id: 'user-456' })).toBe('user-456');
    });

    it('should handle user with ObjectId-like _id', () => {
      const mockObjectId = { toString: () => '507f1f77bcf86cd799439011' };
      expect(getUserId({ _id: mockObjectId })).toBe('507f1f77bcf86cd799439011');
    });

    it('should prefer id over _id when both exist', () => {
      expect(getUserId({ id: 'preferred', _id: 'secondary' })).toBe('preferred');
    });

    it('should handle user with no id fields', () => {
      expect(getUserId({ name: 'John', email: 'john@example.com' })).toBe('');
    });
  });

  describe('hasSameId comprehensive tests', () => {
    it('should return false when first object has no id', () => {
      expect(hasSameId({}, { _id: 'test' })).toBe(false);
    });

    it('should return false when second object has no id', () => {
      expect(hasSameId({ _id: 'test' }, {})).toBe(false);
    });

    it('should return false when both objects have no id', () => {
      expect(hasSameId({}, {})).toBe(false);
    });

    it('should return true when both have same _id', () => {
      expect(hasSameId({ _id: 'same-id' }, { _id: 'same-id' })).toBe(true);
    });

    it('should return true when both have same id', () => {
      expect(hasSameId({ id: 'same-id' }, { id: 'same-id' })).toBe(true);
    });

    it('should return true when _id matches id', () => {
      expect(hasSameId({ _id: 'same-id' }, { id: 'same-id' })).toBe(true);
    });

    it('should return false when ids are different', () => {
      expect(hasSameId({ _id: 'id1' }, { _id: 'id2' })).toBe(false);
    });
  });

  describe('removeDuplicateIds comprehensive tests', () => {
    it('should handle empty array', () => {
      expect(removeDuplicateIds([])).toEqual([]);
    });

    it('should keep first occurrence of duplicates', () => {
      const input = [
        { _id: 'id1', value: 'first' },
        { _id: 'id2', value: 'second' },
        { _id: 'id1', value: 'duplicate' },
        { _id: 'id3', value: 'third' }
      ];
      const result = removeDuplicateIds(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe('first');
      expect(result[1].value).toBe('second');
      expect(result[2].value).toBe('third');
    });

    it('should handle objects without ids', () => {
      const input = [
        { _id: 'id1', value: 'first' },
        { value: 'no-id' } as Record<string, unknown>,
        { _id: 'id2', value: 'second' }
      ];
      const result = removeDuplicateIds(input);
      
      expect(result).toHaveLength(2);
      expect(result![0]?.value).toBe('first');
      expect(result![1]?.value).toBe('second');
    });

    it('should handle mixed id types', () => {
      const input = [
        { _id: 'same-id', value: 'mongo' },
        { id: 'same-id', value: 'client' },
        { _id: 'unique', value: 'unique' }
      ];
      const result = removeDuplicateIds(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('mongo');
      expect(result[1].value).toBe('unique');
    });
  });

  describe('findById comprehensive tests', () => {
    const testObjects = [
      { _id: 'mongo1', name: 'first' },
      { id: 'client1', name: 'second' },
      { _id: 'mongo2', id: 'client2', name: 'third' }
    ];

    it('should find object by _id', () => {
      const result = findById(testObjects, 'mongo1');
      expect(result?.name).toBe('first');
    });

    it('should find object by id', () => {
      const result = findById(testObjects, 'client1');
      expect(result?.name).toBe('second');
    });

    it('should return undefined for non-existent id', () => {
      const result = findById(testObjects, 'non-existent');
      expect(result).toBe(undefined);
    });

    it('should handle empty array', () => {
      const result = findById([], 'any-id');
      expect(result).toBe(undefined);
    });

    it('should prefer _id over id when object has both', () => {
      const result = findById(testObjects, 'mongo2');
      expect(result?.name).toBe('third');
    });
  });

  describe('createIdMap comprehensive tests', () => {
    it('should create map from objects with ids', () => {
      const objects = [
        { _id: 'id1', name: 'first' },
        { id: 'id2', name: 'second' },
        { _id: 'id3', name: 'third' }
      ];
      const map = createIdMap(objects);
      
      expect(map.size).toBe(3);
      expect(map.get('id1')?.name).toBe('first');
      expect(map.get('id2')?.name).toBe('second');
      expect(map.get('id3')?.name).toBe('third');
    });

    it('should handle empty array', () => {
      const map = createIdMap([]);
      expect(map.size).toBe(0);
    });

    it('should skip objects without ids', () => {
      const objects = [
        { _id: 'id1', name: 'first' },
        { name: 'no-id' },
        { id: 'id2', name: 'second' }
      ];
      const map = createIdMap(objects);
      
      expect(map.size).toBe(2);
      expect(map.get('id1')?.name).toBe('first');
      expect(map.get('id2')?.name).toBe('second');
    });

    it('should handle duplicate ids by keeping last occurrence', () => {
      const objects = [
        { _id: 'same-id', name: 'first' },
        { _id: 'same-id', name: 'second' }
      ];
      const map = createIdMap(objects);
      
      expect(map.size).toBe(1);
      expect(map.get('same-id')?.name).toBe('second');
    });
  });

  describe('findCarById comprehensive tests', () => {
    const cars = [
      { _id: 'mongo-car-1', name: 'Toyota Camry' },
      { id: 'client-car-1', name: 'Honda Civic' },
      { _id: 'mongo-car-2', id: 'client-car-2', name: 'Ford Focus' }
    ];

    it('should find car by mongo _id', () => {
      const result = findCarById('mongo-car-1', cars);
      expect(result?.name).toBe('Toyota Camry');
    });

    it('should find car by client id', () => {
      const result = findCarById('client-car-1', cars);
      expect(result?.name).toBe('Honda Civic');
    });

    it('should return undefined for non-existent id', () => {
      const result = findCarById('non-existent', cars);
      expect(result).toBe(undefined);
    });

    it('should handle null carId', () => {
      const result = findCarById(null as any, cars);
      expect(result).toBe(undefined);
    });

    it('should handle undefined carId', () => {
      const result = findCarById(undefined as any, cars);
      expect(result).toBe(undefined);
    });

    it('should handle empty carId', () => {
      const result = findCarById('', cars);
      expect(result).toBe(undefined);
    });

    it('should handle null cars array', () => {
      const result = findCarById('any-id', null as any);
      expect(result).toBe(undefined);
    });

    it('should handle empty cars array', () => {
      const result = findCarById('any-id', []);
      expect(result).toBe(undefined);
    });

    it('should handle number ids', () => {
      const carsWithNumbers = [
        { _id: 123, name: 'Car with number _id' },
        { id: 456, name: 'Car with number id' }
      ];
      
      expect(findCarById('123', carsWithNumbers)?.name).toBe('Car with number _id');
      expect(findCarById('456', carsWithNumbers)?.name).toBe('Car with number id');
    });
  });

  describe('getCarNameById comprehensive tests', () => {
    const cars = [
      { _id: 'car1', name: 'Toyota Camry' },
      { id: 'car2', name: 'Honda Civic' },
      { _id: 'car3', brand: 'Ford' } // No name property
    ];

    it('should return car name by id', () => {
      expect(getCarNameById('car1', cars)).toBe('Toyota Camry');
      expect(getCarNameById('car2', cars)).toBe('Honda Civic');
    });

    it('should return empty string for non-existent car', () => {
      expect(getCarNameById('non-existent', cars)).toBe('');
    });

    it('should return empty string for car without name', () => {
      expect(getCarNameById('car3', cars)).toBe('');
    });

    it('should handle null inputs', () => {
      expect(getCarNameById(null as any, cars)).toBe('');
      expect(getCarNameById('car1', null as any)).toBe('');
    });

    it('should handle empty arrays', () => {
      expect(getCarNameById('car1', [])).toBe('');
    });
  });

  describe('validateVehicle comprehensive tests', () => {
    it('should return null for null input', () => {
      expect(validateVehicle(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(validateVehicle(undefined)).toBe(null);
    });

    it('should handle vehicle with valid id and name', () => {
      const vehicle = { _id: 'car1', name: 'Toyota Camry' };
      const result = validateVehicle(vehicle);
      expect(result).toBeTruthy();
      expect(result.id).toBe('car1');
      expect(result.name).toBe('Toyota Camry');
    });

    it('should handle vehicle with missing name', () => {
      const vehicle = { _id: 'car1' };
      const result = validateVehicle(vehicle);
      expect(result).toBeTruthy();
      expect(result.id).toBe('car1');
      expect(result.name).toBe('Unknown Vehicle');
    });

    it('should handle vehicle with empty name', () => {
      const vehicle = { _id: 'car1', name: '' };
      const result = validateVehicle(vehicle);
      expect(result).toBeTruthy();
      expect(result.id).toBe('car1');
      expect(result.name).toBe('Unknown Vehicle');
    });

    it('should handle vehicle with missing id', () => {
      const vehicle = { name: 'Toyota Camry' };
      const result = validateVehicle(vehicle);
      expect(result).toBeTruthy();
      expect(result.id).toBeTruthy(); // Should generate an ID
      expect(result.name).toBe('Toyota Camry');
    });

    it('should preserve other vehicle properties', () => {
      const vehicle = { 
        _id: 'car1', 
        name: 'Toyota Camry',
        brand: 'Toyota',
        model: 'Camry',
        year: 2020
      };
      const result = validateVehicle(vehicle);
      expect(result.brand).toBe('Toyota');
      expect(result.model).toBe('Camry');
      expect(result.year).toBe(2020);
    });
  });
}); 