import { currencies, distanceUnits, volumeUnits, tyrePressureUnits, paymentTypes, expenseCategories } from '../lib/vehicleData';

// Common interface for Car - used across multiple components
export interface Car {
  id: string;
  _id?: string;
  name: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  photo: string;
  dateAdded: string;
}

// Common interface for FuelEntry - used in fuel-related components
export interface FuelEntry {
  id: string;
  _id?: string;
  carId: string;
  fuelCompany: string;
  fuelType: string;
  mileage: number | string;
  distanceUnit: typeof distanceUnits[number];
  volume: number | string;
  volumeUnit: typeof volumeUnits[number];
  cost: number | string;
  currency: typeof currencies[number];
  date: string;
  time: string;
  location: string;
  partialFuelUp: boolean;
  paymentType: typeof paymentTypes[number];
  tyrePressure: number | string;
  tyrePressureUnit: typeof tyrePressureUnits[number];
  tags: string[];
  notes: string;
  images: string[];
}

// Base interface for financial entries (expenses and income)
interface BaseFinancialEntry {
  carId: string;
  category: typeof expenseCategories[number];
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
  images: string[];
}

// Common interface for ExpenseEntry - used in expense-related components
export interface ExpenseEntry extends BaseFinancialEntry {
  id: string;
  _id?: string;
}

// Common interface for IncomeEntry - used in income-related components
export interface IncomeEntry extends BaseFinancialEntry {
  id?: string;
  _id?: string;
}
