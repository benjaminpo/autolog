'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageContainer from '../components/PageContainer';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { useTranslation } from '../hooks/useTranslation';
import { currencies } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';

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

export default function AddIncomePage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [incomeForm, setIncomeForm] = useState({
    carId: '',
    category: '',
    amount: '',
    currency: 'HKD' as typeof currencies[number],
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  useEffect(() => {
    if (!user) return;

    // Fetch vehicles
    fetch('/api/vehicles')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.vehicles)) {
          const normalizedVehicles = data.vehicles.map((vehicle: Partial<Car>) => {
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

    // Fetch income categories
    fetch('/api/income-categories')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.incomeCategories)) {
          const allCategories = data.incomeCategories.map((cat: { name: string }) => cat.name);
          setIncomeCategories(allCategories.sort());
        } else {
          setIncomeCategories([]);
        }
      })
      .catch(error => {
        console.error('Error fetching income categories:', error);
        setIncomeCategories([]);
      });

    // Load user preferences
    loadFormPreferences();
  }, [user]);

  const loadFormPreferences = () => {
    try {
      const savedPrefs = localStorage.getItem('incomeFormPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setIncomeForm(prev => ({
          ...prev,
          carId: prefs.carId || '',
          category: prefs.category || '',
          currency: prefs.currency || 'HKD',
        }));
      }
    } catch (error) {
      console.error('Error loading form preferences:', error);
    }
  };

  const saveFormPreferences = (formData: typeof incomeForm) => {
    try {
      const prefsToSave = {
        carId: formData.carId,
        category: formData.category,
        currency: formData.currency,
      };
      localStorage.setItem('incomeFormPreferences', JSON.stringify(prefsToSave));
    } catch (error) {
      console.error('Error saving form preferences:', error);
    }
  };

  const clearPreferences = () => {
    try {
      localStorage.removeItem('incomeFormPreferences');
      setIncomeForm({
        carId: '',
        category: '',
        amount: '',
        currency: 'HKD' as typeof currencies[number],
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setSubmitMessage({ type: 'success', text: 'Preferences cleared successfully!' });
    } catch (error) {
      console.error('Error clearing preferences:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to clear preferences' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIncomeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/income-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeForm),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage({ type: 'success', text: (t as any)?.income?.labels?.addIncome ? `${(t as any).income.labels.addIncome} successful!` : 'Income added successfully!' });
        
        // Save user preferences
        saveFormPreferences(incomeForm);

        // Reset only specific fields while preserving user preferences
        setIncomeForm(prev => ({
          ...prev,
          amount: '',
          notes: '',
        }));
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to add income' });
      }
    } catch (error) {
      console.error('Error adding income:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while adding the income' });
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

  const getCategoryTranslation = (category: string): string => {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '');
    
    // Check if there's a direct translation available
    if (t && categoryKey in t) {
      return (t as any)[categoryKey] as string;
    }
    
    // Map to specific translation keys
    const categoryMap: { [key: string]: string } = {
      'ride sharing': getText('income.labels.rideSharing', category),
      'delivery services': getText('income.labels.deliveryServices', category),
      'taxi services': getText('income.labels.taxiServices', category),
      'car rental': getText('income.labels.carRental', category),
      'vehicle sale': getText('income.labels.vehicleSale', category),
      'insurance claim': getText('income.labels.insuranceClaim', category),
      'fuel reimbursement': getText('income.labels.fuelReimbursement', category),
      'mileage reimbursement': getText('income.labels.mileageReimbursement', category),
      'business use': getText('income.labels.businessUse', category),
      'freelance driving': getText('income.labels.freelanceDriving', category),
      'other': getText('payment.type.other', category),
    };

    return categoryMap[category.toLowerCase()] || category;
  };

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
            <h1 className="text-lg font-bold">{getText('income.labels.addIncome', 'Add Income')}</h1>
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vehicle Selection */}
                <div>
                  <label htmlFor="carId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('vehicle.labels.vehicle', 'Vehicle')} *
                  </label>
                  <select
                    id="carId"
                    name="carId"
                    value={incomeForm.carId}
                    onChange={handleInputChange}
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

                {/* Category Selection */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('income.labels.category', 'Category')} *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={incomeForm.category}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    required
                  >
                    <option value="">{getText('income.labels.category', 'Select Category')}</option>
                    {incomeCategories.map((category) => (
                      <option key={`category-${category}`} value={category}>
                        {getCategoryTranslation(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('income.labels.amount', 'Amount')} *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={incomeForm.amount}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('payment.currency', 'Currency')}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={incomeForm.currency}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                  >
                    {currencies.map((currency) => (
                      <option key={`currency-${currency}`} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('form.fields.date', 'Date')} *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={incomeForm.date}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('form.fields.notes', 'Notes')}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={incomeForm.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    placeholder={getText('form.fields.notes', 'Add any additional notes...')}
                  />
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
                      : getText('income.labels.addIncome', 'Add Income')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={clearPreferences}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-colors"
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