import { renderHook, act } from '@testing-library/react'
import { useDataTableFilters } from '../../app/hooks/useDataTableFilters'
import { SortOption, FilterOption } from '../../app/components/DataTableControls'

describe('useDataTableFilters', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@test.com', date: '2024-01-15', amount: 100, category: 'fuel' },
    { id: 2, name: 'Jane Smith', email: 'jane@test.com', date: '2024-01-10', amount: 200, category: 'maintenance' },
    { id: 3, name: 'Bob Wilson', email: 'bob@test.com', date: '2024-01-20', amount: 50, category: 'fuel' },
    { id: 4, name: 'Alice Brown', email: 'alice@test.com', date: '2024-01-05', amount: 150, category: 'insurance' }
  ]

  const mockSortOptions: SortOption[] = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Name' },
    { key: 'amount', label: 'Amount' }
  ]

  const mockFilterOptions: FilterOption[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'fuel', label: 'Fuel' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'insurance', label: 'Insurance' }
      ]
    },
    {
      key: 'date',
      label: 'Date Range',
      type: 'dateRange'
    }
  ]

  const defaultProps = {
    data: mockData,
    searchFields: ['name', 'email'] as (keyof typeof mockData[0])[],
    sortOptions: mockSortOptions,
    filterOptions: mockFilterOptions
  }

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      expect(result.current.searchTerm).toBe('')
      expect(result.current.sortBy).toBe('date')
      expect(result.current.sortDirection).toBe('desc')
      expect(result.current.showFilters).toBe(false)
      expect(result.current.filters).toEqual({})
      expect(result.current.totalCount).toBe(4)
      expect(result.current.resultCount).toBe(4)
      // Data should be sorted by date descending by default
      expect(result.current.filteredData[0].date).toBe('2024-01-20')
      expect(result.current.filteredData[1].date).toBe('2024-01-15')
      expect(result.current.filteredData[2].date).toBe('2024-01-10')
      expect(result.current.filteredData[3].date).toBe('2024-01-05')
    })

    it('should initialize with custom initial values', () => {
      const { result } = renderHook(() => 
        useDataTableFilters({
          ...defaultProps,
          initialSortBy: 'name',
          initialSortDirection: 'asc'
        })
      )

      expect(result.current.sortBy).toBe('name')
      expect(result.current.sortDirection).toBe('asc')
    })
  })

  describe('search functionality', () => {
    it('should filter data based on search term', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSearchTerm('john')
      })

      expect(result.current.searchTerm).toBe('john')
      expect(result.current.resultCount).toBe(1)
      expect(result.current.filteredData[0].name).toBe('John Doe')
    })

    it('should search across multiple fields', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSearchTerm('jane@test.com')
      })

      expect(result.current.resultCount).toBe(1)
      expect(result.current.filteredData[0].email).toBe('jane@test.com')
    })

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSearchTerm('JANE')
      })

      expect(result.current.resultCount).toBe(1)
      expect(result.current.filteredData[0].name).toBe('Jane Smith')
    })

    it('should return all data when search term is empty', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSearchTerm('john')
      })

      act(() => {
        result.current.setSearchTerm('')
      })

      expect(result.current.resultCount).toBe(4)
    })

    it('should handle null and undefined values in search fields', () => {
      const dataWithNulls = [
        { id: 1, name: null, email: 'test@test.com', date: '2024-01-15', amount: 100, category: 'fuel' },
        { id: 2, name: 'John', email: undefined, date: '2024-01-10', amount: 200, category: 'maintenance' }
      ]

      const { result } = renderHook(() => 
        useDataTableFilters({
          ...defaultProps,
          data: dataWithNulls
        })
      )

      act(() => {
        result.current.setSearchTerm('john')
      })

      expect(result.current.resultCount).toBe(1)
      expect(result.current.filteredData[0].name).toBe('John')
    })
  })

  describe('sorting functionality', () => {
    it('should sort by date in descending order by default', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      expect(result.current.filteredData[0].date).toBe('2024-01-20')
      expect(result.current.filteredData[3].date).toBe('2024-01-05')
    })

    it('should sort by date in ascending order', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSortDirection('asc')
      })

      expect(result.current.filteredData[0].date).toBe('2024-01-05')
      expect(result.current.filteredData[3].date).toBe('2024-01-20')
    })

    it('should sort by string field', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.handleSortChange('name', 'asc')
      })

      expect(result.current.sortBy).toBe('name')
      expect(result.current.sortDirection).toBe('asc')
      expect(result.current.filteredData[0].name).toBe('Alice Brown')
      expect(result.current.filteredData[3].name).toBe('John Doe')
    })

    it('should sort by number field', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.handleSortChange('amount', 'asc')
      })

      expect(result.current.filteredData[0].amount).toBe(50)
      expect(result.current.filteredData[3].amount).toBe(200)
    })

    it('should handle string comparison case-insensitively', () => {
      const dataWithMixedCase = [
        { id: 1, name: 'alice', email: 'alice@test.com', date: '2024-01-15', amount: 100, category: 'fuel' },
        { id: 2, name: 'Bob', email: 'bob@test.com', date: '2024-01-10', amount: 200, category: 'maintenance' }
      ]

      const { result } = renderHook(() => 
        useDataTableFilters({
          ...defaultProps,
          data: dataWithMixedCase
        })
      )

      act(() => {
        result.current.handleSortChange('name', 'asc')
      })

      expect(result.current.filteredData[0].name).toBe('alice')
      expect(result.current.filteredData[1].name).toBe('Bob')
    })
  })

  describe('filter functionality', () => {
    it('should filter by select option', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.updateFilter('category', 'fuel')
      })

      expect(result.current.resultCount).toBe(2)
      expect(result.current.filteredData.every(item => item.category === 'fuel')).toBe(true)
    })

    it('should filter by date range', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.updateFilter('date', {
          startDate: '2024-01-10',
          endDate: '2024-01-15'
        })
      })

      expect(result.current.resultCount).toBe(2)
      const dates = result.current.filteredData.map(item => item.date)
      expect(dates).toContain('2024-01-10')
      expect(dates).toContain('2024-01-15')
    })

    it('should filter by date range with only start date', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.updateFilter('date', {
          startDate: '2024-01-15',
          endDate: null
        })
      })

      expect(result.current.resultCount).toBe(2)
      expect(result.current.filteredData.every(item => new Date(item.date) >= new Date('2024-01-15'))).toBe(true)
    })

    it('should filter by date range with only end date', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.updateFilter('date', {
          startDate: null,
          endDate: '2024-01-15'
        })
      })

      expect(result.current.resultCount).toBe(3)
      expect(result.current.filteredData.every(item => new Date(item.date) <= new Date('2024-01-15'))).toBe(true)
    })

    it('should filter by multi-select', () => {
      const multiSelectFilterOptions: FilterOption[] = [
        {
          key: 'category',
          label: 'Categories Multi',
          type: 'multiSelect',
          options: [
            { value: 'fuel', label: 'Fuel' },
            { value: 'maintenance', label: 'Maintenance' }
          ]
        }
      ]

      const { result } = renderHook(() => 
        useDataTableFilters({
          ...defaultProps,
          filterOptions: multiSelectFilterOptions
        })
      )

      act(() => {
        result.current.updateFilter('category', ['fuel', 'maintenance'])
      })

      expect(result.current.resultCount).toBe(3)
      expect(result.current.filteredData.every(item => 
        ['fuel', 'maintenance'].includes(item.category)
      )).toBe(true)
    })

    it('should clear filter when value is empty string', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.updateFilter('category', 'fuel')
      })

      expect(result.current.resultCount).toBe(2)

      act(() => {
        result.current.updateFilter('category', '')
      })

      expect(result.current.resultCount).toBe(4)
      expect(result.current.filters.category).toBeUndefined()
    })

    it('should handle unknown filter types gracefully', () => {
      const filterWithUnknownType: FilterOption[] = [
        {
          key: 'unknown',
          label: 'Unknown',
          type: 'unknownType' as any
        }
      ]

      const { result } = renderHook(() => 
        useDataTableFilters({
          ...defaultProps,
          filterOptions: filterWithUnknownType
        })
      )

      act(() => {
        result.current.updateFilter('unknown', 'someValue')
      })

      expect(result.current.resultCount).toBe(4) // Should return all data
    })
  })

  describe('combined functionality', () => {
    it('should apply search, filter, and sort together', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSearchTerm('test.com')
        result.current.updateFilter('category', 'fuel')
        result.current.handleSortChange('amount', 'asc')
      })

      expect(result.current.resultCount).toBe(2)
      expect(result.current.filteredData[0].amount).toBe(50) // Sorted by amount asc
      expect(result.current.filteredData[1].amount).toBe(100)
      expect(result.current.filteredData.every(item => 
        item.category === 'fuel' && item.email.includes('test.com')
      )).toBe(true)
    })
  })

  describe('utility functions', () => {
    it('should reset all filters and search', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      act(() => {
        result.current.setSearchTerm('john')
        result.current.updateFilter('category', 'fuel')
      })

      expect(result.current.resultCount).toBe(1)

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.searchTerm).toBe('')
      expect(result.current.filters).toEqual({})
      expect(result.current.resultCount).toBe(4)
    })

    it('should toggle show filters', () => {
      const { result } = renderHook(() => useDataTableFilters(defaultProps))

      expect(result.current.showFilters).toBe(false)

      act(() => {
        result.current.setShowFilters(true)
      })

      expect(result.current.showFilters).toBe(true)
    })

    it('should handle empty data array', () => {
      const { result } = renderHook(() => 
        useDataTableFilters({
          ...defaultProps,
          data: []
        })
      )

      expect(result.current.totalCount).toBe(0)
      expect(result.current.resultCount).toBe(0)
      expect(result.current.filteredData).toEqual([])
    })
  })
}) 