'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageContainer from '../components/PageContainer';
import ListsTab from '../components/ListsTab';
import withTranslations from '../components/withTranslations';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { vehicleBrands, vehicleModels, fuelCompanies as predefinedFuelCompanies, fuelTypes as predefinedFuelTypes } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import { SimpleThemeToggle } from '../components/ThemeToggle';

// Wrap component with translations HOC
const TranslatedListsTab = withTranslations(ListsTab);

interface Car {
  id: string;
  name: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number | null;
  photo: string;
  dateAdded: string;
  customModel?: string;
  description?: string;
  distanceUnit?: string;
  fuelUnit?: string;
  consumptionUnit?: string;
  fuelType?: string;
  tankCapacity?: number | null;
  licensePlate?: string;
  vin?: string;
  insurancePolicy?: string;
  country?: string;
  state?: string;
  city?: string;
}

interface FuelCompanyItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

interface FuelTypeItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

export default function ManageListsPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [fuelCompanies, setFuelCompanies] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [fullFuelCompanies, setFullFuelCompanies] = useState<FuelCompanyItem[]>([]);
  const [fullFuelTypes, setFullFuelTypes] = useState<FuelTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customBrands, setCustomBrands] = useState<{ [key: string]: string[] }>({});
  const [customModels, setCustomModels] = useState<{ [key: string]: { [brand: string]: string[] } }>({});

  const [newCar, setNewCar] = useState({
    name: '',
    vehicleType: '',
    brand: '',
    model: '',
    customModel: '',
    year: '',
    photo: '',
    description: '',
    distanceUnit: 'km',
    fuelUnit: 'L',
    consumptionUnit: 'L/100km',
    fuelType: '',
    tankCapacity: '',
    licensePlate: '',
    vin: '',
    insurancePolicy: '',
    country: '',
    state: '',
    city: ''
  });
  const [newFuelCompany, setNewFuelCompany] = useState('');
  const [newFuelType, setNewFuelType] = useState('');
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [editFuelCompany, setEditFuelCompany] = useState<{ old: string; new: string } | null>(null);
  const [editFuelType, setEditFuelType] = useState<{ old: string; new: string } | null>(null);

  // Load data
  const loadVehicleFormPreferences = useCallback(() => {
    try {
      const savedPrefs = localStorage.getItem('vehicleFormPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setNewCar(prev => ({
          ...prev,
          distanceUnit: prefs.distanceUnit || 'km',
          fuelUnit: prefs.fuelUnit || 'L',
          consumptionUnit: prefs.consumptionUnit || 'L/100km',
          fuelType: prefs.fuelType || '',
          country: prefs.country || '',
          state: prefs.state || '',
          city: prefs.city || '',
        }));
      }
    } catch (error) {
      console.error('Error loading vehicle form preferences:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    
    // Load vehicle form preferences
    loadVehicleFormPreferences();

    // Fetch vehicles
    fetch('/api/vehicles')
      .then(response => response.json())
      .then(data => {
        console.log('Vehicle data received:', data);
        if (data.success && Array.isArray(data.vehicles)) {
          // Ensure all vehicles have both id and _id properties
          const normalizedVehicles = data.vehicles.map((vehicle: any) => {
            const normalizedVehicle = {...vehicle};
            if (normalizedVehicle._id && !normalizedVehicle.id) {
              normalizedVehicle.id = normalizedVehicle._id.toString();
            } else if (normalizedVehicle.id && !normalizedVehicle._id) {
              normalizedVehicle._id = normalizedVehicle.id;
            }
            return normalizedVehicle;
          });

          console.log(`Setting ${normalizedVehicles.length} vehicles with normalized IDs`);
          setCars(normalizedVehicles);
        } else if (data.message === 'Unauthorized') {
          console.log('User not authenticated, skipping vehicle fetch');
          setCars([]); // Set empty array instead of causing error
        } else {
          console.warn('Vehicle API did not return expected format:', data);
          setCars([]); // Set empty array as fallback
        }
      })
      .catch(error => {
        console.error('Error fetching vehicles:', error);
      });

    // Fetch fuel companies
    fetch('/api/fuel-companies')
      .then(response => response.json())
      .then(data => {
        if (data.companies) {
          const customCompanies = Array.isArray(data.companies) ? data.companies : [];
          setFullFuelCompanies(customCompanies);
          
          // Create predefined company objects
          const predefinedCompanyObjects = predefinedFuelCompanies.map(name => ({
            _id: `predefined-${name}`,
            userId: 'system',
            name,
            isPredefined: true
          }));
          
          // Merge predefined with custom, avoiding duplicates
          const customCompanyNames = customCompanies
            .filter((company: any) => !predefinedFuelCompanies.includes(company.name))
            .map((company: any) => company.name);
          
          setFuelCompanies([...predefinedFuelCompanies, ...customCompanyNames].sort());
          setFullFuelCompanies([...predefinedCompanyObjects, ...customCompanies.filter((company: any) => !predefinedFuelCompanies.includes(company.name))]);
        }
      })
      .catch(error => {
        console.error('Error fetching fuel companies:', error);
        // Set predefined companies as fallback
        setFuelCompanies(predefinedFuelCompanies);
        const predefinedCompanyObjects = predefinedFuelCompanies.map(name => ({
          _id: `predefined-${name}`,
          userId: 'system',
          name,
          isPredefined: true
        }));
        setFullFuelCompanies(predefinedCompanyObjects);
      });

    // Fetch fuel types
    fetch('/api/fuel-types')
      .then(response => response.json())
      .then(data => {
        if (data.types) {
          const customTypes = Array.isArray(data.types) ? data.types : [];
          
          // Create predefined type objects
          const predefinedTypeObjects = predefinedFuelTypes.map(name => ({
            _id: `predefined-${name}`,
            userId: 'system',
            name,
            isPredefined: true
          }));
          
          // Merge predefined with custom, avoiding duplicates
          const customTypeNames = customTypes
            .filter((type: any) => !predefinedFuelTypes.includes(type.name))
            .map((type: any) => type.name);
          
          setFuelTypes([...predefinedFuelTypes, ...customTypeNames].sort());
          setFullFuelTypes([...predefinedTypeObjects, ...customTypes.filter((type: any) => !predefinedFuelTypes.includes(type.name))]);
        }
      })
      .catch(error => {
        console.error('Error fetching fuel types:', error);
        // Set predefined types as fallback
        setFuelTypes(predefinedFuelTypes);
        const predefinedTypeObjects = predefinedFuelTypes.map(name => ({
          _id: `predefined-${name}`,
          userId: 'system',
          name,
          isPredefined: true
        }));
        setFullFuelTypes(predefinedTypeObjects);
      });

    // Fetch custom brands and models from user preferences
    fetch('/api/user-preferences')
      .then(response => response.json())
      .then(data => {
        if (data.preferences) {
          if (data.preferences.customBrands) {
            setCustomBrands(data.preferences.customBrands);
          }
          if (data.preferences.customModels) {
            setCustomModels(data.preferences.customModels);
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, loadVehicleFormPreferences]);

  const saveVehicleFormPreferences = useCallback((carData: typeof newCar) => {
    try {
      const prefsToSave = {
        distanceUnit: carData.distanceUnit,
        fuelUnit: carData.fuelUnit,
        consumptionUnit: carData.consumptionUnit,
        fuelType: carData.fuelType,
        country: carData.country,
        state: carData.state,
        city: carData.city,
      };
      localStorage.setItem('vehicleFormPreferences', JSON.stringify(prefsToSave));
    } catch (error) {
      console.error('Error saving vehicle form preferences:', error);
    }
  }, []);

  const clearVehiclePreferences = () => {
    try {
      localStorage.removeItem('vehicleFormPreferences');
      setNewCar(prev => ({
        ...prev,
        distanceUnit: 'km',
        fuelUnit: 'L',
        consumptionUnit: 'L/100km',
        fuelType: '',
        country: '',
        state: '',
        city: '',
      }));
    } catch (error) {
      console.error('Error clearing vehicle preferences:', error);
    }
  };

  // Handle new car input changes - use functional update to avoid dependencies
  const handleNewCarInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCar(prev => ({ ...prev, [name]: value }));
  }, []);

  // Wrapper for setNewCar that supports both direct updates and functional updates
  const setNewCarWrapper = useCallback((update: typeof newCar | ((prev: typeof newCar) => typeof newCar)) => {
    if (typeof update === 'function') {
      setNewCar(prev => update(prev));
    } else {
      setNewCar(update);
    }
  }, []);

  // Update custom brands
  const updateCustomBrands = useCallback(async (vehicleType: string, brand: string) => {
    if (brand === 'Other' || !brand) return;

    try {
      setCustomBrands(prev => {
        const updatedBrands = { ...prev };
        if (!updatedBrands[vehicleType]) {
          updatedBrands[vehicleType] = [];
        }
        if (!updatedBrands[vehicleType].includes(brand)) {
          updatedBrands[vehicleType].push(brand);
          
          // Update in database asynchronously
          fetch('/api/user-preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customBrands: updatedBrands }),
          }).catch(error => {
            console.error('Error updating custom brands:', error);
          });
        }
        return updatedBrands;
      });
    } catch (error) {
      console.error('Error updating custom brands:', error);
    }
  }, []);

  // Update custom models
  const updateCustomModels = useCallback(async (vehicleType: string, brand: string, model: string) => {
    if (model === 'Other' || !model || !brand) return;

    try {
      setCustomModels(prev => {
        const updatedModels = { ...prev };
        if (!updatedModels[vehicleType]) {
          updatedModels[vehicleType] = {};
        }
        if (!updatedModels[vehicleType][brand]) {
          updatedModels[vehicleType][brand] = [];
        }
        if (!updatedModels[vehicleType][brand].includes(model)) {
          updatedModels[vehicleType][brand].push(model);
          
          // Update in database asynchronously
          fetch('/api/user-preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customModels: updatedModels }),
          }).catch(error => {
            console.error('Error updating custom models:', error);
          });
        }
        return updatedModels;
      });
    } catch (error) {
      console.error('Error updating custom models:', error);
    }
  }, []);

  // Add new car
  const addCar = useCallback(async () => {
    if (!newCar.name || !newCar.vehicleType || !newCar.brand || !newCar.model) {
      alert(t?.system?.fillRequiredFields || t?.fillRequiredFields || 'Please fill in required fields: Name, Vehicle Type, Brand, and Model');
      return;
    }

    const carData = {
      ...newCar,
      year: newCar.year ? parseInt(newCar.year) : null,
      tankCapacity: newCar.tankCapacity ? parseFloat(newCar.tankCapacity) : null,
      dateAdded: new Date().toISOString()
    };

    console.log('Adding car with data:', carData);

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
      });

      const data = await response.json();
      console.log('Add car API response:', data);

      if (data.success) {
        console.log('Car added successfully:', data.vehicle);

        // Ensure the vehicle has consistent ID properties
        const newVehicle = {...data.vehicle};
        if (newVehicle._id && !newVehicle.id) {
          newVehicle.id = newVehicle._id.toString();
        } else if (newVehicle.id && !newVehicle._id) {
          newVehicle._id = newVehicle.id;
        }

        console.log('Adding normalized vehicle to state:', newVehicle);

        setCars(prevCars => [...prevCars, newVehicle]);

        // Reset form
        setNewCar({
          name: '',
          vehicleType: '',
          brand: '',
          model: '',
          customModel: '',
          year: '',
          photo: '',
          description: '',
          distanceUnit: 'km',
          fuelUnit: 'L',
          consumptionUnit: 'L/100km',
          fuelType: '',
          tankCapacity: '',
          licensePlate: '',
          vin: '',
          insurancePolicy: '',
          country: '',
          state: '',
          city: ''
        });

        // Update custom brands/models if needed
        if (newCar.brand === 'Other' || !vehicleBrands[newCar.vehicleType]?.includes(newCar.brand)) {
          updateCustomBrands(newCar.vehicleType, newCar.brand);
        }

        if (newCar.model === 'Other' || !vehicleModels[newCar.vehicleType]?.[newCar.brand]?.includes(newCar.model)) {
          updateCustomModels(newCar.vehicleType, newCar.brand, newCar.customModel || newCar.model);
        }

        // Save vehicle form preferences
        saveVehicleFormPreferences(newCar);
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  }, [newCar, t, saveVehicleFormPreferences, updateCustomBrands, updateCustomModels]);

  // Add new fuel company
  const addFuelCompany = useCallback(async () => {
    if (!newFuelCompany) return;

    try {
      const response = await fetch('/api/fuel-companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newFuelCompany }),
      });

      const data = await response.json();

      if (data.success) {
        setFuelCompanies([...fuelCompanies, newFuelCompany].sort());
        setFullFuelCompanies([...fullFuelCompanies, data.company]);
        setNewFuelCompany('');
      }
    } catch (error) {
      console.error('Error adding fuel company:', error);
    }
  }, [newFuelCompany, fuelCompanies, setFuelCompanies, fullFuelCompanies, setFullFuelCompanies, setNewFuelCompany]);

  // Add new fuel type
  const addFuelType = useCallback(async () => {
    if (!newFuelType) return;

    try {
      const response = await fetch('/api/fuel-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newFuelType }),
      });

      const data = await response.json();

      if (data.success) {
        setFuelTypes([...fuelTypes, newFuelType].sort());
        setFullFuelTypes([...fullFuelTypes, data.type]);
        setNewFuelType('');
      }
    } catch (error) {
      console.error('Error adding fuel type:', error);
    }
  }, [newFuelType, fuelTypes, setFuelTypes, fullFuelTypes, setFullFuelTypes, setNewFuelType]);

  // Delete car
  const deleteCar = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCars(cars.filter(car => getObjectId(car as unknown as Record<string, unknown>) !== id));
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  }, [cars, setCars]);

  // Delete fuel company
  const deleteFuelCompany = useCallback(async (company: string) => {
    // Check if company is predefined
    const companyItem = fullFuelCompanies?.find(c => c.name === company);
    if (companyItem?.isPredefined) {
      alert(t?.system?.cannotDeletePredefinedFuelCompanies || t?.cannotDeletePredefinedFuelCompanies || 'Cannot delete predefined fuel companies');
      return;
    }

    if (!window.confirm(t?.system?.confirmDeleteFuelCompany?.replace('{{name}}', company) || t?.confirmDeleteFuelCompany?.replace('{{name}}', company) || `Are you sure you want to delete "${company}" from fuel companies?`)) return;

    try {
      // Find the company ID
      const companyId = companyItem?._id;
      if (!companyId) return;

      const response = await fetch(`/api/fuel-companies/${companyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setFuelCompanies(fuelCompanies.filter(c => c !== company));
        setFullFuelCompanies(fullFuelCompanies.filter(c => c._id !== companyId));
      }
    } catch (error) {
      console.error('Error deleting fuel company:', error);
    }
  }, [fullFuelCompanies, t, fuelCompanies, setFuelCompanies, setFullFuelCompanies]);

  // Delete fuel type
  const deleteFuelType = useCallback(async (type: string) => {
    // Check if type is predefined
    const typeItem = fullFuelTypes?.find(t => t.name === type);
    if (typeItem?.isPredefined) {
      alert(t?.system?.cannotDeletePredefinedFuelTypes || t?.cannotDeletePredefinedFuelTypes || 'Cannot delete predefined fuel types');
      return;
    }

    if (!window.confirm(t?.system?.confirmDeleteFuelType?.replace('{{name}}', type) || t?.confirmDeleteFuelType?.replace('{{name}}', type) || `Are you sure you want to delete "${type}" from fuel types?`)) return;

    try {
      // Find the type ID
      const typeId = typeItem?._id;
      if (!typeId) return;

      const response = await fetch(`/api/fuel-types/${typeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setFuelTypes(fuelTypes.filter(t => t !== type));
        setFullFuelTypes(fullFuelTypes.filter(t => t._id !== typeId));
      }
    } catch (error) {
      console.error('Error deleting fuel type:', error);
    }
  }, [fullFuelTypes, t, fuelTypes, setFuelTypes, setFullFuelTypes]);



  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{t?.navigation?.manageLists || 'Manage Lists'}</h1>
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

      <main className="flex-grow overflow-auto bg-gray-50 dark:bg-gray-800 transition-colors">
        <PageContainer className="p-3 md:p-6">
          <TranslatedListsTab
            cars={cars}
            fuelCompanies={fuelCompanies}
            fuelTypes={fuelTypes}
            fullFuelCompanies={fullFuelCompanies}
            fullFuelTypes={fullFuelTypes}
            newCar={newCar}
            newFuelCompany={newFuelCompany}
            newFuelType={newFuelType}
            editCar={editCar}
            editFuelCompany={editFuelCompany}
            editFuelType={editFuelType}
            customBrands={customBrands}
            customModels={customModels}
            handleNewCarInputChange={handleNewCarInputChange}
            addCar={addCar}
            addFuelCompany={addFuelCompany}
            addFuelType={addFuelType}
            setCars={setCars}
            setFuelCompanies={setFuelCompanies}
            setFuelTypes={setFuelTypes}
            setNewCar={setNewCarWrapper}
            setNewFuelCompany={setNewFuelCompany}
            setNewFuelType={setNewFuelType}
            setCustomBrands={setCustomBrands}
            setCustomModels={setCustomModels}
            deleteCar={deleteCar}
            deleteFuelCompany={deleteFuelCompany}
            deleteFuelType={deleteFuelType}
            setEditCar={setEditCar}
            setEditFuelCompany={setEditFuelCompany}
            setEditFuelType={setEditFuelType}
          />
        </PageContainer>
      </main>
    </div>
  );
}
