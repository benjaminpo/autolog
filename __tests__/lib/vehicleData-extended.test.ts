import {
  currencies,
  fullCurrencyData,
  distanceUnits,
  volumeUnits,
  tyrePressureUnits,
  vehicleTypeKeys,
  vehicleTypes,
  paymentTypes,
  fuelCompanies,
  fuelTypes,
  expenseCategories,
  getTranslatedVehicleTypes,
  translateVehicleType,
  getVehicleDataKey,
  vehicleKeyToDisplayMap,
  vehicleDisplayToKeyMap,
  vehicleBrands,
  vehicleModels
} from '../../app/lib/vehicleData';

describe('Vehicle Data Module Extended Tests', () => {
  describe('Currency Data', () => {
    it('should export currencies as array', () => {
      expect(currencies).toBeDefined();
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
    });

    it('should include major currencies', () => {
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
      expect(currencies).toContain('JPY');
    });

    it('should export full currency data', () => {
      expect(fullCurrencyData).toBeDefined();
      expect(Array.isArray(fullCurrencyData)).toBe(true);
      expect(fullCurrencyData.length).toBeGreaterThan(0);
    });

    it('should have currency objects with code and name', () => {
      const usdCurrency = fullCurrencyData.find(c => c.code === 'USD');
      expect(usdCurrency).toBeDefined();
      expect(usdCurrency?.name).toBeDefined();
      expect(typeof usdCurrency?.name).toBe('string');
    });

    it('should have no duplicate currency codes', () => {
      const codes = fullCurrencyData.map(c => c.code);
      const uniqueCodes = [...new Set(codes)];
      expect(uniqueCodes.length).toBe(codes.length);
    });

    it('should have currencies array match fullCurrencyData codes', () => {
      const codes = fullCurrencyData.map(c => c.code);
      expect(currencies).toEqual(codes);
    });
  });

  describe('Distance Units', () => {
    it('should export distance units', () => {
      expect(distanceUnits).toBeDefined();
      expect(Array.isArray(distanceUnits)).toBe(true);
      expect(distanceUnits.length).toBeGreaterThan(0);
    });

    it('should include common distance units', () => {
      expect(distanceUnits).toContain('km');
      expect(distanceUnits).toContain('miles');
    });

    it('should have no duplicate distance units', () => {
      const uniqueUnits = [...new Set(distanceUnits)];
      expect(uniqueUnits.length).toBe(distanceUnits.length);
    });
  });

  describe('Volume Units', () => {
    it('should export volume units', () => {
      expect(volumeUnits).toBeDefined();
      expect(Array.isArray(volumeUnits)).toBe(true);
      expect(volumeUnits.length).toBeGreaterThan(0);
    });

    it('should include common volume units', () => {
      expect(volumeUnits).toContain('liters');
      expect(volumeUnits).toContain('gallons (US)');
      expect(volumeUnits).toContain('gallons (UK)');
    });

    it('should have no duplicate volume units', () => {
      const uniqueUnits = [...new Set(volumeUnits)];
      expect(uniqueUnits.length).toBe(volumeUnits.length);
    });
  });

  describe('Tyre Pressure Units', () => {
    it('should export tyre pressure units', () => {
      expect(tyrePressureUnits).toBeDefined();
      expect(Array.isArray(tyrePressureUnits)).toBe(true);
      expect(tyrePressureUnits.length).toBeGreaterThan(0);
    });

    it('should include common pressure units', () => {
      expect(tyrePressureUnits).toContain('PSI');
      expect(tyrePressureUnits).toContain('bar');
      expect(tyrePressureUnits).toContain('kPa');
    });

    it('should have no duplicate pressure units', () => {
      const uniqueUnits = [...new Set(tyrePressureUnits)];
      expect(uniqueUnits.length).toBe(tyrePressureUnits.length);
    });
  });

  describe('Vehicle Types', () => {
    it('should export vehicle type keys', () => {
      expect(vehicleTypeKeys).toBeDefined();
      expect(Array.isArray(vehicleTypeKeys)).toBe(true);
      expect(vehicleTypeKeys.length).toBeGreaterThan(0);
    });

    it('should export vehicle types', () => {
      expect(vehicleTypes).toBeDefined();
      expect(Array.isArray(vehicleTypes)).toBe(true);
      expect(vehicleTypes.length).toBeGreaterThan(0);
    });

    it('should include common vehicle types', () => {
      expect(vehicleTypes).toContain('Car/Truck');
      expect(vehicleTypes).toContain('Motorcycle');
      expect(vehicleTypes).toContain('Other');
    });

    it('should have matching key and type arrays length', () => {
      expect(vehicleTypeKeys.length).toBe(vehicleTypes.length);
    });

    it('should have no duplicate vehicle types', () => {
      const uniqueTypes = [...new Set(vehicleTypes)];
      expect(uniqueTypes.length).toBe(vehicleTypes.length);
    });

    it('should have no duplicate vehicle type keys', () => {
      const uniqueKeys = [...new Set(vehicleTypeKeys)];
      expect(uniqueKeys.length).toBe(vehicleTypeKeys.length);
    });
  });

  describe('Payment Types', () => {
    it('should export payment types', () => {
      expect(paymentTypes).toBeDefined();
      expect(Array.isArray(paymentTypes)).toBe(true);
      expect(paymentTypes.length).toBeGreaterThan(0);
    });

    it('should include common payment types', () => {
      expect(paymentTypes).toContain('Cash');
      expect(paymentTypes).toContain('Credit Card');
      expect(paymentTypes).toContain('Other');
    });

    it('should have no duplicate payment types', () => {
      const uniqueTypes = [...new Set(paymentTypes)];
      expect(uniqueTypes.length).toBe(paymentTypes.length);
    });
  });

  describe('Fuel Companies', () => {
    it('should export fuel companies', () => {
      expect(fuelCompanies).toBeDefined();
      expect(Array.isArray(fuelCompanies)).toBe(true);
      expect(fuelCompanies.length).toBeGreaterThan(0);
    });

    it('should include major fuel companies', () => {
      expect(fuelCompanies).toContain('Shell');
      expect(fuelCompanies).toContain('ExxonMobil');
      expect(fuelCompanies).toContain('BP');
      expect(fuelCompanies).toContain('Other');
    });

    it('should have no duplicate fuel companies', () => {
      const uniqueCompanies = [...new Set(fuelCompanies)];
      expect(uniqueCompanies.length).toBe(fuelCompanies.length);
    });
  });

  describe('Fuel Types', () => {
    it('should export fuel types', () => {
      expect(fuelTypes).toBeDefined();
      expect(Array.isArray(fuelTypes)).toBe(true);
      expect(fuelTypes.length).toBeGreaterThan(0);
    });

    it('should include common fuel types', () => {
      expect(fuelTypes).toContain('Regular Gasoline');
      expect(fuelTypes).toContain('Premium Gasoline');
      expect(fuelTypes).toContain('Diesel');
      expect(fuelTypes).toContain('Electric');
      expect(fuelTypes).toContain('Other');
    });

    it('should have no duplicate fuel types', () => {
      const uniqueTypes = [...new Set(fuelTypes)];
      expect(uniqueTypes.length).toBe(fuelTypes.length);
    });
  });

  describe('Expense Categories', () => {
    it('should export expense categories', () => {
      expect(expenseCategories).toBeDefined();
      expect(Array.isArray(expenseCategories)).toBe(true);
      expect(expenseCategories.length).toBeGreaterThan(0);
    });

    it('should include maintenance categories', () => {
      expect(expenseCategories).toContain('Oil Change');
      expect(expenseCategories).toContain('Tire Replacement');
      expect(expenseCategories).toContain('Brake Service');
    });

    it('should include legal categories', () => {
      expect(expenseCategories).toContain('Vehicle Registration');
      expect(expenseCategories).toContain('Insurance Premium');
    });

    it('should have no duplicate expense categories', () => {
      const uniqueCategories = [...new Set(expenseCategories)];
      expect(uniqueCategories.length).toBe(expenseCategories.length);
    });
  });

  describe('Translation Functions', () => {
    const mockTranslations = {
      vehicleTypeCar: 'Car',
      vehicleTypeMotorcycle: 'Motorcycle',
      vehicleTypeTruck: 'Truck'
    };

    describe('getTranslatedVehicleTypes', () => {
      it('should return translated vehicle types', () => {
        const result = getTranslatedVehicleTypes(mockTranslations);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(vehicleTypeKeys.length);
      });

      it('should handle missing translations gracefully', () => {
        const incompleteTranslations = { vehicleTypeCar: 'Car' };
        const result = getTranslatedVehicleTypes(incompleteTranslations);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(vehicleTypeKeys.length);
      });

      it('should handle empty translations object', () => {
        const result = getTranslatedVehicleTypes({});
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(vehicleTypeKeys.length);
      });

      it('should return original keys when no translations available', () => {
        const result = getTranslatedVehicleTypes({});
        expect(result).toEqual(vehicleTypeKeys);
      });

      it('should mix translated and untranslated values', () => {
        const partialTranslations = { vehicleTypeCar: 'Automobile' };
        const result = getTranslatedVehicleTypes(partialTranslations);
        expect(result[0]).toBe('Automobile'); // Assuming vehicleTypeCar is first
        // Other items should be original keys
        expect(result.length).toBe(vehicleTypeKeys.length);
      });
    });

    describe('translateVehicleType', () => {
      it('should translate vehicle types from display to translation', () => {
        // This function translates from display value to translated value
        const result = translateVehicleType('Car/Truck', mockTranslations);
        expect(result).toBe('Car'); // Should find 'vehicleTypeCar' key and return 'Car'
      });

      it('should return original value for unknown display types', () => {
        const result = translateVehicleType('Unknown Type', mockTranslations);
        expect(result).toBe('Unknown Type');
      });

      it('should handle non-string translation values', () => {
        const invalidTranslations = { vehicleTypeCar: 123 };
        const result = translateVehicleType('Car/Truck', invalidTranslations);
        expect(result).toBe('Car/Truck'); // Should fallback to original
      });

      it('should handle empty input', () => {
        const result = translateVehicleType('', mockTranslations);
        expect(result).toBe('');
      });

      it('should handle null translation object', () => {
        const result = translateVehicleType('Car/Truck', null as any);
        expect(result).toBe('Car/Truck');
      });

      it('should handle undefined translation object', () => {
        const result = translateVehicleType('Car/Truck', undefined as any);
        expect(result).toBe('Car/Truck');
      });
    });

    describe('getVehicleDataKey', () => {
      it('should return display key for translated type', () => {
        const result = getVehicleDataKey('Car', mockTranslations);
        expect(result).toBe('Car/Truck'); // Should find vehicleTypeCar -> Car/Truck mapping
      });

      it('should return original value for unknown translated type', () => {
        const result = getVehicleDataKey('Unknown Type', mockTranslations);
        expect(result).toBe('Unknown Type');
      });

      it('should handle empty input', () => {
        const result = getVehicleDataKey('', mockTranslations);
        expect(result).toBe('');
      });

      it('should handle case sensitivity', () => {
        const result = getVehicleDataKey('car', mockTranslations);
        expect(result).toBe('car'); // Should return original if no exact match
      });

      it('should handle null translation object', () => {
        const result = getVehicleDataKey('Car', null as any);
        expect(result).toBe('Car');
      });

      it('should handle empty translation object', () => {
        const result = getVehicleDataKey('Car', {});
        expect(result).toBe('Car');
      });
    });
  });

  describe('Vehicle Mapping Objects', () => {
    describe('vehicleKeyToDisplayMap', () => {
      it('should be an object with key-to-display mappings', () => {
        expect(typeof vehicleKeyToDisplayMap).toBe('object');
        expect(vehicleKeyToDisplayMap).not.toBeNull();
      });

      it('should have vehicleTypeCar mapping', () => {
        expect(vehicleKeyToDisplayMap.vehicleTypeCar).toBe('Car/Truck');
      });

      it('should have vehicleTypeMotorcycle mapping', () => {
        expect(vehicleKeyToDisplayMap.vehicleTypeMotorcycle).toBe('Motorcycle');
      });

      it('should have all vehicle type keys mapped', () => {
        const mappedKeys = Object.keys(vehicleKeyToDisplayMap);
        vehicleTypeKeys.forEach(key => {
          expect(mappedKeys).toContain(key);
        });
      });

      it('should have no duplicate display values', () => {
        const displayValues = Object.values(vehicleKeyToDisplayMap);
        const uniqueValues = [...new Set(displayValues)];
        expect(uniqueValues.length).toBe(displayValues.length);
      });
    });

    describe('vehicleDisplayToKeyMap', () => {
      it('should be an object with display-to-key mappings', () => {
        expect(typeof vehicleDisplayToKeyMap).toBe('object');
        expect(vehicleDisplayToKeyMap).not.toBeNull();
      });

      it('should have Car/Truck mapping', () => {
        expect(vehicleDisplayToKeyMap['Car/Truck']).toBe('vehicleTypeCar');
      });

      it('should have Motorcycle mapping', () => {
        expect(vehicleDisplayToKeyMap['Motorcycle']).toBe('vehicleTypeMotorcycle');
      });

      it('should be inverse of vehicleKeyToDisplayMap', () => {
        Object.entries(vehicleKeyToDisplayMap).forEach(([key, display]) => {
          expect(vehicleDisplayToKeyMap[display]).toBe(key);
        });
      });

      it('should have all vehicle types mapped', () => {
        const mappedDisplays = Object.keys(vehicleDisplayToKeyMap);
        vehicleTypes.forEach(type => {
          expect(mappedDisplays).toContain(type);
        });
      });
    });
  });

  describe('Vehicle Brands', () => {
    it('should be an object with vehicle type to brands mapping', () => {
      expect(typeof vehicleBrands).toBe('object');
      expect(vehicleBrands).not.toBeNull();
    });

    it('should have Car/Truck brands', () => {
      expect(Array.isArray(vehicleBrands['Car/Truck'])).toBe(true);
      expect(vehicleBrands['Car/Truck'].length).toBeGreaterThan(0);
    });

    it('should include major car brands', () => {
      const carBrands = vehicleBrands['Car/Truck'];
      expect(carBrands).toContain('Toyota');
      expect(carBrands).toContain('Honda');
      expect(carBrands).toContain('Ford');
      expect(carBrands).toContain('BMW');
    });

    it('should have Motorcycle brands', () => {
      expect(Array.isArray(vehicleBrands['Motorcycle'])).toBe(true);
      expect(vehicleBrands['Motorcycle'].length).toBeGreaterThan(0);
    });

    it('should include major motorcycle brands', () => {
      const motorcycleBrands = vehicleBrands['Motorcycle'];
      expect(motorcycleBrands).toContain('Honda');
      expect(motorcycleBrands).toContain('Yamaha');
      expect(motorcycleBrands).toContain('Harley-Davidson');
    });

    it('should have no duplicate brands within each category', () => {
      Object.values(vehicleBrands).forEach(brands => {
        const uniqueBrands = [...new Set(brands)];
        expect(uniqueBrands.length).toBe(brands.length);
      });
    });

    it('should have brands for all vehicle types', () => {
      vehicleTypes.forEach(type => {
        expect(vehicleBrands[type]).toBeDefined();
        expect(Array.isArray(vehicleBrands[type])).toBe(true);
      });
    });
  });

  describe('Vehicle Models', () => {
    it('should be an object with vehicle type to brand-model mapping', () => {
      expect(typeof vehicleModels).toBe('object');
      expect(vehicleModels).not.toBeNull();
    });

    it('should have Car/Truck models', () => {
      expect(typeof vehicleModels['Car/Truck']).toBe('object');
      expect(vehicleModels['Car/Truck']).not.toBeNull();
    });

    it('should have Toyota models', () => {
      const toyotaModels = vehicleModels['Car/Truck']?.['Toyota'];
      expect(Array.isArray(toyotaModels)).toBe(true);
      expect(toyotaModels.length).toBeGreaterThan(0);
    });

    it('should include popular Toyota models', () => {
      const toyotaModels = vehicleModels['Car/Truck']?.['Toyota'];
      expect(toyotaModels).toContain('Camry');
      expect(toyotaModels).toContain('Corolla');
      expect(toyotaModels).toContain('Prius');
    });

    it('should have Honda models', () => {
      const hondaModels = vehicleModels['Car/Truck']?.['Honda'];
      expect(Array.isArray(hondaModels)).toBe(true);
      expect(hondaModels.length).toBeGreaterThan(0);
    });

    it('should include popular Honda models', () => {
      const hondaModels = vehicleModels['Car/Truck']?.['Honda'];
      expect(hondaModels).toContain('Civic');
      expect(hondaModels).toContain('Accord');
      expect(hondaModels).toContain('CR-V');
    });

    it('should have no duplicate models within each brand', () => {
      Object.values(vehicleModels).forEach(brandModels => {
        Object.values(brandModels).forEach(models => {
          const uniqueModels = [...new Set(models)];
          expect(uniqueModels.length).toBe(models.length);
        });
      });
    });

    it('should have models for major brands', () => {
      const carBrands = vehicleBrands['Car/Truck'];
      const majorBrands = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz'];
      
      majorBrands.forEach(brand => {
        if (carBrands.includes(brand)) {
          expect(vehicleModels['Car/Truck'][brand]).toBeDefined();
          expect(Array.isArray(vehicleModels['Car/Truck'][brand])).toBe(true);
        }
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have no empty strings in arrays', () => {
      const arrays = [
        currencies,
        distanceUnits,
        volumeUnits,
        tyrePressureUnits,
        vehicleTypeKeys,
        vehicleTypes,
        paymentTypes,
        fuelCompanies,
        fuelTypes,
        expenseCategories
      ];

      arrays.forEach(array => {
        array.forEach(item => {
          expect(typeof item).toBe('string');
          expect(item.trim()).not.toBe('');
        });
      });
    });

    it('should have consistent vehicle type counts', () => {
      expect(vehicleTypeKeys.length).toBe(vehicleTypes.length);
    });

    it('should have all required data exports', () => {
      const requiredExports = [
        currencies,
        fullCurrencyData,
        distanceUnits,
        volumeUnits,
        tyrePressureUnits,
        vehicleTypeKeys,
        vehicleTypes,
        paymentTypes,
        fuelCompanies,
        fuelTypes,
        expenseCategories
      ];

      requiredExports.forEach(exportedData => {
        expect(exportedData).toBeDefined();
        expect(Array.isArray(exportedData)).toBe(true);
      });
    });

    it('should have consistent mapping between keys and display values', () => {
      // Check that all keys in vehicleKeyToDisplayMap have corresponding entries in vehicleDisplayToKeyMap
      Object.entries(vehicleKeyToDisplayMap).forEach(([key, display]) => {
        expect(vehicleDisplayToKeyMap[display]).toBe(key);
      });

      // Check reverse mapping
      Object.entries(vehicleDisplayToKeyMap).forEach(([display, key]) => {
        expect(vehicleKeyToDisplayMap[key]).toBe(display);
      });
    });

    it('should have all vehicle types covered in mapping objects', () => {
      const mappedTypes = Object.keys(vehicleDisplayToKeyMap);
      vehicleTypes.forEach(type => {
        expect(mappedTypes).toContain(type);
      });
    });

    it('should have all vehicle type keys covered in mapping objects', () => {
      const mappedKeys = Object.keys(vehicleKeyToDisplayMap);
      vehicleTypeKeys.forEach(key => {
        expect(mappedKeys).toContain(key);
      });
    });
  });
}); 