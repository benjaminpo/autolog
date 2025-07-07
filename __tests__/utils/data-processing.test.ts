// Data processing utility tests
describe('Data Processing Utilities', () => {
  // Mock data structures
  interface VehicleRecord {
    id: string;
    name: string;
    type: 'car' | 'motorcycle' | 'truck';
    year: number;
    fuelEfficiency?: number;
    status: 'active' | 'inactive';
    purchaseDate: Date;
    value: number;
  }

  interface ExpenseRecord {
    id: string;
    vehicleId: string;
    category: 'fuel' | 'maintenance' | 'insurance' | 'other';
    amount: number;
    date: Date;
    description: string;
    recurring: boolean;
  }

  // Sample data
  const mockVehicles: VehicleRecord[] = [
    {
      id: 'v1',
      name: 'Toyota Camry',
      type: 'car',
      year: 2020,
      fuelEfficiency: 28.5,
      status: 'active',
      purchaseDate: new Date('2020-01-15'),
      value: 25000
    },
    {
      id: 'v2',
      name: 'Honda Civic',
      type: 'car',
      year: 2018,
      fuelEfficiency: 32.0,
      status: 'active',
      purchaseDate: new Date('2018-03-20'),
      value: 18000
    },
    {
      id: 'v3',
      name: 'Ford F-150',
      type: 'truck',
      year: 2019,
      fuelEfficiency: 20.5,
      status: 'inactive',
      purchaseDate: new Date('2019-07-10'),
      value: 35000
    },
    {
      id: 'v4',
      name: 'Yamaha R6',
      type: 'motorcycle',
      year: 2021,
      fuelEfficiency: 45.0,
      status: 'active',
      purchaseDate: new Date('2021-05-05'),
      value: 12000
    }
  ];

  const mockExpenses: ExpenseRecord[] = [
    {
      id: 'e1',
      vehicleId: 'v1',
      category: 'fuel',
      amount: 45.50,
      date: new Date('2023-10-01'),
      description: 'Gas station fill-up',
      recurring: false
    },
    {
      id: 'e2',
      vehicleId: 'v1',
      category: 'maintenance',
      amount: 150.00,
      date: new Date('2023-09-15'),
      description: 'Oil change',
      recurring: true
    },
    {
      id: 'e3',
      vehicleId: 'v2',
      category: 'insurance',
      amount: 120.00,
      date: new Date('2023-10-01'),
      description: 'Monthly premium',
      recurring: true
    },
    {
      id: 'e4',
      vehicleId: 'v3',
      category: 'fuel',
      amount: 85.75,
      date: new Date('2023-09-28'),
      description: 'Diesel fill-up',
      recurring: false
    }
  ];

  describe('Array Operations', () => {
    it('should sort vehicles by year', () => {
      const sorted = [...mockVehicles].sort((a, b) => a.year - b.year);
      expect(sorted[0].year).toBe(2018);
      expect(sorted[1].year).toBe(2019);
      expect(sorted[2].year).toBe(2020);
    });

    it('should filter active vehicles', () => {
      const active = mockVehicles.filter(v => v.status === 'active');
      expect(active).toHaveLength(3);
    });

    it('should calculate total value', () => {
      const total = mockVehicles.reduce((sum, v) => sum + v.value, 0);
      expect(total).toBe(90000);
    });
  });

  describe('Data Aggregation', () => {
    it('should group expenses by category', () => {
      const grouped = mockExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);
      
      expect(grouped.fuel).toBe(131.25);
      expect(grouped.maintenance).toBe(150.00);
    });

    it('should calculate average fuel efficiency', () => {
      const vehicles = mockVehicles.filter(v => v.fuelEfficiency);
      const avg = vehicles.reduce((sum, v) => sum + v.fuelEfficiency!, 0) / vehicles.length;
      expect(avg).toBeCloseTo(31.5, 0);
    });
  });

  describe('Data Validation', () => {
    it('should validate positive amounts', () => {
      const isValidAmount = (amount: number) => amount > 0 && Number.isFinite(amount);
      
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-50)).toBe(false);
      expect(isValidAmount(NaN)).toBe(false);
    });

    it('should validate required fields', () => {
      const isValidVehicle = (v: Partial<VehicleRecord>) => 
        !!(v.id && v.name && v.type && v.year);
      
      expect(isValidVehicle(mockVehicles[0])).toBe(true);
      expect(isValidVehicle({ id: 'v1' })).toBe(false);
    });
  });

  describe('Search and Query', () => {
    it('should search by name', () => {
      const results = mockVehicles.filter(v => 
        v.name.toLowerCase().includes('honda')
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Honda Civic');
    });

    it('should filter by value range', () => {
      const inRange = mockVehicles.filter(v => v.value >= 20000 && v.value <= 30000);
      expect(inRange).toHaveLength(1);
      expect(inRange[0].name).toBe('Toyota Camry');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty arrays safely', () => {
      const safeAverage = (values: number[]) => 
        values.length === 0 ? 0 : values.reduce((sum, val) => sum + val, 0) / values.length;
      
      expect(safeAverage([])).toBe(0);
      expect(safeAverage([10, 20])).toBe(15);
    });

    it('should handle null/undefined values', () => {
      const safeSum = (values: (number | null | undefined)[]) =>
        values.filter((val): val is number => typeof val === 'number').reduce((sum, val) => sum + val, 0);
      
      expect(safeSum([1, null, 2, undefined, 3])).toBe(6);
    });
  });

  describe('Array Sorting Functions', () => {
    it('should sort vehicles by name alphabetically', () => {
      const sortByName = (a: VehicleRecord, b: VehicleRecord) => a.name.localeCompare(b.name);
      const sorted = [...mockVehicles].sort(sortByName);
      
      expect(sorted[0].name).toBe('Ford F-150');
      expect(sorted[1].name).toBe('Honda Civic');
      expect(sorted[2].name).toBe('Toyota Camry');
      expect(sorted[3].name).toBe('Yamaha R6');
    });

    it('should sort expenses by amount descending', () => {
      const sortByAmountDesc = (a: ExpenseRecord, b: ExpenseRecord) => b.amount - a.amount;
      const sorted = [...mockExpenses].sort(sortByAmountDesc);
      
      expect(sorted[0].amount).toBe(150.00);
      expect(sorted[1].amount).toBe(120.00);
      expect(sorted[2].amount).toBe(85.75);
      expect(sorted[3].amount).toBe(45.50);
    });

    it('should sort by multiple criteria (type, then year)', () => {
      const sortByTypeAndYear = (a: VehicleRecord, b: VehicleRecord) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.year - b.year;
      };
      
      const sorted = [...mockVehicles].sort(sortByTypeAndYear);
      
      expect(sorted[0].type).toBe('car');
      expect(sorted[0].year).toBe(2018);
      expect(sorted[1].type).toBe('car');
      expect(sorted[1].year).toBe(2020);
      expect(sorted[2].type).toBe('motorcycle');
      expect(sorted[3].type).toBe('truck');
    });
  });

  describe('Array Filtering Functions', () => {
    it('should filter vehicles by type', () => {
      const cars = mockVehicles.filter(v => v.type === 'car');
      
      expect(cars).toHaveLength(2);
      expect(cars.every(v => v.type === 'car')).toBe(true);
    });

    it('should filter expenses by date range', () => {
      const startDate = new Date('2023-09-01');
      const endDate = new Date('2023-09-30');
      
      const septemberExpenses = mockExpenses.filter(e => 
        e.date >= startDate && e.date <= endDate
      );
      
      expect(septemberExpenses).toHaveLength(2);
    });

    it('should filter vehicles by fuel efficiency threshold', () => {
      const efficientVehicles = mockVehicles.filter(v => 
        v.fuelEfficiency && v.fuelEfficiency > 30
      );
      
      expect(efficientVehicles).toHaveLength(2);
      expect(efficientVehicles.every(v => v.fuelEfficiency! > 30)).toBe(true);
    });

    it('should filter recurring expenses', () => {
      const recurringExpenses = mockExpenses.filter(e => e.recurring);
      
      expect(recurringExpenses).toHaveLength(2);
      expect(recurringExpenses.every(e => e.recurring)).toBe(true);
    });
  });

  describe('Data Aggregation Functions', () => {
    it('should calculate expenses per vehicle', () => {
      const expensesPerVehicle = mockExpenses.reduce((acc, expense) => {
        acc[expense.vehicleId] = (acc[expense.vehicleId] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);
      
      expect(expensesPerVehicle.v1).toBeCloseTo(195.50, 2);
      expect(expensesPerVehicle.v2).toBe(120.00);
      expect(expensesPerVehicle.v3).toBeCloseTo(85.75, 2);
    });

    it('should find min and max values', () => {
      const amounts = mockExpenses.map(e => e.amount);
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      
      expect(minAmount).toBe(45.50);
      expect(maxAmount).toBe(150.00);
    });
  });

  describe('Data Transformation Functions', () => {
    it('should transform vehicles to summary format', () => {
      const vehicleSummaries = mockVehicles.map(v => ({
        id: v.id,
        displayName: `${v.year} ${v.name}`,
        isActive: v.status === 'active',
        mpg: v.fuelEfficiency || 0
      }));
      
      expect(vehicleSummaries[0].displayName).toBe('2020 Toyota Camry');
      expect(vehicleSummaries[0].isActive).toBe(true);
      expect(vehicleSummaries[0].mpg).toBe(28.5);
    });

    it('should group vehicles by type', () => {
      const vehiclesByType = mockVehicles.reduce((acc, vehicle) => {
        if (!acc[vehicle.type]) acc[vehicle.type] = [];
        acc[vehicle.type].push(vehicle);
        return acc;
      }, {} as Record<string, VehicleRecord[]>);
      
      expect(vehiclesByType.car).toHaveLength(2);
      expect(vehiclesByType.truck).toHaveLength(1);
      expect(vehiclesByType.motorcycle).toHaveLength(1);
    });

    it('should create expense timeline', () => {
      const timeline = mockExpenses
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(e => ({
          date: e.date.toISOString().split('T')[0],
          amount: e.amount,
          vehicle: mockVehicles.find(v => v.id === e.vehicleId)?.name || 'Unknown'
        }));
      
      expect(timeline).toHaveLength(4);
      expect(timeline[0].date).toBe('2023-09-15');
      expect(timeline[0].vehicle).toBe('Toyota Camry');
    });

    it('should calculate running totals', () => {
      const sortedExpenses = [...mockExpenses].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let runningTotal = 0;
      const expensesWithRunningTotal = sortedExpenses.map(expense => {
        runningTotal += expense.amount;
        return {
          ...expense,
          runningTotal
        };
      });
      
      expect(expensesWithRunningTotal[0].runningTotal).toBe(150.00);
      expect(expensesWithRunningTotal[1].runningTotal).toBeCloseTo(235.75, 2);
      expect(expensesWithRunningTotal[2].runningTotal).toBeCloseTo(281.25, 2);
      expect(expensesWithRunningTotal[3].runningTotal).toBeCloseTo(401.25, 2);
    });
  });

  describe('Data Search and Query Functions', () => {
    it('should find vehicles within value range', () => {
      const minValue = 15000;
      const maxValue = 30000;
      
      const vehiclesInRange = mockVehicles.filter(v => 
        v.value >= minValue && v.value <= maxValue
      );
      
      expect(vehiclesInRange).toHaveLength(2);
    });

    it('should find expenses matching multiple criteria', () => {
      const criteria = {
        category: 'fuel' as const,
        minAmount: 50,
        vehicleType: 'truck' as const
      };
      
      const matchingExpenses = mockExpenses.filter(expense => {
        const vehicle = mockVehicles.find(v => v.id === expense.vehicleId);
        return expense.category === criteria.category &&
               expense.amount >= criteria.minAmount &&
               vehicle?.type === criteria.vehicleType;
      });
      
      expect(matchingExpenses).toHaveLength(1);
      expect(matchingExpenses[0].vehicleId).toBe('v3');
    });
  });

  describe('Data Validation Functions', () => {
    it('should validate vehicle data completeness', () => {
      const validateVehicle = (vehicle: Partial<VehicleRecord>): boolean => {
        return !!(vehicle.id && vehicle.name && vehicle.type && vehicle.year);
      };
      
      const validVehicle = mockVehicles[0];
      const invalidVehicle = { id: 'v5', name: 'Test Car' };
      
      expect(validateVehicle(validVehicle)).toBe(true);
      expect(validateVehicle(invalidVehicle)).toBe(false);
    });

    it('should validate expense amount', () => {
      const validateExpenseAmount = (amount: number): boolean => {
        return amount > 0 && amount < 10000 && Number.isFinite(amount);
      };
      
      expect(validateExpenseAmount(50.25)).toBe(true);
      expect(validateExpenseAmount(0)).toBe(false);
      expect(validateExpenseAmount(-10)).toBe(false);
      expect(validateExpenseAmount(15000)).toBe(false);
      expect(validateExpenseAmount(NaN)).toBe(false);
    });

    it('should validate date ranges', () => {
      const validateDateRange = (start: Date, end: Date): boolean => {
        return start <= end && start <= new Date() && end <= new Date();
      };
      
      const validStart = new Date('2023-01-01');
      const validEnd = new Date('2023-12-31');
      const invalidEnd = new Date('2022-12-31');
      
      expect(validateDateRange(validStart, validEnd)).toBe(true);
      expect(validateDateRange(validStart, invalidEnd)).toBe(false);
    });
  });

  describe('Performance Optimization Functions', () => {
    it('should efficiently process large datasets', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        value: Math.random() * 1000,
        category: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'
      }));
      
      const startTime = performance.now();
      
      const processedData = largeDataset
        .filter(item => item.value > 500)
        .map(item => ({ ...item, processed: true }))
        .reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const endTime = performance.now();
      
      expect(Object.keys(processedData)).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should handle memory-efficient operations', () => {
      const createLargeArray = () => new Array(50000).fill(0).map((_, i) => i);
      
      const startMemory = process.memoryUsage().heapUsed;
      
      // Process in chunks to manage memory
      const chunkSize = 1000;
      let total = 0;
      
      for (let i = 0; i < 50; i++) {
        const chunk = createLargeArray().slice(i * chunkSize, (i + 1) * chunkSize);
        total += chunk.reduce((sum, val) => sum + val, 0);
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      expect(total).toBeGreaterThan(0);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Error Handling in Data Operations', () => {
    it('should handle division by zero safely', () => {
      const calculateAverage = (values: number[]): number => {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      };
      
      expect(calculateAverage([])).toBe(0);
      expect(calculateAverage([10, 20, 30])).toBe(20);
    });

    it('should handle invalid data gracefully', () => {
      const safeSum = (values: (number | null | undefined)[]): number => {
        return values
          .filter((val): val is number => typeof val === 'number' && !isNaN(val))
          .reduce((sum, val) => sum + val, 0);
      };
      
      const mixedValues = [10, null, 20, undefined, NaN, 30];
      expect(safeSum(mixedValues)).toBe(60);
    });

    it('should handle circular references in data structures', () => {
      const obj1: any = { id: 1, name: 'Object 1' };
      const obj2: any = { id: 2, name: 'Object 2', ref: obj1 };
      obj1.ref = obj2; // Create circular reference
      
      const safeStringify = (obj: any): string => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, val) => {
          if (val !== null && typeof val === 'object') {
            if (seen.has(val)) return '[Circular]';
            seen.add(val);
          }
          return val;
        });
      };
      
      expect(() => safeStringify(obj1)).not.toThrow();
      expect(safeStringify(obj1)).toContain('[Circular]');
    });
  });
}); 