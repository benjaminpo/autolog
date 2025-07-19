import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { currencies } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import ImageUpload from './ImageUpload';

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

interface FinancialEntryFormData {
  carId: string;
  category: string;
  amount: string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
  images: string[];
}

interface FinancialEntryFormProps {
  formType: 'income' | 'expense';
}

const FinancialEntryForm: React.FC<FinancialEntryFormProps> = ({ formType }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<FinancialEntryFormData>({
    carId: '',
    category: '',
    amount: '',
    currency: 'HKD' as typeof currencies[number],
    date: new Date().toISOString().split('T')[0],
    notes: '',
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadFormPreferences = useCallback(() => {
    try {
      const savedPrefs = localStorage.getItem(`${formType}FormPreferences`);
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setFormData(prev => ({
          ...prev,
          carId: prefs.carId || '',
          category: prefs.category || '',
          currency: prefs.currency || 'HKD',
        }));
      }
    } catch (error) {
      console.error('Error loading form preferences:', error);
    }
  }, [formType]);

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

    // Fetch categories
    const categoryEndpoint = formType === 'income' ? '/api/income-categories' : '/api/expense-categories';
    const categoryKey = formType === 'income' ? 'incomeCategories' : 'expenseCategories';

    fetch(categoryEndpoint)
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data[categoryKey])) {
          const allCategories = data[categoryKey].map((cat: { name: string }) => cat.name);
          setCategories(allCategories.sort((a: string, b: string) => a.localeCompare(b)));
        } else {
          setCategories([]);
        }
      })
      .catch(error => {
        console.error(`Error fetching ${formType} categories:`, error);
        setCategories([]);
      });

    // Load user preferences
    loadFormPreferences();
  }, [user, formType, loadFormPreferences]);  const saveFormPreferences = (data: FinancialEntryFormData) => {
    try {
      const prefsToSave = {
        carId: data.carId,
        category: data.category,
        currency: data.currency,
      };
      localStorage.setItem(`${formType}FormPreferences`, JSON.stringify(prefsToSave));
    } catch (error) {
      console.error('Error saving form preferences:', error);
    }
  };

  const clearPreferences = () => {
    try {
      localStorage.removeItem(`${formType}FormPreferences`);
      setFormData({
        carId: '',
        category: '',
        amount: '',
        currency: 'HKD' as typeof currencies[number],
        date: new Date().toISOString().split('T')[0],
        notes: '',
        images: [],
      });
      setSubmitMessage({ type: 'success', text: 'Preferences cleared successfully!' });
    } catch (error) {
      console.error('Error clearing preferences:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to clear preferences' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const endpoint = formType === 'income' ? '/api/income-entries' : '/api/expense-entries';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        const successMessage = formType === 'income'
          ? getText('income.labels.addIncome', 'Income added successfully!')
          : getText('expense.labels.addExpense', 'Expense added successfully!');
        setSubmitMessage({ type: 'success', text: successMessage });

        // Save user preferences
        saveFormPreferences(formData);

        // Reset only specific fields while preserving user preferences
        setFormData(prev => ({
          ...prev,
          amount: '',
          notes: '',
          images: [],
        }));
      } else {
        setSubmitMessage({ type: 'error', text: data.message || `Failed to add ${formType}` });
      }
    } catch (error) {
      console.error(`Error adding ${formType}:`, error);
      setSubmitMessage({ type: 'error', text: `An error occurred while adding the ${formType}` });
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

    // Map to specific translation keys based on form type
    if (formType === 'income') {
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
    } else {
      // Expense categories
      const categoryMap: { [key: string]: string } = {
        'fuel': getText('expense.labels.fuel', category),
        'maintenance': getText('expense.labels.maintenance', category),
        'insurance': getText('expense.labels.insurance', category),
        'registration': getText('expense.labels.registration', category),
        'parking': getText('expense.labels.parking', category),
        'tolls': getText('expense.labels.tolls', category),
        'repairs': getText('expense.labels.repairs', category),
        'other': getText('payment.type.other', category),
      };
      return categoryMap[category.toLowerCase()] || category;
    }
  };

  return (
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
            value={formData.carId}
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
            {getText(`${formType}.labels.category`, 'Category')} *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
            required
          >
            <option value="">{getText(`${formType}.labels.category`, 'Select Category')}</option>
            {categories.map((category) => (
              <option key={`category-${category}`} value={category}>
                {getCategoryTranslation(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {getText(`${formType}.labels.amount`, 'Amount')} *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
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
            value={formData.currency}
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
            value={formData.date}
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
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
            placeholder={getText('form.fields.notes', 'Add any additional notes...')}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {getText('form.fields.images', 'Images')}
          </label>
          <ImageUpload
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            disabled={isSubmitting}
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
              : getText(`${formType}.labels.add${formType === 'income' ? 'Income' : 'Expense'}`, `Add ${formType === 'income' ? 'Income' : 'Expense'}`)
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
  );
};

export default FinancialEntryForm;
