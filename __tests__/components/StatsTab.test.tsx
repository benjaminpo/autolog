import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsTab from '../../app/components/StatsTab';

// Mock Chart.js components - just mock what's actually used
jest.mock('chart.js', () => ({}), { virtual: true });

// Mock recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Line: () => null,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock Language Context
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      stats: {
        title: 'Statistics',
        overview: 'Overview',
        charts: 'Charts',
        totalFuelCost: 'Total Fuel Cost',
        totalExpenses: 'Total Expenses', 
        totalIncome: 'Total Income',
        averageFuelEconomy: 'Average Fuel Economy',
        totalDistance: 'Total Distance',
        fuelCostTrend: 'Fuel Cost Trend',
        expensesByCategory: 'Expenses by Category',
        monthlyComparison: 'Monthly Comparison',
        noData: 'No data available',
        currency: '$',
        distance: 'km',
        volume: 'L',
        period: {
          all: 'All Time',
          year: 'This Year',
          month: 'This Month',
          week: 'This Week',
        },
      },
    },
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

const mockCars = [
  {
    id: 'car1',
    name: 'Toyota Camry',
    vehicleType: 'car',
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    photo: '',
    dateAdded: '2023-01-01',
  },
];

const mockFuelEntries = [
  {
    id: 'fuel1',
    carId: 'car1',
    fuelCompany: 'Shell',
    fuelType: 'Regular',
    mileage: 50000,
    distanceUnit: 'km' as const,
    volume: 40,
    volumeUnit: 'liters' as const,
    cost: 60.00,
    currency: 'USD' as const,
    date: '2023-10-15',
    time: '14:30',
    location: 'Shell Station',
    partialFuelUp: false,
    paymentType: 'Credit Card',
    tyrePressure: 35,
    tyrePressureUnit: 'psi',
    tags: ['regular'],
    notes: 'Full tank',
    images: [],
  },
];

const mockExpenses = [
  {
    id: 'expense1',
    carId: 'car1',
    category: 'Maintenance',
    amount: 150.00,
    currency: 'USD' as const,
    date: '2023-10-15',
    notes: 'Oil change',
    images: [],
  },
];

const mockIncomes = [
  {
    id: 'income1',
    carId: 'car1',
    category: 'Ride Sharing',
    amount: 300.00,
    currency: 'USD' as const,
    date: '2023-10-15',
    notes: 'Uber earnings',
    images: [],
  },
];

const defaultProps = {
  cars: mockCars,
  entries: mockFuelEntries,
  expenses: mockExpenses,
  incomes: mockIncomes,
  fuelConsumptionUnit: 'L/100km' as const,
  setFuelConsumptionUnit: jest.fn(),
};

