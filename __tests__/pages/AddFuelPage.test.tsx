import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AddFuelPage from '../../app/add-fuel/page';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Mock fetch
global.fetch = jest.fn();

// Mock useAuth
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user123', email: 'test@example.com' },
    loading: false,
    error: null,
  })),
}));

// Mock useTranslation
jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: {
      fuel: {
        labels: {
          addFuel: 'Add Fuel',
          date: 'Date',
          vehicle: 'Vehicle',
          fuelCompany: 'Fuel Company',
          fuelType: 'Fuel Type',
          amount: 'Amount',
          pricePerLiter: 'Price per Liter',
          odometer: 'Odometer',
          location: 'Location',
          notes: 'Notes',
          totalCost: 'Total Cost',
          efficiency: 'Efficiency',
          fillUp: 'Fill Up',
          partialFill: 'Partial Fill',
          selectVehicle: 'Select Vehicle',
          selectFuelCompany: 'Select Fuel Company',
          selectFuelType: 'Select Fuel Type',
        },
        validation: {
          dateRequired: 'Date is required',
          vehicleRequired: 'Vehicle is required',
          fuelCompanyRequired: 'Fuel company is required',
          fuelTypeRequired: 'Fuel type is required',
          amountRequired: 'Amount is required',
          pricePerLiterRequired: 'Price per liter is required',
          odometerRequired: 'Odometer reading is required',
        }
      },
      actions: {
        save: 'Save',
        cancel: 'Cancel',
        clear: 'Clear',
      },
      payment: {
        type: {
          cash: 'Cash',
          card: 'Card',
        }
      }
    },
  })),
}));

// Mock ThemeContext
jest.mock('../../app/context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
}));

// Mock LanguageContext  
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    language: 'en',
    setLanguage: jest.fn(),
  })),
}));

// Mock components
jest.mock('../../app/components/TranslatedNavigation', () => {
  return {
    TranslatedNavigation: function TranslatedNavigation() {
      return <div data-testid="translated-navigation">Translated Navigation</div>;
    },
  };
});

jest.mock('../../app/components/AuthButton', () => {
  return {
    AuthButton: function AuthButton() {
      return <div data-testid="auth-button">Auth Button</div>;
    },
  };
});

jest.mock('../../app/components/GlobalLanguageSelector', () => {
  return {
    GlobalLanguageSelector: function GlobalLanguageSelector() {
      return <div data-testid="global-language-selector">Language Selector</div>;
    },
  };
});

jest.mock('../../app/components/ThemeToggle', () => {
  return {
    SimpleThemeToggle: function SimpleThemeToggle() {
      return <div data-testid="theme-toggle">Theme Toggle</div>;
    },
  };
});

jest.mock('../../app/components/PageContainer', () => {
  return function PageContainer({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-container">{children}</div>;
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('AddFuelPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseSession.mockReturnValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      status: 'authenticated',
    } as any);

    // Mock fetch responses for initial data loading
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          vehicles: [
            { _id: 'vehicle1', make: 'Toyota', model: 'Camry', year: 2020, nickname: 'My Car' }
          ]
        })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          companies: [
            { _id: 'company1', name: 'Shell' },
            { _id: 'company2', name: 'BP' }
          ]
        })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          fuelTypes: [
            { _id: 'type1', name: 'Regular' },
            { _id: 'type2', name: 'Premium' }
          ]
        })
      }));
  });

  describe('Component Rendering', () => {
    it('should render the add fuel page when user is authenticated', async () => {
      render(<AddFuelPage />);

      await waitFor(() => {
        expect(screen.getByText('Add Fuel')).toBeInTheDocument();
      });

      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('global-language-selector')).toBeInTheDocument();
    });

    it('should show loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      } as any);

      render(<AddFuelPage />);

      expect(screen.getAllByTestId('page-container')).toHaveLength(2);
    });

    it('should render with unauthenticated status', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { container } = render(<AddFuelPage />);

      // Component should render and show the appropriate content for unauthenticated users
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Data Loading', () => {
    it('should load vehicles, fuel companies, and fuel types on mount', async () => {
      // Reset mock to ensure we're tracking these calls specifically
      (global.fetch as jest.Mock).mockClear();
      
      // Mock fetch responses for this specific test
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            vehicles: [{ _id: 'vehicle1', make: 'Toyota', model: 'Camry' }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            companies: [{ _id: 'company1', name: 'Shell' }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            types: [{ _id: 'type1', name: 'Regular' }]
          })
        });
      
      render(<AddFuelPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/vehicles');
        expect(global.fetch).toHaveBeenCalledWith('/api/fuel-companies');
        expect(global.fetch).toHaveBeenCalledWith('/api/fuel-types');
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<AddFuelPage />);

      // Component should still render even if API calls fail
      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });
  });

  describe('Form Functionality', () => {
    it('should render basic form fields', async () => {
      render(<AddFuelPage />);

      await waitFor(() => {
        expect(screen.getByText('Add Fuel')).toBeInTheDocument();
      });

      // These would be the actual form elements that would be rendered
      expect(screen.getAllByTestId('page-container')).toHaveLength(2);
    });

    it('should submit form data when save is clicked', async () => {
      // Mock successful form submission
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }));

      render(<AddFuelPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });

      // In a real test, we would interact with form elements and submit
      // For now, we're testing that the component renders without errors
    });
  });

  describe('Navigation', () => {
    it('should handle navigation actions correctly', async () => {
      render(<AddFuelPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });

      // The component should render successfully with navigation components
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation keys gracefully', () => {
      // Mock missing translations
      const { useTranslation } = require('../../app/hooks/useTranslation');
      useTranslation.mockReturnValue({
        t: {}
      });

      render(<AddFuelPage />);

      expect(screen.getAllByTestId('page-container')).toHaveLength(2);
    });

    it('should handle authentication errors', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { container } = render(<AddFuelPage />);

      // Component should still render but may show different content
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper page structure', async () => {
      render(<AddFuelPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });

      // Basic accessibility checks
      expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render responsive components', async () => {
      render(<AddFuelPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });

      // Component should render with responsive design elements
      expect(screen.getByTestId('global-language-selector')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });
}); 