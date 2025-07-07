import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ExportPage from '../../app/export/page';
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
    t: {}
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
  export: {
    title: 'Export Data',
    export: 'Export Data',
    labels: {
      exportData: 'Export Data',
    },
  },
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ExportPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockTranslation,
    });

    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        vehicles: [],
        entries: [],
        expenses: [],
        expenseCategories: [],
        incomeCategories: [],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the export page when authenticated', async () => {
      render(<ExportPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render page-container when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<ExportPage />);

      // Should not have page-container when not authenticated
      expect(screen.queryByTestId('page-container')).not.toBeInTheDocument();
      // Should show login prompt with auth button
      expect(screen.getByText('Please log in to export data')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });

    it('should show loading state without page-container', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<ExportPage />);

      // Should not have page-container when loading
      expect(screen.queryByTestId('page-container')).not.toBeInTheDocument();
      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
}); 