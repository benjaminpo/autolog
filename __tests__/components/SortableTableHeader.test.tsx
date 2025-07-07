import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortableTableHeader from '../../app/components/SortableTableHeader';

describe('SortableTableHeader', () => {
  const defaultProps = {
    label: 'Test Column',
    sortKey: 'testKey',
    currentSortBy: '',
    currentSortDirection: 'asc' as const,
    onSort: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header with label', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Test Column')).toBeInTheDocument();
    });

    it('should apply default className', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      expect(header).toHaveClass('p-1', 'text-left');
    });

    it('should apply custom className', () => {
      render(<SortableTableHeader {...defaultProps} className="custom-class" />);
      
      const header = screen.getByRole('button');
      expect(header).toHaveClass('custom-class');
    });

    it('should show sort arrows', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      const arrows = header.querySelectorAll('svg');
      
      // Should have two arrows (up and down)
      expect(arrows).toHaveLength(2);
    });

    it('should be clickable', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      expect(header).toHaveClass('cursor-pointer');
    });
  });

  describe('Sorting States', () => {
    it('should show inactive state when not sorted', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="otherKey"
          currentSortDirection="asc"
        />
      );
      
      const header = screen.getByRole('button');
      const arrows = header.querySelectorAll('svg');
      
      // Both arrows should have inactive colors
      arrows.forEach(arrow => {
        expect(arrow).toHaveClass('text-gray-400', 'dark:text-gray-500');
        expect(arrow).not.toHaveClass('text-blue-600', 'dark:text-blue-400');
      });
    });

    it('should show active ascending state', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="testKey"
          currentSortDirection="asc"
        />
      );
      
      const header = screen.getByRole('button');
      const arrows = header.querySelectorAll('svg');
      const upArrow = arrows[0];
      const downArrow = arrows[1];
      
      // Up arrow should be active (blue)
      expect(upArrow).toHaveClass('text-blue-600', 'dark:text-blue-400');
      expect(upArrow).not.toHaveClass('text-gray-400');
      
      // Down arrow should be inactive (gray)
      expect(downArrow).toHaveClass('text-gray-400', 'dark:text-gray-500');
      expect(downArrow).not.toHaveClass('text-blue-600');
    });

    it('should show active descending state', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="testKey"
          currentSortDirection="desc"
        />
      );
      
      const header = screen.getByRole('button');
      const arrows = header.querySelectorAll('svg');
      const upArrow = arrows[0];
      const downArrow = arrows[1];
      
      // Up arrow should be inactive (gray)
      expect(upArrow).toHaveClass('text-gray-400', 'dark:text-gray-500');
      expect(upArrow).not.toHaveClass('text-blue-600');
      
      // Down arrow should be active (blue)
      expect(downArrow).toHaveClass('text-blue-600', 'dark:text-blue-400');
      expect(downArrow).not.toHaveClass('text-gray-400');
    });
  });

  describe('Click Handling', () => {
    it('should call onSort with ascending when clicking inactive column', () => {
      const mockOnSort = jest.fn();
      render(
        <SortableTableHeader
          {...defaultProps}
          onSort={mockOnSort}
          currentSortBy="otherKey"
        />
      );
      
      const header = screen.getByRole('button');
      fireEvent.click(header);
      
      expect(mockOnSort).toHaveBeenCalledWith('testKey', 'asc');
    });

    it('should toggle to descending when clicking active ascending column', () => {
      const mockOnSort = jest.fn();
      render(
        <SortableTableHeader
          {...defaultProps}
          onSort={mockOnSort}
          currentSortBy="testKey"
          currentSortDirection="asc"
        />
      );
      
      const header = screen.getByRole('button');
      fireEvent.click(header);
      
      expect(mockOnSort).toHaveBeenCalledWith('testKey', 'desc');
    });

    it('should toggle to ascending when clicking active descending column', () => {
      const mockOnSort = jest.fn();
      render(
        <SortableTableHeader
          {...defaultProps}
          onSort={mockOnSort}
          currentSortBy="testKey"
          currentSortDirection="desc"
        />
      );
      
      const header = screen.getByRole('button');
      fireEvent.click(header);
      
      expect(mockOnSort).toHaveBeenCalledWith('testKey', 'asc');
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attribute when not active', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="otherKey"
        />
      );
      
      const header = screen.getByRole('button');
      expect(header).toHaveAttribute('title', 'Sort by Test Column ascending');
    });

    it('should have proper title attribute when active ascending', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="testKey"
          currentSortDirection="asc"
        />
      );
      
      const header = screen.getByRole('button');
      expect(header).toHaveAttribute('title', 'Sort by Test Column descending');
    });

    it('should have proper title attribute when active descending', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="testKey"
          currentSortDirection="desc"
        />
      );
      
      const header = screen.getByRole('button');
      expect(header).toHaveAttribute('title', 'Sort by Test Column ascending');
    });

    it('should be keyboard accessible', () => {
      const mockOnSort = jest.fn();
      render(
        <SortableTableHeader
          {...defaultProps}
          onSort={mockOnSort}
        />
      );
      
      const header = screen.getByRole('button');
      
      // Test keyboard navigation
      header.focus();
      expect(header).toHaveFocus();
      
      // Test Enter key
      fireEvent.keyDown(header, { key: 'Enter' });
      expect(mockOnSort).toHaveBeenCalledWith('testKey', 'asc');
      
      // Test Space key
      fireEvent.keyDown(header, { key: ' ' });
      expect(mockOnSort).toHaveBeenCalledTimes(2);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          currentSortBy="testKey"
          currentSortDirection="asc"
        />
      );
      
      const header = screen.getByRole('button');
      
      // Should be focusable for keyboard users
      expect(header).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Visual States', () => {
    it('should have hover styles', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      expect(header).toHaveClass('hover:bg-gray-300', 'dark:hover:bg-gray-500');
    });

    it('should have transition styles', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      expect(header).toHaveClass('transition-colors');
    });

    it('should be non-selectable', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      expect(header).toHaveClass('select-none');
    });

    it('should have proper arrow positioning', () => {
      render(<SortableTableHeader {...defaultProps} />);
      
      const header = screen.getByRole('button');
      const arrowContainer = header.querySelector('.flex.flex-col');
      
      expect(arrowContainer).toBeInTheDocument();
      expect(arrowContainer).toHaveClass('ml-1');
      
      // Down arrow should have negative margin
      const downArrow = arrowContainer?.children[1];
      expect(downArrow).toHaveClass('-mt-1');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple columns with different states', () => {
      const { rerender } = render(
        <table>
          <thead>
            <tr>
              <SortableTableHeader
                {...defaultProps}
                label="Column 1"
                sortKey="col1"
                currentSortBy="col1"
                currentSortDirection="asc"
              />
              <SortableTableHeader
                {...defaultProps}
                label="Column 2"
                sortKey="col2"
                currentSortBy="col1"
                currentSortDirection="asc"
              />
            </tr>
          </thead>
        </table>
      );
      
      const headers = screen.getAllByRole('button');
      const col1Header = headers[0];
      const col2Header = headers[1];
      
      // Column 1 should be active
      const col1Arrows = col1Header.querySelectorAll('svg');
      expect(col1Arrows[0]).toHaveClass('text-blue-600');
      
      // Column 2 should be inactive
      const col2Arrows = col2Header.querySelectorAll('svg');
      expect(col2Arrows[0]).toHaveClass('text-gray-400');
      expect(col2Arrows[1]).toHaveClass('text-gray-400');
    });

    it('should handle rapid clicking', () => {
      const mockOnSort = jest.fn();
      render(
        <SortableTableHeader
          {...defaultProps}
          onSort={mockOnSort}
          currentSortBy="testKey"
          currentSortDirection="asc"
        />
      );
      
      const header = screen.getByRole('button');
      
      // Rapid clicks
      fireEvent.click(header);
      fireEvent.click(header);
      fireEvent.click(header);
      
      expect(mockOnSort).toHaveBeenCalledTimes(3);
      expect(mockOnSort).toHaveBeenNthCalledWith(1, 'testKey', 'desc');
      expect(mockOnSort).toHaveBeenNthCalledWith(2, 'testKey', 'desc');
      expect(mockOnSort).toHaveBeenNthCalledWith(3, 'testKey', 'desc');
    });

    it('should work with custom sort keys', () => {
      const mockOnSort = jest.fn();
      render(
        <SortableTableHeader
          {...defaultProps}
          onSort={mockOnSort}
          sortKey="custom.nested.key"
          currentSortBy="custom.nested.key"
          currentSortDirection="desc"
        />
      );
      
      const header = screen.getByRole('button');
      fireEvent.click(header);
      
      expect(mockOnSort).toHaveBeenCalledWith('custom.nested.key', 'asc');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      render(
        <SortableTableHeader
          {...defaultProps}
          label=""
        />
      );
      
      const header = screen.getByRole('button');
      expect(header).toBeInTheDocument();
      // Should still show arrows even with empty label
      expect(header.querySelectorAll('svg')).toHaveLength(2);
    });

    it('should handle long labels', () => {
      const longLabel = 'This is a very long column header label that might wrap or overflow';
      render(
        <SortableTableHeader
          {...defaultProps}
          label={longLabel}
        />
      );
      
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle missing onSort function gracefully', () => {
      const props = { ...defaultProps };
      delete (props as any).onSort;
      
      expect(() => {
        render(<SortableTableHeader {...props} />);
      }).not.toThrow();
    });
  });
}); 