'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { currencies, expenseCategories } from '../lib/vehicleData';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useDataTableFilters } from '../hooks/useDataTableFilters';
import DataTableControls, { SortOption, FilterOption } from './DataTableControls';
import SortableTableHeader from './SortableTableHeader';
import ImageModal from './ImageModal';
import { TranslationType } from '../translations';

interface Car {
  id?: string;
  _id?: string;
  name: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  photo: string;
  dateAdded: string;
}

interface IncomeEntry {
  id?: string;
  _id?: string;
  carId: string;
  category: typeof expenseCategories[number];
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
  images: string[];
}

interface IncomeTabProps {
  t?: TranslationType | Record<string, string>;
  cars: Car[];
  incomes: IncomeEntry[];
  showIncomeDetails: string | null;
  itemsPerPage: number;
  setShowIncomeDetails: (id: string | null) => void;
  startEditingIncome?: (income: IncomeEntry) => void;
  deleteIncome?: (id: string) => void;
  updateIncome?: (income: IncomeEntry) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export default function IncomeTab({
  t,
  cars,
  incomes,
  showIncomeDetails,
  itemsPerPage,
  setShowIncomeDetails,
  startEditingIncome,
  deleteIncome,
  onLoadMore,
  hasMore = false,
  loading = false,
}: IncomeTabProps) {
  // State for image modal
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    altText: string;
  }>({
    isOpen: false,
    imageSrc: '',
    altText: '',
  });

  // Helper function to translate income categories
  const getCategoryTranslation = (category: string): string => {
    // Convert category name to camelCase format that matches translation keys
    // Examples: "Ride Sharing" -> "rideSharing", "Delivery Services" -> "deliveryServices"
    const camelCaseKey = category
      .toLowerCase()
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // Try to get translation from income.labels namespace
    const translation = (t as any)?.income?.labels?.[camelCaseKey];
    if (typeof translation === 'string') {
      return translation;
    }
    
    // Fallback to original category name
    return category;
  };

  // Define sort options for income entries
  const sortOptions: SortOption[] = [
    { key: 'date', label: (t as any)?.date || 'Date' },
    { key: 'amount', label: (t as any)?.amount || 'Amount' },
    { key: 'category', label: (t as any)?.category || 'Category' },
  ];

  // Define filter options for income entries
  const filterOptions: FilterOption[] = [
    {
      key: 'carId',
      label: (t as any)?.car || 'Vehicle',
      type: 'select',
      options: cars.map(car => ({ value: car.id || car._id || '', label: car.name })),
    },
    {
      key: 'category',
      label: (t as any)?.category || 'Category',
      type: 'select',
      options: [...new Set(incomes.map(income => income.category))]
        .filter(Boolean)
        .map(category => ({ value: category, label: getCategoryTranslation(category) })),
    },
    {
      key: 'date',
      label: (t as any)?.dateRange || 'Date Range',
      type: 'dateRange',
    },
  ];

  // Use the data table filters hook
  const {
    searchTerm,
    sortBy,
    sortDirection,
    showFilters,
    filteredData,
    totalCount,
    resultCount,
    setSearchTerm,
    setShowFilters,
    updateFilter,
    resetFilters,
    handleSortChange,
    filters,
  } = useDataTableFilters({
    data: incomes,
    initialSortBy: 'date',
    initialSortDirection: 'desc',
    searchFields: ['category', 'notes'],
    sortOptions,
    filterOptions,
  });

  // Use infinite scroll hook with filtered data
  const { visibleItems: visibleIncomes, canLoadMore, loadingRef } = useInfiniteScroll({
    items: filteredData,
    itemsPerPage,
    hasMore,
    onLoadMore,
    loading
  });

  const getCarName = (carId: string): string => {
    const car = cars.find(c => (c.id === carId || c._id === carId));
    return car ? car.name : 'Unknown Vehicle';
  };

