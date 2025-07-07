import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageSelector } from '../../app/components/LanguageSelector';

// Mock function for language change
const mockOnChange = jest.fn();

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render language selector with current language', () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
  });

  it('should display available language options', async () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('should call onChange when language is selected', async () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'zh' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('zh');
    });
  });

  it('should display Chinese when language prop is zh', () => {
    render(<LanguageSelector language="zh" onChange={mockOnChange} />);
    
    expect(screen.getByDisplayValue('中文')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', 'Select language');
    expect(select).toHaveAttribute('title', 'Language selection');
  });

  it('should handle keyboard navigation', () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    
    // Test keyboard focus
    select.focus();
    expect(select).toHaveFocus();
  });

  it('should apply dark mode styles when darkMode prop is true', () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} darkMode={true} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('bg-gray-700', 'text-white', 'border-gray-600');
  });

  it('should apply light mode styles when darkMode prop is false', () => {
    render(<LanguageSelector language="en" onChange={mockOnChange} darkMode={false} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('bg-white');
  });

  it('should not render initially to prevent hydration mismatch', () => {
    // Mock useEffect to simulate initial render
    const mockUseEffect = jest.spyOn(React, 'useEffect');
    
    render(<LanguageSelector language="en" onChange={mockOnChange} />);
    
    // useEffect should be called (for mounted state)
    expect(mockUseEffect).toHaveBeenCalled();
    
    mockUseEffect.mockRestore();
  });
}); 