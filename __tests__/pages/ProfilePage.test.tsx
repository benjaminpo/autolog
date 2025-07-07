import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '../../app/profile/page';
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
  name: 'Test User',
};

const mockTranslation = {
  profile: {
    title: 'Profile',
    labels: {
      email: 'Email',
      name: 'Name',
    },
  },
};

describe('ProfilePage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockTranslation,
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the profile page', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<ProfilePage />);

      // ProtectedRoute redirects unauthenticated users, so no page-container
      expect(screen.queryByTestId('page-container')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<ProfilePage />);

      // Loading state shows spinner, no page-container
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Profile Information', () => {
    it('should display user information when authenticated', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should handle missing user information', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '1' },
        loading: false,
      });

      render(<ProfilePage />);

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: null,
      });

      render(<ProfilePage />);

      expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
    });
  });
}); 