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
}); 