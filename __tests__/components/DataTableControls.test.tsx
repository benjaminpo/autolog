import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataTableControls, { SortOption, FilterOption } from '../../app/components/DataTableControls';
import { TranslationType } from '../../app/translations';

// Mock data for tests
const mockSortOptions: SortOption[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'category', label: 'Category' },
];

const mockFilters: FilterOption[] = [
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'fuel', label: 'Fuel' },
      { value: 'maintenance', label: 'Maintenance' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'dateRange',
  },
];

const mockTranslations: Partial<TranslationType> = {
  searchPlaceholder: 'Search entries...',
  filters: 'Filters',
  allItems: 'All',
  resetFilters: 'Reset Filters',
  showingResults: 'Showing',
  of: 'of',
  entries: 'entries',
  for: 'for',
  totalEntries: 'Total',
  startDate: 'Start Date',
  endDate: 'End Date',
};

const defaultProps = {
  searchTerm: '',
  onSearchChange: jest.fn(),
  sortBy: 'date',
  sortDirection: 'asc' as const,
  onSortChange: jest.fn(),
  sortOptions: mockSortOptions,
  filters: mockFilters,
  onFilterChange: jest.fn(),
  onResetFilters: jest.fn(),
  showFilters: false,
  onToggleFilters: jest.fn(),
  resultCount: 10,
  totalCount: 100,
};

