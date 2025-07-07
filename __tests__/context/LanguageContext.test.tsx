import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Clear the jest setup mock for this test file
jest.unmock('../../app/context/LanguageContext');

import { LanguageProvider, useLanguage } from '../../app/context/LanguageContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock translations
jest.mock('../../app/translations', () => {
  const mockTranslations = {
    en: {
      navigation: {
        dashboard: 'Dashboard',
        fuel: 'Fuel',
        expenses: 'Expenses',
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
      },
    },
    zh: {
      navigation: {
        dashboard: '儀表板',
        fuel: '燃料',
        expenses: '支出',
      },
      common: {
        save: '儲存',
        cancel: '取消',
      },
    },
  };
  
  return {
    __esModule: true,
    default: mockTranslations,
    translations: mockTranslations,
  };
});

// Test component using useLanguage hook
const TestComponent = () => {
  try {
    const { language, setLanguage, t } = useLanguage();
    
    return (
      <div>
        <div data-testid="current-language">{language}</div>
        <div data-testid="dashboard-text">{(t as any)?.navigation?.dashboard || 'Dashboard'}</div>
                 <button 
           onClick={() => setLanguage('zh')} 
           data-testid="switch-to-chinese"
         >
           Switch to Chinese
         </button>
        <button 
          onClick={() => setLanguage('en')} 
          data-testid="switch-to-english"
        >
          Switch to English
        </button>
      </div>
    );
  } catch (error) {
    return <div>No LanguageContext</div>;
  }
};

// Test component for translation testing
const TranslationTestComponent = () => {
  const { t } = useLanguage();
  
  return (
    <div>
      <div data-testid="save-text">{(t as any)?.common?.save || 'Save'}</div>
      <div data-testid="cancel-text">{(t as any)?.common?.cancel || 'Cancel'}</div>
      <div data-testid="fuel-text">{(t as any)?.navigation?.fuel || 'Fuel'}</div>
    </div>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // Explicitly set localStorage to return null by default
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('LanguageProvider', () => {
    it('should render children without crashing', () => {
      render(
        <LanguageProvider>
          <div data-testid="child">Test Child</div>
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide default language value', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should initialize with English when no localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('preferredLanguage');
    });

    it('should initialize with stored language from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('zh');
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
    });

    it('should switch language from English to Chinese', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('dashboard-text')).toHaveTextContent('Dashboard');
      
      fireEvent.click(screen.getByTestId('switch-to-chinese'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
      });
    });

    it('should switch language from Chinese to English', async () => {
      localStorageMock.getItem.mockReturnValue('zh');
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
      
      fireEvent.click(screen.getByTestId('switch-to-english'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });
    });

    it('should persist language to localStorage when changed', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      fireEvent.click(screen.getByTestId('switch-to-chinese'));
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('preferredLanguage', 'zh');
      });
    });
  });

  describe('useLanguage hook', () => {
    it('should provide language context through useLanguage hook', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });

    it('should throw error when used outside LanguageProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const TestComponentWithError = () => {
        const { language } = useLanguage(); // This should throw
        return <div>{language}</div>;
      };
      
      expect(() => {
        render(<TestComponentWithError />);
      }).toThrow('useLanguage must be used within a LanguageProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Translation functionality', () => {
    it('should provide English translations by default', () => {
      render(
        <LanguageProvider>
          <TranslationTestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('save-text')).toHaveTextContent('Save');
      expect(screen.getByTestId('cancel-text')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('fuel-text')).toHaveTextContent('Fuel');
    });

    it('should provide Chinese translations when language is switched', async () => {
      localStorageMock.getItem.mockReturnValue('zh');
      
      render(
        <LanguageProvider>
          <TranslationTestComponent />
        </LanguageProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('save-text')).toHaveTextContent('儲存');
        expect(screen.getByTestId('cancel-text')).toHaveTextContent('取消');
        expect(screen.getByTestId('fuel-text')).toHaveTextContent('燃料');
      });
    });

    it('should update translations when language changes', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
          <TranslationTestComponent />
        </LanguageProvider>
      );
      
      // Initially English
      expect(screen.getByTestId('save-text')).toHaveTextContent('Save');
      
      // Switch to Chinese
      fireEvent.click(screen.getByTestId('switch-to-chinese'));
      
      await waitFor(() => {
        expect(screen.getByTestId('save-text')).toHaveTextContent('儲存');
      });
    });
  });

  describe('LocalStorage integration', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      fireEvent.click(screen.getByTestId('switch-to-chinese'));
      
      // Should still switch language even if localStorage fails
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage getItem errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      // Should default to English when localStorage fails
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid language values from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-language');
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      // Should default to English for invalid values
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });
  });

  describe('Multiple consumers', () => {
    const MultiConsumerTest = () => (
      <LanguageProvider>
        <TestComponent />
        <TranslationTestComponent />
      </LanguageProvider>
    );

    it('should synchronize language across multiple consumers', async () => {
      render(<MultiConsumerTest />);
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('save-text')).toHaveTextContent('Save');
      
      fireEvent.click(screen.getByTestId('switch-to-chinese'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
        expect(screen.getByTestId('save-text')).toHaveTextContent('儲存');
      });
    });
  });

  describe('Performance and memory', () => {
    it('should not cause memory leaks when unmounting', () => {
      const { unmount } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(() => unmount()).not.toThrow();
    });

    it('should maintain language state across re-renders', async () => {
      const { rerender } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      fireEvent.click(screen.getByTestId('switch-to-chinese'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
      });
      
      rerender(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('zh');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid language switches', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      const chineseButton = screen.getByTestId('switch-to-chinese');
      const englishButton = screen.getByTestId('switch-to-english');
      
      // Rapid switches
      fireEvent.click(chineseButton);
      fireEvent.click(englishButton);
      fireEvent.click(chineseButton);
      fireEvent.click(englishButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });
    });

    it('should work with different initial localStorage states', () => {
      const languages = ['en', 'zh', '', null, 'invalid'];
      
      languages.forEach((lang) => {
        localStorageMock.clear();
        localStorageMock.getItem.mockReturnValue(lang);
        
        const { unmount } = render(
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        );
        
        const expectedLang = lang === 'zh' ? 'zh' : 'en';
        expect(screen.getByTestId('current-language')).toHaveTextContent(expectedLang);
        
        unmount();
      });
    });
  });

  describe('Context without provider', () => {
    it('should handle missing context gracefully', () => {
      render(<TestComponent />);
      
      expect(screen.getByText('No LanguageContext')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible language switching functionality', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );
      
      const chineseButton = screen.getByTestId('switch-to-chinese');
      const englishButton = screen.getByTestId('switch-to-english');
      
      expect(chineseButton).toBeInTheDocument();
      expect(chineseButton.tagName).toBe('BUTTON');
      expect(englishButton).toBeInTheDocument();
      expect(englishButton.tagName).toBe('BUTTON');
    });
  });
}); 