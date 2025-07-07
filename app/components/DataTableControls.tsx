'use client';

import React from 'react';
import { TranslationType } from '../translations';

export interface SortOption {
  key: string;
  label: string;
  direction?: 'asc' | 'desc';
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'dateRange' | 'multiSelect';
  options?: { value: string; label: string }[];
  value?: string | { startDate?: string; endDate?: string };
}

interface DataTableControlsProps {
  t?: TranslationType | Record<string, string>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: string, direction: 'asc' | 'desc') => void;
  sortOptions: SortOption[];
  filters: FilterOption[];
  onFilterChange: (filterKey: string, value: string | { startDate?: string; endDate?: string }) => void;
  onResetFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  resultCount: number;
  totalCount: number;
}

export default function DataTableControls({
  t,
  searchTerm,
  onSearchChange,
  sortBy,
  sortDirection,
  onSortChange,
  sortOptions,
  filters,
  onFilterChange,
  onResetFilters,
  showFilters,
  onToggleFilters,
  resultCount,
  totalCount,
}: DataTableControlsProps) {
  // Helper function to safely get translation strings
  const getText = (key: string, fallback?: string): string => {
    if (t && typeof t[key] === 'string') {
      return t[key];
    }
    
    // Try nested access for common translation patterns
    const paths = [
      key,
      `common.${key}`,
      `actions.${key}`,
      `search.${key}`,
      `filter.${key}`,
    ];
    
    for (const path of paths) {
      const value = path.split('.').reduce((obj: any, prop: string) => obj?.[prop], t);
      if (typeof value === 'string') return value;
    }
    
    return fallback || key;
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortKey, direction] = e.target.value.split(':');
    onSortChange(sortKey, direction as 'asc' | 'desc');
  };

  const getSortValue = () => {
    return `${sortBy}:${sortDirection}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 border dark:border-gray-700 transition-colors">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder={getText('searchPlaceholder', 'Search entries...')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="sm:w-64">
          <select
            value={getSortValue()}
            onChange={handleSortChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {sortOptions.map((option) => (
              <React.Fragment key={option.key}>
                <option value={`${option.key}:asc`}>
                  {option.label} (A→Z)
                </option>
                <option value={`${option.key}:desc`}>
                  {option.label} (Z→A)
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={onToggleFilters}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showFilters || filters.some(f => f.value !== undefined && f.value !== null && f.value !== '')
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0111 22v-6.586a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z" />
          </svg>
          {getText('filters', 'Filters')}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t dark:border-gray-600 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {filter.label}
                </label>
                
                {filter.type === 'select' && filter.options && (
                  <select
                    value={typeof filter.value === 'string' ? filter.value : ''}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">{getText('allItems', 'All')}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'dateRange' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={typeof filter.value === 'object' && filter.value?.startDate || ''}
                      onChange={(e) => onFilterChange(filter.key, { 
                        ...(typeof filter.value === 'object' ? filter.value : {}), 
                        startDate: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder={getText('startDate', 'Start Date')}
                    />
                    <input
                      type="date"
                      value={typeof filter.value === 'object' && filter.value?.endDate || ''}
                      onChange={(e) => onFilterChange(filter.key, { 
                        ...(typeof filter.value === 'object' ? filter.value : {}), 
                        endDate: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder={getText('endDate', 'End Date')}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Reset Filters Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={onResetFilters}
                              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              {getText('resetFilters', 'Reset Filters')}
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
                    <div className="text-sm text-gray-700 dark:text-gray-400 mt-4">
        {searchTerm || filters.some(f => f.value !== undefined && f.value !== null && f.value !== '') ? (
          <span>
            {getText('showingResults', 'Showing')} {resultCount} {getText('of', 'of')} {totalCount} {getText('entries', 'entries')}
            {searchTerm && (
              <span className="ml-2">
                {getText('for', 'for')} &ldquo;<span className="font-medium">{searchTerm}</span>&rdquo;
              </span>
            )}
          </span>
        ) : (
          <span>
            {getText('totalEntries', 'Total')}: {totalCount} {getText('entries', 'entries')}
          </span>
        )}
      </div>
    </div>
  );
} 