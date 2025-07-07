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
  validateVehicle,
  validateVehicles
} from '../../app/lib/idUtils';

describe('ID Utils Extended Coverage', () => {
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

    it('should handle empty strings', () => {
      expect(getObjectId({ id: '' })).toBe('');
      expect(getObjectId({ _id: '' })).toBe('');
    });

    it('should handle boolean values', () => {
      expect(getObjectId({ id: true })).toBe('true');
      expect(getObjectId({ _id: false })).toBe('false');
    });

    it('should handle nested objects', () => {
      const nestedObj = { prop: 'value' };
      expect(getObjectId({ id: nestedObj })).toBe('[object Object]');
    });

    it('should handle arrays', () => {
      expect(getObjectId({ id: [1, 2, 3] })).toBe('1,2,3');
      expect(getObjectId({ _id: ['a', 'b'] })).toBe('a,b');
    });

    it('should handle null and undefined values', () => {
      expect(getObjectId({ id: null })).toBe('null');
      expect(getObjectId({ _id: undefined })).toBe('undefined');
    });
  });

  describe('normalizeId comprehensive tests', () => {
    it('should handle null input', () => {
      expect(normalizeId(null)).toBe(null);
    });

    it('should handle undefined input', () => {
      expect(normalizeId(undefined)).toBe(undefined);
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

    it('should handle empty objects', () => {
      const result = normalizeId({});
      expect(result).toEqual({});
    });

    it('should handle objects with both id and _id', () => {
      const obj = { id: 'existing-id', _id: 'existing-_id', name: 'test' };
      const result = normalizeId(obj);
      expect(result.id).toBe('existing-id');
      expect(result._id).toBe('existing-_id');
    });

    it('should handle string conversion for number _id', () => {
      const obj = { _id: 12345, name: 'test' };
      const result = normalizeId(obj);
      expect(result.id).toBe('12345');
      expect(result._id).toBe(12345);
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

    it('should handle array with null items', () => {
      const result = normalizeIds([{ _id: 'test1' }, null as any, { _id: 'test2' }]);
      expect(result).toHaveLength(3);
      expect(result?.[0]).toHaveProperty('id', 'test1');
      expect(result?.[1]).toBe(null);
      expect(result?.[2]).toHaveProperty('id', 'test2');
    });

    it('should handle empty array', () => {
      expect(normalizeIds([])).toEqual([]);
    });

         it('should handle mixed object types', () => {
       const input = [
         { _id: 'mongo1', name: 'test1' },
         { id: 'regular2', name: 'test2' },
         { _id: 12345, name: 'test3' },
         { id: 67890, name: 'test4' }
       ];
       const result = normalizeIds(input);
       expect(result).toHaveLength(4);
       expect(result?.[0]).toHaveProperty('id', 'mongo1');
       expect(result?.[1]).toHaveProperty('_id', 'regular2');
       expect(result?.[2]).toHaveProperty('id', '12345');
       expect(result?.[3]).toHaveProperty('_id', 67890);
     });
  });

  describe('getUserId comprehensive tests', () => {
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

    it('should handle null user', () => {
      expect(getUserId(null)).toBe('');
    });

    it('should handle undefined user', () => {
      expect(getUserId(undefined)).toBe('');
    });

    it('should handle user with empty object _id', () => {
      expect(getUserId({ _id: {} })).toBe('[object Object]');
    });

    it('should handle user with numeric ids', () => {
      expect(getUserId({ id: 12345 })).toBe('12345');
      expect(getUserId({ _id: 67890 })).toBe('67890');
    });
  });

  describe('hasSameId comprehensive tests', () => {
    it('should return true for objects with same string ids', () => {
      const obj1 = { id: 'same-id', name: 'obj1' };
      const obj2 = { _id: 'same-id', name: 'obj2' };
      expect(hasSameId(obj1, obj2)).toBe(true);
    });

    it('should return false for objects with different ids', () => {
      const obj1 = { id: 'id1', name: 'obj1' };
      const obj2 = { id: 'id2', name: 'obj2' };
      expect(hasSameId(obj1, obj2)).toBe(false);
    });

    it('should return false when one object has no id', () => {
      const obj1 = { id: 'id1', name: 'obj1' };
      const obj2 = { name: 'obj2' };
      expect(hasSameId(obj1, obj2)).toBe(false);
    });

    it('should return false when both objects have no id', () => {
      const obj1 = { name: 'obj1' };
      const obj2 = { name: 'obj2' };
      expect(hasSameId(obj1, obj2)).toBe(false);
    });

    it('should handle ObjectId-like objects', () => {
      const obj1 = { _id: { toString: () => 'same-id' }, name: 'obj1' };
      const obj2 = { id: 'same-id', name: 'obj2' };
      expect(hasSameId(obj1, obj2)).toBe(true);
    });

    it('should handle numeric ids', () => {
      const obj1 = { id: 12345, name: 'obj1' };
      const obj2 = { _id: 12345, name: 'obj2' };
      expect(hasSameId(obj1, obj2)).toBe(true);
    });
  });

  describe('removeDuplicateIds comprehensive tests', () => {
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
        { value: 'no-id' },
        { _id: 'id2', value: 'second' }
      ];
      const result = removeDuplicateIds(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('first');
      expect(result[1].value).toBe('second');
    });

    it('should handle empty array', () => {
      expect(removeDuplicateIds([])).toEqual([]);
    });

    it('should handle array with one element', () => {
      const input = [{ id: 'single', value: 'only' }];
      const result = removeDuplicateIds(input);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('only');
    });

    it('should handle mixed id types', () => {
      const input = [
        { id: 'string-id', value: 'first' },
        { _id: 123, value: 'second' },
        { id: 'string-id', value: 'duplicate' },
        { _id: 123, value: 'duplicate-numeric' }
      ];
      const result = removeDuplicateIds(input);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('first');
      expect(result[1].value).toBe('second');
    });
  });

  describe('findById comprehensive tests', () => {
    const objects = [
      { _id: 'mongo1', name: 'Object 1' },
      { id: 'regular2', name: 'Object 2' },
      { _id: 'mongo3', id: 'regular3', name: 'Object 3' }
    ];

    it('should find object by MongoDB _id', () => {
      const result = findById(objects, 'mongo1');
      expect(result?.name).toBe('Object 1');
    });

    it('should find object by regular id', () => {
      const result = findById(objects, 'regular2');
      expect(result?.name).toBe('Object 2');
    });

    it('should return undefined for non-existent id', () => {
      const result = findById(objects, 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = findById([], 'any-id');
      expect(result).toBeUndefined();
    });

    it('should handle empty string id', () => {
      const result = findById(objects, '');
      expect(result).toBeUndefined();
    });

    it('should handle numeric ids', () => {
      const numericObjects = [
        { id: 123, name: 'Numeric Object' },
        { _id: 456, name: 'Numeric MongoDB Object' }
      ];
      
      expect(findById(numericObjects, '123')?.name).toBe('Numeric Object');
      expect(findById(numericObjects, '456')?.name).toBe('Numeric MongoDB Object');
    });
  });

  describe('createIdMap comprehensive tests', () => {
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

    it('should handle empty array', () => {
      const map = createIdMap([]);
      expect(map.size).toBe(0);
    });

    it('should handle ObjectId-like objects', () => {
      const objects = [
        { _id: { toString: () => 'object-id' }, name: 'ObjectId Object' },
        { id: 'regular-id', name: 'Regular Object' }
      ];
      const map = createIdMap(objects);
      
      expect(map.size).toBe(2);
      expect(map.get('object-id')?.name).toBe('ObjectId Object');
      expect(map.get('regular-id')?.name).toBe('Regular Object');
    });

    it('should handle numeric ids', () => {
      const objects = [
        { id: 123, name: 'Numeric ID' },
        { _id: 456, name: 'Numeric _ID' }
      ];
      const map = createIdMap(objects);
      
      expect(map.size).toBe(2);
      expect(map.get('123')?.name).toBe('Numeric ID');
      expect(map.get('456')?.name).toBe('Numeric _ID');
    });
  });

  describe('findCarById edge cases', () => {
    const cars = [
      { _id: 'mongo-car-1', name: 'Toyota Camry' },
      { id: 'client-car-1', name: 'Honda Civic' }
    ];

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

    it('should find by string representation of ObjectId', () => {
      const carsWithObjectId = [
        { _id: { toString: () => 'object-id-123' }, name: 'ObjectId Car' }
      ];
      
      expect(findCarById('object-id-123', carsWithObjectId)?.name).toBe('ObjectId Car');
    });
  });

  describe('getCarNameById edge cases', () => {
    const cars = [
      { _id: 'car1', name: 'Toyota Camry' },
      { id: 'car2', name: 'Honda Civic' },
      { _id: 'car3', brand: 'Ford' } // No name property
    ];

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

    it('should handle undefined cars array', () => {
      expect(getCarNameById('car1', undefined as any)).toBe('');
    });

    it('should handle empty string carId', () => {
      expect(getCarNameById('', cars)).toBe('');
    });

    it('should handle cars with null name', () => {
      const carsWithNullName = [
        { _id: 'car-null', name: null, brand: 'Test' }
      ];
      expect(getCarNameById('car-null', carsWithNullName)).toBe(null);
    });

    it('should handle cars with undefined name explicitly', () => {
      const carsWithUndefinedName = [
        { _id: 'car-undefined', name: undefined, brand: 'Test' }
      ];
      expect(getCarNameById('car-undefined', carsWithUndefinedName)).toBe(undefined);
    });

    it('should handle cars with boolean name', () => {
      const carsWithBooleanName = [
        { _id: 'car-bool', name: true, brand: 'Test' }
      ];
      expect(getCarNameById('car-bool', carsWithBooleanName)).toBe(true);
    });

    it('should handle cars with numeric name', () => {
      const carsWithNumericName = [
        { _id: 'car-num', name: 123, brand: 'Test' }
      ];
      expect(getCarNameById('car-num', carsWithNumericName)).toBe(123);
    });
  });

  describe('validateVehicle edge cases', () => {
    it('should return null for null input', () => {
      expect(validateVehicle(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(validateVehicle(undefined)).toBe(null);
    });

    it('should handle empty object', () => {
      const result = validateVehicle({});
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^temp-\d+-[a-z0-9]+$/);
      expect(result.name).toBe('Unknown Vehicle');
    });

    it('should handle vehicle with only brand', () => {
      const vehicle = { brand: 'Toyota' };
      const result = validateVehicle(vehicle);
      expect(result.brand).toBe('Toyota');
      expect(result.id).toMatch(/^temp-\d+-[a-z0-9]+$/);
      expect(result.name).toBe('Unknown Vehicle');
    });

    it('should handle vehicle with very long id', () => {
      const longId = 'this-is-a-very-long-id-that-exceeds-normal-length-limits-and-should-be-truncated';
      const vehicle = { id: longId };
      const result = validateVehicle(vehicle);
      expect(result.name).toBe('Vehicle this-is-');
    });

    it('should handle vehicle with ObjectId-like _id', () => {
      const mockObjectId = { toString: () => 'mock-object-id-123' };
      const vehicle = { _id: mockObjectId, brand: 'Honda' };
      const result = validateVehicle(vehicle);
      expect(result.id).toBe('mock-object-id-123');
      expect(result.name).toBe('Vehicle mock-obj');
    });

    it('should handle vehicle with numeric id', () => {
      const vehicle = { id: 12345, brand: 'Ford' };
      const result = validateVehicle(vehicle);
      expect(result.id).toBe(12345);
      expect(result._id).toBe(12345);
      expect(result.name).toBe('Vehicle 12345');
    });

    it('should handle vehicle with array as name', () => {
      const vehicle = { id: 'test', name: ['array', 'name'], brand: 'Test' };
      const result = validateVehicle(vehicle);
      expect(result.name).toBe('Vehicle test');
    });

    it('should handle vehicle with object as name', () => {
      const vehicle = { id: 'test', name: { prop: 'value' }, brand: 'Test' };
      const result = validateVehicle(vehicle);
      expect(result.name).toBe('Vehicle test');
    });

    it('should preserve complex vehicle properties', () => {
      const vehicle = {
        _id: 'complex-vehicle',
        name: 'Complex Vehicle',
        brand: 'Toyota',
        year: 2023,
        color: 'Blue',
        features: ['GPS', 'Bluetooth']
      };
      const result = validateVehicle(vehicle);
      expect(result.brand).toBe('Toyota');
      expect(result.year).toBe(2023);
      expect(result.color).toBe('Blue');
      expect(result.features).toEqual(['GPS', 'Bluetooth']);
    });
  });

  describe('validateVehicles comprehensive tests', () => {
    it('should handle null input', () => {
      expect(validateVehicles(null as any)).toEqual([]);
    });

    it('should handle undefined input', () => {
      expect(validateVehicles(undefined as any)).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect(validateVehicles('not-an-array' as any)).toEqual([]);
    });

    it('should handle empty array', () => {
      expect(validateVehicles([])).toEqual([]);
    });

    it('should validate mixed vehicle types', () => {
      const vehicles = [
        { _id: 'mongo1', name: 'Car 1', brand: 'Toyota' },
        { id: 'regular2', name: 'Car 2', brand: 'Honda' },
        { brand: 'Ford' }, // Missing id and name
        null, // Invalid vehicle
        undefined, // Invalid vehicle
        { _id: 'mongo3', name: '', brand: 'BMW' }, // Empty name
        { id: 'regular4', name: '   ', brand: 'Audi' } // Whitespace name
      ];
      
      const result = validateVehicles(vehicles);
      
      // Should filter out null/undefined and fix the rest
      expect(result.length).toBe(5);
      
      // Check first valid vehicle
      expect(result[0]).toEqual({
        _id: 'mongo1',
        id: 'mongo1',
        name: 'Car 1',
        brand: 'Toyota'
      });
      
      // Check second valid vehicle
      expect(result[1]).toEqual({
        id: 'regular2',
        _id: 'regular2',
        name: 'Car 2',
        brand: 'Honda'
      });
      
      // Check vehicle with missing id/name gets temp id and generated name
      expect(result[2].brand).toBe('Ford');
      expect(result[2].id).toMatch(/^temp-\d+-[a-z0-9]+$/);
      expect(result[2].name).toBe('Unknown Vehicle');
      
      // Check vehicle with empty name gets generated name
      expect(result[3].name).toBe('Vehicle mongo3');
      
      // Check vehicle with whitespace name gets generated name
      expect(result[4].name).toBe('Vehicle regular4');
    });

    it('should handle vehicles with complex ObjectId-like _id', () => {
      const vehicles = [
        { _id: { toString: () => 'complex-id-1' }, name: 'Vehicle 1' },
        { _id: { toString: () => 'complex-id-2' }, brand: 'Toyota' }
      ];
      
      const result = validateVehicles(vehicles);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('complex-id-1');
      expect(result[0].name).toBe('Vehicle 1');
      expect(result[1].id).toBe('complex-id-2');
      expect(result[1].name).toBe('Vehicle complex-');
    });

    it('should not mutate original vehicle objects', () => {
      const vehicles = [
        { _id: 'original1', brand: 'Toyota' },
        { brand: 'Honda' }
      ];
      
      const originalVehicles = JSON.parse(JSON.stringify(vehicles));
      const result = validateVehicles(vehicles);
      
      // Original should be unchanged
      expect(vehicles).toEqual(originalVehicles);
      
      // Result should be different
      expect(result[0]).not.toBe(vehicles[0]);
      expect(result[1]).not.toBe(vehicles[1]);
    });

    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `vehicle-${i}`,
        name: `Vehicle ${i}`,
        brand: 'Test'
      }));
      
      const result = validateVehicles(largeArray);
      expect(result).toHaveLength(1000);
      expect(result[0].name).toBe('Vehicle 0');
      expect(result[999].name).toBe('Vehicle 999');
    });
  });
}); 