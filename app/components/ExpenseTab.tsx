import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { currencies, expenseCategories } from '../lib/vehicleData';
import { getCarNameById } from '../lib/idUtils';
import { useLanguage } from '../context/LanguageContext';
import { TranslationType } from '../translations';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useDataTableFilters } from '../hooks/useDataTableFilters';
import DataTableControls, { SortOption, FilterOption } from './DataTableControls';
import SortableTableHeader from './SortableTableHeader';
import ImageModal from './ImageModal';

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

interface ExpenseEntry {
  id: string;
  carId: string;
  category: typeof expenseCategories[number];
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
  images: string[];
}

// Unused interfaces removed to clean up linting warnings
// interface Language and ExpenseCategoryItem were not being used

// Helper function to get field labels for expense entries
const getExpenseFieldLabel = (fieldKey: string, t: any): string => {
  switch (fieldKey) {
    case 'carId': return t?.expense?.labels?.vehicle || 'Vehicle';
    case 'category': return t?.expense?.labels?.category || 'Category';
    case 'amount': return t?.payment?.cost || 'Amount';
    case 'currency': return t?.payment?.currency || 'Currency';
    case 'date': return t?.form?.fields?.date || 'Date';
    case 'notes': return t?.form?.fields?.notes || 'Notes';
    case 'images': return 'Images';
    default: return t?.expense?.labels?.[fieldKey] || fieldKey;
  }
};

