import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { vehicleBrands, vehicleModels, vehicleTypes, getTranslatedVehicleTypes, translateVehicleType, fuelCompanies as predefinedFuelCompanies, fuelTypes as predefinedFuelTypes } from '../lib/vehicleData';
import { useFileInput } from '../hooks/useFileInput';
import { getObjectId } from '../lib/idUtils';
import { useLanguage } from '../context/LanguageContext';
import { TranslationType } from '../translations';
import { FormInput, FormSelect, inputClasses, labelClasses } from './FormComponents';

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

interface Car {
  id: string;
  name: string;
  vehicleType: typeof vehicleTypes[number];
  brand: string;
  model: string;
  year: number | null;
  photo: string;
  dateAdded: string; // ISO DateTime string (e.g., "2025-05-16T08:19:00")
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

interface Language {
  [key: string]: string;
}


interface ListsTabProps {
  t?: TranslationType | Record<string, string>;
  cars: Car[];
  fuelCompanies: string[];
  fuelTypes: string[];
  fullFuelCompanies?: FuelCompanyItem[];
  fullFuelTypes?: FuelTypeItem[];
  newCar: {
    name: string;
    vehicleType: typeof vehicleTypes[number];
    brand: string;
    model: string;
    customModel: string;
    year: string;
    photo: string;
    description: string;
    distanceUnit: string;
    fuelUnit: string;
    consumptionUnit: string;
    fuelType: string;
    tankCapacity: string;
    licensePlate: string;
    vin: string;
    insurancePolicy: string;
    country: string;
    state: string;
    city: string;
  };
  newFuelCompany: string;
  newFuelType: string;
  editCar: Car | null;
  editFuelCompany: { old: string; new: string } | null;
  editFuelType: { old: string; new: string } | null;
  customBrands: { [key: string]: string[] };
  customModels: { [key: string]: { [brand: string]: string[] } };
  handleNewCarInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  addCar: () => void;
  addFuelCompany: () => void;
  addFuelType: () => void;
  setCars: (cars: Car[]) => void;
  setFuelCompanies: (companies: string[]) => void;
  setFuelTypes: (types: string[]) => void;
  setNewCar: (car: ListsTabProps['newCar'] | ((prev: ListsTabProps['newCar']) => ListsTabProps['newCar'])) => void;
  setNewFuelCompany: (company: string) => void;
  setNewFuelType: (type: string) => void;
  setCustomBrands: (brands: { [key: string]: string[] }) => void;
  setCustomModels: (models: { [key: string]: { [brand: string]: string[] } }) => void;
  deleteCar: (id: string) => void;
  deleteFuelCompany: (company: string) => void;
  deleteFuelType: (type: string) => void;
  setEditCar: (car: Car | null) => void;
  setEditFuelCompany: (company: { old: string; new: string } | null) => void;
  setEditFuelType: (type: { old: string; new: string } | null) => void;
}

export default function ListsTab({
  t: propT,
  cars,
  fuelCompanies,
  fuelTypes,
  fullFuelCompanies,
  fullFuelTypes,
  newCar,
  newFuelCompany,
  newFuelType,
  editCar,
  editFuelCompany,
  editFuelType,
  customBrands,
  customModels,
  handleNewCarInputChange,
  addCar,
  addFuelCompany,
  addFuelType,
  setCars,
  setFuelCompanies,
  setFuelTypes,
  setNewCar,
  setNewFuelCompany,
  setNewFuelType,
  setCustomBrands,
  setCustomModels,
  deleteCar,
  deleteFuelCompany,
  deleteFuelType,
  setEditCar,
  setEditFuelCompany,
  setEditFuelType,
}: ListsTabProps) {
  // Use translations from context if not provided as props
  const { t: contextT } = useLanguage();
  const t = propT || contextT;

  // React 19 compatibility - inputs now use direct props to prevent re-renders

  // Handle file input with special hook for React 19 compatibility
  const handleFileUpload = useCallback((file: File, reader: FileReader) => {
    reader.onload = (e) => {
      if (e.target?.result) {
        setNewCar(prev => ({
          ...prev,
          photo: e.target!.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  }, [setNewCar]);

  const fileInput = useFileInput(handleFileUpload);

  // Combine and sort models dynamically
  const getSortedModels = useCallback((vehicleType: string, brand: string) => {
    const predefinedModels = vehicleModels[vehicleType]?.[brand] || [];
    const customModelList = customModels[vehicleType]?.[brand] || [];
    return [...new Set([...predefinedModels, ...customModelList])].sort((a, b) => a.localeCompare(b));
  }, [customModels]);

  // Format DateTime for display
  const formatDateTime = useCallback((dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Format vehicle details with additional info
  const formatVehicleDetails = useCallback((car: Car) => {
    const yearText = car.year ? `, ${car.year}` : '';
    const details = [
              `${car.name} (${translateVehicleType(car.vehicleType, t)}, ${car.brand}, ${car.model}${yearText})`,
    ];

    if (car.licensePlate) details.push(`${(t as any)?.system?.license || (t as any)?.license || 'License'}: ${car.licensePlate}`);
    if (car.fuelType) details.push(`${(t as any)?.system?.fuel || (t as any)?.fuel || 'Fuel'}: ${car.fuelType}`);

    return details.join(', ');
  }, [t]);

  // Memoized handlers for fuel company and fuel type inputs
  const handleFuelCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFuelCompany(e.target.value);
  }, [setNewFuelCompany]);

  const handleFuelTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFuelType(e.target.value);
  }, [setNewFuelType]);

  // Edit handlers
  const updateCar = useCallback(async (updatedCar: Car) => {
    try {
      const response = await fetch(`/api/vehicles/${getObjectId(updatedCar as unknown as Record<string, unknown>)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCar),
      });

      const data = await response.json();

      if (data.success) {
        setCars(cars.map(car => getObjectId(car as unknown as Record<string, unknown>) === getObjectId(updatedCar as unknown as Record<string, unknown>) ? updatedCar : car));
        setEditCar(null);
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  }, [cars, setCars, setEditCar]);

  const updateFuelCompany = useCallback(async (oldName: string, newName: string) => {
    if (oldName === newName) {
      setEditFuelCompany(null);
      return;
    }

    try {
      // Find the company item
      const companyItem = fullFuelCompanies?.find(c => c.name === oldName);
      if (!companyItem || companyItem.isPredefined) {
        alert('Cannot edit predefined fuel companies');
        setEditFuelCompany(null);
        return;
      }

      const response = await fetch(`/api/fuel-companies/${companyItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();

      if (data.success) {
        setFuelCompanies(fuelCompanies.map(company => company === oldName ? newName : company));
        setEditFuelCompany(null);
      }
    } catch (error) {
      console.error('Error updating fuel company:', error);
    }
  }, [fullFuelCompanies, fuelCompanies, setFuelCompanies, setEditFuelCompany]);

  const updateFuelType = useCallback(async (oldName: string, newName: string) => {
    if (oldName === newName) {
      setEditFuelType(null);
      return;
    }

    try {
      // Find the type item
      const typeItem = fullFuelTypes?.find(t => t.name === oldName);
      if (!typeItem || typeItem.isPredefined) {
        alert('Cannot edit predefined fuel types');
        setEditFuelType(null);
        return;
      }

      const response = await fetch(`/api/fuel-types/${typeItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();

      if (data.success) {
        setFuelTypes(fuelTypes.map(type => type === oldName ? newName : type));
        setEditFuelType(null);
      }
    } catch (error) {
      console.error('Error updating fuel type:', error);
    }
  }, [fullFuelTypes, fuelTypes, setFuelTypes, setEditFuelType]);

    // Define sections as memoized JSX instead of components to prevent React from treating them as new on each render
  const carManagementSection = useMemo(() => (
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
        {(t as any)?.vehicle?.actions?.addVehicle || 'Add Vehicle'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vehicle-name" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.car || 'Vehicle Name'} *
          </label>
          <FormInput
            id="vehicle-name"
            type="text"
            name="name"
            value={newCar.name ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.car || 'Vehicle Name'}
            required
          />
        </div>
        
        <div>
          <label htmlFor="vehicle-type" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.vehicleType || 'Vehicle Type'} *
          </label>
          <FormSelect
            id="vehicle-type"
            name="vehicleType"
            value={newCar.vehicleType ?? ''}
            onChange={handleNewCarInputChange}
            required
          >
            <option value="">{(t as any)?.vehicle?.labels?.vehicleType || 'Vehicle Type'}</option>
            {getTranslatedVehicleTypes(t).map((translatedType: string, idx: number) => (
              <option key={`vehicle-type-${vehicleTypes[idx]}`} value={vehicleTypes[idx]}>{translatedType}</option>
            ))}
          </FormSelect>
        </div>
      </div>

      {newCar.vehicleType && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vehicle-brand" className={labelClasses}>
              {(t as any)?.vehicle?.labels?.brand || 'Brand'} *
            </label>
            <FormSelect
              id="vehicle-brand"
              name="brand"
              value={newCar.brand ?? ''}
              onChange={handleNewCarInputChange}
              required
            >
              <option value="">{(t as any)?.vehicle?.labels?.brand || 'Brand'}</option>
              {[...(vehicleBrands[newCar.vehicleType] || []), ...(customBrands[newCar.vehicleType] || []), 'Other'].map((brand) => (
                <option key={`brand-${brand}`} value={brand}>
                  {brand}
                </option>
              ))}
            </FormSelect>
          </div>
          
          <div>
            {newCar.brand === 'Other' ? (
              <>
                <label htmlFor="custom-brand" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.brand || 'Custom Brand'} *
                </label>
                <FormInput
                  id="custom-brand"
                  type="text"
                  name="brand"
                  value=""
                  onChange={handleNewCarInputChange}
                  placeholder={(t as any)?.vehicle?.brand?.customPrompt || 'Enter custom brand'}
                  required
                />
              </>
            ) : (
              newCar.brand && (
                <>
                  <label htmlFor="vehicle-model" className={labelClasses}>
                    {(t as any)?.vehicle?.labels?.model || 'Model'} *
                  </label>
                  <FormSelect
                    id="vehicle-model"
                    name="model"
                    value={newCar.model ?? ''}
                    onChange={handleNewCarInputChange}
                    required
                  >
                    <option value="">{(t as any)?.vehicle?.labels?.model || 'Model'}</option>
                    {getSortedModels(newCar.vehicleType, newCar.brand).map((model) => (
                      <option key={`model-${model}`} value={model}>
                        {model}
                      </option>
                    ))}
                    <option key="model-other" value="Other">{(t as any)?.other || 'Other'}</option>
                  </FormSelect>
                </>
              )
            )}
          </div>
        </div>
      )}

      {newCar.model === 'Other' && (
        <div>
          <label htmlFor="custom-model" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.model || 'Custom Model'} *
          </label>
          <FormInput
            id="custom-model"
            type="text"
            name="customModel"
            value={newCar.customModel ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.model?.customPrompt || 'Enter custom model'}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vehicle-year" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.year || 'Year'}
          </label>
          <FormInput
            id="vehicle-year"
            type="number"
            name="year"
            value={newCar.year ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.year || 'Year'}
            min="1900"
            max="2030"
          />
        </div>
        
        <div>
          <label htmlFor="vehicle-photo" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.photo || 'Photo'}
          </label>
          <input
            id="vehicle-photo"
            type="file"
            name="photo"
            accept="image/*"
            onChange={fileInput.handleFileChange}
            className={inputClasses}
          />
        </div>
      </div>

      {newCar.photo && (
        <div className="flex justify-center">
          <Image
            src={newCar.photo}
            alt="Vehicle Preview"
            width={96}
            height={96}
            className="object-cover rounded border"
            unoptimized={true}
          />
        </div>
      )}

      <div>
        <label htmlFor="vehicle-description" className={labelClasses}>
          {(t as any)?.vehicle?.labels?.description || 'Description'}
        </label>
        <FormInput
          id="vehicle-description"
          type="text"
          name="description"
          value={newCar.description ?? ''}
          onChange={handleNewCarInputChange}
          placeholder={(t as any)?.vehicle?.labels?.description || 'Description'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="distance-unit" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.distanceUnit || 'Distance Unit'}
          </label>
          <FormSelect
            id="distance-unit"
            name="distanceUnit"
            value={newCar.distanceUnit ?? ''}
            onChange={handleNewCarInputChange}
          >
            <option value="">{(t as any)?.vehicle?.labels?.distanceUnit || 'Distance Unit'}</option>
            <option value="km">{(t as any)?.units?.distance?.kmFull || 'Kilometers (km)'}</option>
            <option value="mi">{(t as any)?.units?.distance?.milesFull || 'Miles (mi)'}</option>
          </FormSelect>
        </div>
        
        <div>
          <label htmlFor="fuel-unit" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.volumeUnit || 'Fuel Unit'}
          </label>
          <FormSelect
            id="fuel-unit"
            name="fuelUnit"
            value={newCar.fuelUnit ?? ''}
            onChange={handleNewCarInputChange}
          >
            <option value="">{(t as any)?.vehicle?.labels?.volumeUnit || 'Fuel Unit'}</option>
            <option value="L">{(t as any)?.units?.volume?.litersFull || 'Liters (L)'}</option>
            <option value="gal">{(t as any)?.units?.volume?.gallonsFull || 'Gallons (gal)'}</option>
          </FormSelect>
        </div>
        
        <div>
          <label htmlFor="consumption-unit" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.consumptionUnit || 'Consumption Unit'}
          </label>
          <FormSelect
            id="consumption-unit"
            name="consumptionUnit"
            value={newCar.consumptionUnit ?? ''}
            onChange={handleNewCarInputChange}
          >
            <option value="">{(t as any)?.vehicle?.labels?.consumptionUnit || 'Consumption Unit'}</option>
            <option value="L/100km">{(t as any)?.units?.consumption?.per100km || 'L/100km'}</option>
            <option value="mpg">{(t as any)?.units?.consumption?.mpg || 'MPG'}</option>
            <option value="km/L">{(t as any)?.units?.consumption?.kmPerLiter || 'km/L'}</option>
          </FormSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fuel-type" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.fuelType || 'Default Fuel Type'}
          </label>
          <FormSelect
            id="fuel-type"
            name="fuelType"
            value={newCar.fuelType ?? ''}
            onChange={handleNewCarInputChange}
          >
            <option value="">{(t as any)?.vehicle?.labels?.fuelType || 'Default Fuel Type'}</option>
            {fuelTypes && fuelTypes.map((type, idx) => (
              <option key={`fuel-type-${idx}`} value={type}>{type}</option>
            ))}
          </FormSelect>
        </div>
        
        <div>
          <label htmlFor="tank-capacity" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.tankCapacity || 'Tank Capacity (L)'}
          </label>
          <FormInput
            id="tank-capacity"
            type="number"
            name="tankCapacity"
            value={newCar.tankCapacity ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.tankCapacity || 'Tank Capacity (L)'}
            step="0.1"
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="license-plate" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.licensePlate || 'License Plate'}
          </label>
          <FormInput
            id="license-plate"
            type="text"
            name="licensePlate"
            value={newCar.licensePlate ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.licensePlate || 'License Plate'}
          />
        </div>
        
        <div>
          <label htmlFor="vin" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.vin || 'VIN'}
          </label>
          <FormInput
            id="vin"
            type="text"
            name="vin"
            value={newCar.vin ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.vin || 'VIN'}
          />
        </div>
      </div>

      <div>
        <label htmlFor="insurance-policy" className={labelClasses}>
          {(t as any)?.vehicle?.labels?.insurancePolicy || 'Insurance Policy'}
        </label>
        <FormInput
          id="insurance-policy"
          type="text"
          name="insurancePolicy"
          value={newCar.insurancePolicy ?? ''}
          onChange={handleNewCarInputChange}
          placeholder={(t as any)?.vehicle?.labels?.insurancePolicy || 'Insurance Policy'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="country" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.country || 'Country'}
          </label>
          <FormInput
            id="country"
            type="text"
            name="country"
            value={newCar.country ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.country || 'Country'}
          />
        </div>
        
        <div>
          <label htmlFor="state" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.state || 'State/Region/Province'}
          </label>
          <FormInput
            id="state"
            type="text"
            name="state"
            value={newCar.state ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.state || 'State/Region/Province'}
          />
        </div>
        
        <div>
          <label htmlFor="city" className={labelClasses}>
            {(t as any)?.vehicle?.labels?.city || 'City'}
          </label>
          <FormInput
            id="city"
            type="text"
            name="city"
            value={newCar.city ?? ''}
            onChange={handleNewCarInputChange}
            placeholder={(t as any)?.vehicle?.labels?.city || 'City'}
          />
        </div>
      </div>

      <button
        onClick={addCar}
        className="w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 font-medium transition-colors"
      >
        {(t as any)?.vehicle?.actions?.addVehicle || 'Add Vehicle'}
      </button>

      <div className="max-h-64 overflow-y-auto border rounded-md bg-gray-50 dark:bg-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 p-3 border-b dark:border-gray-600">
          {(t as any)?.system?.existingVehicles || 'Existing Vehicles'}
        </h4>
        {cars && cars.length > 0 ? (
          <div className="divide-y dark:divide-gray-600">
            {cars.map((car, index) => (
              <div key={`car-item-${String(getObjectId(car as unknown as Record<string, unknown>) || `temp-${index}-${Date.now()}`)}`} className="flex justify-between items-center p-3">
                <div className="flex items-center gap-3">
                  {car.photo ? (
                    <Image
                      src={car.photo}
                      alt={car.name}
                      width={48}
                      height={48}
                      className="object-cover rounded"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-400 text-xs rounded transition-colors">
                      No Photo
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {car.name} ({translateVehicleType(car.vehicleType, t)}, {car.brand}, {car.model}{car.year ? `, ${car.year}` : ''})
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-400">
                      {car.licensePlate && `${(t as any)?.system?.license || (t as any)?.license || 'License'}: ${car.licensePlate} • `}
                      {car.fuelType && `${(t as any)?.system?.fuel || (t as any)?.fuel || 'Fuel'}: ${car.fuelType} • `}
                      Added: {formatDateTime(car.dateAdded)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditCar(car)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                  >
                    {(t as any)?.actions?.edit || 'Edit'}
                  </button>
                  <button
                    onClick={() => deleteCar(getObjectId(car as unknown as Record<string, unknown>))}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    {(t as any)?.actions?.delete || 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-400 text-center p-6">
            {(t as any)?.noData || 'No vehicles'}
          </div>
        )}
      </div>
    </div>
  ), [newCar, cars, t, customBrands, fuelTypes, handleNewCarInputChange, addCar, deleteCar, setEditCar, fileInput.handleFileChange, getSortedModels, formatDateTime]);

  const fuelCompanySection = useMemo(() => (
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
        {(t as any)?.fuel?.labels?.fuelCompany || 'Fuel Companies'}
      </h3>
      
      <div>
        <label htmlFor="new-fuel-company" className={labelClasses}>
          {(t as any)?.fuel?.labels?.addFuelCompany || 'Add Fuel Company'}
        </label>
        <FormInput
          id="new-fuel-company"
          type="text"
          name="newFuelCompany"
          value={newFuelCompany || ''}
          onChange={handleFuelCompanyChange}
          placeholder={(t as any)?.fuel?.labels?.addFuelCompany || 'Add Fuel Company'}
        />
      </div>
      
      <button
        onClick={addFuelCompany}
        className="w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 font-medium transition-colors"
      >
        {(t as any)?.fuel?.labels?.addFuelCompany || 'Add Fuel Company'}
      </button>
      
      <div className="max-h-64 overflow-y-auto border rounded-md bg-gray-50 dark:bg-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 p-3 border-b dark:border-gray-600">
          {(t as any)?.system?.existingFuelCompanies || 'Existing Fuel Companies'}
        </h4>
        {fuelCompanies && fuelCompanies.length > 0 ? (
          <div className="divide-y dark:divide-gray-600">
            {fuelCompanies.map((company) => {
              // Find if this is a predefined company
              const companyItem = fullFuelCompanies?.find(c => c.name === company);
              const isPredefined = companyItem?.isPredefined;

              return (
                <div key={`fuel-company-${company}`} className="flex justify-between items-center p-3">
                  <span className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                    {company}
                    {isPredefined && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs transition-colors">
                        {(t as any)?.system?.predefined || 'Predefined'}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditFuelCompany({ old: company, new: company })}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                    >
                      {(t as any)?.actions?.edit || 'Edit'}
                    </button>
                    <button
                      onClick={() => deleteFuelCompany(company)}
                      className={`text-white px-3 py-1 rounded text-sm transition-colors ${isPredefined ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                      disabled={isPredefined}
                    >
                      {(t as any)?.actions?.delete || 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-400 text-center p-6">
            {(t as any)?.noData || 'No fuel companies'}
          </div>
        )}
      </div>
    </div>
  ), [fuelCompanies, fullFuelCompanies, t, newFuelCompany, handleFuelCompanyChange, addFuelCompany, setEditFuelCompany, deleteFuelCompany]);

  const fuelTypeSection = useMemo(() => (
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
        {(t as any)?.fuel?.labels?.fuelType || 'Fuel Types'}
      </h3>
      
      <div>
        <label htmlFor="new-fuel-type" className={labelClasses}>
          {(t as any)?.fuel?.labels?.addFuelType || 'Add Fuel Type'}
        </label>
        <FormInput
          id="new-fuel-type"
          type="text"
          name="newFuelType"
          value={newFuelType || ''}
          onChange={handleFuelTypeChange}
          placeholder={(t as any)?.fuel?.labels?.addFuelType || 'Add Fuel Type'}
        />
      </div>
      
      <button
        onClick={addFuelType}
        className="w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 font-medium transition-colors"
      >
        {(t as any)?.fuel?.labels?.addFuelType || 'Add Fuel Type'}
      </button>
      
      <div className="max-h-64 overflow-y-auto border rounded-md bg-gray-50 dark:bg-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 p-3 border-b dark:border-gray-600">
          {(t as any)?.system?.existingFuelTypes || 'Existing Fuel Types'}
        </h4>
        {fuelTypes && fuelTypes.length > 0 ? (
          <div className="divide-y dark:divide-gray-600">
            {fuelTypes.map((type) => {
              // Find if this is a predefined type
              const typeItem = fullFuelTypes?.find(t => t.name === type);
              const isPredefined = typeItem?.isPredefined;

              return (
                <div key={`fuel-type-${type}`} className="flex justify-between items-center p-3">
                  <span className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                    {type}
                    {isPredefined && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs transition-colors">
                        {(t as any)?.system?.predefined || 'Predefined'}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditFuelType({ old: type, new: type })}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                    >
                      {(t as any)?.actions?.edit || 'Edit'}
                    </button>
                    <button
                      onClick={() => deleteFuelType(type)}
                      className={`text-white px-3 py-1 rounded text-sm transition-colors ${isPredefined ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                      disabled={isPredefined}
                    >
                      {(t as any)?.actions?.delete || 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-400 text-center p-6">
            {(t as any)?.noData || 'No fuel types'}
          </div>
        )}
      </div>
    </div>
  ), [fuelTypes, fullFuelTypes, t, newFuelType, handleFuelTypeChange, addFuelType, setEditFuelType, deleteFuelType]);

  // Edit Forms/Modals
  const EditCarModal = () => {
    const [editCarData, setEditCarData] = React.useState(editCar || {
      id: '',
      name: '',
      vehicleType: 'Car/Truck' as const,
      brand: '',
      model: '',
      year: null,
      photo: '',
      dateAdded: new Date().toISOString(),
      customModel: '',
      description: '',
      distanceUnit: 'km',
      fuelUnit: 'L',
      consumptionUnit: 'L/100km',
      fuelType: '',
      tankCapacity: null,
      licensePlate: '',
      vin: '',
      insurancePolicy: '',
      country: '',
      state: '',
      city: ''
    });

    const editFileInput = useFileInput((file: File, reader: FileReader) => {
      const result = reader.result as string;
      setEditCarData(prev => ({ ...prev, photo: result }));
    });

    if (!editCar) return null;

    const handleEditCarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditCarData(prev => ({ ...prev, [name]: value }));
    };

    const translatedVehicleTypes = getTranslatedVehicleTypes(t as TranslationType);
    const availableBrands = editCarData.vehicleType ? vehicleBrands[editCarData.vehicleType] || [] : [];
    const availableModels = editCarData.vehicleType && editCarData.brand ? vehicleModels[editCarData.vehicleType]?.[editCarData.brand] || [] : [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{(t as any)?.vehicle?.actions?.editVehicle || 'Edit Vehicle'}</h3>
          
          <div className="space-y-4">
            {/* Vehicle Name */}
            <div>
              <label htmlFor="edit-vehicle-name" className={labelClasses}>
                {(t as any)?.vehicle?.labels?.car || 'Vehicle Name'} *
              </label>
              <FormInput
                id="edit-vehicle-name"
                type="text"
                name="name"
                value={editCarData.name}
                onChange={handleEditCarChange}
                placeholder={(t as any)?.vehicle?.labels?.car || 'Vehicle Name'}
                required
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label htmlFor="edit-vehicle-type" className={labelClasses}>
                {(t as any)?.vehicle?.labels?.vehicleType || 'Vehicle Type'} *
              </label>
              <FormSelect
                id="edit-vehicle-type"
                name="vehicleType"
                value={editCarData.vehicleType}
                onChange={handleEditCarChange}
                required
              >
                <option value="">{(t as any)?.vehicle?.labels?.vehicleType || 'Select Vehicle Type'}</option>
                {translatedVehicleTypes.map((translatedType: string, idx: number) => (
                  <option key={`edit-vehicle-type-${vehicleTypes[idx]}`} value={vehicleTypes[idx]}>{translatedType}</option>
                ))}
              </FormSelect>
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="edit-vehicle-brand" className={labelClasses}>
                {(t as any)?.vehicle?.labels?.brand || 'Brand'} *
              </label>
              <FormSelect
                id="edit-vehicle-brand"
                name="brand"
                value={editCarData.brand}
                onChange={handleEditCarChange}
                required
              >
                <option value="">{(t as any)?.vehicle?.labels?.brand || 'Select Brand'}</option>
                {availableBrands.map((brand, idx) => (
                  <option key={`edit-brand-${idx}`} value={brand}>{brand}</option>
                ))}
                <option value="Other">{(t as any)?.vehicle?.labels?.other || 'Other'}</option>
              </FormSelect>
            </div>

            {/* Model */}
            <div>
              <label htmlFor="edit-vehicle-model" className={labelClasses}>
                {(t as any)?.vehicle?.labels?.model || 'Model'} *
              </label>
              <FormSelect
                id="edit-vehicle-model"
                name="model"
                value={editCarData.model}
                onChange={handleEditCarChange}
                required
              >
                <option value="">{(t as any)?.vehicle?.labels?.model || 'Select Model'}</option>
                {availableModels.map((model, idx) => (
                  <option key={`edit-model-${idx}`} value={model}>{model}</option>
                ))}
                <option value="Other">{(t as any)?.vehicle?.labels?.other || 'Other'}</option>
              </FormSelect>
            </div>

            {/* Custom Model */}
            {editCarData.model === 'Other' && (
              <div>
                <label htmlFor="edit-custom-model" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.model || 'Custom Model'} *
                </label>
                <FormInput
                  id="edit-custom-model"
                  type="text"
                  name="customModel"
                  value={editCarData.customModel ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.model?.customPrompt || 'Enter custom model'}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year */}
              <div>
                <label htmlFor="edit-vehicle-year" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.year || 'Year'}
                </label>
                <FormInput
                  id="edit-vehicle-year"
                  type="number"
                  name="year"
                  value={editCarData.year ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.year || 'Year'}
                  min="1900"
                  max="2030"
                />
              </div>
              
              {/* Photo */}
              <div>
                <label htmlFor="edit-vehicle-photo" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.photo || 'Photo'}
                </label>
                <input
                  id="edit-vehicle-photo"
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={editFileInput.handleFileChange}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Photo Preview */}
            {editCarData.photo && (
              <div className="flex justify-center">
                <Image
                  src={editCarData.photo}
                  alt="Vehicle Preview"
                  width={96}
                  height={96}
                  className="object-cover rounded border"
                  unoptimized={true}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="edit-vehicle-description" className={labelClasses}>
                {(t as any)?.vehicle?.labels?.description || 'Description'}
              </label>
              <FormInput
                id="edit-vehicle-description"
                type="text"
                name="description"
                value={editCarData.description ?? ''}
                onChange={handleEditCarChange}
                placeholder={(t as any)?.vehicle?.labels?.description || 'Description'}
              />
            </div>

            {/* Units */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-distance-unit" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.distanceUnit || 'Distance Unit'}
                </label>
                <FormSelect
                  id="edit-distance-unit"
                  name="distanceUnit"
                  value={editCarData.distanceUnit ?? ''}
                  onChange={handleEditCarChange}
                >
                  <option value="">{(t as any)?.vehicle?.labels?.distanceUnit || 'Distance Unit'}</option>
                  <option value="km">{(t as any)?.units?.distance?.kmFull || 'Kilometers (km)'}</option>
                  <option value="mi">{(t as any)?.units?.distance?.milesFull || 'Miles (mi)'}</option>
                </FormSelect>
              </div>
              
              <div>
                <label htmlFor="edit-fuel-unit" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.volumeUnit || 'Fuel Unit'}
                </label>
                <FormSelect
                  id="edit-fuel-unit"
                  name="fuelUnit"
                  value={editCarData.fuelUnit ?? ''}
                  onChange={handleEditCarChange}
                >
                  <option value="">{(t as any)?.vehicle?.labels?.volumeUnit || 'Fuel Unit'}</option>
                  <option value="L">{(t as any)?.units?.volume?.litersFull || 'Liters (L)'}</option>
                  <option value="gal">{(t as any)?.units?.volume?.gallonsFull || 'Gallons (gal)'}</option>
                </FormSelect>
              </div>
              
              <div>
                <label htmlFor="edit-consumption-unit" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.consumptionUnit || 'Consumption Unit'}
                </label>
                <FormSelect
                  id="edit-consumption-unit"
                  name="consumptionUnit"
                  value={editCarData.consumptionUnit ?? ''}
                  onChange={handleEditCarChange}
                >
                  <option value="">{(t as any)?.vehicle?.labels?.consumptionUnit || 'Consumption Unit'}</option>
                  <option value="L/100km">{(t as any)?.units?.consumption?.per100km || 'L/100km'}</option>
                  <option value="mpg">{(t as any)?.units?.consumption?.mpg || 'MPG'}</option>
                  <option value="km/L">{(t as any)?.units?.consumption?.kmPerLiter || 'km/L'}</option>
                </FormSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fuel Type */}
              <div>
                <label htmlFor="edit-fuel-type" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.fuelType || 'Default Fuel Type'}
                </label>
                <FormSelect
                  id="edit-fuel-type"
                  name="fuelType"
                  value={editCarData.fuelType ?? ''}
                  onChange={handleEditCarChange}
                >
                  <option value="">{(t as any)?.vehicle?.labels?.fuelType || 'Default Fuel Type'}</option>
                  {fuelTypes && fuelTypes.map((type, idx) => (
                    <option key={`edit-fuel-type-${idx}`} value={type}>{type}</option>
                  ))}
                </FormSelect>
              </div>
              
              {/* Tank Capacity */}
              <div>
                <label htmlFor="edit-tank-capacity" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.tankCapacity || 'Tank Capacity (L)'}
                </label>
                <FormInput
                  id="edit-tank-capacity"
                  type="number"
                  name="tankCapacity"
                  value={editCarData.tankCapacity ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.tankCapacity || 'Tank Capacity (L)'}
                  step="0.1"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Plate */}
              <div>
                <label htmlFor="edit-license-plate" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.licensePlate || 'License Plate'}
                </label>
                <FormInput
                  id="edit-license-plate"
                  type="text"
                  name="licensePlate"
                  value={editCarData.licensePlate ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.licensePlate || 'License Plate'}
                />
              </div>
              
              {/* VIN */}
              <div>
                <label htmlFor="edit-vin" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.vin || 'VIN'}
                </label>
                <FormInput
                  id="edit-vin"
                  type="text"
                  name="vin"
                  value={editCarData.vin ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.vin || 'VIN'}
                />
              </div>
            </div>

            {/* Insurance Policy */}
            <div>
              <label htmlFor="edit-insurance-policy" className={labelClasses}>
                {(t as any)?.vehicle?.labels?.insurancePolicy || 'Insurance Policy'}
              </label>
              <FormInput
                id="edit-insurance-policy"
                type="text"
                name="insurancePolicy"
                value={editCarData.insurancePolicy ?? ''}
                onChange={handleEditCarChange}
                placeholder={(t as any)?.vehicle?.labels?.insurancePolicy || 'Insurance Policy'}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-country" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.country || 'Country'}
                </label>
                <FormInput
                  id="edit-country"
                  type="text"
                  name="country"
                  value={editCarData.country ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.country || 'Country'}
                />
              </div>
              
              <div>
                <label htmlFor="edit-state" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.state || 'State'}
                </label>
                <FormInput
                  id="edit-state"
                  type="text"
                  name="state"
                  value={editCarData.state ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.state || 'State'}
                />
              </div>
              
              <div>
                <label htmlFor="edit-city" className={labelClasses}>
                  {(t as any)?.vehicle?.labels?.city || 'City'}
                </label>
                <FormInput
                  id="edit-city"
                  type="text"
                  name="city"
                  value={editCarData.city ?? ''}
                  onChange={handleEditCarChange}
                  placeholder={(t as any)?.vehicle?.labels?.city || 'City'}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => updateCar(editCarData)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-medium transition-colors"
            >
              {(t as any)?.actions?.save || 'Save'}
            </button>
            <button
              onClick={() => setEditCar(null)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium transition-colors"
            >
              {(t as any)?.actions?.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditFuelCompanyModal = () => {
    const [newName, setNewName] = React.useState(editFuelCompany?.new || '');

    if (!editFuelCompany) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full border dark:border-gray-700 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{(t as any)?.fuel?.labels?.editFuelCompany || 'Edit Fuel Company'}</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-fuel-company-name" className={labelClasses}>
                {(t as any)?.fuel?.labels?.fuelCompany || 'Fuel Company Name'}
              </label>
              <input
                id="edit-fuel-company-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={(t as any)?.fuel?.labels?.fuelCompany || 'Fuel Company Name'}
                className={inputClasses}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => updateFuelCompany(editFuelCompany.old, newName)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-medium transition-colors"
            >
              {(t as any)?.actions?.save || 'Save'}
            </button>
            <button
              onClick={() => setEditFuelCompany(null)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium transition-colors"
            >
              {(t as any)?.actions?.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditFuelTypeModal = () => {
    const [newName, setNewName] = React.useState(editFuelType?.new || '');

    if (!editFuelType) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full border dark:border-gray-700 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{(t as any)?.fuel?.labels?.editFuelType || 'Edit Fuel Type'}</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-fuel-type-name" className={labelClasses}>
                {(t as any)?.fuel?.labels?.fuelType || 'Fuel Type Name'}
              </label>
              <input
                id="edit-fuel-type-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={(t as any)?.fuel?.labels?.fuelType || 'Fuel Type Name'}
                className={inputClasses}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => updateFuelType(editFuelType.old, newName)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-medium transition-colors"
            >
              {(t as any)?.actions?.save || 'Save'}
            </button>
            <button
              onClick={() => setEditFuelType(null)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium transition-colors"
            >
              {(t as any)?.actions?.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 transition-colors">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {(t as any)?.navigation?.manageLists || (t as any)?.manageLists || 'Manage Lists'}
          </h2>
          <p className="text-gray-800 dark:text-gray-400 mt-1">
            {(t as any)?.navigation?.manageListsDescription || 'Manage your vehicles, fuel companies, and fuel types'}
          </p>
        </div>
        
        <div className="p-6 space-y-8">
          <div key="car-management-section">
            {carManagementSection}
          </div>
          <div key="fuel-companies-section">
            {fuelCompanySection}
          </div>
          <div key="fuel-types-section">
            {fuelTypeSection}
          </div>
        </div>
      </div>
      
      {/* Edit Modals */}
      <EditCarModal />
      <EditFuelCompanyModal />
      <EditFuelTypeModal />
    </div>
  );
}
