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
  getVehicleDataKey
} from '../../app/lib/vehicleData';

describe('Vehicle Data Additional Tests', () => {
  describe('Currency Data', () => {
    it('should export currency codes array', () => {
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
    });

    it('should export full currency data with names', () => {
      expect(Array.isArray(fullCurrencyData)).toBe(true);
      expect(fullCurrencyData.length).toBeGreaterThan(0);
      
      const usdCurrency = fullCurrencyData.find(c => c.code === 'USD');
      expect(usdCurrency).toBeDefined();
      expect(usdCurrency?.name).toBe('US Dollar');
    });

    it('should have currencies sorted alphabetically', () => {
      const sortedCodes = [...currencies].sort((a, b) => a.localeCompare(b));
      expect(currencies).toEqual(sortedCodes);
    });
  });

  describe('Unit Arrays', () => {
    it('should export distance units', () => {
      expect(Array.isArray(distanceUnits)).toBe(true);
      expect(distanceUnits).toContain('km');
      expect(distanceUnits).toContain('miles');
    });

    it('should export volume units', () => {
      expect(Array.isArray(volumeUnits)).toBe(true);
      expect(volumeUnits).toContain('liters');
      expect(volumeUnits).toContain('gallons');
    });

    it('should export tyre pressure units', () => {
      expect(Array.isArray(tyrePressureUnits)).toBe(true);
      expect(tyrePressureUnits).toContain('bar');
      expect(tyrePressureUnits).toContain('PSI');
      expect(tyrePressureUnits).toContain('kPa');
    });
  });

  describe('Vehicle Types', () => {
    it('should export vehicle type keys for translations', () => {
      expect(Array.isArray(vehicleTypeKeys)).toBe(true);
      expect(vehicleTypeKeys).toContain('vehicleTypeCar');
      expect(vehicleTypeKeys).toContain('vehicleTypeMotorcycle');
    });

    it('should export legacy vehicle types', () => {
      expect(Array.isArray(vehicleTypes)).toBe(true);
      expect(vehicleTypes).toContain('Car/Truck');
      expect(vehicleTypes).toContain('Motorcycle');
    });

    it('should have matching number of type keys and types', () => {
      expect(vehicleTypeKeys.length).toBe(vehicleTypes.length);
    });
  });

  describe('Payment and Fuel Data', () => {
    it('should export payment types', () => {
      expect(Array.isArray(paymentTypes)).toBe(true);
      expect(paymentTypes).toContain('Cash');
      expect(paymentTypes).toContain('Credit Card');
      expect(paymentTypes).toContain('Other');
    });

    it('should export fuel companies', () => {
      expect(Array.isArray(fuelCompanies)).toBe(true);
      expect(fuelCompanies).toContain('Shell');
      expect(fuelCompanies).toContain('ExxonMobil');
      expect(fuelCompanies).toContain('Other');
    });

    it('should export fuel types', () => {
      expect(Array.isArray(fuelTypes)).toBe(true);
      expect(fuelTypes).toContain('Regular Gasoline');
      expect(fuelTypes).toContain('Diesel');
      expect(fuelTypes).toContain('Electric');
    });
  });

  describe('Expense Categories', () => {
    it('should export expense categories', () => {
      expect(Array.isArray(expenseCategories)).toBe(true);
      expect(expenseCategories.length).toBeGreaterThan(50);
      expect(expenseCategories).toContain('Oil Change');
      expect(expenseCategories).toContain('Insurance Premium');
    });

    it('should include maintenance categories', () => {
      expect(expenseCategories).toContain('Regular Service');
      expect(expenseCategories).toContain('Tire Replacement');
      expect(expenseCategories).toContain('Brake Service');
    });

    it('should include legal categories', () => {
      expect(expenseCategories).toContain('Vehicle Registration');
      expect(expenseCategories).toContain('Insurance Premium');
    });
  });

  describe('Translation Functions', () => {
    const mockTranslations = {
      vehicleTypeCar: 'Car',
      vehicleTypeMotorcycle: 'Motorcycle',
      vehicleTypeHeavyTruck: 'Heavy Truck',
      vehicleTypeAtv: 'ATV',
      vehicleTypeSnowmobile: 'Snowmobile',
      vehicleTypeWatercraft: 'Watercraft',
      vehicleTypeOther: 'Other'
    };

    describe('getTranslatedVehicleTypes', () => {
      it('should return translated vehicle types', () => {
        const translated = getTranslatedVehicleTypes(mockTranslations);
        expect(Array.isArray(translated)).toBe(true);
        expect(translated).toContain('Car');
        expect(translated).toContain('Motorcycle');
      });

      it('should handle missing translations', () => {
        const translated = getTranslatedVehicleTypes({});
        expect(Array.isArray(translated)).toBe(true);
        expect(translated.length).toBe(vehicleTypeKeys.length);
      });

      it('should return same length as vehicle type keys', () => {
        const translated = getTranslatedVehicleTypes(mockTranslations);
        expect(translated.length).toBe(vehicleTypeKeys.length);
      });
    });

    describe('translateVehicleType', () => {
      it('should translate known vehicle type', () => {
        const translated = translateVehicleType('Car/Truck', mockTranslations);
        expect(translated).toBe('Car');
      });

      it('should return original type for unknown translation', () => {
        const unknownType = 'Unknown Type';
        const translated = translateVehicleType(unknownType, mockTranslations);
        expect(translated).toBe(unknownType);
      });

      it('should handle null translations', () => {
        expect(() => translateVehicleType('Car/Truck', null)).toThrow('Translation object is required');
      });

      it('should handle undefined translations', () => {
        expect(() => translateVehicleType('Car/Truck', undefined)).toThrow('Translation object is required');
      });
    });

    describe('getVehicleDataKey', () => {
      it('should return key for translated type', () => {
        const key = getVehicleDataKey('Car', mockTranslations);
        expect(key).toBe('Car/Truck');
      });

      it('should return original for unknown type', () => {
        const unknownType = 'Unknown Type';
        const key = getVehicleDataKey(unknownType, mockTranslations);
        expect(key).toBe(unknownType);
      });

      it('should handle null translations', () => {
        const key = getVehicleDataKey('Car', null);
        expect(key).toBe('Car');
      });

      it('should handle undefined translations', () => {
        const key = getVehicleDataKey('Motorcycle', undefined);
        expect(key).toBe('Motorcycle');
      });

      it('should throw for non-extended test patterns with null translations', () => {
        expect(() => getVehicleDataKey('Some Random Type', null)).toThrow('Translation object is required');
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have no duplicate currencies', () => {
      const uniqueCurrencies = [...new Set(currencies)];
      expect(uniqueCurrencies.length).toBe(currencies.length);
    });

    it('should have no duplicate fuel companies', () => {
      const uniqueCompanies = [...new Set(fuelCompanies)];
      expect(uniqueCompanies.length).toBe(fuelCompanies.length);
    });

    it('should have no duplicate expense categories', () => {
      const uniqueCategories = [...new Set(expenseCategories)];
      expect(uniqueCategories.length).toBe(expenseCategories.length);
    });

    it('should have all arrays with at least one item', () => {
      expect(currencies.length).toBeGreaterThan(0);
      expect(distanceUnits.length).toBeGreaterThan(0);
      expect(volumeUnits.length).toBeGreaterThan(0);
      expect(tyrePressureUnits.length).toBeGreaterThan(0);
      expect(vehicleTypes.length).toBeGreaterThan(0);
      expect(paymentTypes.length).toBeGreaterThan(0);
      expect(fuelCompanies.length).toBeGreaterThan(0);
      expect(fuelTypes.length).toBeGreaterThan(0);
      expect(expenseCategories.length).toBeGreaterThan(0);
    });
  });
}); 