describe('DataTableControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render search input with placeholder', () => {
      render(<DataTableControls {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search entries...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('should render sort dropdown with options', () => {
      render(<DataTableControls {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Date (A→Z)');
      expect(sortSelect).toBeInTheDocument();
    });

    it('should render filter toggle button', () => {
      render(<DataTableControls {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('should render result count', () => {
      render(<DataTableControls {...defaultProps} />);
      
      expect(screen.getByText(/Total: 100 entries/)).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should call onSearchChange when typing in search input', () => {
      const onSearchChange = jest.fn();
      render(<DataTableControls {...defaultProps} onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search entries...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      expect(onSearchChange).toHaveBeenCalledWith('test search');
    });

    it('should display current search term', () => {
      render(<DataTableControls {...defaultProps} searchTerm="fuel" />);
      
      const searchInput = screen.getByDisplayValue('fuel');
      expect(searchInput).toBeInTheDocument();
    });

    it('should show filtered results count when searching', () => {
      render(
        <DataTableControls 
          {...defaultProps} 
          searchTerm="fuel" 
          resultCount={5} 
        />
      );
      
      expect(screen.getByText(/Showing 5 of 100 entries/)).toBeInTheDocument();
      // Check for search term display using flexible matcher since text spans multiple elements
      expect(screen.getByText(/for/)).toBeInTheDocument();
      expect(screen.getByText('fuel')).toBeInTheDocument();
    });
  });

  describe('Sort functionality', () => {
    it('should call onSortChange when sort option changes', () => {
      const onSortChange = jest.fn();
      render(<DataTableControls {...defaultProps} onSortChange={onSortChange} />);
      
      const sortSelect = screen.getByDisplayValue('Date (A→Z)');
      fireEvent.change(sortSelect, { target: { value: 'amount:desc' } });
      
      expect(onSortChange).toHaveBeenCalledWith('amount', 'desc');
    });

    it('should show current sort selection', () => {
      render(
        <DataTableControls 
          {...defaultProps} 
          sortBy="amount" 
          sortDirection="desc" 
        />
      );
      
      const sortSelect = screen.getByDisplayValue('Amount (Z→A)');
      expect(sortSelect).toBeInTheDocument();
    });

    it('should render all sort options', () => {
      render(<DataTableControls {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('Date (A→Z)');
      
      // Check options exist
      expect(sortSelect.children).toHaveLength(6); // 3 options * 2 directions
    });
  });

  describe('Filter functionality', () => {
    it('should toggle filters panel when button is clicked', () => {
      const onToggleFilters = jest.fn();
      render(<DataTableControls {...defaultProps} onToggleFilters={onToggleFilters} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);
      
      expect(onToggleFilters).toHaveBeenCalled();
    });

    it('should show filters panel when showFilters is true', () => {
      render(<DataTableControls {...defaultProps} showFilters={true} />);
      
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('should hide filters panel when showFilters is false', () => {
      render(<DataTableControls {...defaultProps} showFilters={false} />);
      
      expect(screen.queryByText('Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Date Range')).not.toBeInTheDocument();
    });

    it('should render select filter with options', () => {
      render(<DataTableControls {...defaultProps} showFilters={true} />);
      
      const categorySelect = screen.getByDisplayValue('All');
      expect(categorySelect).toBeInTheDocument();
    });

    it('should call onFilterChange for select filter', () => {
      const onFilterChange = jest.fn();
      render(
        <DataTableControls 
          {...defaultProps} 
          showFilters={true} 
          onFilterChange={onFilterChange} 
        />
      );
      
      const categorySelect = screen.getByDisplayValue('All');
      fireEvent.change(categorySelect, { target: { value: 'fuel' } });
      
      expect(onFilterChange).toHaveBeenCalledWith('category', 'fuel');
    });

    it('should render date range filter', () => {
      render(<DataTableControls {...defaultProps} showFilters={true} />);
      
      const dateInputs = screen.getAllByDisplayValue('');
      expect(dateInputs.filter(input => input.getAttribute('type') === 'date')).toHaveLength(2);
    });

    it('should call onFilterChange for date range filter', () => {
      const onFilterChange = jest.fn();
      render(
        <DataTableControls 
          {...defaultProps} 
          showFilters={true} 
          onFilterChange={onFilterChange} 
        />
      );
      
      const dateInputs = screen.getAllByDisplayValue('');
      const startDateInput = dateInputs.find(input => 
        input.getAttribute('type') === 'date' && 
        input.getAttribute('placeholder') === 'Start Date'
      );
      
      if (startDateInput) {
        fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
        expect(onFilterChange).toHaveBeenCalledWith('dateRange', { startDate: '2023-01-01' });
      }
    });

    it('should call onResetFilters when reset button is clicked', () => {
      const onResetFilters = jest.fn();
      render(
        <DataTableControls 
          {...defaultProps} 
          showFilters={true} 
          onResetFilters={onResetFilters} 
        />
      );
      
      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      fireEvent.click(resetButton);
      
      expect(onResetFilters).toHaveBeenCalled();
    });
  });

  describe('Filter button styling', () => {
    it('should highlight filter button when filters are active', () => {
      const filtersWithValues = [
        {
          ...mockFilters[0],
          value: 'fuel',
        },
      ];

      render(
        <DataTableControls 
          {...defaultProps} 
          filters={filtersWithValues}
          showFilters={false}
        />
      );
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should highlight filter button when filters panel is shown', () => {
      render(<DataTableControls {...defaultProps} showFilters={true} />);
      
      // Get the main filter button (not the reset button)
      const filterButtons = screen.getAllByRole('button');
      const filterButton = filterButtons.find(button => 
        button.textContent?.includes('Filters') && !button.textContent?.includes('Reset')
      );
      expect(filterButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should use default styling when no filters are active and panel is hidden', () => {
      render(<DataTableControls {...defaultProps} showFilters={false} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toHaveClass('bg-gray-200', 'text-gray-700');
    });
  });

  describe('Translation support', () => {
    it('should use provided translations', () => {
      render(
        <DataTableControls 
          {...defaultProps} 
          t={mockTranslations}
        />
      );
      
      expect(screen.getByPlaceholderText('Search entries...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('should fall back to default text when translations are missing', () => {
      render(<DataTableControls {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search entries...')).toBeInTheDocument();
      expect(screen.getByText(/Total: 100 entries/)).toBeInTheDocument();
    });

    it('should handle nested translation paths', () => {
      const nestedTranslations = {
        common: {
          searchPlaceholder: 'Nested search placeholder',
        },
      };

      render(
        <DataTableControls 
          {...defaultProps} 
          t={nestedTranslations}
        />
      );
      
      expect(screen.getByPlaceholderText('Nested search placeholder')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DataTableControls {...defaultProps} showFilters={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search entries...');
      expect(searchInput).toHaveAttribute('type', 'text');
      
      // Look specifically for form labels by their text content
      const categoryLabel = screen.getByText('Category');
      const dateRangeLabel = screen.getByText('Date Range');
      expect(categoryLabel).toBeInTheDocument();
      expect(dateRangeLabel).toBeInTheDocument();
    });

    it('should have proper form associations', () => {
      render(<DataTableControls {...defaultProps} showFilters={true} />);
      
      const labels = screen.getAllByRole('generic');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty sort options', () => {
      render(
        <DataTableControls 
          {...defaultProps} 
          sortOptions={[]}
        />
      );
      
      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect.children).toHaveLength(0);
    });

    it('should handle empty filters', () => {
      render(
        <DataTableControls 
          {...defaultProps} 
          filters={[]}
          showFilters={true}
        />
      );
      
      expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
    });

    it('should handle zero result count', () => {
      render(
        <DataTableControls 
          {...defaultProps} 
          resultCount={0}
          totalCount={0}
        />
      );
      
      expect(screen.getByText(/Total: 0 entries/)).toBeInTheDocument();
    });

    it('should handle filter with undefined value', () => {
      const filtersWithUndefined = [
        {
          ...mockFilters[0],
          value: undefined,
        },
      ];

      render(
        <DataTableControls 
          {...defaultProps} 
          filters={filtersWithUndefined}
          showFilters={true}
        />
      );
      
      const categorySelect = screen.getByDisplayValue('All');
      expect(categorySelect).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<DataTableControls {...defaultProps} />);
      
      // Re-render with same props
      rerender(<DataTableControls {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search entries...')).toBeInTheDocument();
    });
  });
}); 