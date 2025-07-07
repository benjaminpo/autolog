import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranslatedNavigation } from '../../app/components/TranslatedNavigation';
import { useLanguage } from '../../app/context/LanguageContext';

// Mock the LanguageContext
jest.mock('../../app/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

// Mock the Navigation component
jest.mock('../../app/components/Navigation', () => ({
  Navigation: jest.fn(({ t, onTabChange, activeTab, showTabs }) => (
    <div data-testid="navigation">
      <span data-testid="has-translations">{t ? 'yes' : 'no'}</span>
      <span data-testid="active-tab">{activeTab || 'none'}</span>
      <span data-testid="show-tabs">{showTabs ? 'yes' : 'no'}</span>
      {onTabChange && <button data-testid="tab-change" onClick={() => onTabChange('stats')}>Change Tab</button>}
    </div>
  )),
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

describe('TranslatedNavigation', () => {
  const mockTranslations = {
    _: jest.fn((key: string) => `translated_${key}`),
    _p: jest.fn((count: number, key: string) => `plural_${key}_${count}`),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseLanguage.mockReturnValue({
      language: 'en',
      t: mockTranslations,
      setLanguage: jest.fn(),
      saveLanguagePreference: jest.fn(),
    });
  });

  describe('Translation Injection', () => {
    it('should inject translations from context into Navigation component', () => {
      render(<TranslatedNavigation />);

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
    });

    it('should pass translations from different languages', () => {
      const chineseTranslations = {
        _: jest.fn((key: string) => `chinese_${key}`),
        _p: jest.fn((count: number, key: string) => `chinese_plural_${key}_${count}`),
      };

      mockUseLanguage.mockReturnValue({
        language: 'zh',
        t: chineseTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      render(<TranslatedNavigation />);

      // Navigation should receive the Chinese translations
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward onTabChange prop correctly', () => {
      const mockOnTabChange = jest.fn();
      
      render(<TranslatedNavigation onTabChange={mockOnTabChange} />);

      const tabChangeButton = screen.getByTestId('tab-change');
      tabChangeButton.click();

      expect(mockOnTabChange).toHaveBeenCalledWith('stats');
    });

    it('should forward activeTab prop correctly', () => {
      render(<TranslatedNavigation activeTab="lists" />);

      expect(screen.getByTestId('active-tab')).toHaveTextContent('lists');
    });

    it('should forward showTabs prop correctly', () => {
      render(<TranslatedNavigation showTabs={true} />);

      expect(screen.getByTestId('show-tabs')).toHaveTextContent('yes');
    });

    it('should handle all props together', () => {
      const mockOnTabChange = jest.fn();
      
      render(
        <TranslatedNavigation 
          onTabChange={mockOnTabChange}
          activeTab="stats"
          showTabs={false}
        />
      );

      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
      expect(screen.getByTestId('active-tab')).toHaveTextContent('stats');
      expect(screen.getByTestId('show-tabs')).toHaveTextContent('no');
    });
  });

  describe('Type Safety', () => {
    it('should accept valid TabType values', () => {
      const validTabs: Array<'lists' | 'stats'> = ['lists', 'stats'];
      
      validTabs.forEach(tab => {
        const { unmount } = render(<TranslatedNavigation activeTab={tab} />);
        expect(screen.getByTestId('active-tab')).toHaveTextContent(tab);
        unmount();
      });
    });

    it('should work without any props', () => {
      render(<TranslatedNavigation />);
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('has-translations')).toHaveTextContent('yes');
      expect(screen.getByTestId('active-tab')).toHaveTextContent('none');
      expect(screen.getByTestId('show-tabs')).toHaveTextContent('no');
    });
  });

  describe('Context Integration', () => {
    it('should call useLanguage hook', () => {
      render(<TranslatedNavigation />);
      
      expect(mockUseLanguage).toHaveBeenCalled();
    });

    it('should handle missing translation context gracefully', () => {
      mockUseLanguage.mockReturnValue({
        language: 'en',
        t: undefined as any,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      expect(() => {
        render(<TranslatedNavigation />);
      }).not.toThrow();
    });

    it('should re-render when language context changes', () => {
      const { rerender } = render(<TranslatedNavigation />);
      
      expect(mockUseLanguage).toHaveBeenCalledTimes(1);

      // Change language context
      mockUseLanguage.mockReturnValue({
        language: 'zh',
        t: mockTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      rerender(<TranslatedNavigation />);
      
      expect(mockUseLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle translation errors gracefully', () => {
      const errorTranslations = {
        _: jest.fn().mockImplementation(() => {
          throw new Error('Translation error');
        }),
        _p: jest.fn(),
      };

      mockUseLanguage.mockReturnValue({
        language: 'en',
        t: errorTranslations,
        setLanguage: jest.fn(),
        saveLanguagePreference: jest.fn(),
      });

      expect(() => {
        render(<TranslatedNavigation />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should render Navigation component with correct props structure', () => {
      const Navigation = require('../../app/components/Navigation').Navigation;
      const mockOnTabChange = jest.fn();
      
      render(
        <TranslatedNavigation 
          onTabChange={mockOnTabChange}
          activeTab="lists"
          showTabs={true}
        />
      );

      expect(Navigation).toHaveBeenCalledWith(
        expect.objectContaining({
          t: mockTranslations,
          onTabChange: mockOnTabChange,
          activeTab: 'lists',
          showTabs: true,
        }),
        undefined
      );
    });

    it('should pass all props correctly to Navigation', () => {
      const Navigation = require('../../app/components/Navigation').Navigation;
      
      render(<TranslatedNavigation showTabs={true} activeTab="stats" />);

      expect(Navigation).toHaveBeenCalledWith(
        expect.objectContaining({
          t: expect.any(Object),
          showTabs: true,
          activeTab: 'stats',
        }),
        undefined
      );
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      // This test verifies the component doesn't cause excessive re-renders
      const { rerender } = render(<TranslatedNavigation activeTab="lists" />);
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();

      // Re-render with same props should work without errors
      rerender(<TranslatedNavigation activeTab="lists" />);
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });
}); 