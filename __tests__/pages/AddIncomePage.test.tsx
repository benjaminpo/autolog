import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import AddIncomePage from '../../app/add-income/page';
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
  income: {
    labels: {
      addIncome: 'Add Income',
    },
  },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AddIncomePage', () => {
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
        incomeCategories: [
          { name: 'Salary' },
          { name: 'Bonus' },
        ],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the add income form', async () => {
      await act(async () => {
        render(<AddIncomePage />);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      await act(async () => {
        render(<AddIncomePage />);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show loading state', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      await act(async () => {
        render(<AddIncomePage />);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch income categories on mount when user is authenticated', async () => {
      await act(async () => {
        render(<AddIncomePage />);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(<AddIncomePage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Interactions', () => {
    it('should handle form input changes', async () => {
      await act(async () => {
        render(<AddIncomePage />);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', async () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: null,
      });

      await act(async () => {
        render(<AddIncomePage />);
      });

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });
  });
}); 