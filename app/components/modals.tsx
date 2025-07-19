import * as React from 'react';
import Image from 'next/image';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { getObjectId } from '../lib/idUtils';
import { vehicleBrands, vehicleModels, currencies, distanceUnits, volumeUnits, tyrePressureUnits, vehicleTypes, getTranslatedVehicleTypes, paymentTypes, expenseCategories } from '../lib/vehicleData';
import { inputClasses, selectClasses, textareaClasses } from './FormComponents';
import ImageUpload from './ImageUpload';

interface Car {
  id: string;
  name: string;
  vehicleType: typeof vehicleTypes[number];
  brand: string;
  model: string;
  year: number;
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

interface FuelEntry {
  id: string;
  carId: string;
  fuelCompany: string;
  fuelType: string;
  mileage: number | string;
  distanceUnit: typeof distanceUnits[number];
  volume: number | string;
  volumeUnit: typeof volumeUnits[number];
  cost: number | string;
  currency: typeof currencies[number];
  date: string;
  time: string;
  location: string;
  partialFuelUp: boolean;
  paymentType: typeof paymentTypes[number];
  tyrePressure: number | string;
  tyrePressureUnit: typeof tyrePressureUnits[number];
  tags: string[];
  notes: string;
  images: string[];
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

interface ModalsProps {
  t: Record<string, string>;
  cars: Car[];
  fuelCompanies: string[];
  fuelTypes: string[];
  expenseCategories?: string[];
  editEntry: FuelEntry | null;
  editExpense: ExpenseEntry | null;
  editCar: Car | null;
  editFuelCompany: { old: string; new: string } | null;
  editFuelType: { old: string; new: string } | null;
  handleEditInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleEditCarInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleEditExpenseInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleEditSubmit: (e: React.FormEvent) => void;
  handleEditExpenseSubmit: (e: React.FormEvent) => void;
  handleEditCarSubmit: (e: React.FormEvent) => void;
  handleEditFuelCompanySubmit: (e: React.FormEvent) => void;
  handleEditFuelTypeSubmit: (e: React.FormEvent) => void;
  setEditEntry: (entry: FuelEntry | null) => void;
  setEditExpense: (expense: ExpenseEntry | null) => void;
  setEditCar: (car: Car | null) => void;
  setEditFuelCompany: (company: { old: string; new: string } | null) => void;
  setEditFuelType: (type: { old: string; new: string } | null) => void;
}

export function Modals({
  t,
  cars,
  fuelCompanies,
  fuelTypes,
  expenseCategories: propExpenseCategories,
  editEntry,
  editExpense,
  editCar,
  editFuelCompany,
  editFuelType,
  handleEditInputChange,
  handleEditCarInputChange,
  handleEditExpenseInputChange,
  handleEditSubmit,
  handleEditExpenseSubmit,
  handleEditCarSubmit,
  handleEditFuelCompanySubmit,
  handleEditFuelTypeSubmit,
  setEditEntry,
  setEditExpense,
  setEditCar,
  setEditFuelCompany,
  setEditFuelType,
}: ModalsProps) {
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showFuelDetails, setShowFuelDetails] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Vehicle form preferences state
  const [originalEditCar, setOriginalEditCar] = useState<Car | null>(null);

  // Use provided expenseCategories or fallback to imported ones
  const availableExpenseCategories = propExpenseCategories || expenseCategories;

  // Load vehicle form preferences when editCar opens
  const loadVehicleFormPreferences = useCallback(() => {
    try {
      const savedPrefs = localStorage.getItem('vehicleFormPreferences');
      if (savedPrefs && editCar) {
        const prefs = JSON.parse(savedPrefs);
        // Apply preferences to non-identifying fields only
        const updatedCar = {
          ...editCar,
          distanceUnit: prefs.distanceUnit || editCar.distanceUnit || 'km',
          fuelUnit: prefs.fuelUnit || editCar.fuelUnit || 'L',
          consumptionUnit: prefs.consumptionUnit || editCar.consumptionUnit || 'L/100km',
          fuelType: prefs.fuelType || editCar.fuelType || '',
          country: prefs.country || editCar.country || '',
          state: prefs.state || editCar.state || '',
          city: prefs.city || editCar.city || '',
        };
        // Update the editCar state through the parent component
        setEditCar(updatedCar);
      }
    } catch (error) {
      console.error('Error loading vehicle form preferences:', error);
    }
  }, [editCar, setEditCar]);

