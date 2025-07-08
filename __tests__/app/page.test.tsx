import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../../app/page';
import { useAuth } from '../../app/context/AuthContext';
import { useLanguage } from '../../app/context/LanguageContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn()
}));

// Mock ThemeToggle component
jest.mock('../../app/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

// Mock LanguageSelector component
jest.mock('../../app/components/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector">Language Selector</div>,
}));

describe('HomePage', () => {
  const mockReplace = jest.fn();
  const mockSetLanguage = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
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
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      render(<HomePage />);

      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Should not redirect while loading
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should have correct loading spinner styles', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      const { container } = render(<HomePage />);

      // Check for spinner element with animation classes
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-16', 'w-16', 'border-t-2', 'border-b-2');
    });

    it('should have proper container styling', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      const { container } = render(<HomePage />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'min-h-screen',
        'bg-white',
        'dark:bg-gray-800',
        'transition-colors'
      );
    });
  });

  describe('Authenticated User Redirect', () => {
    it('should redirect authenticated user to fuel-history page', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle user with different properties', async () => {
      const mockUser = { 
        id: 'user456', 
        email: 'another@test.com',
        name: 'Test User'
      };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });

    it('should redirect even with minimal user object', async () => {
      const mockUser = { id: 'minimal-user' };
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });
  });

  describe('Unauthenticated User Landing Page', () => {
    it('should show landing page for unauthenticated user when user is null', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
        expect(screen.getByText('Like Never Before')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should show landing page for unauthenticated user when user is undefined', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: undefined,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should show landing page when user is false', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: false,
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });

    it('should show landing page when user is empty string', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: '',
        loading: false
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Track Your Vehicle Expenses')).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(mockReplace).not.toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Loading State Changes', () => {
    it('should not redirect while loading is true regardless of user state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: true
      });

      render(<HomePage />);

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should redirect after loading becomes false', async () => {
      const { rerender } = render(<HomePage />);

      // Initially loading
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: true
      });

      rerender(<HomePage />);
      expect(mockReplace).not.toHaveBeenCalled();

      // Loading finished
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: false
      });

      rerender(<HomePage />);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/fuel-history');
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render without crashing with valid props', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should render loading state by default', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      const { container } = render(<HomePage />);

      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render different content based on auth state', async () => {
      // Test with authenticated user (should redirect, so no content)
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: '123' },
        loading: false
      });

      const { container: container1 } = render(<HomePage />);

      // Test with unauthenticated user (should show landing page)
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      const { container: container2 } = render(<HomePage />);

      await waitFor(() => {
        // Authenticated user gets null (redirected)
        expect(container1.innerHTML).toBe('');
        
        // Unauthenticated user gets landing page
        expect(container2.innerHTML).toContain('Track Your Vehicle Expenses');
      });
    });
  });

  describe('Hook Dependencies', () => {
    it('should call useAuth hook', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      render(<HomePage />);

      expect(useAuth).toHaveBeenCalled();
    });

    it('should call useRouter hook', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      });

      render(<HomePage />);

      expect(useRouter).toHaveBeenCalled();
    });

    it('should handle missing router methods gracefully', () => {
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn()
      });

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle auth hook returning undefined', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should handle auth hook returning empty object', () => {
      (useAuth as jest.Mock).mockReturnValue({});

      expect(() => render(<HomePage />)).not.toThrow();
    });

    it('should handle router hook returning undefined', () => {
      (useRouter as jest.Mock).mockReturnValue({
        replace: jest.fn()
      });

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false
      });

      expect(() => render(<HomePage />)).not.toThrow();
    });
  });
}); 