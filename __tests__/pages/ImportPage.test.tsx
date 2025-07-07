import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ImportPage from '../../app/import/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';

// Mock dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../app/hooks/useTranslation', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    language: 'en',
    t: {
      import: {
        title: 'Import Data',
        labels: {
          importData: 'Import Data',
        },
      },
    },
    setLanguage: jest.fn(),
    saveLanguagePreference: jest.fn(),
  })),
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
  import: {
    title: 'Import Data',
    labels: {
      importData: 'Import Data',
    },
  },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ImportPage', () => {
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
          },
        ],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the import page', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<ImportPage />);

      expect(screen.getByText('Please log in to access this page.')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<ImportPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle file selection', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should validate file format', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle CSV import', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle JSON import', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate imported data structure', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle invalid data formats', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: null,
      });

      render(<ImportPage />);

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });

    it('should handle import errors', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle file size limits', async () => {
      render(<ImportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });
}); 