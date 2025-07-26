import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinancialAnalysisPage from '../../app/financial-analysis/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';
import { useVehicles } from '../../app/hooks/useVehicles';

// Mock dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../app/hooks/useVehicles', () => ({
  useVehicles: jest.fn(),
}));

// Mock utility functions and data
jest.mock('../../app/lib/idUtils', () => ({
  getObjectId: jest.fn(() => 'mock-object-id'),
}));

jest.mock('../../app/lib/vehicleData', () => ({
  currencies: ['USD', 'EUR', 'GBP'],
  distanceUnits: ['km', 'miles'],
  volumeUnits: ['liters', 'gallons'],
}));

jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    language: 'en',
    t: {
      navigation: {
        financialAnalysis: 'Financial Analysis',
      },
      stats: {
        financialAnalysisBreakEven: 'Financial Analysis & Break-Even',
        noVehiclesFound: 'No vehicles found. Add vehicles to see financial analysis.',
        overallFinancialSummary: 'Overall Financial Summary',
        financialTotalIncome: 'Total Income',
        financialTotalCosts: 'Total Costs',
        netProfit: 'Net Profit',
        profitMargin: 'Profit Margin',
        roi: 'ROI',
      },
    },
    setLanguage: jest.fn(),
    saveLanguagePreference: jest.fn(),
  })),
}));

// Mock components that might cause issues in testing
jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div data-testid="page-container" className={className}>{children}</div>;
  };
});

jest.mock('../../app/components/TranslatedNavigation', () => ({
  TranslatedNavigation: function MockTranslatedNavigation() {
    return <nav data-testid="translated-navigation">Navigation</nav>;
  },
}));

jest.mock('../../app/components/AuthButton', () => ({
  AuthButton: function MockAuthButton() {
    return <button data-testid="auth-button">Auth</button>;
  },
}));

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: function MockGlobalLanguageSelector() {
    return <select data-testid="language-selector"><option>English</option></select>;
  },
}));

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: function MockSimpleThemeToggle() {
    return <button data-testid="theme-toggle">Theme</button>;
  },
}));

jest.mock('../../app/components/LoadingState', () => ({
  LoadingState: function MockLoadingState() {
    return <div data-testid="loading-state">Loading...</div>;
  },
}));

jest.mock('../../app/components/ErrorState', () => ({
  ErrorState: function MockErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
      <div data-testid="error-state">
        <span>{error}</span>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} data-testid="next-image" />;
  };
});

const mockUser = {
  id: '1',
  email: 'test@example.com',
};

const mockTranslation = {
  navigation: {
    financialAnalysis: 'Financial Analysis',
  },
  stats: {
    financialAnalysisBreakEven: 'Financial Analysis & Break-Even',
    noVehiclesFound: 'No vehicles found. Add vehicles to see financial analysis.',
    overallFinancialSummary: 'Overall Financial Summary',
    financialTotalIncome: 'Total Income',
    financialTotalCosts: 'Total Costs',
    netProfit: 'Net Profit',
    profitMargin: 'Profit Margin',
    roi: 'ROI',
    profitable: 'Profitable',
    breakEven: 'Break-Even',
    loss: 'Loss',
  },
};

const mockCars = [
  {
    id: '1',
    name: 'Test Car 1',
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    photo: null,
  },
  {
    id: '2',
    name: 'Test Car 2',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    photo: 'test-photo.jpg',
  },
];

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FinancialAnalysisPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockTranslation,
    });

    (useVehicles as jest.Mock).mockReturnValue({
      cars: mockCars,
      isLoading: false,
      error: null,
    });

    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        vehicles: mockCars,
        entries: [
          {
            id: '1',
            carId: '1',
            cost: 50.00,
            currency: 'USD',
            date: '2023-01-01',
          },
        ],
        expenses: [
          {
            id: '1',
            carId: '1',
            amount: 25.00,
            currency: 'USD',
            date: '2023-01-01',
          },
        ],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Layout and Structure', () => {
    it('should render with consistent layout structure', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        // Check header structure
        expect(screen.getByText('Financial Analysis')).toBeInTheDocument();
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('language-selector')).toBeInTheDocument();
        expect(screen.getByTestId('auth-button')).toBeInTheDocument();
      });
    });

    it('should render navigation component', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('translated-navigation')).toBeInTheDocument();
      });
    });

    it('should render main content within PageContainer', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        const pageContainers = screen.getAllByTestId('page-container');
        expect(pageContainers.length).toBeGreaterThan(0);
      });
    });

    it('should show loading state initially', () => {
      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        isLoading: true,
        error: null,
      });

      render(<FinancialAnalysisPage />);
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show error state when there is an error', async () => {
      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        isLoading: false,
        error: null,
      });

      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });
  });

  describe('Content Display', () => {
    it('should display no vehicles message when no cars are available', async () => {
      (useVehicles as jest.Mock).mockReturnValue({
        cars: [],
        isLoading: false,
        error: null,
      });

      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('No vehicles found. Add vehicles to see financial analysis.')).toBeInTheDocument();
      });
    });

    it('should display financial analysis for vehicles with data', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('Financial Analysis & Break-Even')).toBeInTheDocument();
        expect(screen.getByText('Overall Financial Summary')).toBeInTheDocument();
      });
    });

    it('should calculate and display financial metrics', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Income')).toBeInTheDocument();
        expect(screen.getByText('Total Costs')).toBeInTheDocument();
        expect(screen.getByText('Net Profit')).toBeInTheDocument();
        expect(screen.getByText('Profit Margin')).toBeInTheDocument();
        expect(screen.getByText('ROI')).toBeInTheDocument();
      });
    });

    it('should display vehicle images when available', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        const images = screen.getAllByTestId('next-image');
        expect(images.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Loading and Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });

    it('should retry data loading when retry button is clicked', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);
      });

      // Should attempt to fetch again (4 calls initially + 4 calls on retry = 8 total)
      expect(mockFetch).toHaveBeenCalledTimes(8);
    });

    it('should handle missing user gracefully', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<FinancialAnalysisPage />);

      // Should not crash and should not make API calls
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility and Responsive Design', () => {
    it('should have proper heading structure', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('should have proper semantic structure with main element', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should maintain consistent styling classes', async () => {
      render(<FinancialAnalysisPage />);

      await waitFor(() => {
        const mainContainer = screen.getByRole('main');
        expect(mainContainer).toHaveClass('flex-grow', 'overflow-auto');
      });
    });
  });
});
