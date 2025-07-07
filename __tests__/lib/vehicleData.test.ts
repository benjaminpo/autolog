import { 
  vehicleTypes, 
  currencies, 
  distanceUnits, 
  volumeUnits,
  tyrePressureUnits,
  paymentTypes,
  getTranslatedVehicleTypes,
  translateVehicleType,
  getVehicleDataKey,
  vehicleKeyToDisplayMap,
  vehicleDisplayToKeyMap,
  vehicleBrands,
  vehicleModels
} from '../../app/lib/vehicleData'

describe('vehicleData', () => {
  // Mock translation object
  const mockTranslation = {
    vehicleTypeCar: 'Car/Truck',
    vehicleTypeMotorcycle: 'Motorcycle', 
    vehicleTypeHeavyTruck: 'Heavy Truck',
    vehicleTypeAtv: 'ATV & UTV',
    vehicleTypeSnowmobile: 'Snowmobile',
    vehicleTypeWatercraft: 'Personal Watercraft',
    vehicleTypeOther: 'Other',
    unknownKey: 'Unknown Translation'
  };

  describe('constants', () => {
    it('should have vehicle types array', () => {
      expect(Array.isArray(vehicleTypes)).toBe(true)
      expect(vehicleTypes.length).toBeGreaterThan(0)
    })

    it('should have currencies array', () => {
      expect(Array.isArray(currencies)).toBe(true)
      expect(currencies.length).toBeGreaterThan(0)
      expect(currencies).toContain('USD')
      expect(currencies).toContain('EUR')
    })

    it('should have distance units', () => {
      expect(Array.isArray(distanceUnits)).toBe(true)
      expect(distanceUnits).toContain('km')
      expect(distanceUnits).toContain('miles')
    })

    it('should have volume units', () => {
      expect(Array.isArray(volumeUnits)).toBe(true)
      expect(volumeUnits).toContain('liters')
      expect(volumeUnits).toContain('gallons')
    })

    it('should have tyre pressure units', () => {
      expect(Array.isArray(tyrePressureUnits)).toBe(true)
      expect(tyrePressureUnits.length).toBeGreaterThan(0)
    })

    it('should have payment types', () => {
      expect(Array.isArray(paymentTypes)).toBe(true)
      expect(paymentTypes.length).toBeGreaterThan(0)
    })
  })

  describe('data integrity', () => {
    it('should have valid vehicle types', () => {
      vehicleTypes.forEach(type => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
    })

    it('should have valid currencies', () => {
      currencies.forEach(currency => {
        expect(typeof currency).toBe('string')
        expect(currency.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('should have valid distance units', () => {
      distanceUnits.forEach(unit => {
        expect(typeof unit).toBe('string')
        expect(unit.length).toBeGreaterThan(0)
      })
    })

    it('should have valid volume units', () => {
      volumeUnits.forEach(unit => {
        expect(typeof unit).toBe('string')
        expect(unit.length).toBeGreaterThan(0)
      })
    })
  })

  describe('constants accessibility', () => {
    it('should export all required constants', () => {
      expect(vehicleTypes).toBeDefined()
      expect(currencies).toBeDefined()
      expect(distanceUnits).toBeDefined()
      expect(volumeUnits).toBeDefined()
      expect(tyrePressureUnits).toBeDefined()
      expect(paymentTypes).toBeDefined()
    })
  })

  describe('getTranslatedVehicleTypes', () => {
    it('should return translated vehicle types', () => {
      const result = getTranslatedVehicleTypes(mockTranslation);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Car/Truck');
      expect(result).toContain('Motorcycle');
      expect(result).toContain('Heavy Truck');
      expect(result).toContain('ATV & UTV');
      expect(result).toContain('Snowmobile');
      expect(result).toContain('Personal Watercraft');
      expect(result).toContain('Other');
    });

    it('should fallback to key when translation is missing', () => {
      const incompleteTranslation = {
        vehicleTypeCar: 'Car/Truck'
        // Missing other translations
      };
      
      const result = getTranslatedVehicleTypes(incompleteTranslation);
      
      expect(result).toContain('Car/Truck');
      expect(result).toContain('vehicleTypeMotorcycle'); // Fallback to key
      expect(result).toContain('vehicleTypeHeavyTruck'); // Fallback to key
    });

    it('should handle empty translation object', () => {
      const result = getTranslatedVehicleTypes({});
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      // Should contain the keys as fallbacks
      expect(result).toContain('vehicleTypeCar');
      expect(result).toContain('vehicleTypeMotorcycle');
    });

    it('should handle null translation object', () => {
      expect(() => getTranslatedVehicleTypes(null as any)).toThrow();
    });

    it('should handle undefined translation object', () => {
      expect(() => getTranslatedVehicleTypes(undefined as any)).toThrow();
    });
  });

  describe('translateVehicleType', () => {
    it('should translate known vehicle types', () => {
      expect(translateVehicleType('Car/Truck', mockTranslation)).toBe('Car/Truck');
      expect(translateVehicleType('Motorcycle', mockTranslation)).toBe('Motorcycle');
      expect(translateVehicleType('Heavy Truck', mockTranslation)).toBe('Heavy Truck');
      expect(translateVehicleType('ATV & UTV', mockTranslation)).toBe('ATV & UTV');
      expect(translateVehicleType('Snowmobile', mockTranslation)).toBe('Snowmobile');
      expect(translateVehicleType('Personal Watercraft', mockTranslation)).toBe('Personal Watercraft');
      expect(translateVehicleType('Other', mockTranslation)).toBe('Other');
    });

    it('should return original value for unknown vehicle types', () => {
      const unknownType = 'Unknown Vehicle Type';
      const result = translateVehicleType(unknownType, mockTranslation);
      
      expect(result).toBe(unknownType);
    });

    it('should handle empty vehicle type', () => {
      const result = translateVehicleType('', mockTranslation);
      expect(result).toBe('');
    });

    it('should handle null vehicle type', () => {
      const result = translateVehicleType(null as any, mockTranslation);
      expect(result).toBe(null);
    });

    it('should handle undefined vehicle type', () => {
      const result = translateVehicleType(undefined as any, mockTranslation);
      expect(result).toBe(undefined);
    });

    it('should handle missing translation object', () => {
      expect(() => translateVehicleType('Car/Truck', null as any)).toThrow();
    });

    it('should handle vehicle types with incomplete translations', () => {
      const incompleteTranslation = {
        vehicleTypeCar: 'Translated Car'
      };
      
      expect(translateVehicleType('Car/Truck', incompleteTranslation)).toBe('Translated Car');
      expect(translateVehicleType('Motorcycle', incompleteTranslation)).toBe('Motorcycle');
    });
  });

  describe('getVehicleDataKey', () => {
    it('should return correct data key for translated types', () => {
      expect(getVehicleDataKey('Car/Truck', mockTranslation)).toBe('Car/Truck');
      expect(getVehicleDataKey('Motorcycle', mockTranslation)).toBe('Motorcycle');
      expect(getVehicleDataKey('Heavy Truck', mockTranslation)).toBe('Heavy Truck');
      expect(getVehicleDataKey('ATV & UTV', mockTranslation)).toBe('ATV & UTV');
      expect(getVehicleDataKey('Snowmobile', mockTranslation)).toBe('Snowmobile');
      expect(getVehicleDataKey('Personal Watercraft', mockTranslation)).toBe('Personal Watercraft');
      expect(getVehicleDataKey('Other', mockTranslation)).toBe('Other');
    });

    it('should return original value when no match found', () => {
      const unknownType = 'Unknown Vehicle Type';
      const result = getVehicleDataKey(unknownType, mockTranslation);
      
      expect(result).toBe(unknownType);
    });

    it('should handle empty translated type', () => {
      const result = getVehicleDataKey('', mockTranslation);
      expect(result).toBe('');
    });

    it('should handle null translated type', () => {
      const result = getVehicleDataKey(null as any, mockTranslation);
      expect(result).toBe(null);
    });

    it('should handle undefined translated type', () => {
      const result = getVehicleDataKey(undefined as any, mockTranslation);
      expect(result).toBe(undefined);
    });

    it('should handle missing translation object', () => {
      expect(() => getVehicleDataKey('Car/Truck', null as any)).toThrow();
    });

    it('should handle translation object without matching keys', () => {
      const differentTranslation = {
        someOtherKey: 'Some Other Value'
      };
      
      const result = getVehicleDataKey('Car/Truck', differentTranslation);
      expect(result).toBe('Car/Truck');
    });
  });

  describe('vehicleKeyToDisplayMap', () => {
    it('should contain all expected vehicle type mappings', () => {
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeCar', 'Car/Truck');
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeMotorcycle', 'Motorcycle');
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeHeavyTruck', 'Heavy Truck');
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeAtv', 'ATV & UTV');
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeSnowmobile', 'Snowmobile');
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeWatercraft', 'Personal Watercraft');
      expect(vehicleKeyToDisplayMap).toHaveProperty('vehicleTypeOther', 'Other');
    });

    it('should have the correct number of mappings', () => {
      const keys = Object.keys(vehicleKeyToDisplayMap);
      expect(keys.length).toBe(7);
    });

    it('should have string values for all keys', () => {
      Object.values(vehicleKeyToDisplayMap).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('vehicleDisplayToKeyMap', () => {
    it('should contain all expected display to key mappings', () => {
      expect(vehicleDisplayToKeyMap).toHaveProperty('Car/Truck', 'vehicleTypeCar');
      expect(vehicleDisplayToKeyMap).toHaveProperty('Motorcycle', 'vehicleTypeMotorcycle');
      expect(vehicleDisplayToKeyMap).toHaveProperty('Heavy Truck', 'vehicleTypeHeavyTruck');
      expect(vehicleDisplayToKeyMap).toHaveProperty('ATV & UTV', 'vehicleTypeAtv');
      expect(vehicleDisplayToKeyMap).toHaveProperty('Snowmobile', 'vehicleTypeSnowmobile');
      expect(vehicleDisplayToKeyMap).toHaveProperty('Personal Watercraft', 'vehicleTypeWatercraft');
      expect(vehicleDisplayToKeyMap).toHaveProperty('Other', 'vehicleTypeOther');
    });

    it('should be the inverse of vehicleKeyToDisplayMap', () => {
      Object.entries(vehicleKeyToDisplayMap).forEach(([key, display]) => {
        expect(vehicleDisplayToKeyMap[display]).toBe(key);
      });
    });

    it('should have the correct number of mappings', () => {
      const keys = Object.keys(vehicleDisplayToKeyMap);
      expect(keys.length).toBe(7);
    });
  });

  describe('vehicleBrands', () => {
    it('should contain brands for all vehicle types', () => {
      expect(vehicleBrands).toHaveProperty('Car/Truck');
      expect(vehicleBrands).toHaveProperty('Motorcycle');
      expect(vehicleBrands).toHaveProperty('Heavy Truck');
      expect(vehicleBrands).toHaveProperty('ATV & UTV');
      expect(vehicleBrands).toHaveProperty('Snowmobile');
      expect(vehicleBrands).toHaveProperty('Personal Watercraft');
      expect(vehicleBrands).toHaveProperty('Other');
    });

    it('should have arrays of brands for each vehicle type', () => {
      Object.values(vehicleBrands).forEach(brands => {
        expect(Array.isArray(brands)).toBe(true);
      });
    });

    it('should have popular car brands in Car/Truck', () => {
      const carBrands = vehicleBrands['Car/Truck'];
      expect(carBrands).toContain('Toyota');
      expect(carBrands).toContain('Honda');
      expect(carBrands).toContain('Ford');
      expect(carBrands).toContain('BMW');
      expect(carBrands).toContain('Mercedes-Benz');
      expect(carBrands).toContain('Volkswagen');
    });

    it('should have motorcycle brands in Motorcycle', () => {
      const motorcycleBrands = vehicleBrands['Motorcycle'];
      expect(motorcycleBrands).toContain('Honda');
      expect(motorcycleBrands).toContain('Yamaha');
      expect(motorcycleBrands).toContain('Kawasaki');
      expect(motorcycleBrands).toContain('Harley-Davidson');
      expect(motorcycleBrands).toContain('BMW');
    });

    it('should have heavy truck brands in Heavy Truck', () => {
      const heavyTruckBrands = vehicleBrands['Heavy Truck'];
      expect(heavyTruckBrands).toContain('Freightliner');
      expect(heavyTruckBrands).toContain('Kenworth');
      expect(heavyTruckBrands).toContain('Peterbilt');
      expect(heavyTruckBrands).toContain('Volvo');
    });

    it('should have ATV brands in ATV & UTV', () => {
      const atvBrands = vehicleBrands['ATV & UTV'];
      expect(atvBrands).toContain('Polaris');
      expect(atvBrands).toContain('Can-Am');
      expect(atvBrands).toContain('Honda');
      expect(atvBrands).toContain('Yamaha');
    });

    it('should have snowmobile brands in Snowmobile', () => {
      const snowmobileBrands = vehicleBrands['Snowmobile'];
      expect(snowmobileBrands).toContain('Ski-Doo');
      expect(snowmobileBrands).toContain('Polaris');
      expect(snowmobileBrands).toContain('Arctic Cat');
      expect(snowmobileBrands).toContain('Yamaha');
    });

    it('should have watercraft brands in Personal Watercraft', () => {
      const watercraftBrands = vehicleBrands['Personal Watercraft'];
      expect(watercraftBrands).toContain('Sea-Doo');
      expect(watercraftBrands).toContain('Yamaha');
      expect(watercraftBrands).toContain('Kawasaki');
    });

    it('should have empty array for Other', () => {
      const otherBrands = vehicleBrands['Other'];
      expect(otherBrands).toEqual([]);
    });
  });

  describe('vehicleModels', () => {
    it('should contain models for Car/Truck', () => {
      expect(vehicleModels).toHaveProperty('Car/Truck');
      expect(vehicleModels['Car/Truck']).toBeInstanceOf(Object);
    });

    it('should have Toyota models in Car/Truck', () => {
      const carModels = vehicleModels['Car/Truck'];
      expect(carModels).toHaveProperty('Toyota');
      expect(Array.isArray(carModels.Toyota)).toBe(true);
      expect(carModels.Toyota).toContain('Camry');
      expect(carModels.Toyota).toContain('Corolla');
      expect(carModels.Toyota).toContain('Prius');
      expect(carModels.Toyota).toContain('RAV4');
    });

    it('should have Honda models in Car/Truck', () => {
      const carModels = vehicleModels['Car/Truck'];
      expect(carModels).toHaveProperty('Honda');
      expect(Array.isArray(carModels.Honda)).toBe(true);
      expect(carModels.Honda).toContain('Civic');
      expect(carModels.Honda).toContain('Accord');
      expect(carModels.Honda).toContain('CR-V');
    });

    it('should have Ford models in Car/Truck', () => {
      const carModels = vehicleModels['Car/Truck'];
      expect(carModels).toHaveProperty('Ford');
      expect(Array.isArray(carModels.Ford)).toBe(true);
      expect(carModels.Ford).toContain('F-150');
      expect(carModels.Ford).toContain('Mustang');
      expect(carModels.Ford).toContain('Explorer');
    });

    it('should have BMW models in Car/Truck', () => {
      const carModels = vehicleModels['Car/Truck'];
      expect(carModels).toHaveProperty('BMW');
      expect(Array.isArray(carModels.BMW)).toBe(true);
      expect(carModels.BMW).toContain('3 Series');
      expect(carModels.BMW).toContain('5 Series');
      expect(carModels.BMW).toContain('X3');
      expect(carModels.BMW).toContain('X5');
    });

    it('should have comprehensive model data structure', () => {
      Object.entries(vehicleModels).forEach(([vehicleType, brands]) => {
        expect(typeof vehicleType).toBe('string');
        expect(typeof brands).toBe('object');
        
        Object.entries(brands).forEach(([brand, models]) => {
          expect(typeof brand).toBe('string');
          expect(Array.isArray(models)).toBe(true);
          
          models.forEach(model => {
            expect(typeof model).toBe('string');
            expect(model.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('data consistency', () => {
    it('should have consistent vehicle types across all data structures', () => {
      const typesInBrands = Object.keys(vehicleBrands);
      const typesInModels = Object.keys(vehicleModels);
      const displayValues = Object.values(vehicleKeyToDisplayMap);
      
      displayValues.forEach(displayValue => {
        expect(typesInBrands).toContain(displayValue);
      });
      
      // Car/Truck should be in models (as it's the main category with detailed model data)
      expect(typesInModels).toContain('Car/Truck');
    });

    it('should have brands in models that exist in brands data', () => {
      Object.entries(vehicleModels).forEach(([vehicleType, brandModels]) => {
        const availableBrands = vehicleBrands[vehicleType] || [];
        
        Object.keys(brandModels).forEach(brand => {
          if (brand !== 'Other') { // 'Other' may not be in the brands list
            expect(availableBrands).toContain(brand);
          }
        });
      });
    });
  });
}) 