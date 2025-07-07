import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../app/context/AuthContext';
import { LanguageProvider } from '../../app/context/LanguageContext';
import { ThemeProvider } from '../../app/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getSession, signIn, useSession } from 'next-auth/react';
import Register from '../../app/auth/register/page';
import translations from '../../app/translations';

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
    register: jest.fn().mockResolvedValue(true),
    login: jest.fn().mockResolvedValue(true),
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

describe('Register Page', () => {
  describe('Translation Integration', () => {
    it('should display English translations by default', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const t = translations.en;
      
      expect(screen.getByText(t._('auth.register.title'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.name'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.email'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.password'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.confirmPassword'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t._('auth.register.button') })).toBeInTheDocument();
      expect(screen.getByText(t._('auth.oauth.google'))).toBeInTheDocument();
      expect(screen.getByText(t._('auth.login.prompt'))).toBeInTheDocument();
      expect(screen.getByRole('link', { name: t._('auth.login.action') })).toBeInTheDocument();
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
          <Register />
        </TestWrapper>
      );

      const t = translations.zh;
      
      expect(screen.getByText(t._('auth.register.title'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.name'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.email'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.password'))).toBeInTheDocument();
      expect(screen.getByLabelText(t._('auth.fields.confirmPassword'))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t._('auth.register.button') })).toBeInTheDocument();
      expect(screen.getByText(t._('auth.oauth.google'))).toBeInTheDocument();
      expect(screen.getByText(t._('auth.login.prompt'))).toBeInTheDocument();
      expect(screen.getByRole('link', { name: t._('auth.login.action') })).toBeInTheDocument();
    });
  });

  describe('Form Functionality', () => {
    it('should handle form submission with centralized translations', async () => {
      const mockRegister = jest.fn().mockResolvedValue(true);
      const mockUseAuth = require('../../app/context/AuthContext').useAuth;
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
        setError: jest.fn(),
        register: mockRegister,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(translations.en._('auth.fields.name'));
      const emailInput = screen.getByLabelText(translations.en._('auth.fields.email'));
      const passwordInput = screen.getByLabelText(translations.en._('auth.fields.password'));
      const confirmPasswordInput = screen.getByLabelText(translations.en._('auth.fields.confirmPassword'));
      const submitButton = screen.getByRole('button', { name: translations.en._('auth.register.button') });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('Test User', 'test@example.com', 'password123');
      });
    });

    it('should handle Google registration with centralized translations', async () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const googleButton = screen.getByText(translations.en._('auth.oauth.google'));
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
      });
    });

    it('should display password mismatch error with centralized translation', async () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(translations.en._('auth.fields.name'));
      const emailInput = screen.getByLabelText(translations.en._('auth.fields.email'));
      const passwordInput = screen.getByLabelText(translations.en._('auth.fields.password'));
      const confirmPasswordInput = screen.getByLabelText(translations.en._('auth.fields.confirmPassword'));
      const submitButton = screen.getByRole('button', { name: translations.en._('auth.register.button') });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(translations.en._('auth.validation.passwordMismatch'))).toBeInTheDocument();
      });
    });

    it('should display password too short error with centralized translation', async () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(translations.en._('auth.fields.name'));
      const emailInput = screen.getByLabelText(translations.en._('auth.fields.email'));
      const passwordInput = screen.getByLabelText(translations.en._('auth.fields.password'));
      const confirmPasswordInput = screen.getByLabelText(translations.en._('auth.fields.confirmPassword'));
      const submitButton = screen.getByRole('button', { name: translations.en._('auth.register.button') });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(translations.en._('auth.validation.passwordTooShort'))).toBeInTheDocument();
      });
    });

    it('should display server error messages', async () => {
      // Mock the useAuth hook to return an error
      const mockUseAuth = require('../../app/context/AuthContext').useAuth;
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: 'Registration failed',
        setError: jest.fn(),
        register: jest.fn().mockResolvedValue(false),
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      // Check if error message is displayed
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have login link with correct href and centralized translation', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const loginLink = screen.getByRole('link', { name: translations.en._('auth.login.action') });
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels using centralized translations', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(translations.en._('auth.fields.name'));
      const emailInput = screen.getByLabelText(translations.en._('auth.fields.email'));
      const passwordInput = screen.getByLabelText(translations.en._('auth.fields.password'));
      const confirmPasswordInput = screen.getByLabelText(translations.en._('auth.fields.confirmPassword'));

      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });

    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(translations.en._('auth.register.title'));
    });
  });

  describe('Theme Integration', () => {
    it('should render without crashing in different themes', () => {
      const { container } = render(
        <TestWrapper>
          <Register />
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
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Register />
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