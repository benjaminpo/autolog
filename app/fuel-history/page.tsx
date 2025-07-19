'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import FuelTab from '../components/FuelTab';
import withTranslations from '../components/withTranslations';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { currencies, distanceUnits, volumeUnits, tyrePressureUnits, paymentTypes, fuelCompanies as predefinedFuelCompanies, fuelTypes as predefinedFuelTypes } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import { Modals } from '../components/modals';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { Car, FuelEntry } from '../types/common';

// Wrap components with translations HOC
const TranslatedFuelTab = withTranslations(FuelTab);
const TranslatedModals = withTranslations(Modals);

export default function FuelHistoryPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [showFuelDetails, setShowFuelDetails] = useState<string | null>(null);
  const [itemsPerPage] = useState(20);
  const [editEntry, setEditEntry] = useState<FuelEntry | null>(null);
  const [fuelCompanies, setFuelCompanies] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Add state for collapsible sections
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showFuelDetailsSection, setShowFuelDetailsSection] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

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

  // Load data
  useEffect(() => {
    if (!user) return;

    // Fetch vehicles
    fetch('/api/vehicles')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.vehicles)) {
          const normalizedVehicles = data.vehicles.map((vehicle: any) => {
            const normalizedVehicle = {...vehicle};
            if (normalizedVehicle._id && !normalizedVehicle.id) {
              normalizedVehicle.id = normalizedVehicle._id.toString();
            } else if (normalizedVehicle.id && !normalizedVehicle._id) {
              normalizedVehicle._id = normalizedVehicle.id;
            }
            return normalizedVehicle;
          });
          setCars(normalizedVehicles);
        }
      })
      .catch(error => {
        console.error('Error fetching vehicles:', error);
      });

    // Fetch fuel entries
    loadFuelEntries();

    // Fetch fuel companies
    fetch('/api/fuel-companies')
      .then(response => response.json())
      .then(data => {
        if (data.companies) {
          const customCompanies = Array.isArray(data.companies) ? data.companies : [];
          const customCompanyNames = customCompanies
            .filter((company: any) => !predefinedFuelCompanies.includes(company.name))
            .map((company: any) => company.name);
          setFuelCompanies([...predefinedFuelCompanies, ...customCompanyNames].sort((a, b) => a.localeCompare(b)));
        }
      })
      .catch(error => {
        console.error('Error fetching fuel companies:', error);
        setFuelCompanies(predefinedFuelCompanies);
      });

    // Fetch fuel types
    fetch('/api/fuel-types')
      .then(response => response.json())
      .then(data => {
        if (data.types) {
          const customTypes = Array.isArray(data.types) ? data.types : [];
          const customTypeNames = customTypes
            .filter((type: any) => !predefinedFuelTypes.includes(type.name))
            .map((type: any) => type.name);
          setFuelTypes([...predefinedFuelTypes, ...customTypeNames].sort((a, b) => a.localeCompare(b)));
        }
      })
      .catch(error => {
        console.error('Error fetching fuel types:', error);
        setFuelTypes(predefinedFuelTypes);
      });
  }, [user, loadFuelEntries]);

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

      if (user) {        try {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-800 transition-colors">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
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

      <main className="flex-grow overflow-auto transition-colors">
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
