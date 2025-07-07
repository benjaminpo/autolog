import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Unmock the ThemeContext to use the real implementation
jest.unmock('../../app/context/ThemeContext');

import { ThemeProvider, useTheme } from '../../app/context/ThemeContext';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Next.js theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test component that uses useTheme hook
const TestComponent = () => {
  try {
    const { theme, isDark, toggleTheme } = useTheme();
    
    return (
      <div>
        <div data-testid="current-theme">{theme}</div>
        <div data-testid="is-dark">{isDark?.toString() || 'false'}</div>
        <button onClick={toggleTheme} data-testid="toggle-button">
          Toggle Theme
        </button>
      </div>
    );
  } catch (error) {
    return <div>No ThemeContext</div>;
  }
};

// Test component using useTheme hook
const HookTestComponent = () => {
  try {
    const { theme, isDark, toggleTheme } = useTheme();
    
    return (
      <div>
        <div data-testid="hook-theme">{theme}</div>
        <div data-testid="hook-is-dark">{isDark?.toString() || 'false'}</div>
        <button onClick={toggleTheme} data-testid="hook-toggle">
          Toggle
        </button>
      </div>
    );
  } catch (error) {
    return <div>Hook Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    
    // Explicitly set localStorage to return null by default
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('ThemeProvider', () => {
    it('should render children without crashing', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Test Child</div>
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide default theme value', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    });

    it('should initialize with system theme when no localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    });

    it('should initialize with stored theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should toggle theme from system to dark', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      });
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });

    it('should toggle theme from dark to light', async () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });
    });

    it('should persist theme to localStorage when toggled', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
    });

    it('should persist multiple theme toggles correctly', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      // Toggle to dark (from system which appears as light)
      fireEvent.click(screen.getByTestId('toggle-button'));
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
      
      // Toggle back to light
      fireEvent.click(screen.getByTestId('toggle-button'));
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });
    });
  });

  describe('useTheme hook', () => {
    it('should provide theme context through useTheme hook', () => {
      render(
        <ThemeProvider>
          <HookTestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('hook-theme')).toHaveTextContent('system');
    });

    it('should allow theme toggling through useTheme hook', async () => {
      render(
        <ThemeProvider>
          <HookTestComponent />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-theme')).toHaveTextContent('system');
      });
      
      fireEvent.click(screen.getByTestId('hook-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-theme')).toHaveTextContent('dark');
      });
    });

    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<HookTestComponent />);
      
      expect(screen.getByText('Hook Error: useTheme must be used within a ThemeProvider')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Context without provider', () => {
    it('should render "No ThemeContext" when context is not available', () => {
      render(<TestComponent />);
      
      expect(screen.getByText('No ThemeContext')).toBeInTheDocument();
    });
  });

  describe('LocalStorage integration', () => {
    it('should handle localStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      
      // Should still toggle theme even if localStorage fails
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage getItem errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      // Should default to system theme when localStorage fails
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid theme values from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      // Should default to system theme for invalid values
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    });
  });

  describe('Multiple consumers', () => {
    const MultiConsumerTest = () => (
      <ThemeProvider>
        <TestComponent />
        <HookTestComponent />
      </ThemeProvider>
    );

    it('should synchronize theme across multiple consumers', async () => {
      render(<MultiConsumerTest />);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
        expect(screen.getByTestId('hook-theme')).toHaveTextContent('system');
      });
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('hook-theme')).toHaveTextContent('dark');
      });
    });

    it('should maintain state consistency when toggling from different consumers', async () => {
      render(<MultiConsumerTest />);
      
      fireEvent.click(screen.getByTestId('hook-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('hook-theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('Performance and memory', () => {
    it('should not cause memory leaks when unmounting', () => {
      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      unmount();
      
      // No assertions needed, just ensuring no errors during unmount
    });

    it('should maintain theme state across re-renders', async () => {
      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
      
      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid theme toggles', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      // Rapid toggles
      fireEvent.click(screen.getByTestId('toggle-button'));
      fireEvent.click(screen.getByTestId('toggle-button'));
      fireEvent.click(screen.getByTestId('toggle-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });

    it('should work with different initial localStorage states', async () => {
      const themes = ['light', 'dark', 'system', null];
      
      for (const theme of themes) {
        localStorageMock.getItem.mockReturnValue(theme);
        
        const { unmount } = render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        );
        
        const expectedTheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'system';
        await waitFor(() => {
          expect(screen.getByTestId('current-theme')).toHaveTextContent(expectedTheme);
        });
        
        unmount();
      }
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible theme toggle functionality', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      const toggleButton = screen.getByTestId('toggle-button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton.tagName).toBe('BUTTON');
    });
  });
}); 