// Helper function to render expense image grid
const renderExpenseImageGrid = (
  fieldValue: string[], 
  setImageModal: (modal: { isOpen: boolean; imageSrc: string; altText: string }) => void
) => {
  if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
    return 'No images';
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
      {fieldValue.map((image, index) => (
        <div key={index} className="relative">
          <Image
            src={image}
            alt={`Expense image ${index + 1}`}
            width={80}
            height={80}
            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
            unoptimized={true}
            onClick={() => setImageModal({
              isOpen: true,
              imageSrc: image,
              altText: `Expense image ${index + 1}`,
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
};

// Helper function to format expense field values
const formatExpenseValue = (
  fieldKey: string, 
  fieldValue: any, 
  cars: Car[], 
  getCategoryTranslation: (category: string) => string,
  setImageModal: (modal: { isOpen: boolean; imageSrc: string; altText: string }) => void
) => {
  if (fieldKey === 'carId') {
    const carName = cars.find(c => (c.id || c._id) === String(fieldValue))?.name;
    return carName || 'Unknown Vehicle';
  }
  
  if (fieldKey === 'category') {
    return getCategoryTranslation(String(fieldValue));
  }
  
  if (fieldKey === 'amount') {
    const numValue = Number(fieldValue);
    return isNaN(numValue) ? fieldValue : numValue.toFixed(2);
  }
  
  if (fieldKey === 'images') {
    return renderExpenseImageGrid(fieldValue, setImageModal);
  }
  
  return String(fieldValue);
};

interface ExpenseTabProps {
  t?: TranslationType | Record<string, string>;
  cars: Car[];
  expenses: ExpenseEntry[];
  showExpenseDetails: string | null;
  itemsPerPage: number;
  setShowExpenseDetails: (id: string | null) => void;
  startEditingExpense?: (expense: ExpenseEntry) => void;
  deleteExpense?: (id: string) => void;
  updateExpense?: (expense: ExpenseEntry) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export default function ExpenseTab({
  t,
  cars,
  expenses,
  showExpenseDetails,
  itemsPerPage,
  setShowExpenseDetails,
  startEditingExpense,
  deleteExpense,
  onLoadMore,
  hasMore = false,
  loading = false,
}: ExpenseTabProps) {
  // Use translations from context if needed
  const { t: contextT } = useLanguage();
  const translatedText = t || contextT;

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

  // Define sort options for expense entries
  const sortOptions: SortOption[] = [
    { key: 'date', label: (translatedText as any)?.date || 'Date' },
    { key: 'amount', label: (translatedText as any)?.amount || 'Amount' },
    { key: 'category', label: (translatedText as any)?.category || 'Category' },
  ];

  // Define filter options for expense entries
  const filterOptions: FilterOption[] = [
    {
      key: 'carId',
      label: (translatedText as any)?.car || 'Vehicle',
      type: 'select',
      options: cars.map(car => ({ value: car.id || car._id || '', label: car.name })),
    },
    {
      key: 'category',
      label: (translatedText as any)?.category || 'Category',
      type: 'select',
      options: [...new Set(expenses.map(expense => expense.category))]
        .filter(Boolean)
        .map(category => ({ value: category, label: category })),
    },
    {
      key: 'date',
      label: (translatedText as any)?.dateRange || 'Date Range',
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
    data: expenses,
    initialSortBy: 'date',
    initialSortDirection: 'desc',
    searchFields: ['category', 'notes'],
    sortOptions,
    filterOptions,
  });

  // Use infinite scroll hook with filtered data
  const { visibleItems: visibleExpenses, canLoadMore, loadingRef } = useInfiniteScroll({
    items: filteredData,
    itemsPerPage,
    hasMore,
    onLoadMore,
    loading
  });

  // Debug logging for cars prop
  useEffect(() => {
    if (cars && cars.length > 0) {
      console.log('ExpenseTab received cars:', cars.length);
      console.log('First car structure:', JSON.stringify(cars[0]));
    } else {
      console.log('ExpenseTab: No cars available or empty array');
    }
  }, [cars]);

  // Helper function to safely get translation strings
  function getText(key: string, fallback?: string): string {
    // First try to get from the passed t object
    if (t && typeof t[key] === 'string') {
      return t[key];
    }
    
    // Then try to get from various namespaced sections
    if (translatedText) {
      // Try different namespaced paths based on the key
      const paths = [
        key, // direct access
        `actions.${key}`, // actions namespace
        `common.${key}`, // common namespace
        `navigation.${key}`, // navigation namespace
        `expense.labels.${key}`, // expense labels
        `form.fields.${key}`, // form fields
        `payment.${key}`, // payment
      ];
      
      for (const path of paths) {
        const value = path.split('.').reduce((obj: any, prop: string) => obj?.[prop], translatedText);
        if (typeof value === 'string') return value;
      }
    }
    
    return fallback || key;
  }

  // Helper function to translate expense categories
  function getCategoryTranslation(category: string): string {
    // Convert category name to camelCase format that matches translation keys
    // Examples: "Car Wash" -> "carWash", "Parking Fees" -> "parkingFees"
    const camelCaseKey = category
      .toLowerCase()
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    // Try to get translation from expense.labels namespace
    const translation = (translatedText as any)?.expense?.labels?.[camelCaseKey];
    if (typeof translation === 'string') {
      return translation;
    }
    
    // Fallback to original category name
    return category;
  }

  const getCarName = (carId: string) => {
    // Use the utility function for consistent car name lookup
    return getCarNameById(carId, cars);
  };

  const ExpenseTable = () => (
    <table className="w-full text-xs sm:text-sm">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-600">
          <SortableTableHeader
            label={(translatedText as any)?.car || 'Vehicle'}
            sortKey="carId"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={translatedText as any}
          />
          <SortableTableHeader
            label={(translatedText as any)?.date || 'Date'}
            sortKey="date"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={translatedText as any}
          />
          <SortableTableHeader
            label={(translatedText as any)?.category || 'Category'}
            sortKey="category"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={translatedText as any}
          />
          <SortableTableHeader
            label={(translatedText as any)?.amount || 'Amount'}
            sortKey="amount"
            currentSortBy={sortBy}
            currentSortDirection={sortDirection}
            onSort={handleSortChange}
            t={translatedText as any}
          />
          <th className="p-1 text-left text-gray-900 dark:text-gray-100">{(translatedText as any)?.actions?.actions || 'Actions'}</th>
        </tr>
      </thead>
      <tbody>
        {visibleExpenses && visibleExpenses.length > 0 ? visibleExpenses.map((expense) => (
          <React.Fragment key={`expense-fragment-${expense.id}`}>
            <tr className={showExpenseDetails === expense.id ? "bg-blue-50 dark:bg-blue-900/30" : ""}>
              <td className="p-1 text-gray-900 dark:text-gray-100">{getCarName(expense.carId)}</td>
              <td className="p-1 text-gray-900 dark:text-gray-100">{expense.date}</td>
              <td className="p-1 text-gray-900 dark:text-gray-100">
                {getCategoryTranslation(String(expense.category))}
              </td>
              <td className="p-1 text-gray-900 dark:text-gray-100">
                {expense.amount} {expense.currency}
              </td>
              <td className="p-1 flex gap-1">
                <button
                  onClick={() => setShowExpenseDetails(showExpenseDetails === expense.id ? null : expense.id)}
                  className={`px-2 py-1 rounded text-white text-xs ${
                    showExpenseDetails === expense.id
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  {showExpenseDetails === expense.id ? ((translatedText as any)?.actions?.hide || 'Hide') : ((translatedText as any)?.actions?.showMore || 'Show More')}
                </button>
                {startEditingExpense && (
                  <button
                    onClick={() => startEditingExpense(expense)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                  >
                    {(translatedText as any)?.actions?.edit || 'Edit'}
                  </button>
                )}
                {deleteExpense && (
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                  >
                    {(translatedText as any)?.actions?.delete || 'Delete'}
                  </button>
                )}
              </td>
            </tr>
            {showExpenseDetails === expense.id && (
              <tr>
                <td colSpan={5} className="p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm">
                    <strong>{(translatedText as any)?.details || 'Details'}:</strong>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(expense).filter(([key]) => 
                        key !== 'id' && key !== '_id' && key !== 'userId' && key !== '__v'
                      ).map(([key, value]) => {
                        return (
                          <div key={`${expense.id}-${key}`} className="text-xs">
                            <span className="font-medium">{getExpenseFieldLabel(key, translatedText)}:</span> {formatExpenseValue(key, value, cars, getCategoryTranslation, setImageModal)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        )) : (
          <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-800 dark:text-gray-400">
              {(translatedText as any)?.noExpensesFound || 'No expenses found'}
            </td>
          </tr>
        )}
        {loading && canLoadMore && (
          <tr>
            <td colSpan={5} className="p-4 text-center">
              <LoadingIndicator />
            </td>
          </tr>
        )}
        {canLoadMore && !loading && (
          <tr>
            <td colSpan={5} className="p-4 text-center">
              <button
                ref={loadingRef as unknown as React.RefObject<HTMLButtonElement>}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {(translatedText as any)?.loadMore || 'Load More'}
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const LoadingIndicator = () => (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-400">
        {(translatedText as any)?.loading || 'Loading...'}
      </span>
    </div>
  );

  if (!visibleExpenses || visibleExpenses.length === 0) {
    return (
      <div className="text-center py-8">
                      <p className="text-gray-800 dark:text-gray-400">{(translatedText as any)?.noExpensesFound || 'No expenses found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Table Controls */}
      <DataTableControls
        t={translatedText as any}
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

      {/* Expense Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
        <div className="overflow-x-auto">
          <ExpenseTable />
        </div>
      </div>

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
