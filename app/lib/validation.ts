import FuelEntry from '../models/FuelEntry';
import mongoose from 'mongoose';

/**
 * A utility to validate a FuelEntry without requiring a database connection
 * This helps test our model changes independently from actual database connectivity
 */
export function validateFuelEntry(fuelEntryData: Record<string, unknown>): { isValid: boolean; errors?: unknown } {
  try {
    // Create an instance of the model
    const fuelEntry = new FuelEntry(fuelEntryData);

    // Manually validate the model
    const validationError = fuelEntry.validateSync();

    if (validationError) {
      return {
        isValid: false,
        errors: validationError.errors
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      errors: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate decimal volume
 */
export function validateDecimalVolume(volume: number): boolean {
  // Check if volume is a number, greater than zero, and can be a decimal
  return typeof volume === 'number' && volume > 0;
}

/**
 * Validate zero cost
 */
export function validateZeroCost(cost: number): boolean {
  // Check if cost is a number and greater than or equal to zero
  return typeof cost === 'number' && cost >= 0;
}

/**
 * Test function to validate our changes
 */
export function testFuelEntryValidation(): {
  decimalVolumeWorks: boolean,
  zeroCostWorks: boolean,
  modelValidationWorks: boolean
} {
  // Create a minimal valid fuel entry
  const userId = new mongoose.Types.ObjectId().toString();
  const carId = new mongoose.Types.ObjectId().toString();

  const baseEntry = {
    userId,
    carId,
    fuelCompany: 'Test Company',
    fuelType: 'Test Fuel',
    mileage: 10000,
    distanceUnit: 'km',
    volume: 10.0,
    volumeUnit: 'l',
    cost: 50,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    paymentType: 'Cash'
  };

  // Test decimal volume
  const decimalVolumeEntry = { ...baseEntry, volume: 10.418 };
  const decimalVolumeValidation = validateFuelEntry(decimalVolumeEntry);
  const decimalVolumeWorks = decimalVolumeValidation.isValid &&
                             validateDecimalVolume(decimalVolumeEntry.volume);

  // Test zero cost
  const zeroCostEntry = { ...baseEntry, cost: 0 };
  const zeroCostValidation = validateFuelEntry(zeroCostEntry);
  const zeroCostWorks = zeroCostValidation.isValid &&
                        validateZeroCost(zeroCostEntry.cost);

  // Test model validation
  const modelValidationWorks = decimalVolumeValidation.isValid && zeroCostValidation.isValid;

  return {
    decimalVolumeWorks,
    zeroCostWorks,
    modelValidationWorks
  };
}
