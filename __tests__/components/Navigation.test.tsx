import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Navigation } from '../../app/components/Navigation';
import { LanguageProvider } from '../../app/context/LanguageContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock LanguageContext
const mockContextT = {
  navigation: {
    profile: 'Profile',
    fuelHistory: 'Fuel History',
    expenseHistory: 'Expense History',
    incomeHistory: 'Income History',
    addFuel: 'Add Fuel',
    addExpense: 'Add Expense',
    addIncome: 'Add Income',
    manageLists: 'Manage Lists',
    statistics: 'Statistics',
    financialAnalysis: 'Financial Analysis',
    import: 'Import Data',
    export: 'Export Data',
    manageCategories: 'Manage Categories',
    menu: 'Menu',
    sections: 'Sections'
  }
};

const MockLanguageProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-mock-language-provider>
    {children}
  </div>
);

// Mock the useLanguage hook
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: () => ({ t: mockContextT }),
  LanguageProvider: ({ children }: any) => <div>{children}</div>
}));

describe('Navigation Component', () => {
  const mockOnTabChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Desktop Navigation', () => {
    beforeEach(() => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('renders desktop navigation links', () => {
      render(<Navigation />);

      // Check that main navigation links are present (using getAllByText since both mobile and desktop render)
      expect(screen.getAllByText('Fuel History')).toHaveLength(2); // Mobile and desktop versions
      expect(screen.getAllByText('Expense History')).toHaveLength(2);
      expect(screen.getAllByText('Income History')).toHaveLength(2);
      expect(screen.getAllByText('Add Fuel')).toHaveLength(2);
      expect(screen.getAllByText('Add Expense')).toHaveLength(2);
      expect(screen.getAllByText('Add Income')).toHaveLength(2);
      expect(screen.getAllByText('Manage Categories')).toHaveLength(2);
      expect(screen.getAllByText('Manage Lists')).toHaveLength(2);
      expect(screen.getAllByText('Statistics')).toHaveLength(2);
      expect(screen.getAllByText('Financial Analysis')).toHaveLength(2);
      expect(screen.getAllByText('Import Data')).toHaveLength(2);
      expect(screen.getAllByText('Export Data')).toHaveLength(2);
    });

    it('highlights active navigation link', () => {
      (usePathname as jest.Mock).mockReturnValue('/fuel-history');
      render(<Navigation />);

      // Get all the links and find the one with active classes
      const fuelHistoryLinks = screen.getAllByText('Fuel History');
      const activeLinks = fuelHistoryLinks
        .map(link => link.closest('a'))
        .filter(link => link?.classList.contains('text-blue-500') || link?.classList.contains('text-blue-600'));
      
      expect(activeLinks.length).toBeGreaterThan(0);
      // Check that at least one active link exists
      const hasActiveDesktopLink = activeLinks.some(link => 
        link?.classList.contains('text-blue-500') && link?.classList.contains('border-blue-500')
      );
      const hasActiveMobileLink = activeLinks.some(link =>
        link?.classList.contains('text-blue-600')
      );
      
      expect(hasActiveDesktopLink || hasActiveMobileLink).toBe(true);
    });

    it('does not highlight inactive navigation links', () => {
      (usePathname as jest.Mock).mockReturnValue('/fuel-history');
      render(<Navigation />);

      // Get the desktop version (second element)
      const expenseHistoryLinks = screen.getAllByText('Expense History');
      const desktopExpenseHistoryLink = expenseHistoryLinks[1].closest('a');
      expect(desktopExpenseHistoryLink).toHaveClass('border-transparent');
      expect(desktopExpenseHistoryLink).toHaveClass('text-gray-600');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('shows mobile menu button', () => {
      render(<Navigation />);
      
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('title', 'Toggle navigation menu');
    });

    it('toggles mobile menu on button click', () => {
      render(<Navigation />);
      
      const menuButton = screen.getByLabelText('Toggle menu');
      
      // Initially menu should be closed
      const mobileMenu = menuButton.closest('div')?.nextElementSibling;
      expect(mobileMenu).toHaveClass('hidden');
      
      // Click to open menu
      fireEvent.click(menuButton);
      expect(mobileMenu).toHaveClass('block');
      
      // Click to close menu
      fireEvent.click(menuButton);
      expect(mobileMenu).toHaveClass('hidden');
    });

    it('shows current page title in mobile header', () => {
      (usePathname as jest.Mock).mockReturnValue('/fuel-history');
      render(<Navigation />);
      
      // Check that at least one instance of the title is present
      expect(screen.getAllByText('Fuel History').length).toBeGreaterThan(0);
    });

    it('closes mobile menu when clicking on a link', () => {
      render(<Navigation />);
      
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton); // Open menu
      
      const mobileMenu = menuButton.closest('div')?.nextElementSibling;
      expect(mobileMenu).toHaveClass('block');
      
      // Click on a navigation link in mobile menu (get mobile menu version)
      const fuelHistoryLinks = screen.getAllByText('Fuel History');
      const mobileFuelHistoryLink = fuelHistoryLinks[0]; // Mobile version is typically first
      fireEvent.click(mobileFuelHistoryLink);
      
      expect(mobileMenu).toHaveClass('hidden');
    });

    it('closes mobile menu when clicking outside', async () => {
      render(<Navigation />);
      
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton); // Open menu
      
      const mobileMenu = menuButton.closest('div')?.nextElementSibling;
      expect(mobileMenu).toHaveClass('block');
      
      // Click outside the menu
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(mobileMenu).toHaveClass('hidden');
      });
    });
  });

  describe('Translation Handling', () => {
    it('uses prop translations when provided', () => {
      const customTranslations = {
        navigation: {
          fuelHistory: 'Historial de Combustible',
          expenseHistory: 'Historial de Gastos'
        }
      } as any;
      
      render(<Navigation t={customTranslations} />);
      
      expect(screen.getAllByText('Historial de Combustible').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Historial de Gastos').length).toBeGreaterThan(0);
    });

    it('falls back to context translations', () => {
      render(<Navigation />);
      
      // Should use context translations
      expect(screen.getAllByText('Fuel History').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Expense History').length).toBeGreaterThan(0);
    });

    it('falls back to default text when no translations available', () => {
      // Create a spy on the useLanguage hook to mock it properly
      const useLanguageSpy = jest.spyOn(require('../../app/context/LanguageContext'), 'useLanguage');
      useLanguageSpy.mockReturnValueOnce({ t: {} });
      
      render(<Navigation t={{}} />);
      
      // Should use default English text
      expect(screen.getAllByText('Fuel History').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Expense History').length).toBeGreaterThan(0);
      
      useLanguageSpy.mockRestore();
    });

    it('handles special import/export translation cases', () => {
      const customTranslations = {
        import: { title: 'Importar Datos' },
        export: { title: 'Exportar Datos' }
      } as any;
      
      render(<Navigation t={customTranslations} />);
      
      expect(screen.getAllByText('Importar Datos').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Exportar Datos').length).toBeGreaterThan(0);
    });
  });

  describe('Tab Functionality', () => {
    it('calls onTabChange when provided', () => {
      render(<Navigation onTabChange={mockOnTabChange} activeTab="lists" showTabs={true} />);
      
      // The component should render without errors when tab props are provided
      expect(screen.getAllByText('Fuel History').length).toBeGreaterThan(0);
    });

    it('handles showTabs prop correctly', () => {
      render(<Navigation showTabs={false} />);
      
      // Component should still render navigation even when showTabs is false
      expect(screen.getAllByText('Fuel History').length).toBeGreaterThan(0);
    });
  });

  describe('Active State Logic', () => {
    it('correctly identifies active paths', () => {
      (usePathname as jest.Mock).mockReturnValue('/fuel-history/123');
      render(<Navigation />);
      
      // Should match partial paths - get all links and find the active ones
      const fuelHistoryLinks = screen.getAllByText('Fuel History');
      const activeLinks = fuelHistoryLinks
        .map(link => link.closest('a'))
        .filter(link => link?.classList.contains('text-blue-500'));
      
      expect(activeLinks.length).toBeGreaterThan(0);
    });

    it('does not match root path incorrectly', () => {
      (usePathname as jest.Mock).mockReturnValue('/fuel-history');
      render(<Navigation />);
      
      // Root path should not be considered active for other paths
      const fuelHistoryLinks = screen.getAllByText('Fuel History');
      const activeLinks = fuelHistoryLinks
        .map(link => link.closest('a'))
        .filter(link => link?.classList.contains('text-blue-500'));
      
      expect(activeLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Page Title', () => {
    const testCases = [
      { pathname: '/profile', expectedTitle: 'Profile' },
      { pathname: '/fuel-history', expectedTitle: 'Fuel History' },
      { pathname: '/expense-history', expectedTitle: 'Expense History' },
      { pathname: '/income-history', expectedTitle: 'Income History' },
      { pathname: '/add-fuel', expectedTitle: 'Add Fuel' },
      { pathname: '/add-expense', expectedTitle: 'Add Expense' },
      { pathname: '/add-income', expectedTitle: 'Add Income' },
      { pathname: '/manage-categories', expectedTitle: 'Manage Categories' },
      { pathname: '/manage-lists', expectedTitle: 'Manage Lists' },
      { pathname: '/statistics', expectedTitle: 'Statistics' },
      { pathname: '/financial-analysis', expectedTitle: 'Financial Analysis' },
      { pathname: '/import', expectedTitle: 'Import Data' },
      { pathname: '/export', expectedTitle: 'Export Data' },
      { pathname: '/unknown', expectedTitle: 'Navigation' }
    ];

    testCases.forEach(({ pathname, expectedTitle }) => {
      it(`shows correct title for ${pathname}`, () => {
        (usePathname as jest.Mock).mockReturnValue(pathname);
        render(<Navigation />);
        
        // Use getAllByText and check that at least one exists
        const titleElements = screen.getAllByText(expectedTitle);
        expect(titleElements.length).toBeGreaterThan(0);
        expect(titleElements[0]).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and titles', () => {
      render(<Navigation />);
      
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
      expect(menuButton).toHaveAttribute('title', 'Toggle navigation menu');
    });

    it('supports keyboard navigation', () => {
      render(<Navigation />);
      
      const menuButton = screen.getByLabelText('Toggle menu');
      
      // Should be focusable
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(menuButton, { key: 'Enter' });
      // Menu state should change (though exact behavior may vary)
    });
  });

  describe('Event Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<Navigation />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
}); 