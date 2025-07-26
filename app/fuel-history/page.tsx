'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { AuthButton } from '../components/AuthButton';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useTranslation } from '../hooks/useTranslation';
import FuelTab from '../components/FuelTab';
import withTranslations from '../components/withTranslations';
import { useVehicles } from '../hooks/useVehicles';
import { fuelCompanies as predefinedFuelCompanies, fuelTypes as predefinedFuelTypes } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import { Modals } from '../components/modals';
import { FuelEntry } from '../types/common';

// Wrap components with translations HOC
const TranslatedFuelTab = withTranslations(FuelTab);
const TranslatedModals = withTranslations(Modals);

export default function FuelHistoryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { cars } = useVehicles();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [showFuelDetails, setShowFuelDetails] = useState<string | null>(null);
  const [itemsPerPage] = useState(20);
  const [editEntry, setEditEntry] = useState<FuelEntry | null>(null);
  const [fuelCompanies, setFuelCompanies] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Remove the separate cars loading - it's handled by useVehicles hook
  const loadFuelEntries = useCallback(async (offset = 0) => {
    try {
      const response = await fetch(`/api/fuel-entries?limit=${itemsPerPage}&offset=${offset}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.entries)) {
        const normalizedEntries = data.entries.map((entry: any) => {
          const normalizedEntry = {...entry};
          if (normalizedEntry._id && !normalizedEntry.id) {
            normalizedEntry.id = normalizedEntry._id.toString();
          } else if (normalizedEntry.id && !normalizedEntry._id) {
            normalizedEntry._id = normalizedEntry.id;
          }
          return normalizedEntry;
        });

        if (offset === 0) {
          setEntries(normalizedEntries);
        } else {
          setEntries(prev => [...prev, ...normalizedEntries]);
        }
        setHasMore(normalizedEntries.length === itemsPerPage);
      }
    } catch (error) {
      console.error('Error fetching fuel entries:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [itemsPerPage]);

  // Consolidated data loading function
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch fuel entries
      await loadFuelEntries();

      // Fetch fuel companies
      const fuelCompaniesResponse = await fetch('/api/fuel-companies');
      const fuelCompaniesData = await fuelCompaniesResponse.json();
      if (fuelCompaniesData.companies) {
        const customCompanies = Array.isArray(fuelCompaniesData.companies) ? fuelCompaniesData.companies : [];
        const customCompanyNames = customCompanies
          .filter((company: any) => !predefinedFuelCompanies.includes(company.name))
          .map((company: any) => company.name);
        setFuelCompanies([...predefinedFuelCompanies, ...customCompanyNames].sort((a, b) => a.localeCompare(b)));
      } else {
        setFuelCompanies(predefinedFuelCompanies);
      }

      // Fetch fuel types
      const fuelTypesResponse = await fetch('/api/fuel-types');
      const fuelTypesData = await fuelTypesResponse.json();
      if (fuelTypesData.types) {
        const customTypes = Array.isArray(fuelTypesData.types) ? fuelTypesData.types : [];
        const customTypeNames = customTypes
          .filter((type: any) => !predefinedFuelTypes.includes(type.name))
          .map((type: any) => type.name);
        setFuelTypes([...predefinedFuelTypes, ...customTypeNames].sort((a, b) => a.localeCompare(b)));
      } else {
        setFuelTypes(predefinedFuelTypes);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
      // Set fallback data
      setFuelCompanies(predefinedFuelCompanies);
      setFuelTypes(predefinedFuelTypes);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadFuelEntries]);

  // Load data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadFuelEntries(entries.length);
    }
  };

  const handleDeleteFuelEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/fuel-entries/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove the entry from the list
        setEntries(entries.filter(entry => entry.id !== id));
        setShowFuelDetails(null);
      }
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
    }
  };

  const handleEditInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editEntry) {
      const { name, value, type } = e.target;
      if (type === 'checkbox') {
        setEditEntry({ ...editEntry, [name]: (e.target as HTMLInputElement).checked });
      } else if (name === 'tags') {
        setEditEntry({ ...editEntry, tags: value.split(',').map(tag => tag.trim()).filter(tag => tag) });
      } else {
        setEditEntry({ ...editEntry, [name]: value });
      }
    }
  }, [editEntry]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editEntry) {
      const updatedEntry = {
        ...editEntry,
        mileage: parseFloat(editEntry.mileage as string),
        volume: parseFloat(editEntry.volume as string),
        cost: parseFloat(editEntry.cost as string),
        tyrePressure: parseFloat(editEntry.tyrePressure as string) || 0,
        tags: editEntry.tags,
      };

      if (user) {
        try {
          const entryId = getObjectId(editEntry as unknown as Record<string, unknown>);

          if (!entryId) {
            console.error('Cannot update fuel entry: Invalid ID');
            return;
          }

          const updateData = {
            carId: updatedEntry.carId,
            fuelCompany: updatedEntry.fuelCompany,
            fuelType: updatedEntry.fuelType,
            mileage: updatedEntry.mileage,
            distanceUnit: updatedEntry.distanceUnit,
            volume: updatedEntry.volume,
            volumeUnit: updatedEntry.volumeUnit,
            cost: updatedEntry.cost,
            currency: updatedEntry.currency,
            date: updatedEntry.date,
            time: updatedEntry.time,
            location: updatedEntry.location,
            partialFuelUp: updatedEntry.partialFuelUp,
            paymentType: updatedEntry.paymentType,
            tyrePressure: updatedEntry.tyrePressure,
            tyrePressureUnit: updatedEntry.tyrePressureUnit,
            tags: updatedEntry.tags,
            notes: updatedEntry.notes,
            images: updatedEntry.images || [],
          };

          const response = await fetch(`/api/fuel-entries/${entryId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Failed to update fuel entry:', errorData.message);
            alert(`Cannot update fuel entry: ${errorData.message}`);
            return;
          }

          const data = await response.json();
          const returnedEntry = data.entry;

          if (returnedEntry) {
            const transformedEntry = {
              ...returnedEntry,
              id: getObjectId(returnedEntry as unknown as Record<string, unknown>)
            };

            setEntries(entries.map((entry) => getObjectId(entry as unknown as Record<string, unknown>) === getObjectId(editEntry as unknown as Record<string, unknown>) ? transformedEntry : entry));
          } else {
            console.error('No entry data returned from server');
          }
        } catch (error) {
          console.error('Error updating fuel entry:', error);
          return;
        }
      } else {
        setEntries(entries.map((entry) => getObjectId(entry as unknown as Record<string, unknown>) === getObjectId(editEntry as unknown as Record<string, unknown>) ? updatedEntry : entry));
      }

      setEditEntry(null);
    }
  };

  const startEditing = (entry: FuelEntry) => {
    const entryWithValidId = {
      ...entry,
      id: getObjectId(entry as unknown as Record<string, unknown>),
      mileage: entry.mileage.toString(),
      volume: entry.volume.toString(),
      cost: entry.cost.toString(),
      tyrePressure: entry.tyrePressure ? entry.tyrePressure.toString() : '0',
      tags: entry.tags || [],
    };

    setEditEntry(entryWithValidId);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{(t as any)?.navigation?.fuelHistory || 'Fuel History'}</h1>
            <div className="flex items-center gap-2">
              <SimpleThemeToggle />
              <GlobalLanguageSelector darkMode={false} />
              <AuthButton />
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Navigation Component */}
      <TranslatedNavigation showTabs={false} />

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState
          error={error}
          onRetry={loadData}
        />
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <main className="flex-grow overflow-auto">
          <PageContainer className="p-3 md:p-6">
            <TranslatedFuelTab
              cars={cars}
              entries={entries}
              showFuelDetails={showFuelDetails}
              itemsPerPage={itemsPerPage}
              setShowFuelDetails={setShowFuelDetails}
              deleteEntry={handleDeleteFuelEntry}
              startEditing={startEditing}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loading={isLoadingMore}
            />
          </PageContainer>
        </main>
      )}

      {/* Modals */}
      <TranslatedModals
        cars={cars}
        fuelCompanies={fuelCompanies}
        fuelTypes={fuelTypes}
        expenseCategories={[]}
        editEntry={editEntry}
        editExpense={null}
        editCar={null}
        editFuelCompany={null}
        editFuelType={null}
        handleEditInputChange={handleEditInputChange}
        handleEditCarInputChange={() => {}}
        handleEditExpenseInputChange={() => {}}
        handleEditSubmit={handleEditSubmit}
        handleEditExpenseSubmit={() => {}}
        handleEditCarSubmit={() => {}}
        handleEditFuelCompanySubmit={() => {}}
        handleEditFuelTypeSubmit={() => {}}
        setEditEntry={setEditEntry}
        setEditExpense={() => {}}
        setEditCar={() => {}}
        setEditFuelCompany={() => {}}
        setEditFuelType={() => {}}
      />
    </div>
  );
}