  useEffect(() => {
    if (editCar && !originalEditCar) {
      setOriginalEditCar(editCar);
      loadVehicleFormPreferences();
    } else if (!editCar) {
      setOriginalEditCar(null);
    }
  }, [editCar, originalEditCar, loadVehicleFormPreferences]);

  const saveVehicleFormPreferences = (carData: Car) => {
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
  };

  const clearVehiclePreferences = () => {
    try {
      localStorage.removeItem('vehicleFormPreferences');
      if (editCar) {
        // Reset to original values
        const resetCar = {
          ...editCar,
          distanceUnit: 'km',
          fuelUnit: 'L',
          consumptionUnit: 'L/100km',
          fuelType: '',
          country: '',
          state: '',
          city: '',
        };
        setEditCar(resetCar);
      }
    } catch (error) {
      console.error('Error clearing vehicle preferences:', error);
    }
  };

  // Enhanced handleEditCarSubmit that saves preferences
  const enhancedHandleEditCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCar) {
      // Save preferences before submitting
      saveVehicleFormPreferences(editCar);
    }
    // Call the original submit handler
    await handleEditCarSubmit(e);
  };

  // Memoize sorted arrays to prevent re-sorting on every render
  const sortedFuelTypes = useMemo(() => {
    return fuelTypes ? [...fuelTypes].sort((a, b) => a.localeCompare(b)) : [];
  }, [fuelTypes]);

  // Sort models dynamically for Edit Car modal
  const getSortedModels = (vehicleType: string, brand: string) => {
    const predefinedModels = vehicleModels[vehicleType]?.[brand] || [];
    return [...new Set(predefinedModels)].sort((a, b) => a.localeCompare(b));
  };

  return (
    <div className="p-3 max-w-7xl mx-auto flex-grow">
      {/* Edit Fuel Entry Modal */}
      {editEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-30">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow w-full max-w-md border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.edit}</h2>
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-2 sm:gap-3">
              {/* Basic Info Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowBasicInfo(!showBasicInfo)}
                  className="w-full text-left text-sm font-medium flex justify-between items-center mb-2 text-gray-900 dark:text-gray-100"
                >
                  {t.basicInfo}
                  <span className="text-blue-600 dark:text-blue-400">{showBasicInfo ? '▼' : '▶'}</span>
                </button>
                {showBasicInfo && (
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <select
                      name="carId"
                      value={editEntry.carId || ''}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                    >
                      <option value="">{t.car}</option>
                      {cars.map((car) => (
                        <option key={getObjectId(car as unknown as Record<string, unknown>)} value={getObjectId(car as unknown as Record<string, unknown>)}>
                          {car.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="fuelCompany"
                      value={editEntry.fuelCompany || ''}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                    >
                      <option value="">{t.fuelCompany}</option>
                      {fuelCompanies.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                    <select
                      name="fuelType"
                      value={editEntry.fuelType || ''}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                    >
                      <option value="">{t.fuelType}</option>
                      {sortedFuelTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      name="date"
                      value={editEntry.date || ''}
                      onChange={handleEditInputChange}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Fuel Details Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowFuelDetails(!showFuelDetails)}
                  className="w-full text-left text-sm font-medium flex justify-between items-center mb-2 text-gray-900 dark:text-gray-100"
                >
                  {t.fuelDetails}
                  <span className="text-blue-600 dark:text-blue-400">{showFuelDetails ? '▼' : '▶'}</span>
                </button>
                {showFuelDetails && (
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <input
                      type="number"
                      name="mileage"
                      value={editEntry.mileage || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.mileage}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                      min="0"
                      step="0.1"
                    />
                    <select
                      name="distanceUnit"
                      value={editEntry.distanceUnit || distanceUnits[0]}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    >
                      {distanceUnits.map((unit) => (
                        <option key={unit} value={unit}>{t[unit]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="volume"
                      value={editEntry.volume || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.volume}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                      min="0"
                      step="0.001"
                    />
                    <select
                      name="volumeUnit"
                      value={editEntry.volumeUnit || volumeUnits[0]}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    >
                      {volumeUnits.map((unit) => (
                        <option key={unit} value={unit}>{t[unit]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="cost"
                      value={editEntry.cost || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.cost}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                      min="0"
                      step="0.01"
                    />
                    <select
                      name="currency"
                      value={editEntry.currency || currencies[0]}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    >
                      <option value="">{t.currency}</option>
                      {currencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Additional Info Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full text-left text-sm font-medium flex justify-between items-center mb-2 text-gray-900 dark:text-gray-100"
                >
                  {t.additionalInfo}
                  <span className="text-blue-600 dark:text-blue-400">{showAdditionalInfo ? '▼' : '▶'}</span>
                </button>
                {showAdditionalInfo && (
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <input
                      type="time"
                      name="time"
                      value={editEntry.time || ''}
                      onChange={handleEditInputChange}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    />
                    <input
                      type="text"
                      name="location"
                      value={editEntry.location || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.location}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    />
                    <label className="flex items-center sm:text-sm text-xs text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        name="partialFuelUp"
                        checked={editEntry.partialFuelUp || false}
                        onChange={handleEditInputChange}
                        className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                      />
                      {t.partialFuelUp}
                    </label>
                    <select
                      name="paymentType"
                      value={editEntry.paymentType || paymentTypes[0]}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      required
                    >
                      {paymentTypes.map((type) => (
                        <option key={type} value={type}>
                          {t[type.toLowerCase().replace(' ', '')] || type}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="tyrePressure"
                      value={editEntry.tyrePressure || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.tyrePressure}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      min="0"
                      step="0.1"
                    />
                    <select
                      name="tyrePressureUnit"
                      value={editEntry.tyrePressureUnit || tyrePressureUnits[0]}
                      onChange={handleEditInputChange}
                      className={`${selectClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    >
                      {tyrePressureUnits.map((unit) => (
                        <option key={unit} value={unit}>{t[unit]}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="tags"
                      value={editEntry.tags.join(', ') || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.tags}
                      className={`${inputClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                    />
                    <textarea
                      name="notes"
                      value={editEntry.notes || ''}
                      onChange={handleEditInputChange}
                      placeholder={t.notes}
                      className={`${textareaClasses} sm:p-2 p-1 sm:text-sm text-xs`}
                      rows={2}
                    />
                    
                    {/* Image Upload for Fuel Entry */}
                    <ImageUpload
                      images={editEntry.images || []}
                      onImagesChange={(images) => {
                        if (editEntry) {
                          const updatedEntry = { ...editEntry, images };
                          // Update the editEntry state through the parent component
                          setEditEntry(updatedEntry);
                        }
                      }}
                      maxImages={5}
                      label={t.images || 'Images'}
                      disabled={false}
                    />
                  </div>
                )}
              </div>

              {/* Sticky Buttons */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-2 flex justify-end gap-2 transition-colors">
                <button
                  type="button"
                  onClick={() => setEditEntry(null)}
                  className="bg-gray-500 dark:bg-gray-600 text-white sm:p-2 p-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700 sm:text-sm text-xs transition-colors"
                >
                  {t.cancel || t['actions.cancel'] || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 dark:bg-blue-600 text-white sm:p-2 p-1 rounded hover:bg-blue-600 dark:hover:bg-blue-700 sm:text-sm text-xs transition-colors"
                >
                  {t.save || t['actions.save'] || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-30">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow w-full max-w-md border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.edit}</h2>
            <form onSubmit={handleEditExpenseSubmit} className="grid grid-cols-1 gap-3">
              <select
                name="carId"
                value={editExpense.carId || ''}
                onChange={handleEditExpenseInputChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                required
              >
                <option value="">{t.car}</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
              <select
                name="category"
                value={editExpense.category || availableExpenseCategories[0]}
                onChange={handleEditExpenseInputChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                aria-label={t.category || "Category"}
                title={t.category || "Category"}
                required
              >
                {availableExpenseCategories.map((category) => {
                  // Determine the translation key based on the category
                  const translationKey = category.toLowerCase().replace(/\s+/g, '');

                  // Use the properly translated text
                  let displayText = category;
                  if (translationKey in t) {
                    displayText = t[translationKey];
                  } else if (category.toLowerCase() === 'service' && 'service' in t) {
                    displayText = t.service;
                  } else if (category.toLowerCase() === 'insurance' && 'insurance' in t) {
                    displayText = t.insurance;
                  } else if (category.toLowerCase() === 'road tax' && 'roadTax' in t) {
                    displayText = t.roadTax;
                  } else if (category.toLowerCase() === 'vehicle tax' && 'vehicleTax' in t) {
                    displayText = t.vehicleTax;
                  } else if (category.toLowerCase() === 'vehicle purchase' && 'vehiclePurchase' in t) {
                    displayText = t.vehiclePurchase;
                  } else if (category.toLowerCase() === 'vehicle accident' && 'vehicleAccident' in t) {
                    displayText = t.vehicleAccident;
                  } else if (category.toLowerCase() === 'vehicle service' && 'vehicleService' in t) {
                    displayText = t.vehicleService;
                  } else if (category.toLowerCase() === 'car wash' && 'carWash' in t) {
                    displayText = t.carWash;
                  } else if (category.toLowerCase() === 'fine' && 'fine' in t) {
                    displayText = t.fine;
                  } else if (category.toLowerCase() === 'mot' && 'mot' in t) {
                    displayText = t.mot;
                  } else if (category.toLowerCase() === 'parking' && 'parking' in t) {
                    displayText = t.parking;
                  } else if (category.toLowerCase() === 'tolls' && 'tolls' in t) {
                    displayText = t.tolls;
                  } else if (category.toLowerCase() === 'other' && 'other' in t) {
                    displayText = t.other;
                  }

                  return (
                    <option key={category} value={category}>{displayText}</option>
                  );
                })}
              </select>
              <input
                type="number"
                name="amount"
                value={editExpense.amount || ''}
                onChange={handleEditExpenseInputChange}
                placeholder={t.amount}
                aria-label={t.amount || "Amount"}
                title={t.amount || "Amount"}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                required
                min="0"
                step="0.01"
              />
              <select
                name="currency"
                value={editExpense.currency || currencies[0]}
                onChange={handleEditExpenseInputChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                aria-label={t.currency || "Currency"}
                title={t.currency || "Currency"}
              >
                <option value="">{t.currency}</option>
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="date"
                value={editExpense.date || ''}
                onChange={handleEditExpenseInputChange}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                aria-label={t.date || "Date"}
                title={t.date || "Date"}
                required
              />
              <textarea
                name="notes"
                value={editExpense.notes || ''}
                onChange={handleEditExpenseInputChange}
                placeholder={t.notes}
                aria-label={t.notes || "Notes"}
                title={t.notes || "Notes"}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                rows={2}
              />
              
              {/* Image Upload for Expense */}
              <ImageUpload
                images={editExpense.images || []}
                onImagesChange={(images) => {
                  if (editExpense) {
                    const updatedExpense = { ...editExpense, images };
                    // Update the editExpense state through the parent component
                    setEditExpense(updatedExpense);
                  }
                }}
                maxImages={5}
                label={t.images || 'Images'}
                disabled={false}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditExpense(null)}
                  className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors"
                >
                  {t.cancel || t['actions.cancel'] || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-2 rounded text-sm transition-colors"
                >
                  {t.save || t['actions.save'] || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Car Modal */}
      {editCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.editCar}</h2>
            <form id="edit-car-form" onSubmit={enhancedHandleEditCarSubmit} className="overflow-y-auto flex-1 p-3">
              {/* Basic Vehicle Information Section */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 border-b pb-1">{t.basicInfo || 'Basic Info'}</h3>
                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-name">
                    {t.car || "Vehicle Name"}
                  </label>
                  <input
                    id="edit-car-name"
                    type="text"
                    name="name"
                    value={editCar.name || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.car}
                    className="p-2 border rounded w-full text-sm"
                    required
                    aria-label={t.car}
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-vehicle-type">
                    {t.vehicleType}
                  </label>
                  <select
                    id="edit-car-vehicle-type"
                    name="vehicleType"
                    value={editCar.vehicleType || ''}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    required
                    aria-label={t.vehicleType}
                  >
                    <option value="">{t.vehicleType}</option>
                    {getTranslatedVehicleTypes(t).map((translatedType, idx) => (
                      <option key={`vehicle-type-${idx}`} value={vehicleTypes[idx]}>{translatedType}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-brand">
                    {t.brand}
                  </label>
                  <select
                    id="edit-car-brand"
                    name="brand"
                    value={editCar.brand || ''}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    required
                    aria-label={t.brand}
                  >
                    <option value="">{t.brand}</option>
                    {[...(vehicleBrands[editCar.vehicleType] || []), 'Other'].map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-model">
                    {t.model}
                  </label>
                  <select
                    id="edit-car-model"
                    name="model"
                    value={editCar.model || ''}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    required
                    aria-label={t.model}
                  >
                    <option value="">{t.model}</option>
                    {getSortedModels(editCar.vehicleType, editCar.brand).map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    <option key="other-option" value="Other">{t.other}</option>
                  </select>
                </div>
                {editCar.model === 'Other' && (
                  <div className="mb-2">
                    <label className="block text-sm mb-1" htmlFor="edit-car-custom-model">
                      {t.model || "Custom Model"}
                    </label>
                    <input
                      id="edit-car-custom-model"
                      type="text"
                      name="customModel"
                      value={editCar.customModel || ''}
                      onChange={handleEditCarInputChange}
                      placeholder="Enter custom model"
                      className="p-2 border rounded w-full text-sm"
                      aria-label={t.model || "Custom Model"}
                    />
                  </div>
                )}

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-year">
                    {t.year || "Year"}
                  </label>
                  <input
                    id="edit-car-year"
                    type="number"
                    name="year"
                    value={editCar.year || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.year}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.year}
                  />
                </div>
                <label className="block mb-2">
                  <span className="text-sm">{t.photo || 'Photo'}</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full mt-1 text-sm"
                    aria-label={t.photo || 'Vehicle Photo'}
                  />
                </label>
                {editCar.photo && (
                  <Image
                    src={editCar.photo}
                    alt="Car Preview"
                    width={96}
                    height={96}
                    className="object-cover mb-2"
                    unoptimized={true}
                  />
                )}
                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-description">
                    {t.description || "Description"}
                  </label>
                  <textarea
                    id="edit-car-description"
                    name="description"
                    value={editCar.description || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.description || "Description"}
                    className="p-2 border rounded w-full text-sm"
                    rows={2}
                    aria-label={t.description || "Description"}
                  ></textarea>
                </div>
              </div>

              {/* Fuel & Units Settings Section */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 border-b pb-1">{t.fuelDetails || 'Fuel & Units'}</h3>
                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-distance-unit">
                    {t.distanceUnit || "Distance Unit"}
                  </label>
                  <select
                    id="edit-car-distance-unit"
                    name="distanceUnit"
                    value={editCar.distanceUnit || 'km'}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.distanceUnit || "Distance Unit"}
                  >
                    <option value="km">Kilometers (km)</option>
                    <option value="mi">Miles (mi)</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-fuel-unit">
                    {t.volumeUnit || "Fuel Unit"}
                  </label>
                  <select
                    id="edit-car-fuel-unit"
                    name="fuelUnit"
                    value={editCar.fuelUnit || 'L'}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.volumeUnit || "Fuel Unit"}
                  >
                    <option value="L">Liters (L)</option>
                    <option value="gal">Gallons (gal)</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-consumption-unit">
                    {t.consumptionUnit || "Consumption Unit"}
                  </label>
                  <select
                    id="edit-car-consumption-unit"
                    name="consumptionUnit"
                    value={editCar.consumptionUnit || 'L/100km'}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.consumptionUnit || "Consumption Unit"}
                  >
                    <option value="L/100km">L/100km</option>
                    <option value="mpg">MPG</option>
                    <option value="km/L">km/L</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-fuel-type">
                    {t.fuelType || "Default Fuel Type"}
                  </label>
                  <select
                    id="edit-car-fuel-type"
                    name="fuelType"
                    value={editCar.fuelType || ''}
                    onChange={handleEditCarInputChange}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.fuelType || "Default Fuel Type"}
                  >
                    <option value="">Default Fuel Type</option>
                    {fuelTypes.map((type) => (
                      <option key={`fuel-type-${type}`} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-tank-capacity">
                    {t.tankCapacity || "Tank Capacity (L)"}
                  </label>
                  <input
                    id="edit-car-tank-capacity"
                    type="number"
                    name="tankCapacity"
                    value={editCar.tankCapacity || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.tankCapacity || "Tank Capacity (L)"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.tankCapacity || "Tank Capacity (L)"}
                  />
                </div>
              </div>

              {/* Documents & Identifiers Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 border-b pb-1">{t.additionalInfo || 'Documents & IDs'}</h3>
                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-license-plate">
                    {t.licensePlate || "License Plate"}
                  </label>
                  <input
                    id="edit-car-license-plate"
                    type="text"
                    name="licensePlate"
                    value={editCar.licensePlate || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.licensePlate || "License Plate"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.licensePlate || "License Plate"}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-vin">
                    {t.vin || "VIN"}
                  </label>
                  <input
                    id="edit-car-vin"
                    type="text"
                    name="vin"
                    value={editCar.vin || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.vin || "VIN"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.vin || "VIN"}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-insurance-policy">
                    {t.insurancePolicy || "Insurance Policy"}
                  </label>
                  <input
                    id="edit-car-insurance-policy"
                    type="text"
                    name="insurancePolicy"
                    value={editCar.insurancePolicy || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.insurancePolicy || "Insurance Policy"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.insurancePolicy || "Insurance Policy"}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-country">
                    {t.country || "Country"}
                  </label>
                  <input
                    id="edit-car-country"
                    type="text"
                    name="country"
                    value={editCar.country || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.country || "Country"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.country || "Country"}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-state">
                    {t.state || "State/Region/Province"}
                  </label>
                  <input
                    id="edit-car-state"
                    type="text"
                    name="state"
                    value={editCar.state || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.state || "State/Region/Province"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.state || "State/Region/Province"}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm mb-1" htmlFor="edit-car-city">
                    {t.city || "City"}
                  </label>
                  <input
                    id="edit-car-city"
                    type="text"
                    name="city"
                    value={editCar.city || ''}
                    onChange={handleEditCarInputChange}
                    placeholder={t.city || "City"}
                    className="p-2 border rounded w-full text-sm"
                    aria-label={t.city || "City"}
                  />
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-2 p-3 border-t dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10 transition-colors">
              <button
                type="button"
                onClick={() => setEditCar(null)}
                className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors"
              >
                {t.cancel || t['actions.cancel'] || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={clearVehiclePreferences}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-sm transition-colors"
                title={t.clearPreferences || t['actions.clearPreferences'] || 'Clear saved preferences'}
              >
                {t.clearPreferences || t['actions.clearPreferences'] || 'Clear Prefs'}
              </button>
              <button
                type="submit"
                form="edit-car-form"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-2 rounded text-sm transition-colors"
              >
                {t.save || t['actions.save'] || 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fuel Company Modal */}
      {editFuelCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-30">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow w-full max-w-sm border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.editFuelCompany}</h2>
            <form onSubmit={handleEditFuelCompanySubmit}>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300" htmlFor="edit-fuel-company">
                {t.fuelCompany || "Fuel Company"}
              </label>
              <input
                id="edit-fuel-company"
                type="text"
                value={editFuelCompany.new || ''}
                onChange={(e) => setEditFuelCompany({ ...editFuelCompany, new: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded w-full mb-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                placeholder={t.fuelCompany || "Fuel Company"}
                aria-label={t.fuelCompany || "Fuel Company"}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditFuelCompany(null)}
                  className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors"
                >
                  {t.cancel || t['actions.cancel'] || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-2 rounded text-sm transition-colors"
                >
                  {t.save || t['actions.save'] || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fuel Type Modal */}
      {editFuelType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-30">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow w-full max-w-sm border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.editFuelType}</h2>
            <form onSubmit={handleEditFuelTypeSubmit}>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300" htmlFor="edit-fuel-type">
                {t.fuelType || "Fuel Type"}
              </label>
              <input
                id="edit-fuel-type"
                type="text"
                value={editFuelType.new || ''}
                onChange={(e) => setEditFuelType({ ...editFuelType, new: e.target.value })}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded w-full mb-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                placeholder={t.fuelType || "Fuel Type"}
                aria-label={t.fuelType || "Fuel Type"}
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditFuelType(null)}
                  className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white p-2 rounded text-sm transition-colors"
                >
                  {t.cancel || t['actions.cancel'] || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white p-2 rounded text-sm transition-colors"
                >
                  {t.save || t['actions.save'] || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
