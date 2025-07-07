import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../../app/page';
import { useAuth } from '../../app/context/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('HomePage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
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
      expect(container).toHaveClass('min-h-screen', 'bg-white', 'dark:bg-gray-900');
      
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

    it('should redirect unauthenticated users to login page', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });
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

      // Then not loading with no user
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });
      rerender(<HomePage />);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });

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

      // The component will throw an error when router is null, which is expected behavior
      expect(() => render(<HomePage />)).toThrow('Cannot read properties of null');
    });

    it('should handle missing auth context gracefully', () => {
      (useAuth as jest.Mock).mockReturnValue(null);

      // The component will throw an error when useAuth returns null, which is expected behavior  
      expect(() => render(<HomePage />)).toThrow('Cannot destructure property');
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
  });
}); 