  const IncomeTable = () => (
    <table className="w-full text-xs sm:text-sm">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-600">
          <SortableTableHeader
            label={(t as any)?.car || 'Vehicle'}
            sortKey="carId"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={t as any}
          />
          <SortableTableHeader
            label={(t as any)?.date || 'Date'}
            sortKey="date"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={t as any}
          />
          <SortableTableHeader
            label={(t as any)?.category || 'Category'}
            sortKey="category"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={t as any}
          />
          <SortableTableHeader
            label={(t as any)?.amount || 'Amount'}
            sortKey="amount"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={t as any}
          />
          <th className="p-1 text-left text-gray-900 dark:text-gray-100">{(t as any)?.actions?.actions || 'Actions'}</th>
        </tr>
      </thead>
      <tbody>
        {visibleIncomes && visibleIncomes.length > 0 ? visibleIncomes.map((income) => {
          const incomeId = income.id || income._id || '';
          return (
            <React.Fragment key={`income-fragment-${incomeId}`}>
              <tr className={showIncomeDetails === incomeId ? "bg-green-50 dark:bg-green-900/30" : ""}>
                <td className="p-1 text-gray-900 dark:text-gray-100">
                  {getCarName(income.carId)}
                </td>
                <td className="p-1 text-gray-900 dark:text-gray-100">{income.date}</td>
                <td className="p-1 text-gray-900 dark:text-gray-100">
                  {getCategoryTranslation(String(income.category))}
                </td>
                <td className="p-1 text-gray-900 dark:text-gray-100">
                  {income.amount} {income.currency}
                </td>
                <td className="p-1 flex gap-1">
                  <button
                    onClick={() => setShowIncomeDetails(showIncomeDetails === incomeId ? null : incomeId)}
                    className={`px-2 py-1 rounded text-white text-xs ${
                      showIncomeDetails === incomeId
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-500 hover:bg-gray-600"
                    }`}
                  >
                    {showIncomeDetails === incomeId ? ((t as any)?.actions?.hide || 'Hide') : ((t as any)?.actions?.showMore || 'Show More')}
                  </button>
                  {startEditingIncome && (
                    <button
                      onClick={() => startEditingIncome(income)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                    >
                      {(t as any)?.actions?.edit || 'Edit'}
                    </button>
                  )}
                  {deleteIncome && (
                    <button
                      onClick={() => deleteIncome(incomeId)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                    >
                      {(t as any)?.actions?.delete || 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
              {/* Inline details row */}
              {showIncomeDetails === incomeId && (
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <td colSpan={5} className="p-3">
                    <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-3 transition-colors">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                        {(t as any)?.incomeDetails || 'Income Details'}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                        {Object.entries(income).map(([key, value]) => {
                          // Filter out internal fields, only show user-relevant data
                          if (key === 'id' || key === 'carId' || key === '_id' || key === 'userId' || key === '__v') {
                            return null;
                          }

                          // Map field keys to their proper translation paths
                          const getFieldLabel = (fieldKey: string) => {
                            switch (fieldKey) {
                              case 'category':
                                return (t as any)?.income?.labels?.category || (t as any)?.category || 'Category';
                              case 'amount':
                                return (t as any)?.income?.labels?.amount || (t as any)?.amount || 'Amount';
                              case 'currency':
                                return (t as any)?.payment?.currency || (t as any)?.currency || 'Currency';
                              case 'date':
                                return (t as any)?.form?.fields?.date || (t as any)?.date || 'Date';
                              case 'notes':
                                return (t as any)?.form?.fields?.notes || (t as any)?.notes || 'Notes';
                              case 'createdAt':
                                return (t as any)?.income?.labels?.createdAt || 'Created At';
                              case 'updatedAt':
                                return (t as any)?.income?.labels?.updatedAt || 'Updated At';
                              default:
                                return fieldKey;
                            }
                          };

                          // Format timestamp fields to human-readable format
                          const formatValue = (fieldKey: string, fieldValue: any) => {
                            if (fieldValue == null) return '';
                            
                            if (fieldKey === 'images') {
                              if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                                return (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                    {fieldValue.map((image, index) => (
                                      <div key={index} className="relative">
                                        <Image
                                          src={image}
                                          alt={`Income image ${index + 1}`}
                                          width={80}
                                          height={80}
                                          className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                          unoptimized={true}
                                          onClick={() => setImageModal({
                                            isOpen: true,
                                            imageSrc: image,
                                            altText: `Income image ${index + 1}`,
                                          })}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                            Click to enlarge
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return 'No images';
                            }
                            
                            // Handle category translation
                            if (fieldKey === 'category') {
                              return getCategoryTranslation(String(fieldValue));
                            }
                            
                            // Format timestamp fields
                            if ((fieldKey === 'createdAt' || fieldKey === 'updatedAt') && fieldValue) {
                              try {
                                const date = new Date(fieldValue);
                                return date.toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                });
                              } catch (error) {
                                return String(fieldValue);
                              }
                            }
                            
                            return String(fieldValue);
                          };

                          return (
                            <div key={`detail-${key}`} className="mb-1">
                              <span className="font-semibold text-gray-800 dark:text-gray-300">
                                {getFieldLabel(key)}:
                              </span>
                              <span className="ml-2 text-gray-900 dark:text-gray-100">
                                {formatValue(key, value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        }) : (
          <tr>
                            <td colSpan={5} className="text-center p-2 text-gray-700 dark:text-gray-400">
              {searchTerm || Object.keys(filters).some(key => filters[key] !== undefined) ? (
                <span>{(t as any)?.noResultsFound || 'No results found'}</span>
              ) : (
                <span>{(t as any)?.noData || 'No income entries'}</span>
              )}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const LoadingIndicator = () => (
    <div ref={loadingRef} className="flex justify-center items-center p-4">
      {loading && (
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
      )}
    </div>
  );

  return (
    <div>
      {/* Data Table Controls */}
      <DataTableControls
        t={t as any}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        filters={filterOptions.map(option => ({ ...option, value: filters[option.key] }))}
        onFilterChange={updateFilter}
        onResetFilters={resetFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        resultCount={resultCount}
        totalCount={totalCount}
      />

      {visibleIncomes.length === 0 ? (
        <div className="text-center py-4 text-gray-700 dark:text-gray-400">
          {searchTerm || Object.keys(filters).some(key => filters[key] !== undefined) ? (
            <span>{(t as any)?.noResultsFound || 'No results found'}</span>
          ) : (
            <span>{(t as any)?.noData || 'No income entries'}</span>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <IncomeTable />
          </div>

          {canLoadMore && <LoadingIndicator />}
        </>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({ isOpen: false, imageSrc: '', altText: '' })}
        imageSrc={imageModal.imageSrc}
        altText={imageModal.altText}
      />
    </div>
  );
} 