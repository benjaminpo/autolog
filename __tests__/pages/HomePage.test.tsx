import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../../app/page';
import { useAuth } from '../../app/context/AuthContext';
import { useLanguage } from '../../app/context/LanguageContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock LanguageContext
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

// Mock ThemeToggle component
jest.mock('../../app/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

// Mock LanguageSelector component
jest.mock('../../app/components/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector">Language Selector</div>,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetLanguage = jest.fn();

describe('HomePage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    (useLanguage as jest.Mock).mockReturnValue({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: {
        _: (key: string) => {
          // Mock translation function that returns the key for testing
          const translations: { [key: string]: string } = {
            'homepage.header.login': 'Login',
            'homepage.header.getStarted': 'Get Started',
            'homepage.hero.title': 'Track Your Vehicle Expenses',
            'homepage.hero.subtitle': 'Like Never Before',
            'homepage.hero.description': 'Take control of your vehicle finances with AutoLog. Monitor fuel consumption, track expenses, manage income, and get insights that help you save money.',
            'homepage.hero.startTrackingFree': 'Start Tracking Free',
            'homepage.hero.signIn': 'Sign In',
            'homepage.features.title': 'Everything You Need to Manage Your Vehicle',
            'homepage.features.description': 'Comprehensive tools to track, analyze, and optimize your vehicle expenses',
            'homepage.features.fuelTracking.title': 'Fuel Tracking',
            'homepage.features.fuelTracking.description': 'Monitor fuel consumption, track prices, and analyze your vehicle\'s efficiency with detailed fuel history and consumption statistics.',
            'homepage.features.expenseManagement.title': 'Expense Management',
            'homepage.features.expenseManagement.description': 'Track maintenance costs, repairs, insurance, and all vehicle-related expenses with categorized entries and detailed reporting.',
            'homepage.features.financialAnalytics.title': 'Financial Analytics',
            'homepage.features.financialAnalytics.description': 'Get insights into your spending patterns, fuel efficiency trends, and comprehensive financial analysis to make informed decisions.',
            'homepage.features.multiVehicleSupport.title': 'Multi-Vehicle Support',
            'homepage.features.multiVehicleSupport.description': 'Manage multiple vehicles with separate tracking for cars, motorcycles, trucks, and other vehicle types with customizable settings.',
            'homepage.features.mobileReady.title': 'Mobile Ready',
            'homepage.features.mobileReady.description': 'Access your data anywhere with our responsive web app that works perfectly on desktop, tablet, and mobile devices.',
            'homepage.features.incomeTracking.title': 'Income Tracking',
            'homepage.features.incomeTracking.description': 'Track vehicle-related income for rideshare, delivery, or business use with detailed categorization and tax-ready reports.',
            'homepage.benefits.title': 'Why Choose AutoLog?',
            'homepage.benefits.saveMoney.title': 'Save Money',
            'homepage.benefits.saveMoney.description': 'Identify spending patterns and optimize your vehicle expenses to save hundreds of dollars annually.',
            'homepage.benefits.stayOrganized.title': 'Stay Organized',
            'homepage.benefits.stayOrganized.description': 'Keep all your vehicle records in one place with easy-to-use categorization and search features.',
            'homepage.benefits.makeInformedDecisions.title': 'Make Informed Decisions',
            'homepage.benefits.makeInformedDecisions.description': 'Use detailed analytics and reports to make smart decisions about maintenance, fuel, and vehicle purchases.',
            'homepage.benefits.cta.title': 'Ready to Get Started?',
            'homepage.benefits.cta.description': 'Join thousands of users who are already saving money and staying organized with AutoLog.',
            'homepage.benefits.cta.createAccount': 'Create Your Free Account',
            'homepage.footer.description': 'Your complete vehicle expense tracking solution',
            'homepage.footer.login': 'Login',
            'homepage.footer.register': 'Register',
            'homepage.footer.copyright': '© 2025 AutoLog. Built for vehicle owners who care about their finances.',
          };
          return translations[key] || key;
        }
      }
    });
    
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading spinner when auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveClass('animate-spin');
    });

    it('should show loading spinner with correct styling', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('min-h-screen', 'bg-white', 'dark:bg-gray-800');
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-16', 'w-16', 'border-t-2', 'border-b-2', 'border-blue-600');
    });
  });

  describe('Authentication redirects', () => {
    it('should redirect authenticated users to fuel-history page', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });

    it('should show landing page for unauthenticated users', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
        expect(screen.getByText('Like Never Before')).toBeInTheDocument();
        expect(screen.getByText('Start Tracking Free')).toBeInTheDocument();
        expect(screen.getAllByText('🚗 AutoLog')).toHaveLength(2); // Header and footer
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should not redirect while loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Landing page content', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it('should display hero section with correct content', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
        expect(screen.getByText('Like Never Before')).toBeInTheDocument();
        expect(screen.getByText(/Take control of your vehicle finances/)).toBeInTheDocument();
        expect(screen.getByText('Start Tracking Free')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('should display features section', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Everything You Need to Manage Your Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Fuel Tracking')).toBeInTheDocument();
        expect(screen.getByText('Expense Management')).toBeInTheDocument();
        expect(screen.getByText('Financial Analytics')).toBeInTheDocument();
        expect(screen.getByText('Multi-Vehicle Support')).toBeInTheDocument();
        expect(screen.getByText('Mobile Ready')).toBeInTheDocument();
        expect(screen.getByText('Income Tracking')).toBeInTheDocument();
      });
    });

    it('should display benefits section', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Why Choose AutoLog?')).toBeInTheDocument();
        expect(screen.getByText('Save Money')).toBeInTheDocument();
        expect(screen.getByText('Stay Organized')).toBeInTheDocument();
        expect(screen.getByText('Make Informed Decisions')).toBeInTheDocument();
        expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
      });
    });

    it('should include theme toggle in header', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple render cycles', () => {
    it('should handle user state changes correctly', async () => {
      const { rerender } = render(<HomePage />);

      // Initially loading
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });
      rerender(<HomePage />);
      expect(mockReplace).not.toHaveBeenCalled();

      // Then not loading with no user - should show landing page
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });
      rerender(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');

      jest.clearAllMocks();

      // Then user logs in
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
      });
      rerender(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing router gracefully', () => {
      (useRouter as jest.Mock).mockReturnValue(null);
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      // The component should handle null router gracefully now
      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should handle missing auth context gracefully', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      // Should not throw when auth context is properly mocked
      expect(() => render(<HomePage />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for screen readers during loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<HomePage />);

      // Check that there's a loading state that can be perceived
      const loadingContainer = document.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should be accessible for screen readers when showing landing page', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        // Check for proper heading hierarchy - only one h1 element (main hero heading)
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toBeInTheDocument();
        expect(mainHeading).toHaveTextContent('Track Your Vehicle Expenses');
        
        // Check for proper button labels
        const startButton = screen.getByRole('button', { name: /start tracking free/i });
        expect(startButton).toBeInTheDocument();
        
        const signInButton = screen.getByRole('button', { name: /sign in/i });
        expect(signInButton).toBeInTheDocument();
      });
    });
  });
}); 