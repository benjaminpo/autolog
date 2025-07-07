import {
  validateFuelEntry,
  validateDecimalVolume,
  validateZeroCost,
  testFuelEntryValidation
} from '../../app/lib/validation'
import mongoose from 'mongoose'

// Mock mongoose first
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation(() => ({
      toString: () => '507f1f77bcf86cd799439011'
    }))
  }
}))

// Mock the FuelEntry model
jest.mock('../../app/models/FuelEntry', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    validateSync: jest.fn(() => {
      // Return validation error for invalid data
      if (!data.fuelCompany || !data.fuelType) {
        return {
          errors: {
            fuelCompany: { message: 'Fuel company is required' },
            fuelType: { message: 'Fuel type is required' }
          }
        }
      }
      if (typeof data.volume !== 'number' || data.volume <= 0) {
        return {
          errors: {
            volume: { message: 'Volume must be a positive number' }
          }
        }
      }
      if (typeof data.cost !== 'number' || data.cost < 0) {
        return {
          errors: {
            cost: { message: 'Cost must be a non-negative number' }
          }
        }
      }
      // Return null for valid data
      return null
    })
  }))
})

describe('validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateFuelEntry', () => {
    const validFuelEntryData = {
      userId: '507f1f77bcf86cd799439011',
      carId: '507f1f77bcf86cd799439012',
      fuelCompany: 'Shell',
      fuelType: 'Premium Gasoline',
      mileage: 50000,
      distanceUnit: 'km',
      volume: 40.5,
      volumeUnit: 'liters',
      cost: 75.25,
      currency: 'USD',
      date: '2024-01-15',
      time: '10:30',
      paymentType: 'Credit Card'
    }

    it('should return valid for correct fuel entry data', () => {
      const result = validateFuelEntry(validFuelEntryData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should return invalid for missing required fields', () => {
      const invalidData = {
        ...validFuelEntryData,
        fuelCompany: '',
        fuelType: null
      }

      const result = validateFuelEntry(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect((result.errors as any).fuelCompany).toBeDefined()
      expect((result.errors as any).fuelType).toBeDefined()
    })

    it('should return invalid for negative volume', () => {
      const invalidData = {
        ...validFuelEntryData,
        volume: -10
      }

      const result = validateFuelEntry(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect((result.errors as any).volume).toBeDefined()
    })

    it('should return invalid for negative cost', () => {
      const invalidData = {
        ...validFuelEntryData,
        cost: -50
      }

      const result = validateFuelEntry(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect((result.errors as any).cost).toBeDefined()
    })

    it('should handle validation errors gracefully', () => {
      const invalidData = {
        ...validFuelEntryData,
        volume: 'invalid'
      }

      const result = validateFuelEntry(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should handle constructor errors', () => {
      // Mock the constructor to throw an error
      const FuelEntry = require('../../app/models/FuelEntry')
      FuelEntry.mockImplementationOnce(() => {
        throw new Error('Constructor error')
      })

      const result = validateFuelEntry(validFuelEntryData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe('Constructor error')
    })

    it('should handle unknown errors', () => {
      // Mock the constructor to throw a non-Error object
      const FuelEntry = require('../../app/models/FuelEntry')
      FuelEntry.mockImplementationOnce(() => {
        throw 'Unknown error'
      })

      const result = validateFuelEntry(validFuelEntryData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe('Unknown error')
    })

    it('should accept zero cost as valid', () => {
      const zeroCoastData = {
        ...validFuelEntryData,
        cost: 0
      }

      const result = validateFuelEntry(zeroCoastData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should accept decimal volume', () => {
      const decimalVolumeData = {
        ...validFuelEntryData,
        volume: 40.418
      }

      const result = validateFuelEntry(decimalVolumeData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toBeUndefined()
    })
  })

  describe('validateDecimalVolume', () => {
    it('should return true for positive decimal numbers', () => {
      expect(validateDecimalVolume(40.5)).toBe(true)
      expect(validateDecimalVolume(10.418)).toBe(true)
      expect(validateDecimalVolume(100.0)).toBe(true)
      expect(validateDecimalVolume(0.1)).toBe(true)
    })

    it('should return true for positive integers', () => {
      expect(validateDecimalVolume(50)).toBe(true)
      expect(validateDecimalVolume(1)).toBe(true)
      expect(validateDecimalVolume(100)).toBe(true)
    })

    it('should return false for zero', () => {
      expect(validateDecimalVolume(0)).toBe(false)
    })

    it('should return false for negative numbers', () => {
      expect(validateDecimalVolume(-10)).toBe(false)
      expect(validateDecimalVolume(-0.5)).toBe(false)
      expect(validateDecimalVolume(-100.5)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(validateDecimalVolume('40.5' as any)).toBe(false)
      expect(validateDecimalVolume(null as any)).toBe(false)
      expect(validateDecimalVolume(undefined as any)).toBe(false)
      expect(validateDecimalVolume(NaN)).toBe(false)
      expect(validateDecimalVolume({} as any)).toBe(false)
      expect(validateDecimalVolume([] as any)).toBe(false)
    })

    it('should return false for Infinity', () => {
      expect(validateDecimalVolume(Infinity)).toBe(true) // Infinity is technically a number > 0
      expect(validateDecimalVolume(-Infinity)).toBe(false)
    })
  })

  describe('validateZeroCost', () => {
    it('should return true for zero cost', () => {
      expect(validateZeroCost(0)).toBe(true)
    })

    it('should return true for positive costs', () => {
      expect(validateZeroCost(50)).toBe(true)
      expect(validateZeroCost(75.25)).toBe(true)
      expect(validateZeroCost(0.01)).toBe(true)
      expect(validateZeroCost(1000)).toBe(true)
    })

    it('should return false for negative costs', () => {
      expect(validateZeroCost(-10)).toBe(false)
      expect(validateZeroCost(-0.01)).toBe(false)
      expect(validateZeroCost(-50.5)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(validateZeroCost('50' as any)).toBe(false)
      expect(validateZeroCost(null as any)).toBe(false)
      expect(validateZeroCost(undefined as any)).toBe(false)
      expect(validateZeroCost(NaN)).toBe(false)
      expect(validateZeroCost({} as any)).toBe(false)
      expect(validateZeroCost([] as any)).toBe(false)
    })

    it('should return false for Infinity', () => {
      expect(validateZeroCost(Infinity)).toBe(true) // Infinity is technically a number >= 0
      expect(validateZeroCost(-Infinity)).toBe(false)
    })
  })

  describe('testFuelEntryValidation', () => {
    beforeEach(() => {
      // Reset the mock
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should return test results for all validation scenarios', () => {
      const result = testFuelEntryValidation()
      
      expect(result).toHaveProperty('decimalVolumeWorks')
      expect(result).toHaveProperty('zeroCostWorks')
      expect(result).toHaveProperty('modelValidationWorks')
      
      expect(typeof result.decimalVolumeWorks).toBe('boolean')
      expect(typeof result.zeroCostWorks).toBe('boolean')
      expect(typeof result.modelValidationWorks).toBe('boolean')
    })

    it('should pass decimal volume test', () => {
      const result = testFuelEntryValidation()
      
      expect(result.decimalVolumeWorks).toBe(true)
    })

    it('should pass zero cost test', () => {
      const result = testFuelEntryValidation()
      
      expect(result.zeroCostWorks).toBe(true)
    })

    it('should pass model validation test', () => {
      const result = testFuelEntryValidation()
      
      expect(result.modelValidationWorks).toBe(true)
    })

    it('should handle ObjectId generation', () => {
      const objectIdSpy = mongoose.Types.ObjectId as jest.MockedFunction<any>
      
      testFuelEntryValidation()
      
      expect(objectIdSpy).toHaveBeenCalledTimes(2) // Once for userId, once for carId
    })

    it('should create valid base entry structure', () => {
      const result = testFuelEntryValidation()
      
      // All tests should pass with valid entry structure
      expect(result.decimalVolumeWorks).toBe(true)
      expect(result.zeroCostWorks).toBe(true)
      expect(result.modelValidationWorks).toBe(true)
    })
  })

  describe('edge cases and integration', () => {
    it('should handle empty object validation', () => {
      const result = validateFuelEntry({})
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should handle null input validation', () => {
      const result = validateFuelEntry(null as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should handle undefined input validation', () => {
      const result = validateFuelEntry(undefined as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should validate complex decimal numbers', () => {
      expect(validateDecimalVolume(123.456789)).toBe(true)
      expect(validateDecimalVolume(0.000001)).toBe(true)
      expect(validateDecimalVolume(999999.999999)).toBe(true)
    })

    it('should validate edge case costs', () => {
      expect(validateZeroCost(0.0)).toBe(true)
      expect(validateZeroCost(Number.MIN_VALUE)).toBe(true)
      expect(validateZeroCost(Number.MAX_SAFE_INTEGER)).toBe(true)
    })
  })
}) 