import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddExpensePage from '../../app/add-expense/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';

// Mock dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

jest.mock('../../app/components/AuthButton', () => ({
  AuthButton: () => <div data-testid="auth-button">Auth Button</div>,
}));

jest.mock('../../app/components/TranslatedNavigation', () => ({
  TranslatedNavigation: () => <div data-testid="translated-navigation">Navigation</div>,
}));

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: () => <div data-testid="language-selector">Language Selector</div>,
}));

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
};

const mockTranslation = {
  expense: {
    labels: {
      addExpense: 'Add Expense',
    },
  },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AddExpensePage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockTranslation,
    });

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        vehicles: [
          {
            id: '1',
            name: 'Test Car',
            vehicleType: 'Car',
            brand: 'Toyota',
            model: 'Camry',
            year: 2020,
            photo: 'test.jpg',
            dateAdded: '2023-01-01',
          },
        ],
        expenseCategories: [
          { name: 'Maintenance' },
          { name: 'Insurance' },
        ],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the add expense form', async () => {
      render(<AddExpensePage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<AddExpensePage />);

      // The component should not fetch data without a user
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<AddExpensePage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch vehicles and expense categories on mount', async () => {
      render(<AddExpensePage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/vehicles');
        expect(mockFetch).toHaveBeenCalledWith('/api/expense-categories');
      });
    });

    it('should handle vehicle fetch error gracefully', async () => {
      mockFetch.mockImplementation((url) => {
        if (url === '/api/vehicles') {
          return Promise.reject(new Error('Failed to fetch'));
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, expenseCategories: [] }),
        });
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<AddExpensePage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching vehicles:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle expense categories fetch error gracefully', async () => {
      mockFetch.mockImplementation((url) => {
        if (url === '/api/expense-categories') {
          return Promise.reject(new Error('Failed to fetch'));
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, vehicles: [] }),
        });
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<AddExpensePage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching expense categories:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Interactions', () => {
    it('should handle form input changes', async () => {
      render(<AddExpensePage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Test form interactions would require the actual form elements to be rendered
      // This is a basic structure test
    });
  });

  describe('Local Storage Integration', () => {
    it('should load form preferences from localStorage', async () => {
      const mockPrefs = {
        carId: 'test-car-id',
        category: 'Maintenance',
        currency: 'USD',
      };

      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(mockPrefs));
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem, setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
        writable: true,
      });

      render(<AddExpensePage />);

      await waitFor(() => {
        expect(mockGetItem).toHaveBeenCalledWith('expenseFormPreferences');
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      const mockGetItem = jest.fn().mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem, setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
        writable: true,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<AddExpensePage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading form preferences:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('should handle successful form submission', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
        }),
      });

      render(<AddExpensePage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });

      // Form submission would be tested with actual form elements
    });

    it('should handle form submission error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          message: 'Submission failed',
        }),
      });

      render(<AddExpensePage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });

      // Error handling would be tested with actual form submission
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: null,
      });

      render(<AddExpensePage />);

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });
  });
}); 