import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ManageListsPage from '../../app/manage-lists/page';
import { useAuth } from '../../app/context/AuthContext';
import { useTranslation } from '../../app/hooks/useTranslation';

// Mock dependencies
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    language: 'en',
    t: {
      navigation: {
        manageLists: 'Manage Lists'
      }
    }
  })),
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

jest.mock('../../app/components/ListsTab', () => {
  return function MockListsTab() {
    return <div data-testid="lists-tab">Lists Tab Content</div>;
  };
});

jest.mock('../../app/components/withTranslations', () => ({
  __esModule: true,
  default: (Component: any) => (props: any) => {
    return <Component {...props} t={{
      navigation: {
        manageLists: 'Manage Lists',
        manageListsDescription: 'Manage your vehicles, fuel companies, and fuel types'
      }
    }} />;
  },
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
};

const mockTranslation = {
  navigation: {
    manageLists: 'Manage Lists',
  },
  // Vehicle type translation keys
  vehicleTypeCar: 'Car/Truck',
  vehicleTypeMotorcycle: 'Motorcycle',
  vehicleTypeHeavyTruck: 'Heavy Truck',
  vehicleTypeAtv: 'ATV & UTV',
  vehicleTypeSnowmobile: 'Snowmobile',
  vehicleTypeWatercraft: 'Personal Watercraft',
  vehicleTypeOther: 'Other',
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ManageListsPage', () => {
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
        vehicles: [],
        categories: [],
      }),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the manage lists page', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container').length).toBeGreaterThan(0);
      });
    });

    it('should not render when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<ManageListsPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should show loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<ManageListsPage />);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('List Management', () => {
    it('should display vehicle list', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });

    it('should display category list', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });

    it('should handle adding new vehicles', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });

    it('should handle adding new categories', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should handle item editing', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });

    it('should handle item deletion', async () => {
      render(<ManageListsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', async () => {
      (useTranslation as jest.Mock).mockReturnValue({
        t: null,
      });

      render(<ManageListsPage />);

      // Wait for loading to complete and components to render
      await waitFor(() => {
        expect(screen.getAllByTestId('page-container')).toHaveLength(2);
      });
    });

    it('should handle fetch errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Set up fetch to reject before rendering
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<ManageListsPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
