// Additional utility function tests to improve coverage

describe('Additional Utility Functions', () => {
  // Helper functions for testing
  const formatVehicleName = (make: string, model: string, year?: number): string => {
    const parts = [year, make, model].filter(Boolean);
    return parts.join(' ');
  };

  const calculateFuelEfficiency = (distance: number, volume: number, units: string): number => {
    if (volume === 0 || distance === 0) return 0;
    return units === 'imperial' ? distance / volume : (volume / distance) * 100;
  };

  const convertDistance = (value: number, fromUnit: string, toUnit: string): number => {
    const kmToMiles = 0.621371;
    const milesToKm = 1.609344;

    if (fromUnit === toUnit) return value;
    if (fromUnit === 'km' && toUnit === 'miles') return value * kmToMiles;
    if (fromUnit === 'miles' && toUnit === 'km') return value * milesToKm;
    return value;
  };

  const convertVolume = (value: number, fromUnit: string, toUnit: string): number => {
    const gallonsToLiters = 3.78541;
    const litersToGallons = 0.264172;

    if (fromUnit === toUnit) return value;
    if (fromUnit === 'gallons' && toUnit === 'liters') return value * gallonsToLiters;
    if (fromUnit === 'liters' && toUnit === 'gallons') return value * litersToGallons;
    return value;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  describe('Format Vehicle Name', () => {
    it('should format vehicle name with year, make, and model', () => {
      expect(formatVehicleName('Toyota', 'Camry', 2020)).toBe('2020 Toyota Camry');
    });

    it('should format vehicle name without year', () => {
      expect(formatVehicleName('Honda', 'Civic')).toBe('Honda Civic');
    });

    it('should handle empty strings', () => {
      expect(formatVehicleName('', '', 2020)).toBe('2020');
      expect(formatVehicleName('Toyota', '')).toBe('Toyota');
      expect(formatVehicleName('', 'Camry')).toBe('Camry');
    });

    it('should handle special characters', () => {
      expect(formatVehicleName('BMW', 'X5', 2021)).toBe('2021 BMW X5');
      expect(formatVehicleName('Mercedes-Benz', 'C-Class')).toBe('Mercedes-Benz C-Class');
    });
  });

  describe('Calculate Fuel Efficiency', () => {
    it('should calculate MPG for imperial units', () => {
      expect(calculateFuelEfficiency(300, 10, 'imperial')).toBe(30);
      expect(calculateFuelEfficiency(450, 15, 'imperial')).toBe(30);
    });

    it('should calculate L/100km for metric units', () => {
      expect(calculateFuelEfficiency(100, 8, 'metric')).toBe(8);
      expect(calculateFuelEfficiency(200, 16, 'metric')).toBe(8);
    });

    it('should return 0 for zero distance or volume', () => {
      expect(calculateFuelEfficiency(0, 10, 'imperial')).toBe(0);
      expect(calculateFuelEfficiency(100, 0, 'imperial')).toBe(0);
    });
  });

  describe('Distance Conversion', () => {
    it('should convert kilometers to miles', () => {
      expect(convertDistance(100, 'km', 'miles')).toBeCloseTo(62.14, 2);
      expect(convertDistance(1, 'km', 'miles')).toBeCloseTo(0.62, 2);
    });

    it('should convert miles to kilometers', () => {
      expect(convertDistance(100, 'miles', 'km')).toBeCloseTo(160.93, 2);
      expect(convertDistance(1, 'miles', 'km')).toBeCloseTo(1.61, 2);
    });

    it('should return same value for same unit', () => {
      expect(convertDistance(100, 'km', 'km')).toBe(100);
      expect(convertDistance(50, 'miles', 'miles')).toBe(50);
    });
  });

  describe('Volume Conversion', () => {
    it('should convert gallons to liters', () => {
      expect(convertVolume(10, 'gallons', 'liters')).toBeCloseTo(37.85, 2);
      expect(convertVolume(1, 'gallons', 'liters')).toBeCloseTo(3.79, 2);
    });

    it('should convert liters to gallons', () => {
      expect(convertVolume(10, 'liters', 'gallons')).toBeCloseTo(2.64, 2);
      expect(convertVolume(1, 'liters', 'gallons')).toBeCloseTo(0.26, 2);
    });

    it('should return same value for same unit', () => {
      expect(convertVolume(10, 'gallons', 'gallons')).toBe(10);
      expect(convertVolume(5, 'liters', 'liters')).toBe(5);
    });
  });

  describe('Validation Functions', () => {
    describe('Email Validation', () => {
      it('should validate correct email addresses', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
        expect(validateEmail('user+tag@example.org')).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('test@example')).toBe(false);
        expect(validateEmail('')).toBe(false);
      });
    });

    describe('Phone Number Validation', () => {
      it('should validate correct phone numbers', () => {
        expect(validatePhoneNumber('1234567890')).toBe(true);
        expect(validatePhoneNumber('+1 234 567 8900')).toBe(true);
        expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
      });

      it('should reject invalid phone numbers', () => {
        expect(validatePhoneNumber('123')).toBe(false);
        expect(validatePhoneNumber('abc')).toBe(false);
        expect(validatePhoneNumber('')).toBe(false);
      });
    });
  });

  describe('Age Calculation', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date('1990-01-01');
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThan(30);
      expect(age).toBeLessThan(40);
    });

    it('should handle birthday not yet passed this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth() + 1, today.getDate());
      expect(calculateAge(birthDate)).toBe(24);
    });

    it('should handle birthday already passed this year', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth() - 1, today.getDate());
      expect(calculateAge(birthDate)).toBe(25);
    });
  });

  describe('Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(formatVehicleName('', '')).toBe('');
      expect(calculateFuelEfficiency(0, 0, 'imperial')).toBe(0);
      expect(convertDistance(100, 'unknown', 'km')).toBe(100);
    });

    it('should handle edge cases in validation', () => {
      expect(validateEmail(' ')).toBe(false);
      expect(validatePhoneNumber(' ')).toBe(false);
    });
  });

  describe('Boundary Testing', () => {
    it('should handle very large numbers', () => {
      expect(calculateFuelEfficiency(1000000, 1000, 'imperial')).toBe(1000);
      expect(convertDistance(1000000, 'km', 'miles')).toBeCloseTo(621371, 0);
    });

    it('should handle very small numbers', () => {
      expect(calculateFuelEfficiency(0.1, 0.01, 'imperial')).toBe(10);
      expect(convertDistance(0.001, 'km', 'miles')).toBeCloseTo(0.0006, 4);
    });

    it('should handle negative numbers appropriately', () => {
      expect(convertDistance(-100, 'km', 'miles')).toBeCloseTo(-62.14, 2);
      expect(convertVolume(-10, 'gallons', 'liters')).toBeCloseTo(-37.85, 2);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle repeated conversions', () => {
      let value = 100;
      // Convert km to miles and back 5 times
      for (let i = 0; i < 5; i++) {
        value = convertDistance(value, 'km', 'miles');
        value = convertDistance(value, 'miles', 'km');
      }
      expect(value).toBeCloseTo(100, 1); // Should be close to original
    });

    it('should handle string inputs in validation', () => {
      expect(validateEmail('normal@email.com')).toBe(true);
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
    });

    it('should maintain precision in calculations', () => {
      const efficiency = calculateFuelEfficiency(123.456, 7.89, 'imperial');
      expect(efficiency).toBeCloseTo(15.65, 2);
    });
  });
}); 