import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthButton } from '../../app/components/AuthButton';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
});

// Mock the auth context
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../app/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
      });
    });

    it('should render login and register links when not authenticated', () => {
      render(<AuthButton />);
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should have correct hrefs for login and register links', () => {
      render(<AuthButton />);
      
      const loginLink = screen.getByText('Login');
      const registerLink = screen.getByText('Register');
      
      expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login');
      expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register');
    });

    it('should have proper styling for authentication links', () => {
      render(<AuthButton />);
      
      const loginLink = screen.getByText('Login');
      const registerLink = screen.getByText('Register');
      
      expect(loginLink.closest('a')).toHaveClass('bg-blue-600');
      expect(registerLink.closest('a')).toHaveClass('bg-gray-100');
    });
  });

  describe('when user is authenticated', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        logout: mockLogout,
      });
    });

    it('should render user name and dropdown button when authenticated', () => {
      render(<AuthButton />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show dropdown when button is clicked', async () => {
      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      fireEvent.click(dropdownButton);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should call logout when logout button is clicked', async () => {
      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      fireEvent.click(dropdownButton);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should have profile link with correct href', async () => {
      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      fireEvent.click(dropdownButton);
      
      const profileLink = screen.getByText('Profile');
      expect(profileLink.closest('a')).toHaveAttribute('href', '/profile');
    });

    it('should close dropdown when clicking outside', async () => {
      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      fireEvent.click(dropdownButton);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      
      // Click outside the dropdown
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when profile link is clicked', async () => {
      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      fireEvent.click(dropdownButton);
      
      const profileLink = screen.getByText('Profile');
      fireEvent.click(profileLink);
      
      await waitFor(() => {
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      });
    });
  });

  describe('when auth is loading', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        logout: mockLogout,
      });
    });

    it('should render loading skeleton when loading', () => {
      render(<AuthButton />);
      
      const loadingSkeleton = document.querySelector('.animate-pulse');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('should not render any buttons while loading', () => {
      render(<AuthButton />);
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { name: 'John Doe', email: 'john@example.com' },
        loading: false,
        logout: mockLogout,
      });
    });

    it('should hide user name on small screens', () => {
      render(<AuthButton />);
      
      const userName = screen.getByText('John Doe');
      expect(userName).toHaveClass('hidden', 'sm:inline');
    });

    it('should show dropdown properly on all screen sizes', async () => {
      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      fireEvent.click(dropdownButton);
      
      const dropdown = document.querySelector('.absolute');
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveClass('right-0');
    });
  });

  describe('accessibility', () => {
    it('should have proper focus management for dropdown', async () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'John Doe', email: 'john@example.com' },
        loading: false,
        logout: mockLogout,
      });

      render(<AuthButton />);
      
      const dropdownButton = screen.getByRole('button');
      expect(dropdownButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should have hover states for all interactive elements', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
      });

      render(<AuthButton />);
      
      const loginLink = screen.getByText('Login');
      const registerLink = screen.getByText('Register');
      
      expect(loginLink.closest('a')).toHaveClass('hover:bg-blue-700');
      expect(registerLink.closest('a')).toHaveClass('hover:bg-gray-200');
    });
  });
}); 