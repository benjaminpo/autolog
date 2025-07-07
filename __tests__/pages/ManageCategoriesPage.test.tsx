import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ManageCategoriesPage from '../../app/manage-categories/page';
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
      manageCategories: {
        title: 'Manage Categories',
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

const mockUser = {
  id: '1',
  email: 'test@example.com',
};

const mockTranslation = {
  manageCategories: {
    title: 'Manage Categories',
  },
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ManageCategoriesPage', () => {
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
        expenseCategories: [],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the manage categories page', async () => {
      render(<ManageCategoriesPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });
  });
}); 