'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageContainer from '../components/PageContainer';
import IncomeTab from '../components/IncomeTab';
import withTranslations from '../components/withTranslations';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { useVehicles } from '../hooks/useVehicles';
import { incomeApi } from '../lib/api';
import { getObjectId } from '../lib/idUtils';
import { currencies } from '../lib/vehicleData';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import ImageUpload from '../components/ImageUpload';
import { IncomeEntry } from '../types/common';

// Wrap component with translations HOC
const TranslatedIncomeTab = withTranslations(IncomeTab);

interface IncomeCategoryItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

export default function IncomeHistoryPage() {
  const { user, loading } = useAuth();
  useLanguage();
  const { t } = useTranslation();

  // Use shared vehicle hook instead of manual state management
  const { cars, loading: carsLoading } = useVehicles();

  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [showIncomeDetails, setShowIncomeDetails] = useState<string | null>(null);
  const [itemsPerPage] = useState(20);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadIncomes = useCallback(async (offset = 0) => {
    try {
      // Use shared API utility instead of manual fetch
      const data = await incomeApi.getEntries({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });

      if (data.success && Array.isArray(data.entries)) {
        const normalizedIncomes = data.entries.map((income: any) => {
          const normalizedIncome = {...income};
          if (normalizedIncome._id && !normalizedIncome.id) {
            normalizedIncome.id = normalizedIncome._id.toString();
          } else if (normalizedIncome.id && !normalizedIncome._id) {
            normalizedIncome._id = normalizedIncome.id;
          }
          return normalizedIncome;
        });

        if (offset === 0) {
          setIncomes(normalizedIncomes);
        } else {
          setIncomes(prev => [...prev, ...normalizedIncomes]);
        }
        setHasMore(normalizedIncomes.length === itemsPerPage);
      }
    } catch (error) {
      console.error('Error fetching income entries:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [itemsPerPage]);

  // Load data
  useEffect(() => {
    if (!user) return;

    // Cars are now loaded automatically by useVehicles hook
    // Just load income entries
    loadIncomes();

    // Fetch income categories using shared API utility
    incomeApi.getCategories()
      .then(data => {
        console.log('Income categories API response:', data);
        if (data.success && Array.isArray(data.incomeCategories)) {
          const categoryNames = data.incomeCategories.map((cat: IncomeCategoryItem) => cat.name);
          console.log('Setting available categories:', categoryNames);
          setAvailableCategories(categoryNames);
        }
      })
      .catch(error => {
        console.error('Error fetching income categories:', error);
        // Fallback to predefined categories
        const fallbackCategories = [
          'Ride Sharing',
          'Delivery Services',
          'Taxi Services',
          'Car Rental',
          'Vehicle Sale',
          'Insurance Claim',
          'Fuel Reimbursement',
          'Mileage Reimbursement',
          'Business Use',
          'Freelance Driving',
          'Other'
        ];
        console.log('Using fallback categories:', fallbackCategories);
        setAvailableCategories(fallbackCategories);
      });
  }, [user, loadIncomes]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadIncomes(incomes.length);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm(t?.confirmDelete || 'Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      // Use shared API utility for deletion
      const data = await incomeApi.deleteEntry(id);

      if (data.success) {
        // Remove the income from the list
        setIncomes(incomes.filter(income => getObjectId(income as unknown as Record<string, unknown>) !== id));
        setShowIncomeDetails(null);
      }
    } catch (error) {
      console.error('Error deleting income entry:', error);
    }
  };

  const startEditingIncome = (income: IncomeEntry) => {
    console.log('Starting to edit income:', income);
    console.log('Available categories for editing:', availableCategories);
    setEditingIncome(income);
  };

  const updateIncome = async (updatedIncome: IncomeEntry) => {
    try {
      const incomeId = getObjectId(updatedIncome as unknown as Record<string, unknown>);

      // Use shared API utility for updating
      const data = await incomeApi.updateEntry(incomeId, updatedIncome);

      if (data.success) {
        // Update the income in the list
        setIncomes(incomes.map(income =>
          getObjectId(income as unknown as Record<string, unknown>) === incomeId ? { ...updatedIncome, id: incomeId, _id: incomeId } : income
        ));
        setEditingIncome(null);
      }
    } catch (error) {
      console.error('Error updating income entry:', error);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIncome) {
      updateIncome(editingIncome);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingIncome) {
      setEditingIncome({
        ...editingIncome,
        [name]: value
      });
    }
  };

  if (loading || carsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{t?.navigation?.incomeHistory || 'Income History'}</h1>
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
          <TranslatedIncomeTab
            cars={cars}
            incomes={incomes}
            showIncomeDetails={showIncomeDetails}
            itemsPerPage={itemsPerPage}
            setShowIncomeDetails={setShowIncomeDetails}
            deleteIncome={handleDeleteIncome}
            startEditingIncome={startEditingIncome}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={isLoadingMore}
          />
        </PageContainer>
      </main>

      {/* Edit Income Modal */}
      {editingIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t?.editIncome || 'Edit Income Entry'}</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.car || 'Vehicle'}
                </label>
                <select
                  name="carId"
                  value={editingIncome.carId}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 transition-colors"
                  required
                >
                  <option value="">{t?.selectVehicle || 'Select Vehicle'}</option>
                  {cars.map((car) => (
                                    <option key={getObjectId(car as unknown as Record<string, unknown>)} value={getObjectId(car as unknown as Record<string, unknown>)}>
                  {car.name}
                </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.category || 'Category'}
                </label>
                <select
                  name="category"
                  value={editingIncome.category}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 transition-colors"
                  required
                >
                  <option value="">{t?.selectCategory || 'Select Category'}</option>
                  {(() => {
                    console.log('Rendering category options, availableCategories:', availableCategories);
                    return availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {t?.[category.toLowerCase().replace(/\s+/g, '')] || category}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.amount || 'Amount'}
                </label>
                <input
                  type="number"
                  name="amount"
                  value={editingIncome.amount}
                  onChange={handleEditInputChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 transition-colors"
                  required
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.currency || 'Currency'}
                </label>
                <select
                  name="currency"
                  value={editingIncome.currency}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 transition-colors"
                  required
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.date || 'Date'}
                </label>
                <input
                  type="date"
                  name="date"
                  value={editingIncome.date}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 transition-colors"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.notes || 'Notes'}
                </label>
                <textarea
                  name="notes"
                  value={editingIncome.notes}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent dark:focus:ring-green-400 transition-colors"
                  placeholder={t?.notesPlaceholder || 'Optional notes...'}
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">
                  {t?.form?.fields?.images || 'Images'}
                </label>
                <ImageUpload
                  images={editingIncome.images || []}
                  onImagesChange={(images) => setEditingIncome(prev => prev ? { ...prev, images } : null)}
                  disabled={false}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {t?.save || 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {t?.cancel || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
