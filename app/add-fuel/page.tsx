'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { useTranslation } from '../hooks/useTranslation';
import { useVehicles } from '../hooks/useVehicles';
import { currencies, distanceUnits, volumeUnits, tyrePressureUnits, paymentTypes, fuelCompanies as predefinedFuelCompanies, fuelTypes as predefinedFuelTypes } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import { fuelApi } from '../lib/api';
import ImageUpload from '../components/ImageUpload';

export default function AddFuelPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { cars } = useVehicles();

  const [fuelCompanies, setFuelCompanies] = useState<string[]>(predefinedFuelCompanies);
  const [fuelTypes, setFuelTypes] = useState<string[]>(predefinedFuelTypes);
  const [fuelForm, setFuelForm] = useState({
    carId: '',
    fuelCompany: '',
    fuelType: '',
    mileage: '',
    distanceUnit: 'km' as typeof distanceUnits[number],
    volume: '',
    volumeUnit: 'liters' as typeof volumeUnits[number],
    cost: '',
    currency: 'HKD' as typeof currencies[number],
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    partialFuelUp: false,
    paymentType: 'Cash' as typeof paymentTypes[number],
    tyrePressure: '',
    tyrePressureUnit: 'psi' as typeof tyrePressureUnits[number],
    tags: '',
    notes: '',
    images: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Collapsible sections state
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showFuelDetailsSection, setShowFuelDetailsSection] = useState(true);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Helper function to get payment type translation
  const getPaymentTypeTranslation = (type: string): string => {
    const typeKey = type.toLowerCase().replace(/[^a-z]/g, '');

    switch (typeKey) {
      case 'cash':
        return getText('payment.type.cash', type);
      case 'creditcard':
        return getText('payment.type.creditCard', type);
      case 'mobileapp':
        return getText('payment.type.mobileApp', type);
      case 'other':
        return getText('payment.type.other', type);
      default:
        return type;
    }
  };

  // Load data
  useEffect(() => {
    if (!user) return;

    // Fetch fuel companies using shared API utility
        // Fetch fuel companies using shared API utility
    fuelApi.getCompanies()
      .then(data => {
        if (data.companies) {
          const customCompanies = Array.isArray(data.companies) ? data.companies : [];
          const customCompanyNames = customCompanies
            .filter((company: { name: string }) => !predefinedFuelCompanies.includes(company.name))
            .map((company: { name: string }) => company.name);
          const allCompanies = [...predefinedFuelCompanies, ...customCompanyNames];
          const sortedCompanies = [...allCompanies].sort((a, b) => a.localeCompare(b));
          setFuelCompanies(sortedCompanies);
        }
      })
      .catch(error => {
        console.error('Error fetching fuel companies:', error);
        setFuelCompanies(predefinedFuelCompanies);
      });

    // Fetch fuel types
    // Fetch fuel types using shared API utility
    fuelApi.getTypes()
      .then(data => {
        if (data.types) {
          const customTypes = Array.isArray(data.types) ? data.types : [];
          const customTypeNames = customTypes
            .filter((type: { name: string }) => !predefinedFuelTypes.includes(type.name))
            .map((type: { name: string }) => type.name);
          const allTypes = [...predefinedFuelTypes, ...customTypeNames];
          const sortedTypes = [...allTypes].sort((a, b) => a.localeCompare(b));
          setFuelTypes(sortedTypes);
        }
      })
      .catch(error => {
        console.error('Error fetching fuel types:', error);
        setFuelTypes(predefinedFuelTypes);
      });

    // Load user preferences
    loadFormPreferences();
  }, [user]);

  const loadFormPreferences = () => {
    try {
      const savedPrefs = localStorage.getItem('fuelFormPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setFuelForm(prev => ({
          ...prev,
          carId: prefs.carId || '',
          fuelCompany: prefs.fuelCompany || '',
          fuelType: prefs.fuelType || '',
          distanceUnit: prefs.distanceUnit || 'km',
          volumeUnit: prefs.volumeUnit || 'liters',
          currency: prefs.currency || 'HKD',
          location: prefs.location || '',
          paymentType: prefs.paymentType || 'Cash',
          tyrePressureUnit: prefs.tyrePressureUnit || 'psi',
        }));
      }
    } catch (error) {
      console.error('Error loading form preferences:', error);
    }
  };

  const saveFormPreferences = (formData: typeof fuelForm) => {
    try {
      const prefsToSave = {
        carId: formData.carId,
        fuelCompany: formData.fuelCompany,
        fuelType: formData.fuelType,
        distanceUnit: formData.distanceUnit,
        volumeUnit: formData.volumeUnit,
        currency: formData.currency,
        location: formData.location,
        paymentType: formData.paymentType,
        tyrePressureUnit: formData.tyrePressureUnit,
      };
      localStorage.setItem('fuelFormPreferences', JSON.stringify(prefsToSave));
    } catch (error) {
      console.error('Error saving form preferences:', error);
    }
  };

  const clearPreferences = () => {
    try {
      localStorage.removeItem('fuelFormPreferences');
      setFuelForm({
        carId: '',
        fuelCompany: '',
        fuelType: '',
        mileage: '',
        distanceUnit: 'km' as typeof distanceUnits[number],
        volume: '',
        volumeUnit: 'liters' as typeof volumeUnits[number],
        cost: '',
        currency: 'HKD' as typeof currencies[number],
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        location: '',
        partialFuelUp: false,
        paymentType: 'Cash' as typeof paymentTypes[number],
        tyrePressure: '',
        tyrePressureUnit: 'psi' as typeof tyrePressureUnits[number],
        tags: '',
        notes: '',
        images: [],
      });
      setSubmitMessage({ type: 'success', text: 'Preferences cleared successfully!' });
    } catch (error) {
      console.error('Error clearing preferences:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to clear preferences' });
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFuelForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const newEntry = {
        ...fuelForm,
        tags: fuelForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      // Use shared API utility for fuel entry creation
      const data = await fuelApi.createEntry({
        ...newEntry
      });

      if (data.success) {
        setSubmitMessage({ type: 'success', text: (t as any)?.fuel?.labels?.addEntry ? `${(t as any).fuel.labels.addEntry} successful!` : 'Fuel entry added successfully!' });

        // Save user preferences
        saveFormPreferences(fuelForm);

        // Reset only specific fields while preserving user preferences
        setFuelForm(prev => ({
          ...prev,
          mileage: '',
          volume: '',
          cost: '',
          tyrePressure: '',
          tags: '',
          notes: '',
          partialFuelUp: false,
          time: new Date().toTimeString().slice(0, 5),
        }));
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to add fuel entry' });
      }
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while adding the fuel entry' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getText = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return typeof value === 'string' ? value : fallback || key;
  };

  const getInputProps = useCallback((name: string, value: string | number) => ({
    name,
    value: value ?? '',
    onChange: handleInputChange,
  }), [handleInputChange]);

  const getCheckboxProps = useCallback((name: string, checked: boolean) => ({
    name,
    checked: Boolean(checked),
    onChange: handleInputChange,
  }), [handleInputChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access this page</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{getText('fuel.labels.addEntry', 'Add Fuel')}</h1>
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
          <div className="max-w-2xl mx-auto">
            <div>
              {submitMessage && (
                <div className={`mb-4 p-3 rounded ${
                  submitMessage.type === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBasicInfo(!showBasicInfo)}
                    className="w-full text-left text-lg font-medium flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {getText('sections.basicInfo', 'Basic Info')}
                    <span className="text-blue-600">{showBasicInfo ? '▼' : '▶'}</span>
                  </button>
                  {showBasicInfo && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="carId" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                          {getText('vehicle.labels.vehicle', 'Vehicle')} *
                        </label>
                        <select
                          id="carId"
                          {...getInputProps('carId', fuelForm.carId)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          required
                        >
                          <option value="">{getText('vehicle.labels.vehicle', 'Select Vehicle')}</option>
                          {cars.map((car) => {
                            const carId = getObjectId(car as unknown as Record<string, unknown>);
                            return (
                              <option key={`car-${carId}`} value={carId}>
                                {car.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                                                  <label htmlFor="fuelCompany" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.fuelCompany', 'Fuel Company')} *
                          </label>
                        <select
                          id="fuelCompany"
                          {...getInputProps('fuelCompany', fuelForm.fuelCompany)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          required
                        >
                          <option value="">{getText('fuel.labels.fuelCompany', 'Select Fuel Company')}</option>
                          {fuelCompanies.map((company) => (
                            <option key={`company-${company}`} value={company}>
                              {company}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                                                  <label htmlFor="fuelType" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.fuelType', 'Fuel Type')} *
                          </label>
                        <select
                          id="fuelType"
                          {...getInputProps('fuelType', fuelForm.fuelType)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          required
                        >
                          <option value="">{getText('fuel.labels.fuelType', 'Select Fuel Type')}</option>
                          {fuelTypes.map((type) => (
                            <option key={`type-${type}`} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                                                  <label htmlFor="date" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('form.fields.date', 'Date')} *
                          </label>
                        <input
                          type="date"
                          id="date"
                          {...getInputProps('date', fuelForm.date)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fuel Details Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowFuelDetailsSection(!showFuelDetailsSection)}
                    className="w-full text-left text-lg font-medium flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {getText('sections.fuelDetails', 'Fuel Details')}
                    <span className="text-blue-600">{showFuelDetailsSection ? '▼' : '▶'}</span>
                  </button>
                  {showFuelDetailsSection && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="mileage" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.mileage', 'Mileage')} *
                          </label>
                          <input
                            type="number"
                            id="mileage"
                            {...getInputProps('mileage', fuelForm.mileage)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                            placeholder="0"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="distanceUnit" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.distanceUnit', 'Distance Unit')}
                          </label>
                          <select
                            id="distanceUnit"
                            {...getInputProps('distanceUnit', fuelForm.distanceUnit)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          >
                            {distanceUnits.map((unit) => (
                              <option key={`distance-${unit}`} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="volume" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.volume', 'Volume')}
                          </label>
                          <input
                            type="number"
                            id="volume"
                            {...getInputProps('volume', fuelForm.volume)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                            placeholder="0"
                            step="0.001"
                            min="0"
                          />
                        </div>
                        <div>
                          <label htmlFor="volumeUnit" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.volumeUnit', 'Volume Unit')}
                          </label>
                          <select
                            id="volumeUnit"
                            {...getInputProps('volumeUnit', fuelForm.volumeUnit)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          >
                            {volumeUnits.map((unit) => (
                              <option key={`volume-${unit}`} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="cost" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('payment.cost', 'Cost')}
                          </label>
                          <input
                            type="number"
                            id="cost"
                            {...getInputProps('cost', fuelForm.cost)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <label htmlFor="currency" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('payment.currency', 'Currency')}
                          </label>
                          <select
                            id="currency"
                            {...getInputProps('currency', fuelForm.currency)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          >
                            {currencies.map((currency) => (
                              <option key={`currency-${currency}`} value={currency}>
                                {currency}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="partialFuelUp"
                          {...getCheckboxProps('partialFuelUp', fuelForm.partialFuelUp)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="partialFuelUp" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                          {getText('fuel.labels.partialFuelUp', 'Partial Fuel Up')}
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                    className="w-full text-left text-lg font-medium flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {getText('sections.additionalInfo', 'Additional Info')}
                    <span className="text-blue-600">{showAdditionalInfo ? '▼' : '▶'}</span>
                  </button>
                  {!showAdditionalInfo && !fuelForm.time && (
                    <div className="text-sm text-gray-700 dark:text-gray-400 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      {getText('app.timeDefaultMessage', 'Current time will be used if not specified')}
                    </div>
                  )}
                  {showAdditionalInfo && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                          {getText('form.fields.time', 'Time')}
                        </label>
                        <input
                          type="time"
                          id="time"
                          {...getInputProps('time', fuelForm.time)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                          {getText('form.fields.location', 'Location')}
                        </label>
                        <input
                          type="text"
                          id="location"
                          {...getInputProps('location', fuelForm.location)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          placeholder={getText('form.fields.location', 'Enter location...')}
                        />
                      </div>

                      <div>
                        <label htmlFor="paymentType" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                          {getText('payment.type.label', 'Payment Type')}
                        </label>
                        <select
                          id="paymentType"
                          {...getInputProps('paymentType', fuelForm.paymentType)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                        >
                          {paymentTypes.map((type) => {
                            const displayText = getPaymentTypeTranslation(type);

                            return (
                              <option key={`payment-${type}`} value={type}>
                                {displayText}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="tyrePressure" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.tyrePressure', 'Tyre Pressure')}
                          </label>
                          <input
                            type="number"
                            id="tyrePressure"
                            {...getInputProps('tyrePressure', fuelForm.tyrePressure)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                            placeholder="0"
                            step="0.1"
                            min="0"
                          />
                        </div>
                        <div>
                          <label htmlFor="tyrePressureUnit" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                            {getText('fuel.labels.tyrePressureUnit', 'Pressure Unit')}
                          </label>
                          <select
                            id="tyrePressureUnit"
                            {...getInputProps('tyrePressureUnit', fuelForm.tyrePressureUnit)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          >
                            {tyrePressureUnits.map((unit) => (
                              <option key={`tyre-${unit}`} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                          {getText('form.fields.tags', 'Tags')} ({getText('form.fields.commaSeparated', 'comma separated')})
                        </label>
                        <input
                          type="text"
                          id="tags"
                          {...getInputProps('tags', fuelForm.tags)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                          {getText('form.fields.notes', 'Notes')}
                        </label>
                        <textarea
                          id="notes"
                          {...getInputProps('notes', fuelForm.notes)}
                          rows={3}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                          placeholder={getText('form.fields.notes', 'Add any additional notes...')}
                        />
                      </div>

                      {/* Image Upload */}
                      <ImageUpload
                        images={fuelForm.images}
                        onImagesChange={(images) => setFuelForm(prev => ({ ...prev, images }))}
                        maxImages={5}
                        label={getText('form.fields.images', 'Images')}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                  >
                    {isSubmitting
                      ? getText('actions.submit', 'Adding...')
                      : getText('fuel.labels.addEntry', 'Add Fuel Entry')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={clearPreferences}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-colors"
                    title={getText('actions.clearPreferences', 'Clear saved preferences')}
                  >
                    {getText('actions.clearPreferences', 'Clear Prefs')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
