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
import { expenseCategories as predefinedExpenseCategories } from '../lib/vehicleData';
import { FormInput } from '../components/FormComponents';

interface ExpenseCategoryItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

export default function ManageCategoriesPage() {
  const { user, loading } = useAuth();
  useLanguage();
  const { t } = useTranslation();

  const [fullExpenseCategories, setFullExpenseCategories] = useState<ExpenseCategoryItem[]>([]);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  useEffect(() => {
    if (!user) return;

    // Fetch expense categories
    fetch('/api/expense-categories')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.expenseCategories)) {
          const customCategories = data.expenseCategories;

          // Create predefined category objects
          const predefinedCategoryObjects = predefinedExpenseCategories.map(name => ({
            _id: `predefined-${name}`,
            userId: 'system',
            name,
            isPredefined: true
          }));

          // Merge predefined with custom, avoiding duplicates
          const customCategoriesFiltered = customCategories.filter((category: any) =>
            !predefinedExpenseCategories.includes(category.name)
          );

          setFullExpenseCategories([...predefinedCategoryObjects, ...customCategoriesFiltered]);
        } else {
          // Set predefined categories as fallback
          const predefinedCategoryObjects = predefinedExpenseCategories.map(name => ({
            _id: `predefined-${name}`,
            userId: 'system',
            name,
            isPredefined: true
          }));
          setFullExpenseCategories(predefinedCategoryObjects);
        }
      })
      .catch(error => {
        console.error('Error fetching expense categories:', error);
        // Set predefined categories as fallback
        const predefinedCategoryObjects = predefinedExpenseCategories.map(name => ({
          _id: `predefined-${name}`,
          userId: 'system',
          name,
          isPredefined: true
        }));
        setFullExpenseCategories(predefinedCategoryObjects);
      });
  }, [user]);

  const getText = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : fallback || key;
  };

  const getCategoryTranslation = (category: string): string => {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '');

    // Check if there's a direct translation available
    if (t && categoryKey in t) {
      return t[categoryKey];
    }

    // Map to specific translation keys
    const categoryMap: { [key: string]: string } = {
      'service': getText('expense.labels.service', category),
      'insurance': getText('expense.labels.insurance', category),
      'road tax': getText('expense.labels.roadTax', category),
      'vehicle tax': getText('expense.labels.vehicleTax', category),
      'vehicle purchase': getText('expense.labels.vehiclePurchase', category),
      'vehicle accident': getText('expense.labels.vehicleAccident', category),
      'vehicle service': getText('expense.labels.vehicleService', category),
      'car wash': getText('expense.labels.carWash', category),
      'fine': getText('expense.labels.fine', category),
      'mot': getText('expense.labels.mot', category),
      'parking': getText('expense.labels.parking', category),
      'tolls': getText('expense.labels.tolls', category),
      'other': getText('payment.type.other', category),
    };

    return categoryMap[category.toLowerCase()] || category;
  };

  const addExpenseCategory = async () => {
    if (!newExpenseCategory.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please enter a category name' });
      return;
    }

    // Check if category already exists
    const categoryExists = fullExpenseCategories.some(cat =>
      cat.name.toLowerCase() === newExpenseCategory.trim().toLowerCase()
    );

    if (categoryExists) {
      setSubmitMessage({ type: 'error', text: 'Category already exists' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newExpenseCategory.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Add the new category
        const newCategory = data.expenseCategory;
        setFullExpenseCategories([...fullExpenseCategories, newCategory]);
        setNewExpenseCategory('');
        setSubmitMessage({ type: 'success', text: 'Category added successfully!' });
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to add category' });
      }
    } catch (error) {
      console.error('Error adding expense category:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while adding the category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpenseCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await fetch(`/api/expense-categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the category
        const updatedCategories = fullExpenseCategories.filter(cat => cat._id !== id);
        setFullExpenseCategories(updatedCategories);
        setSubmitMessage({ type: 'success', text: 'Category deleted successfully!' });
      } else {
        const data = await response.json();
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to delete category' });
      }
    } catch (error) {
      console.error('Error deleting expense category:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while deleting the category' });
    }
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

  const predefinedCategories = fullExpenseCategories.filter(cat => cat.isPredefined).sort((a, b) => a.name.localeCompare(b.name));
  const customCategories = fullExpenseCategories.filter(cat => !cat.isPredefined).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{getText('expense.labels.manageCategories', 'Manage Categories')}</h1>
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
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Add New Category */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-colors">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{getText('expense.labels.addCustomCategory', 'Add Custom Category')}</h2>

              {submitMessage && (
                <div className={`mb-4 p-3 rounded ${
                  submitMessage.type === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <FormInput
                  type="text"
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  placeholder={getText('expense.labels.newCategoryName', 'New category name')}
                  className="flex-grow"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addExpenseCategory();
                    }
                  }}
                />
                <button
                  onClick={addExpenseCategory}
                  disabled={isSubmitting || !newExpenseCategory.trim()}
                  className={`px-6 py-3 rounded-md text-white font-medium ${
                    isSubmitting || !newExpenseCategory.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                  }`}
                >
                  {isSubmitting ? getText('actions.submit', 'Adding...') : getText('actions.save', 'Add')}
                </button>
              </div>
            </div>

            {/* Categories Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Predefined Categories */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-colors">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getText('expense.labels.predefinedCategories', 'Predefined Categories')}</h3>
                </div>
                <div className="space-y-2">
                  {predefinedCategories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md transition-colors">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{getCategoryTranslation(category.name)}</span>
                      <span className="text-xs text-gray-700 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded transition-colors">
                        {getText('system.predefined', 'Predefined')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Categories */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{getText('expense.labels.customCategories', 'Custom Categories')}</h3>
                <div className="space-y-2">
                  {customCategories.length > 0 ? (
                    customCategories.map((category) => (
                      <div key={category._id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border dark:border-blue-800 transition-colors">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                        <button
                          onClick={() => deleteExpenseCategory(category._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title={`${getText('actions.delete', 'Delete')} ${category.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-700 dark:text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p>{getText('expense.labels.noCustomCategories', 'No custom categories yet')}</p>
                      <p className="text-sm mt-1">Add your first custom category above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Statistics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-colors">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{getText('stats.categoryStatistics', 'Category Statistics')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border dark:border-blue-800 transition-colors">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{predefinedCategories.length}</div>
                  <div className="text-sm text-gray-800 dark:text-gray-400">{getText('expense.labels.predefinedCategories', 'Predefined Categories')}</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border dark:border-green-800 transition-colors">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{customCategories.length}</div>
                  <div className="text-sm text-gray-800 dark:text-gray-400">{getText('expense.labels.customCategories', 'Custom Categories')}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border dark:border-purple-800 transition-colors">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{fullExpenseCategories.length}</div>
                  <div className="text-sm text-gray-800 dark:text-gray-400">{getText('stats.totalCategories', 'Total Categories')}</div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
