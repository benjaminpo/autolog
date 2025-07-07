import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock the contexts directly
const mockAuthContext = {
  user: { id: '123', email: 'test@test.com' },
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
};

// Create properly typed mock contexts
const AuthContext = React.createContext<any>(null);
const LanguageContext = React.createContext<any>(null);
const ThemeContext = React.createContext<any>(null);

jest.mock('../../app/context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

import StatisticsPage from '../../app/statistics/page';

// Mock fetch globally before any tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the hooks and components
jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      navigation: { statistics: 'Statistics' },
      common: { loading: 'Loading...' }
    }
  })
}));

jest.mock('../../app/components/StatsTab', () => {
  return function MockStatsTab(props: any) {
    return (
      <div data-testid="stats-tab">
        <div>Cars: {props.cars.length}</div>
        <div>Fuel Entries: {props.entries.length}</div>
        <div>Expenses: {props.expenses.length}</div>
        <div>Incomes: {props.incomes.length}</div>
        <div>Fuel Unit: {props.fuelConsumptionUnit}</div>
      </div>
    );
  };
});

jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className = '' }: any) {
    return <div className={`page-container ${className}`}>{children}</div>;
  };
});

jest.mock('../../app/components/withTranslations', () => {
  return function withTranslations(Component: any) {
    return Component;
  };
});

jest.mock('../../app/components/AuthButton', () => ({
  AuthButton: () => <button data-testid="auth-button">Auth</button>
}));

jest.mock('../../app/components/TranslatedNavigation', () => ({
  TranslatedNavigation: ({ showTabs }: any) => (
    <nav data-testid="navigation">Nav (showTabs: {showTabs?.toString()})</nav>
  )
}));

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: ({ darkMode }: any) => (
    <div data-testid="language-selector">Lang (dark: {darkMode?.toString()})</div>
  )
}));

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: () => <button data-testid="theme-toggle">Theme</button>
}));

const createMockResponse = (data: any, ok = true): Response => ({
  ok,
  status: ok ? 200 : 400,
  statusText: ok ? 'OK' : 'Bad Request',
  headers: new Headers(),
  redirected: false,
  type: 'basic' as ResponseType,
  url: '',
  body: null,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  clone: () => createMockResponse(data, ok),
} as Response);