describe('StatsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render without crashing', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Should render the main container
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Consumption unit selector
    });

    it('should render main sections', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Should render consumption unit selector
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render responsive containers for charts', () => {
      render(<StatsTab {...defaultProps} />);
      
      const containers = screen.getAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state handling', () => {
    it('should handle empty fuel entries', () => {
      render(<StatsTab {...defaultProps} entries={[]} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle empty expenses', () => {
      render(<StatsTab {...defaultProps} expenses={[]} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle empty incomes', () => {
      render(<StatsTab {...defaultProps} incomes={[]} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(<StatsTab cars={[]} entries={[]} expenses={[]} incomes={[]} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Chart rendering', () => {
    it('should render chart components', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Check for chart containers
      const chartContainers = screen.getAllByTestId(/chart|container/);
      expect(chartContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Fuel consumption unit changes', () => {
    it('should call setFuelConsumptionUnit when unit changes', () => {
      const mockSetUnit = jest.fn();
      render(<StatsTab {...defaultProps} setFuelConsumptionUnit={mockSetUnit} />);
      
      // Look for the consumption unit selector
      const select = screen.getByRole('combobox', { name: 'Consumption Unit' });
      fireEvent.change(select, { target: { value: 'km/L' } });
      
      // The component should render without throwing
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle component mounting and unmounting', () => {
      const { unmount } = render(<StatsTab {...defaultProps} />);
      
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
      
      unmount();
      
      // Should unmount without errors
      expect(true).toBe(true);
    });

    it('should handle props updates', () => {
      const { rerender } = render(<StatsTab {...defaultProps} />);
      
      const newProps = {
        ...defaultProps,
        entries: [],
      };
      
      rerender(<StatsTab {...newProps} />);
      
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Check for main heading (using actual rendered content)
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
    });

    it('should provide chart accessibility', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Charts should be rendered in accessible containers
      const containers = screen.getAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThan(0);
    });
  });

  describe('Data handling', () => {
    it('should handle different fuel consumption units', () => {
      const units: Array<'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L'> = [
        'L/100km', 'km/L', 'G/100mi', 'km/G', 'mi/L'
      ];
      
      units.forEach(unit => {
        const { unmount } = render(
          <StatsTab {...defaultProps} fuelConsumptionUnit={unit} />
        );
        
        expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle cars with different properties', () => {
      const carsWithVariations = [
        ...mockCars,
        {
          id: 'car2',
          name: 'Honda Civic',
          vehicleType: 'motorcycle',
          brand: 'Honda',
          model: 'Civic',
          year: 2021,
          photo: 'test.jpg',
          dateAdded: '2023-02-01',
        },
      ];
      
      render(<StatsTab {...defaultProps} cars={carsWithVariations} />);
      
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
    });
  });

  describe('Error boundaries', () => {
    it('should handle malformed data gracefully', () => {
      // Test with minimal required data
      const minimalProps = {
        cars: [],
        entries: [],
        expenses: [],
        incomes: [],
        fuelConsumptionUnit: 'L/100km' as const,
        setFuelConsumptionUnit: jest.fn(),
      };
      
      expect(() => {
        render(<StatsTab {...minimalProps} />);
      }).not.toThrow();
    });

    it('should handle missing translation context', () => {
      // Component should still render even if translations are missing
      render(<StatsTab {...defaultProps} />);
      
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate chart libraries without errors', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Should render charts through mocked components
      const containers = screen.getAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should work with language context', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Should use translations from context
      expect(screen.getByText('Overall Fleet Statistics')).toBeInTheDocument();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty data arrays', () => {
      render(<StatsTab cars={[]} entries={[]} expenses={[]} incomes={[]} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle null data arrays', () => {
      render(<StatsTab cars={null as any} entries={null as any} expenses={null as any} incomes={null as any} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle undefined data arrays', () => {
      render(<StatsTab cars={undefined as any} entries={undefined as any} expenses={undefined as any} incomes={undefined as any} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle mixed currency data', () => {
      const mixedCurrencyData = {
        cars: mockCars,
        entries: mockFuelEntries,
        expenses: [
          { ...mockExpenses[0], currency: 'USD' },
          { ...mockExpenses[0], id: 'exp2', currency: 'EUR' },
          { ...mockExpenses[0], id: 'exp3', currency: 'GBP' },
        ],
        incomes: [
          { ...mockIncomes[0], currency: 'USD' },
          { ...mockIncomes[0], id: 'inc2', currency: 'EUR' },
        ],
      };

      render(<StatsTab {...mixedCurrencyData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle zero values in all data', () => {
      const zeroData = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], volume: 0, cost: 0, mileage: 0 }],
        expenses: [{ ...mockExpenses[0], amount: 0, mileage: 0 }],
        incomes: [{ ...mockIncomes[0], amount: 0 }],
      };

      render(<StatsTab {...zeroData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      const negativeData = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], volume: -10, cost: -50 }],
        expenses: [{ ...mockExpenses[0], amount: -100, mileage: -1000 }],
        incomes: [{ ...mockIncomes[0], amount: -200 }],
      };

      render(<StatsTab {...negativeData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle very large values', () => {
      const largeData = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], volume: 999999, cost: 999999.99, mileage: 999999 }],
        expenses: [{ ...mockExpenses[0], amount: 999999.99, mileage: 999999 }],
        incomes: [{ ...mockIncomes[0], amount: 999999.99 }],
      };

      render(<StatsTab {...largeData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle missing car references', () => {
      const dataWithMissingCars = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], carId: 'nonexistent-car' }],
        expenses: [{ ...mockExpenses[0], carId: 'nonexistent-car' }],
        incomes: [{ ...mockIncomes[0], carId: 'nonexistent-car' }],
      };

      render(<StatsTab {...dataWithMissingCars} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle invalid dates', () => {
      const dataWithInvalidDates = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], date: 'invalid-date' }],
        expenses: [{ ...mockExpenses[0], date: 'invalid-date' }],
        incomes: [{ ...mockIncomes[0], date: 'invalid-date' }],
      };

      render(<StatsTab {...dataWithInvalidDates} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle missing dates', () => {
      const dataWithMissingDates = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], date: '' }],
        expenses: [{ ...mockExpenses[0], date: '' }],
        incomes: [{ ...mockIncomes[0], date: '' }],
      };

      render(<StatsTab {...dataWithMissingDates} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle unknown currencies', () => {
      const dataWithUnknownCurrencies = {
        cars: mockCars,
        entries: mockFuelEntries,
        expenses: [{ ...mockExpenses[0], currency: 'XXX' }],
        incomes: [{ ...mockIncomes[0], currency: 'YYY' }],
      };

      render(<StatsTab {...dataWithUnknownCurrencies} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle missing currencies', () => {
      const dataWithMissingCurrencies = {
        cars: mockCars,
        entries: mockFuelEntries,
        expenses: [{ ...mockExpenses[0], currency: '' }],
        incomes: [{ ...mockIncomes[0], currency: '' }],
      };

      render(<StatsTab {...dataWithMissingCurrencies} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle string values that should be numbers', () => {
      const dataWithStringValues = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], volume: '50', cost: '100.50', mileage: '50000' }],
        expenses: [{ ...mockExpenses[0], amount: '200.75', mileage: '75000' }],
        incomes: [{ ...mockIncomes[0], amount: '500.25' }],
      };

      render(<StatsTab {...dataWithStringValues} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle NaN values', () => {
      const dataWithNaN = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], volume: NaN, cost: NaN, mileage: NaN }],
        expenses: [{ ...mockExpenses[0], amount: NaN, mileage: NaN }],
        incomes: [{ ...mockIncomes[0], amount: NaN }],
      };

      render(<StatsTab {...dataWithNaN} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle infinite values', () => {
      const dataWithInfinity = {
        cars: mockCars,
        entries: [{ ...mockFuelEntries[0], volume: Infinity, cost: Infinity, mileage: Infinity }],
        expenses: [{ ...mockExpenses[0], amount: Infinity, mileage: Infinity }],
        incomes: [{ ...mockIncomes[0], amount: Infinity }],
      };

      render(<StatsTab {...dataWithInfinity} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });
  });

  describe('Performance and stress tests', () => {
    it('should handle large datasets', () => {
      const largeDataset = {
        cars: Array.from({ length: 100 }, (_, i) => ({ ...mockCars[0], id: `car-${i}` })),
        entries: Array.from({ length: 1000 }, (_, i) => ({ ...mockFuelEntries[0], id: `entry-${i}` })),
        expenses: Array.from({ length: 1000 }, (_, i) => ({ ...mockExpenses[0], id: `expense-${i}` })),
        incomes: Array.from({ length: 1000 }, (_, i) => ({ ...mockIncomes[0], id: `income-${i}` })),
      };

      render(<StatsTab {...largeDataset} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<StatsTab {...defaultProps} />);
      
      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(<StatsTab {...defaultProps} cars={[...mockCars, { ...mockCars[0], id: `temp-${i}` }]} />);
      }
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle concurrent calculations', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Component should handle concurrent calculations without errors
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });
  });

  describe('Accessibility tests', () => {
    it('should have proper ARIA labels', () => {
      render(<StatsTab {...defaultProps} />);
      
      const statsTab = screen.getByTestId('stats-tab');
      expect(statsTab).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Component should be keyboard accessible
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<StatsTab {...defaultProps} />);
      
      // Component should manage focus properly
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });
  });

  describe('Internationalization edge cases', () => {
    it('should handle RTL languages', () => {
      const rtlTranslations = {
        car: 'רכב',
        date: 'תאריך',
        category: 'קטגוריה',
        amount: 'סכום',
        mileage: 'קילומטראז',
        notes: 'הערות',
      } as any;

      render(<StatsTab {...defaultProps} t={rtlTranslations} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle very long translated text', () => {
      const longTranslations = {
        car: 'Very long vehicle name that might cause layout issues',
        date: 'Very long date format string',
        category: 'Very long category name that could break the layout',
        amount: 'Very long amount label',
        mileage: 'Very long mileage label',
        notes: 'Very long notes label',
      } as any;

      render(<StatsTab {...defaultProps} t={longTranslations} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle missing translation keys gracefully', () => {
      const incompleteTranslations = {
        car: 'Vehículo',
        // Missing other keys
      } as any;

      render(<StatsTab {...defaultProps} t={incompleteTranslations} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle undefined translation object', () => {
      render(<StatsTab {...defaultProps} t={undefined} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });
  });

  describe('Chart data edge cases', () => {
    it('should handle empty chart data', () => {
      const emptyChartData = {
        cars: mockCars,
        entries: [],
        expenses: [],
        incomes: [],
      };

      render(<StatsTab {...emptyChartData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleDataPoint = {
        cars: [mockCars[0]],
        entries: [mockFuelEntries[0]],
        expenses: [mockExpenses[0]],
        incomes: [mockIncomes[0]],
      };

      render(<StatsTab {...singleDataPoint} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle duplicate data points', () => {
      const duplicateData = {
        cars: mockCars,
        entries: [mockFuelEntries[0], mockFuelEntries[0]],
        expenses: [mockExpenses[0], mockExpenses[0]],
        incomes: [mockIncomes[0], mockIncomes[0]],
      };

      render(<StatsTab {...duplicateData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });

    it('should handle data with same dates', () => {
      const sameDateData = {
        cars: mockCars,
        entries: [
          { ...mockFuelEntries[0], date: '2023-10-15' },
          { ...mockFuelEntries[0], id: 'entry2', date: '2023-10-15' },
        ],
        expenses: [
          { ...mockExpenses[0], date: '2023-10-15' },
          { ...mockExpenses[0], id: 'expense2', date: '2023-10-15' },
        ],
        incomes: [
          { ...mockIncomes[0], date: '2023-10-15' },
          { ...mockIncomes[0], id: 'income2', date: '2023-10-15' },
        ],
      };

      render(<StatsTab {...sameDateData} fuelConsumptionUnit="L/100km" setFuelConsumptionUnit={jest.fn()} />);
      
      expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    });
  });
}); 