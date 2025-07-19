'use client';

import { useState, useMemo, useCallback } from 'react';
import { FilterOption } from '../components/DataTableControls';

interface UseDataTableFiltersProps<T> {
  data: T[];
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
  searchFields: (keyof T)[];
  filterOptions: FilterOption[];
}

interface UseDataTableFiltersReturn<T> {
  // State
  searchTerm: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  showFilters: boolean;
  filters: Record<string, any>;

  // Computed data
  filteredData: T[];
  totalCount: number;
  resultCount: number;

  // Actions
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  setShowFilters: (show: boolean) => void;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  handleSortChange: (sortBy: string, direction: 'asc' | 'desc') => void;
}

export function useDataTableFilters<T extends Record<string, any>>({
  data,
  initialSortBy = 'date',
  initialSortDirection = 'desc',
  searchFields,
  filterOptions,
}: UseDataTableFiltersProps<T>): UseDataTableFiltersReturn<T> {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Update filter function
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  }, []);

  // Reset filters function
  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: string, direction: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDirection(direction);
  }, []);

  // Search function
  const searchData = useCallback((items: T[], term: string): T[] => {
    if (!term.trim()) return items;

    const searchLower = term.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [searchFields]);

  // Filter function
  const filterData = useCallback((items: T[]): T[] => {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;

        const filterOption = filterOptions.find(opt => opt.key === key);
        if (!filterOption) return true;

        switch (filterOption.type) {
          case 'select':
            return item[key as keyof T] === value;

          case 'dateRange':
            if (!value.startDate && !value.endDate) return true;
            const itemDate = new Date(item[key as keyof T] as string);
            const startDate = value.startDate ? new Date(value.startDate) : null;
            const endDate = value.endDate ? new Date(value.endDate) : null;

            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            return true;

          case 'multiSelect':
            if (!Array.isArray(value) || value.length === 0) return true;
            return value.includes(item[key as keyof T]);

          default:
            return true;
        }
      });
    });
  }, [filters, filterOptions]);

  // Sort function
  const sortData = useCallback((items: T[]): T[] => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      let aValue: any = a[sortBy as keyof T];
      let bValue: any = b[sortBy as keyof T];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // For date strings, convert to Date objects for proper comparison
        if (sortBy === 'date' || aValue.match(/^\d{4}-\d{2}-\d{2}/)) {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else {
          // Case-insensitive string comparison
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle strings and fallback
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortBy, sortDirection]);

  // Compute filtered and sorted data
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    result = searchData(result, searchTerm);

    // Apply filters
    result = filterData(result);

    // Apply sorting
    result = sortData(result);

    return result;
  }, [data, searchTerm, searchData, filterData, sortData]);

  return {
    // State
    searchTerm,
    sortBy,
    sortDirection,
    showFilters,
    filters,

    // Computed data
    filteredData,
    totalCount: data.length,
    resultCount: filteredData.length,

    // Actions
    setSearchTerm,
    setSortBy,
    setSortDirection,
    setShowFilters,
    updateFilter,
    resetFilters,
    handleSortChange,
  };
}
