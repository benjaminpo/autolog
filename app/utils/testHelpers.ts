// Centralized test data factories
export const createMockExpense = (overrides: any = {}) => ({
  id: 'expense1',
  amount: 100,
  currency: 'USD',
  date: '2023-10-15',
  notes: 'Test expense',
  ...overrides
});

export const createMockVehicle = (overrides: any = {}) => ({
  id: 'car1',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  licensePlate: 'ABC123',
  ...overrides
});
