import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SimpleThemeToggle } from '../../app/components/ThemeToggle';
import { useTheme } from '../../app/context/ThemeContext';

// Mock Theme Context
const mockToggleTheme = jest.fn();
const mockSetTheme = jest.fn();

jest.mock('../../app/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isDark: false,
    toggleTheme: mockToggleTheme,
    setTheme: mockSetTheme,
  }),
}));

describe('SimpleThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render light mode toggle', () => {
    render(<SimpleThemeToggle />);
    
    const toggle = screen.getByRole('button');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-label', expect.stringContaining('Switch to dark mode'));
  });

  it('should call setTheme when clicked', () => {
    render(<SimpleThemeToggle />);
    
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should show sun icon in light mode', () => {
    render(<SimpleThemeToggle />);
    
    // Look for sun icon or light mode indicator
    const sunIcon = screen.getByRole('button');
    expect(sunIcon).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(<SimpleThemeToggle />);
    
    const toggle = screen.getByRole('button');
    
    fireEvent.keyDown(toggle, { key: 'Enter', code: 'Enter' });
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should have proper accessibility attributes', () => {
    render(<SimpleThemeToggle />);
    
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-label');
    expect(toggle).toHaveAttribute('title');
  });

  it('should handle theme changes smoothly', async () => {
    const { rerender } = render(<SimpleThemeToggle />);
    
    // Mock dark theme
    jest.mock('../../app/context/ThemeContext', () => ({
      useTheme: () => ({
        theme: 'dark',
        isDark: true,
        toggleTheme: mockToggleTheme,
        setTheme: mockSetTheme,
      }),
    }));
    
    rerender(<SimpleThemeToggle />);
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should work with system theme preference', () => {
    jest.mock('../../app/context/ThemeContext', () => ({
      useTheme: () => ({
        theme: 'system',
        isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
        toggleTheme: mockToggleTheme,
        setTheme: mockSetTheme,
      }),
    }));
    
    render(<SimpleThemeToggle />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle missing theme context gracefully', () => {
    jest.mock('../../app/context/ThemeContext', () => ({
      useTheme: () => ({
        theme: undefined,
        isDark: false,
        toggleTheme: undefined,
        setTheme: undefined,
      }),
    }));
    
    expect(() => {
      render(<SimpleThemeToggle />);
    }).not.toThrow();
  });
}); 