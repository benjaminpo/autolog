import {
  getObjectId,
  normalizeId,
  normalizeIds,
  findCarById,
  getCarNameById,
  validateVehicle,
  validateVehicles
} from '../../app/lib/idUtils';

describe('idUtils', () => {
  describe('getObjectId', () => {
    it('should return _id as string when object has _id', () => {
      const obj = { _id: 'mongodb123', name: 'test' };
      expect(getObjectId(obj)).toBe('mongodb123');
    });

    it('should return id as string when object has id but no _id', () => {
      const obj = { id: 'regular123', name: 'test' };
      expect(getObjectId(obj)).toBe('regular123');
    });

    it('should convert ObjectId-like objects to string', () => {
      const obj = { _id: { toString: () => 'objectid123' }, name: 'test' };
      expect(getObjectId(obj)).toBe('objectid123');
    });

    it('should prefer _id over id when both exist', () => {
      const obj = { _id: 'mongo123', id: 'regular123', name: 'test' };
      expect(getObjectId(obj)).toBe('mongo123');
    });

    it('should return empty string when object is null', () => {
      expect(getObjectId(null as any)).toBe('');
    });

    it('should return empty string when object is undefined', () => {
      expect(getObjectId(undefined as any)).toBe('');
    });

    it('should return empty string when object has no id or _id', () => {
      const obj = { name: 'test', value: 123 };
      expect(getObjectId(obj)).toBe('');
    });

    it('should handle objects with falsy id values', () => {
      expect(getObjectId({ id: 0 })).toBe(''); // obj && obj.id is false when id is 0
      expect(getObjectId({ id: '' })).toBe(''); // obj && obj.id is false when id is ''
      expect(getObjectId({ id: false })).toBe(''); // obj && obj.id is false when id is false
    });

    it('should handle objects with falsy _id values', () => {
      expect(getObjectId({ _id: 0 })).toBe(''); // obj && obj._id is false when _id is 0
      expect(getObjectId({ _id: '' })).toBe(''); // obj && obj._id is false when _id is ''
      expect(getObjectId({ _id: false })).toBe(''); // obj && obj._id is false when _id is false
    });

    it('should handle numeric ids', () => {
      expect(getObjectId({ id: 123 })).toBe('123');
      expect(getObjectId({ _id: 456 })).toBe('456');
    });
  });

  describe('normalizeId', () => {
    it('should add id property when object has _id but no id', () => {
      const obj = { _id: 'mongo123', name: 'test' };
      const result = normalizeId(obj);
      
      expect(result.id).toBe('mongo123');
      expect(result._id).toBe('mongo123');
      expect(result.name).toBe('test');
    });

    it('should add _id property when object has id but no _id', () => {
      const obj = { id: 'regular123', name: 'test' };
      const result = normalizeId(obj);
      
      expect(result.id).toBe('regular123');
      expect(result._id).toBe('regular123');
      expect(result.name).toBe('test');
    });

    it('should not modify object when both id and _id exist', () => {
      const obj = { _id: 'mongo123', id: 'regular123', name: 'test' };
      const result = normalizeId(obj);
      
      expect(result._id).toBe('mongo123');
      expect(result.id).toBe('regular123');
      expect(result.name).toBe('test');
    });

    it('should handle ObjectId-like _id objects', () => {
      const obj = { _id: { toString: () => 'objectid123' }, name: 'test' };
      const result = normalizeId(obj);
      
      expect(result.id).toBe('objectid123');
      expect(result._id.toString()).toBe('objectid123');
    });

    it('should return null for null input', () => {
      expect(normalizeId(null)).toBe(null);
    });

    it('should return undefined for undefined input', () => {
      expect(normalizeId(undefined)).toBe(undefined);
    });

    it('should create new object without mutating original', () => {
      const original = { _id: 'mongo123', name: 'test' };
      const result = normalizeId(original);
      
      expect(result).not.toBe(original);
      expect((original as any).id).toBeUndefined();
      expect(result.id).toBe('mongo123');
    });

    it('should handle objects with neither id nor _id', () => {
      const obj = { name: 'test', value: 123 };
      const result = normalizeId(obj);
      
      expect(result).toEqual(obj);
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = normalizeId(obj);
      
      expect(result).toEqual({});
    });
  });

  describe('normalizeIds', () => {
    it('should normalize an array of objects', () => {
      const items = [
        { _id: 'mongo1', name: 'item1' },
        { id: 'regular2', name: 'item2' },
        { _id: 'mongo3', id: 'regular3', name: 'item3' }
      ];
      
      const result = normalizeIds(items);
      
      expect(result).toHaveLength(3);
      expect(result?.[0]).toEqual({ _id: 'mongo1', id: 'mongo1', name: 'item1' });
      expect(result?.[1]).toEqual({ id: 'regular2', _id: 'regular2', name: 'item2' });
      expect(result?.[2]).toEqual({ _id: 'mongo3', id: 'regular3', name: 'item3' });
    });

    it('should return original array when input is null', () => {
      expect(normalizeIds(null as any)).toBe(null);
    });

    it('should return original array when input is undefined', () => {
      expect(normalizeIds(undefined as any)).toBe(undefined);
    });

    it('should return original input when not an array', () => {
      const notArray = { _id: 'test' };
      expect(normalizeIds(notArray as any)).toBe(notArray);
    });

    it('should handle empty array', () => {
      expect(normalizeIds([])).toEqual([]);
    });

    it('should handle array with null/undefined items', () => {
      const items = [
        { _id: 'mongo1', name: 'item1' },
        null,
        undefined,
        { id: 'regular2', name: 'item2' }
      ];
      
      const result = normalizeIds(items as any);
      
      expect(result).toHaveLength(4);
      expect(result?.[0]).toEqual({ _id: 'mongo1', id: 'mongo1', name: 'item1' });
      expect(result?.[1]).toBe(null);
      expect(result?.[2]).toBe(undefined);
      expect(result?.[3]).toEqual({ id: 'regular2', _id: 'regular2', name: 'item2' });
    });
  });

  describe('findCarById', () => {
    const cars = [
      { _id: 'mongo1', name: 'Car 1', brand: 'Toyota' },
      { id: 'regular2', name: 'Car 2', brand: 'Honda' },
      { _id: 'mongo3', id: 'regular3', name: 'Car 3', brand: 'Ford' },
      { _id: { toString: () => 'objectid4' }, name: 'Car 4', brand: 'BMW' }
    ];

    it('should find car by MongoDB _id', () => {
      const result = findCarById('mongo1', cars);
      expect(result).toEqual({ _id: 'mongo1', name: 'Car 1', brand: 'Toyota' });
    });

    it('should find car by regular id', () => {
      const result = findCarById('regular2', cars);
      expect(result).toEqual({ id: 'regular2', name: 'Car 2', brand: 'Honda' });
    });

    it('should find car by ObjectId-like _id', () => {
      const result = findCarById('objectid4', cars);
      expect(result).toBeDefined();
      expect(result.name).toBe('Car 4');
      expect(result.brand).toBe('BMW');
      expect(result._id.toString()).toBe('objectid4');
    });

    it('should return undefined when car not found', () => {
      expect(findCarById('nonexistent', cars)).toBeUndefined();
    });

    it('should return undefined when carId is empty', () => {
      expect(findCarById('', cars)).toBeUndefined();
    });

    it('should return undefined when carId is null', () => {
      expect(findCarById(null as any, cars)).toBeUndefined();
    });

    it('should return undefined when cars array is null', () => {
      expect(findCarById('mongo1', null as any)).toBeUndefined();
    });

    it('should return undefined when cars array is undefined', () => {
      expect(findCarById('mongo1', undefined as any)).toBeUndefined();
    });

    it('should return undefined when cars array is empty', () => {
      expect(findCarById('mongo1', [])).toBeUndefined();
    });

    it('should handle cars with numeric ids', () => {
      const carsWithNumericIds = [
        { id: 123, name: 'Car 123' },
        { _id: 456, name: 'Car 456' }
      ];
      
      expect(findCarById('123', carsWithNumericIds)).toEqual({ id: 123, name: 'Car 123' });
      expect(findCarById('456', carsWithNumericIds)).toEqual({ _id: 456, name: 'Car 456' });
    });

    it('should prioritize exact string matches', () => {
      const carsWithSimilarIds = [
        { id: '123', name: 'String 123' },
        { _id: 123, name: 'Number 123' }
      ];
      
      const result = findCarById('123', carsWithSimilarIds);
      expect(result.name).toBe('String 123');
    });
  });

  describe('getCarNameById', () => {
    const cars = [
      { _id: 'mongo1', name: 'Toyota Camry', brand: 'Toyota' },
      { id: 'regular2', name: 'Honda Civic', brand: 'Honda' },
      { _id: 'mongo3', name: '', brand: 'Ford' }, // Empty name
      { _id: 'mongo4', brand: 'BMW' } // No name property
    ];

    it('should return car name when car is found', () => {
      expect(getCarNameById('mongo1', cars)).toBe('Toyota Camry');
      expect(getCarNameById('regular2', cars)).toBe('Honda Civic');
    });

    it('should return empty string when car is not found', () => {
      expect(getCarNameById('nonexistent', cars)).toBe('');
    });

    it('should return empty string when car name is empty', () => {
      expect(getCarNameById('mongo3', cars)).toBe('');
    });

    it('should return undefined when car has no name property', () => {
      expect(getCarNameById('mongo4', cars)).toBeUndefined(); // car.name is undefined, so car ? car.name : '' returns undefined
    });

    it('should return empty string when carId is empty', () => {
      expect(getCarNameById('', cars)).toBe('');
    });

    it('should return empty string when cars array is empty', () => {
      expect(getCarNameById('mongo1', [])).toBe('');
    });

    it('should return empty string when cars array is null', () => {
      expect(getCarNameById('mongo1', null as any)).toBe('');
    });
  });

  describe('validateVehicle', () => {
    it('should return null for null input', () => {
      expect(validateVehicle(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(validateVehicle(undefined)).toBe(null);
    });

    it('should normalize _id to id when id is missing', () => {
      const vehicle = { _id: 'mongo123', name: 'Test Car', brand: 'Toyota' };
      const result = validateVehicle(vehicle);
      
      expect(result.id).toBe('mongo123');
      expect(result._id).toBe('mongo123');
      expect(result.name).toBe('Test Car');
    });

    it('should normalize id to _id when _id is missing', () => {
      const vehicle = { id: 'regular123', name: 'Test Car', brand: 'Honda' };
      const result = validateVehicle(vehicle);
      
      expect(result.id).toBe('regular123');
      expect(result._id).toBe('regular123');
      expect(result.name).toBe('Test Car');
    });

    it('should handle ObjectId-like _id', () => {
      const vehicle = { _id: { toString: () => 'objectid123' }, name: 'Test Car' };
      const result = validateVehicle(vehicle);
      
      expect(result.id).toBe('objectid123');
      expect(result._id.toString()).toBe('objectid123'); // Check that the ObjectId-like object can be converted to string
    });

    it('should generate temporary id when neither id nor _id exists', () => {
      const vehicle = { name: 'Test Car', brand: 'Ford' };
      const result = validateVehicle(vehicle);
      
      expect(result.id).toMatch(/^temp-\d+-[a-z0-9]+$/);
      expect(result._id).toBe(result.id);
      expect(result.name).toBe('Test Car');
    });

    it('should generate vehicle name when name is missing', () => {
      const vehicle = { id: 'test123', brand: 'BMW' };
      const result = validateVehicle(vehicle);
      
      expect(result.name).toBe('Vehicle test123');
    });

    it('should generate vehicle name when name is empty string', () => {
      const vehicle = { id: 'test123', name: '', brand: 'BMW' };
      const result = validateVehicle(vehicle);
      
      expect(result.name).toBe('Vehicle test123');
    });

    it('should generate vehicle name when name is only whitespace', () => {
      const vehicle = { id: 'test123', name: '   ', brand: 'BMW' };
      const result = validateVehicle(vehicle);
      
      expect(result.name).toBe('Vehicle test123');
    });

    it('should generate vehicle name when name is not a string', () => {
      const vehicle = { id: 'test123', name: 123, brand: 'BMW' };
      const result = validateVehicle(vehicle);
      
      expect(result.name).toBe('Vehicle test123');
    });

    it('should preserve valid name', () => {
      const vehicle = { id: 'test123', name: 'My Car', brand: 'Toyota' };
      const result = validateVehicle(vehicle);
      
      expect(result.name).toBe('My Car');
    });

    it('should not mutate original vehicle object', () => {
      const vehicle = { _id: 'mongo123', brand: 'Toyota' };
      const result = validateVehicle(vehicle);
      
      expect(result).not.toBe(vehicle);
      expect((vehicle as any).id).toBeUndefined();
      expect((vehicle as any).name).toBeUndefined();
    });

    it('should handle vehicles with both id and _id already present', () => {
      const vehicle = { _id: 'mongo123', id: 'regular123', name: 'Test Car' };
      const result = validateVehicle(vehicle);
      
      expect(result._id).toBe('mongo123');
      expect(result.id).toBe('regular123');
      expect(result.name).toBe('Test Car');
    });

    it('should truncate id for name generation when id is very long', () => {
      const longId = 'verylongidthatexceedseightcharacters';
      const vehicle = { id: longId };
      const result = validateVehicle(vehicle);
      
      expect(result.name).toBe('Vehicle verylong'); // substring(0, 8) gives 8 characters
    });
  });

  describe('validateVehicles', () => {
    it('should return empty array for null input', () => {
      expect(validateVehicles(null as any)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(validateVehicles(undefined as any)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(validateVehicles('not an array' as any)).toEqual([]);
    });

    it('should validate multiple vehicles', () => {
      const vehicles = [
        { _id: 'mongo1', name: 'Car 1' },
        { id: 'regular2', name: 'Car 2' },
        { brand: 'Toyota' }, // Missing id and name
        null // Invalid vehicle
      ];
      
      const result = validateVehicles(vehicles);
      
      expect(result).toHaveLength(3); // Null should be filtered out
      expect(result[0]).toEqual({
        _id: 'mongo1',
        id: 'mongo1',
        name: 'Car 1'
      });
      expect(result[1]).toEqual({
        id: 'regular2',
        _id: 'regular2',
        name: 'Car 2'
      });
      expect(result[2].id).toMatch(/^temp-\d+-[a-z0-9]+$/);
      expect(result[2].name).toMatch(/^Vehicle temp-/);
    });

    it('should handle empty array', () => {
      expect(validateVehicles([])).toEqual([]);
    });

    it('should log validation progress', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const vehicles = [
        { _id: 'mongo1', name: 'Car 1' },
        { id: 'regular2', name: 'Car 2' }
      ];
      
      validateVehicles(vehicles);
      
      expect(consoleSpy).toHaveBeenCalledWith('Validating 2 vehicles');
      consoleSpy.mockRestore();
    });

    it('should filter out null values returned by validateVehicle', () => {
      const vehicles = [
        { _id: 'mongo1', name: 'Car 1' },
        undefined, // This will return null from validateVehicle
        null, // This will return null from validateVehicle
        { id: 'regular2', name: 'Car 2' }
      ];
      
      const result = validateVehicles(vehicles);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Car 1');
      expect(result[1].name).toBe('Car 2');
    });
  });
}); 