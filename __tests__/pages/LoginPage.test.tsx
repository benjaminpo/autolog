import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../app/context/AuthContext';
import { LanguageProvider } from '../../app/context/LanguageContext';
import { ThemeProvider } from '../../app/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getSession, signIn, useSession } from 'next-auth/react';
import Login from '../../app/auth/login/page';
import translations from '../../app/translations';

// Mock components to avoid complex rendering
jest.mock('../../app/components/PageContainer', () => {
  return function MockPageContainer({ children, className }: any) {
    return <div className={className}>{children}</div>;
  };
})

jest.mock('../../app/components/GlobalLanguageSelector', () => ({
  GlobalLanguageSelector: function MockGlobalLanguageSelector() {
    return <div data-testid="language-selector">Language Selector</div>;
  },
}))

jest.mock('../../app/components/ThemeToggle', () => ({
  SimpleThemeToggle: function MockSimpleThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  },
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
  signIn: jest.fn(),
  useSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset language mock to default English
  const mockUseLanguage = require('../../app/context/LanguageContext').useLanguage;
  mockUseLanguage.mockReturnValue({
    language: 'en',
    setLanguage: jest.fn(),
  });

  // Reset auth mock to default state
  const mockUseAuth = require('../../app/context/AuthContext').useAuth;
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    error: null,
    setError: jest.fn(),
    login: jest.fn().mockResolvedValue(true),
    register: jest.fn(),
    logout: jest.fn(),
  });

  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
  });
  (getSession as jest.Mock).mockResolvedValue(null);
  (useSession as jest.Mock).mockReturnValue({
    data: null,
    status: 'unauthenticated',
  });
  (signIn as jest.Mock).mockResolvedValue({ ok: true });
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

describe('Login Page', () => {
  describe('Translation Integration', () => {
    it('should display English translations by default', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const t = translations.en;
      
      expect(screen.getByText(t._('auth.login.title'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.email'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.password'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t._('auth.login.button') })).toBeInTheDocument();
      expect(screen.getByText(t._('auth.oauth.google'))).toBeInTheDocument();
      expect(screen.getByText(t._('auth.register.prompt'))).toBeInTheDocument();
      expect(screen.getByRole('link', { name: t._('auth.register.action') })).toBeInTheDocument();
    });

    it('should display Chinese translations when language is set to zh', () => {
      // Mock useLanguage to return Chinese
      const mockUseLanguage = require('../../app/context/LanguageContext').useLanguage;
      mockUseLanguage.mockReturnValue({
        language: 'zh',
        setLanguage: jest.fn(),
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const t = translations.zh;
      
      expect(screen.getByText(t._('auth.login.title'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.email'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.password'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t._('auth.login.button') })).toBeInTheDocument();
      expect(screen.getByText(t._('auth.oauth.google'))).toBeInTheDocument();
      expect(screen.getByText(t._('auth.register.prompt'))).toBeInTheDocument();
      expect(screen.getByRole('link', { name: t._('auth.register.action') })).toBeInTheDocument();
    });
  });

  describe('Form Functionality', () => {
    it('should handle form submission with centralized translations', async () => {
      // Mock the login function to capture calls
      const mockLogin = jest.fn().mockResolvedValue(true);
      const mockUseAuth = require('../../app/context/AuthContext').useAuth;
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        setError: jest.fn(),
        login: mockLogin,
        register: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(translations.en._('auth.fields.email'));
      const passwordInput = screen.getByLabelText(translations.en._('auth.fields.password'));
      const submitButton = screen.getByRole('button', { name: translations.en._('auth.login.button') });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', 'en');
      });
    });

    it('should handle Google login with centralized translations', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const googleButton = screen.getByText(translations.en._('auth.oauth.google'));
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
      });
    });

    it('should display error messages', async () => {
      // Mock the useAuth hook to return an error
      const mockUseAuth = require('../../app/context/AuthContext').useAuth;
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: 'Invalid email or password',
        setError: jest.fn(),
        login: jest.fn().mockResolvedValue(false),
        register: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Check if error message is displayed
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have register link with correct href and centralized translation', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const registerLink = screen.getByRole('link', { name: translations.en._('auth.register.action') });
      expect(registerLink).toHaveAttribute('href', '/auth/register');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels using centralized translations', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(translations.en._('auth.fields.email'));
      const passwordInput = screen.getByLabelText(translations.en._('auth.fields.password'));

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(translations.en._('auth.login.title'));
    });
  });

  describe('Theme Integration', () => {
    it('should render without crashing in different themes', () => {
      const { container } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      // Mock the loading state
      const mockUseAuth = require('../../app/context/AuthContext').useAuth;
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        setError: jest.fn(),
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Should show loading text
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Button should be disabled
      const submitButton = screen.getByRole('button', { name: 'Loading...' });
      expect(submitButton).toBeDisabled();
    });
  });
}); 