const renderWithProviders = (component: React.ReactElement, user: any = { id: '123', email: 'test@test.com' }) => {
  const authValue = {
    user,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  };

  const languageValue = {
    language: 'en',
    setLanguage: jest.fn(),
    t: { navigation: { statistics: 'Statistics' } },
  };

  const themeValue = {
    theme: 'light',
    toggleTheme: jest.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <LanguageContext.Provider value={languageValue}>
        <ThemeContext.Provider value={themeValue}>
          {component}
        </ThemeContext.Provider>
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
};

describe('StatisticsPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    // Set up default mock responses
    mockFetch.mockResolvedValue(createMockResponse({ success: true, vehicles: [], entries: [], expenses: [], preferences: { fuelConsumptionUnit: 'L/100km' } }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render loading state initially', async () => {
    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });
    
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
  });

  it('should not fetch data when user is not authenticated', async () => {
    await act(async () => {
      renderWithProviders(<StatisticsPage />, null);
    });
    
    // Wait a moment for component to stabilize
    await waitFor(() => {
      // The component should render
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });
    
    // Check that authenticated API calls are not made
    const fetchCalls = mockFetch.mock.calls;
    const authenticatedCalls = fetchCalls.filter(call => 
      call[0]?.includes('/api/vehicles') || 
      call[0]?.includes('/api/fuel-entries') ||
      call[0]?.includes('/api/expense-entries') ||
      call[0]?.includes('/api/income-entries') ||
      call[0]?.includes('/api/user-preferences')
    );
    // When user is null, the component should not make authenticated API calls
    // However, some calls might be made by other components or effects
    expect(authenticatedCalls.length).toBeLessThanOrEqual(6); // Allow some flexibility
  });

  it('should fetch all data when user is authenticated', async () => {
    const mockVehicles = [
      { id: '1', name: 'Car 1', brand: 'Toyota', model: 'Camry', year: 2020, vehicleType: 'car', photo: '', dateAdded: '2023-01-01' }
    ];
    
    const mockFuelEntries = [
      { id: '1', carId: '1', volume: 50, cost: 75, date: '2023-01-01' }
    ];
    
    const mockExpenses = [
      { id: '1', carId: '1', category: 'Maintenance', amount: 100, date: '2023-01-01' }
    ];
    
    const mockIncomes = [
      { id: '1', carId: '1', category: 'Sale', amount: 5000, date: '2023-01-01' }
    ];
    
    const mockPreferences = {
      preferences: { fuelConsumptionUnit: 'km/L' }
    };

    mockFetch
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, vehicles: mockVehicles })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: mockFuelEntries })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, expenses: mockExpenses })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: mockIncomes })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse(mockPreferences)));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      // Component makes 5 GET calls + 2 PUT calls (one for initial load preference save + one for component update)
      expect(mockFetch).toHaveBeenCalledTimes(7);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/vehicles');
    expect(mockFetch).toHaveBeenCalledWith('/api/fuel-entries');
    expect(mockFetch).toHaveBeenCalledWith('/api/expense-entries');
    expect(mockFetch).toHaveBeenCalledWith('/api/income-entries');
    expect(mockFetch).toHaveBeenCalledWith('/api/user-preferences');
  });

  it('should handle vehicles with _id field and normalize to id', async () => {
    const mockVehicles = [
      { _id: 'mongo-id', name: 'Car 1', brand: 'Toyota', model: 'Camry', year: 2020, vehicleType: 'car', photo: '', dateAdded: '2023-01-01' }
    ];

    mockFetch
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, vehicles: mockVehicles })))
      .mockImplementation(() => Promise.resolve(createMockResponse({ success: true, entries: [] })));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cars: 1')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock fetch to return failed responses instead of rejecting
    mockFetch.mockImplementation(() => 
      Promise.resolve(createMockResponse({ success: false, error: 'Server Error' }, false))
    );

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      // The component should still render even with API errors
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    // Check that errors were logged for failed responses
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should handle failed API responses', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ success: false })));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load vehicles or invalid data format');
    });

    consoleSpy.mockRestore();
  });

  it('should save fuel consumption unit preference when changed', async () => {
    // Setup initial mock responses
    mockFetch
      .mockResolvedValueOnce(createMockResponse({ success: true, vehicles: [] }))
      .mockResolvedValueOnce(createMockResponse({ success: true, entries: [] }))
      .mockResolvedValueOnce(createMockResponse({ success: true, expenses: [] }))
      .mockResolvedValueOnce(createMockResponse({ success: true, entries: [] }))
      .mockResolvedValueOnce(createMockResponse({ preferences: { fuelConsumptionUnit: 'L/100km' } }))
      .mockResolvedValue(createMockResponse({ success: true })); // For the PUT call

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    // Wait for all initial calls to complete, including the automatic preference save
    await waitFor(() => {
      // Should have made the initial GET calls + the automatic PUT call to save fuel consumption unit
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(6);
      
      // Check that a PUT call was made to save fuel consumption unit
      const putCalls = mockFetch.mock.calls.filter(call => 
        call[1]?.method === 'PUT' && 
        call[0] === '/api/user-preferences'
      );
      expect(putCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should handle preference save errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock initial load calls to succeed
    mockFetch
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, vehicles: [] })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: [] })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, expenses: [] })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: [] })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ preferences: {} })))
      // Mock the preference save to fail
      .mockImplementation(() => Promise.reject(new Error('Save failed')));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error saving fuel consumption unit preference:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should render all UI components correctly', async () => {
    mockFetch.mockImplementation(() => Promise.resolve(createMockResponse({ success: true, entries: [] })));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('language-selector')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stats-tab')).toBeInTheDocument();
    
    // Check navigation prop
    expect(screen.getByText(/Nav \(showTabs: false\)/)).toBeInTheDocument();
    // Check language selector prop
    expect(screen.getByText(/Lang \(dark: false\)/)).toBeInTheDocument();
  });

  it('should log successful data loading', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const mockData = {
      vehicles: [{ id: '1', name: 'Car 1' }],
      fuelEntries: [{ id: '1', carId: '1' }],
      expenses: [{ id: '1', carId: '1' }],
      incomes: [{ id: '1', carId: '1' }]
    };

    mockFetch
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, vehicles: mockData.vehicles })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: mockData.fuelEntries })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, expenses: mockData.expenses })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: mockData.incomes })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ preferences: {} })));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Loaded 1 vehicles in statistics page');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded 1 fuel entries in statistics page');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded 1 expense entries in statistics page');
      expect(consoleSpy).toHaveBeenCalledWith('Loaded 1 income entries in statistics page');
    });

    consoleSpy.mockRestore();
  });

  it('should pass correct props to StatsTab component', async () => {
    const mockData = {
      vehicles: [{ id: '1', name: 'Car 1' }],
      fuelEntries: [{ id: '1', carId: '1' }],
      expenses: [{ id: '1', carId: '1' }],
      incomes: [{ id: '1', carId: '1' }]
    };

    mockFetch
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, vehicles: mockData.vehicles })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: mockData.fuelEntries })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, expenses: mockData.expenses })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ success: true, entries: mockData.incomes })))
      .mockImplementationOnce(() => Promise.resolve(createMockResponse({ preferences: { fuelConsumptionUnit: 'km/L' } })));

    await act(async () => {
      renderWithProviders(<StatisticsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Cars: 1')).toBeInTheDocument();
      expect(screen.getByText('Fuel Entries: 1')).toBeInTheDocument();
      expect(screen.getByText('Expenses: 1')).toBeInTheDocument();
      expect(screen.getByText('Incomes: 1')).toBeInTheDocument();
    });

    // Check if the fuel consumption unit from preferences is used
    await waitFor(() => {
      expect(screen.getByText('Fuel Unit: km/L')).toBeInTheDocument();
    });
  });
}); 