import { currencies, distanceUnits, volumeUnits, tyrePressureUnits, paymentTypes } from './vehicleData';

interface Car {
  id: string;
  name: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  photo: string;
  dateAdded: string;
}

interface FuelEntry {
  id: string;
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
}

interface ExpenseEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
}

interface IncomeEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
}

// Helper function to escape CSV values
const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

// Helper function to get car name by ID
const getCarName = (carId: string, cars: Car[]): string => {
  const car = cars.find(c => c.id === carId || (c as unknown as Record<string, unknown>)._id === carId);
  return car ? car.name : 'Unknown Vehicle';
};

// Export fuel entries to CSV
export const exportFuelEntriesToCSV = (entries: FuelEntry[], cars: Car[], filename?: string): void => {
  if (entries.length === 0) {
    alert('No fuel entries to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Car Name',
    'Date',
    'Time',
    'Fuel Company',
    'Fuel Type',
    'Mileage',
    'Distance Unit',
    'Volume',
    'Volume Unit',
    'Cost',
    'Currency',
    'Location',
    'Partial Fuel Up',
    'Payment Type',
    'Tyre Pressure',
    'Tyre Pressure Unit',
    'Tags',
    'Notes'
  ];

  // Convert entries to CSV rows
  const csvRows = [
    headers.join(','),
    ...entries.map(entry => [
      escapeCSVValue(getCarName(entry.carId, cars)),
      escapeCSVValue(entry.date),
      escapeCSVValue(entry.time),
      escapeCSVValue(entry.fuelCompany),
      escapeCSVValue(entry.fuelType),
      escapeCSVValue(entry.mileage),
      escapeCSVValue(entry.distanceUnit),
      escapeCSVValue(entry.volume),
      escapeCSVValue(entry.volumeUnit),
      escapeCSVValue(entry.cost),
      escapeCSVValue(entry.currency),
      escapeCSVValue(entry.location),
      escapeCSVValue(entry.partialFuelUp ? 'Yes' : 'No'),
      escapeCSVValue(entry.paymentType),
      escapeCSVValue(entry.tyrePressure),
      escapeCSVValue(entry.tyrePressureUnit),
      escapeCSVValue(Array.isArray(entry.tags) ? entry.tags.join('; ') : entry.tags),
      escapeCSVValue(entry.notes)
    ].join(','))
  ];

  // Create and download the CSV file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `fuel_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export expense entries to CSV
export const exportExpenseEntriesToCSV = (entries: ExpenseEntry[], cars: Car[], filename?: string): void => {
  if (entries.length === 0) {
    alert('No expense entries to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Car Name',
    'Date',
    'Category',
    'Amount',
    'Currency',
    'Notes'
  ];

  // Convert entries to CSV rows
  const csvRows = [
    headers.join(','),
    ...entries.map(entry => [
      escapeCSVValue(getCarName(entry.carId, cars)),
      escapeCSVValue(entry.date),
      escapeCSVValue(entry.category),
      escapeCSVValue(entry.amount),
      escapeCSVValue(entry.currency),
      escapeCSVValue(entry.notes)
    ].join(','))
  ];

  // Create and download the CSV file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `expense_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export filtered entries based on date range or car selection
export const exportFilteredFuelEntries = (
  entries: FuelEntry[], 
  cars: Car[], 
  filters: {
    carId?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  filename?: string
): void => {
  let filteredEntries = [...entries];

  // Filter by car if specified
  if (filters.carId) {
    filteredEntries = filteredEntries.filter(entry => entry.carId === filters.carId);
  }

  // Filter by date range if specified
  if (filters.startDate) {
    filteredEntries = filteredEntries.filter(entry => entry.date >= filters.startDate!);
  }
  if (filters.endDate) {
    filteredEntries = filteredEntries.filter(entry => entry.date <= filters.endDate!);
  }

  exportFuelEntriesToCSV(filteredEntries, cars, filename);
};

export const exportFilteredExpenseEntries = (
  entries: ExpenseEntry[], 
  cars: Car[], 
  filters: {
    carId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  } = {},
  filename?: string
): void => {
  let filteredEntries = [...entries];

  // Filter by car if specified
  if (filters.carId) {
    filteredEntries = filteredEntries.filter(entry => entry.carId === filters.carId);
  }

  // Filter by category if specified
  if (filters.category) {
    filteredEntries = filteredEntries.filter(entry => entry.category === filters.category);
  }

  // Filter by date range if specified
  if (filters.startDate) {
    filteredEntries = filteredEntries.filter(entry => entry.date >= filters.startDate!);
  }
  if (filters.endDate) {
    filteredEntries = filteredEntries.filter(entry => entry.date <= filters.endDate!);
  }

  exportExpenseEntriesToCSV(filteredEntries, cars, filename);
};

// Export income entries to CSV
export const exportIncomeEntriesToCSV = (entries: IncomeEntry[], cars: Car[], filename?: string): void => {
  if (entries.length === 0) {
    alert('No income entries to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Car Name',
    'Date',
    'Category',
    'Amount',
    'Currency',
    'Notes'
  ];

  // Convert entries to CSV rows
  const csvRows = [
    headers.join(','),
    ...entries.map(entry => [
      escapeCSVValue(getCarName(entry.carId, cars)),
      escapeCSVValue(entry.date),
      escapeCSVValue(entry.category),
      escapeCSVValue(entry.amount),
      escapeCSVValue(entry.currency),
      escapeCSVValue(entry.notes)
    ].join(','))
  ];

  // Create and download the CSV file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `income_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportFilteredIncomeEntries = (
  entries: IncomeEntry[], 
  cars: Car[], 
  filters: {
    carId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  } = {},
  filename?: string
): void => {
  let filteredEntries = [...entries];

  // Filter by car if specified
  if (filters.carId) {
    filteredEntries = filteredEntries.filter(entry => entry.carId === filters.carId);
  }

  // Filter by category if specified
  if (filters.category) {
    filteredEntries = filteredEntries.filter(entry => entry.category === filters.category);
  }

  // Filter by date range if specified
  if (filters.startDate) {
    filteredEntries = filteredEntries.filter(entry => entry.date >= filters.startDate!);
  }
  if (filters.endDate) {
    filteredEntries = filteredEntries.filter(entry => entry.date <= filters.endDate!);
  }

  exportIncomeEntriesToCSV(filteredEntries, cars, filename);
}; 