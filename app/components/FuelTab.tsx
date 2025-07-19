import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getCarNameById, getObjectId } from '../lib/idUtils';
import { TranslationType } from '../translations';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useDataTableFilters } from '../hooks/useDataTableFilters';
import DataTableControls, { SortOption, FilterOption } from './DataTableControls';
import SortableTableHeader from './SortableTableHeader';
import ImageModal from './ImageModal';
import { Car, FuelEntry } from '../types/common';
import { 
  renderImageGrid,
  ImageModalState,
  initialImageModalState,
  resetImageModal
} from '../lib/tabHelpers';interface FuelTabProps {
  t?: TranslationType | Record<string, string>;
  cars: Car[];
  entries: FuelEntry[];
  showFuelDetails: string | null;
  itemsPerPage: number;
  setShowFuelDetails: (id: string | null) => void;
  startEditing?: (entry: FuelEntry) => void;
  deleteEntry?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

// Helper function to get field labels for fuel entries
const getFieldLabel = (fieldKey: string, t: any): string => {
  switch (fieldKey) {
    case 'fuelCompany':
      return t?.fuel?.labels?.fuelCompany || 'Fuel Company';
    case 'fuelType':
      return t?.fuel?.labels?.fuelType || 'Fuel Type';
    case 'mileage':
      return t?.fuel?.labels?.mileage || 'Mileage';
    case 'distanceUnit':
      return t?.fuel?.labels?.distanceUnit || 'Distance Unit';
    case 'volume':
      return t?.fuel?.labels?.volume || 'Volume';
    case 'volumeUnit':
      return t?.fuel?.labels?.volumeUnit || 'Volume Unit';
    case 'cost':
      return t?.payment?.cost || 'Cost';
    case 'currency':
      return t?.payment?.currency || 'Currency';
    case 'date':
      return t?.form?.fields?.date || 'Date';
    case 'time':
      return t?.form?.fields?.time || 'Time';
    case 'location':
      return t?.fuel?.labels?.location || 'Location';
    case 'partialFuelUp':
      return t?.fuel?.labels?.partialFuelUp || 'Partial Fuel Up';
    case 'paymentType':
      return t?.fuel?.labels?.paymentType || 'Payment Type';
    case 'tyrePressure':
      return t?.fuel?.labels?.tyrePressure || 'Tyre Pressure';
    case 'tyrePressureUnit':
      return t?.fuel?.labels?.tyrePressureUnit || 'Tyre Pressure Unit';
    case 'tags':
      return t?.fuel?.labels?.tags || 'Tags';
    case 'notes':
      return t?.fuel?.labels?.notes || 'Notes';
    case 'createdAt':
      return t?.fuel?.labels?.createdAt || 'Created At';
    case 'updatedAt':
      return t?.fuel?.labels?.updatedAt || 'Updated At';
    default:
      return fieldKey;
  }
};

// Helper function to format field values
const formatValue = (
  fieldKey: string,
  fieldValue: any,
  cars: Car[],
  t: any,
  setImageModal: (modal: { isOpen: boolean; imageSrc: string; altText: string }) => void
) => {
  if (fieldValue == null) return '';

  if (fieldKey === 'images') {
    return renderImageGrid(fieldValue, 'Fuel', setImageModal);
  }

  if (fieldKey === 'carId') {
    return getCarNameById(String(fieldValue), cars);
  }

  if (fieldKey === 'partialFuelUp') {
    return fieldValue ? 'Yes' : 'No';
  }

  if (fieldKey === 'tags') {
    return Array.isArray(fieldValue) ? fieldValue.join(', ') : fieldValue;
  }

  if ((fieldKey === 'createdAt' || fieldKey === 'updatedAt') && fieldValue) {
    try {
      return new Date(fieldValue).toLocaleString();
    } catch (error) {
      return fieldValue;
    }
  }

  return fieldValue;
};

export default function FuelTab({
  t: propT,
  cars,
  entries,
  showFuelDetails,
  itemsPerPage,
  setShowFuelDetails,
  startEditing,
  deleteEntry,
  onLoadMore,
  hasMore = false,
  loading = false,
}: FuelTabProps) {
  // Use translations from context if not provided as props
  const { t: contextT } = useLanguage();
  const t = propT || contextT;

  // State for image modal
  const [imageModal, setImageModal] = useState<ImageModalState>(initialImageModalState);

  // Define sort options for fuel entries
  const sortOptions: SortOption[] = [
    { key: 'date', label: (t as any)?.date || 'Date' },
    { key: 'mileage', label: (t as any)?.fuel?.labels?.mileage || (t as any)?.mileage || 'Mileage' },
    { key: 'volume', label: (t as any)?.fuel?.labels?.volume || (t as any)?.volume || 'Volume' },
    { key: 'cost', label: (t as any)?.payment?.cost || (t as any)?.cost || 'Cost' },
    { key: 'fuelCompany', label: (t as any)?.fuel?.labels?.fuelCompany || (t as any)?.fuelCompany || 'Fuel Company' },
    { key: 'fuelType', label: (t as any)?.fuel?.labels?.fuelType || (t as any)?.fuelType || 'Fuel Type' },
  ];

  // Define filter options for fuel entries
  const filterOptions: FilterOption[] = [
    {
      key: 'carId',
      label: (t as any)?.car || 'Vehicle',
      type: 'select',
      options: cars.map(car => ({ value: car.id, label: car.name })),
    },
    {
      key: 'fuelCompany',
      label: (t as any)?.fuel?.labels?.fuelCompany || (t as any)?.fuelCompany || 'Fuel Company',
      type: 'select',
      options: [...new Set(entries.map(entry => entry.fuelCompany))]
        .filter(Boolean)
        .map(company => ({ value: company, label: company })),
    },
    {
      key: 'fuelType',
      label: (t as any)?.fuel?.labels?.fuelType || (t as any)?.fuelType || 'Fuel Type',
      type: 'select',
      options: [...new Set(entries.map(entry => entry.fuelType))]
        .filter(Boolean)
        .map(type => ({ value: type, label: type })),
    },
    {
      key: 'date',
      label: (t as any)?.date || 'Date Range',
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
    data: entries,
    initialSortBy: 'date',
    initialSortDirection: 'desc',
    searchFields: ['fuelCompany', 'fuelType', 'location', 'notes'],
    filterOptions,
  });

  // Use infinite scroll hook with filtered data
  const { visibleItems: visibleEntries, canLoadMore, loadingRef } = useInfiniteScroll({
    items: filteredData,
    itemsPerPage,
    hasMore,
    onLoadMore,
    loading
  });

  // Debug logging for cars prop
  useEffect(() => {
    if (cars && cars.length > 0) {
      console.log('FuelTab received cars:', cars.length);
      console.log('First car structure:', JSON.stringify(cars[0]));
    } else {
      console.log('FuelTab: No cars available or empty array');
    }
  }, [cars]);

  const getCarName = (carId: string) => {
    // Use the utility function for consistent car name lookup
    return getCarNameById(carId, cars);
  };

  // Helper function to calculate fuel price per unit
  const calculateFuelPrice = (entry: FuelEntry) => {
    const cost = typeof entry.cost === 'string' ? parseFloat(entry.cost) : entry.cost;
    const volume = typeof entry.volume === 'string' ? parseFloat(entry.volume) : entry.volume;
    if (volume > 0) {
      return (cost / volume).toFixed(2);
    }
    return '0.00';
  };

  const LoadingIndicator = () => (
    <div ref={loadingRef} className="flex justify-center items-center p-4">
      {loading && (
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
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

      {visibleEntries.length === 0 ? (
        <div className="text-center py-4 text-gray-700 dark:text-gray-400">
          {searchTerm || Object.keys(filters).some(key => filters[key] !== undefined) ? (
            <span>{(t as any)?.noResultsFound || 'No results found'}</span>
          ) : (
            <span>{(t as any)?.noData || 'No fuel entries'}</span>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-600">
                  <SortableTableHeader
                    label={(t as any)?.car || 'Vehicle'}
                    sortKey="carId"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.date || 'Date'}
                    sortKey="date"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.fuel?.labels?.fuelCompany || (t as any)?.fuelCompany || 'Fuel Company'}
                    sortKey="fuelCompany"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.fuel?.labels?.fuelType || (t as any)?.fuelType || 'Fuel Type'}
                    sortKey="fuelType"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.fuel?.labels?.volume || (t as any)?.volume || 'Volume'}
                    sortKey="volume"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.fuel?.labels?.mileage || (t as any)?.mileage || 'Mileage'}
                    sortKey="mileage"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.payment?.cost || (t as any)?.cost || 'Cost'}
                    sortKey="cost"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <SortableTableHeader
                    label={(t as any)?.fuel?.labels?.fuelPrice || (t as any)?.fuelPrice || 'Fuel Price'}
                    sortKey="fuelPrice"
                    currentSortBy={sortBy}
                    currentSortDirection={sortDirection}
                    onSort={handleSortChange}
                  />
                  <th className="p-1 text-left text-gray-900 dark:text-gray-100">{(t as any)?.actions?.actions || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => (
                  <React.Fragment key={`fuel-fragment-${getObjectId(entry as unknown as Record<string, unknown>)}`}>
                    <tr className={showFuelDetails === getObjectId(entry as unknown as Record<string, unknown>) ? "bg-blue-50 dark:bg-blue-900/30" : ""}>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{getCarName(entry.carId)}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{entry.date}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{entry.fuelCompany}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{entry.fuelType}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{entry.volume} {entry.volumeUnit}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{entry.mileage} {entry.distanceUnit}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{entry.cost} {entry.currency}</td>
                      <td className="p-1 text-gray-900 dark:text-gray-100">{calculateFuelPrice(entry)} {entry.currency}/{entry.volumeUnit}</td>
                      <td className="p-1 flex gap-1">
                        <button
                          onClick={() => setShowFuelDetails(showFuelDetails === getObjectId(entry as unknown as Record<string, unknown>) ? null : getObjectId(entry as unknown as Record<string, unknown>))}
                          className={`px-2 py-1 rounded text-white text-xs ${
                            showFuelDetails === getObjectId(entry as unknown as Record<string, unknown>)
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-500 hover:bg-gray-600"
                          }`}
                        >
                          {showFuelDetails === getObjectId(entry as unknown as Record<string, unknown>) ? ((t as any)?.actions?.hide || 'Hide') : ((t as any)?.actions?.showMore || 'Show More')}
                        </button>
                        {startEditing && (
                          <button
                            onClick={() => startEditing(entry)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                          >
                            {(t as any)?.actions?.edit || 'Edit'}
                          </button>
                        )}
                        {deleteEntry && (
                          <button
                            onClick={() => deleteEntry(getObjectId(entry as unknown as Record<string, unknown>))}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                          >
                            {(t as any)?.actions?.delete || 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {showFuelDetails === getObjectId(entry as unknown as Record<string, unknown>) && (
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={8} className="p-3">
                          <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-3 transition-colors">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                              {(t as any)?.fuel?.details?.fuelDetails || (t as any)?.fuelDetails || 'Fuel Details'}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                              {Object.entries(entry).map(([key, value]) => {
                                // Filter out internal fields, only show user-relevant data
                                if (key === 'id' || key === 'carId' || key === '_id' || key === 'userId' || key === '__v') {
                                  return null;
                                }

                                return (
                                  <div key={`detail-${key}`} className="mb-1">
                                    <span className="font-semibold text-gray-800 dark:text-gray-300">
                                      {getFieldLabel(key, t)}:
                                    </span>
                                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                                      {formatValue(key, value, cars, t, setImageModal)}
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
                ))}
              </tbody>
            </table>
          </div>

          {canLoadMore && <LoadingIndicator />}
        </>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal(resetImageModal())}
        imageSrc={imageModal.imageSrc}
        altText={imageModal.altText}
      />
    </div>
  );
}
