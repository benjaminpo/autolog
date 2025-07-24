'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import ExpenseTab from '../components/ExpenseTab';
import withTranslations from '../components/withTranslations';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { useVehicles } from '../hooks/useVehicles';
import { expenseApi } from '../lib/api';
import { expenseCategories } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import { Modals } from '../components/modals';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

// Wrap components with translations HOC
const TranslatedExpenseTab = withTranslations(ExpenseTab);
const TranslatedModals = withTranslations(Modals);

interface Car {
  id: string;
  _id?: string;
  name: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  photo: string;
  dateAdded: string;
}

interface ExpenseEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: string;
  date: string;
  notes: string;
  images: string[];
}

interface ExpenseCategoryItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

export default function ExpenseHistoryPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  // Use shared vehicle hook instead of manual state management
  const { cars } = useVehicles();

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [showExpenseDetails, setShowExpenseDetails] = useState<string | null>(null);
  const [itemsPerPage] = useState(20);
  const [editExpense, setEditExpense] = useState<ExpenseEntry | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async (offset = 0) => {
    const isInitial = offset === 0;

    if (isInitial) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Use shared API utility instead of manual fetch
      const data = await expenseApi.getEntries({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });

      if (data.success && Array.isArray(data.entries)) {
        if (offset === 0) {
          setExpenses(data.entries);
        } else {
          setExpenses(prev => [...prev, ...data.entries]);
        }
        setHasMore(data.entries.length === itemsPerPage);
      }
    } catch (error) {
      console.error('Error fetching expense entries:', error);
      if (isInitial) {
        setError('Failed to load expenses. Please try again.');
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [itemsPerPage]);

  // Consolidated data loading function
  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load expense entries and categories in parallel
      const [expenseResponse, categoriesResponse] = await Promise.all([
        expenseApi.getEntries({
          limit: itemsPerPage.toString(),
          offset: '0'
        }),
        expenseApi.getCategories()
      ]);

      // Handle expense entries
      if (expenseResponse.success && Array.isArray(expenseResponse.entries)) {
        setExpenses(expenseResponse.entries);
        setHasMore(expenseResponse.entries.length === itemsPerPage);
      }

      // Handle categories
      if (categoriesResponse.success && Array.isArray(categoriesResponse.expenseCategories)) {
        // Combine predefined categories with custom categories from API
        const customCategories = categoriesResponse.expenseCategories.map((cat: any) => cat.name) as string[];
        const allCategories = [...expenseCategories, ...customCategories];
        setAvailableCategories([...new Set(allCategories)].sort((a, b) => a.localeCompare(b)));
      } else {
        // Fallback to predefined categories
        setAvailableCategories(expenseCategories.slice().sort((a, b) => a.localeCompare(b)));
      }
    } catch (error) {
      console.error('Failed to load expense data:', error);
      setError('Failed to load expenses. Please try again.');
      // Fallback to predefined categories
      setAvailableCategories(expenseCategories.slice().sort((a, b) => a.localeCompare(b)));
    } finally {
      setIsLoading(false);
    }
  }, [user, itemsPerPage]);

  // Load data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadExpenses(expenses.length);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      // Use shared API utility for deletion
      const data = await expenseApi.deleteEntry(id);

      if (data.success) {
        // Remove the expense from the list
        setExpenses(expenses.filter(expense => expense.id !== id));
        setShowExpenseDetails(null);
      }
    } catch (error) {
      console.error('Error deleting expense entry:', error);
    }
  };

  const handleEditExpenseInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editExpense) {
      const { name, value } = e.target;
      setEditExpense({ ...editExpense, [name]: value });
    }
  }, [editExpense]);

  const handleEditExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editExpense) {
      const updatedExpense = {
        ...editExpense,
        amount: parseFloat(editExpense.amount as string),
      };

      if (user) {
        try {
          const expenseId = getObjectId(editExpense as unknown as Record<string, unknown>);

          if (!expenseId) {
            console.error('Cannot update expense entry: Invalid ID');
            return;
          }

          const updateData = {
            carId: updatedExpense.carId,
            category: updatedExpense.category,
            amount: updatedExpense.amount,
            currency: updatedExpense.currency,
            date: updatedExpense.date,
            notes: updatedExpense.notes,
            images: updatedExpense.images || [],
          };

          // Use shared API utility for updating
          const data = await expenseApi.updateEntry(expenseId, updateData);

          if (!data.success) {
            console.error('Failed to update expense entry:', data.message || 'Unknown error');
            alert(`Cannot update expense entry: ${data.message || 'Unknown error'}`);
            return;
          }

          const returnedExpense = data.expense;

          if (returnedExpense) {
            const transformedExpense = {
              ...returnedExpense,
              id: getObjectId(returnedExpense as unknown as Record<string, unknown>)
            };

            setExpenses(prevExpenses =>
              prevExpenses.map((expense) =>
                getObjectId(expense as unknown as Record<string, unknown>) === getObjectId(editExpense as unknown as Record<string, unknown>) ? transformedExpense : expense
              )
            );
          } else {
            console.error('No expense data returned from server');
          }
        } catch (error) {
          console.error('Error updating expense entry:', error);
          return;
        }
      } else {
        setExpenses(prevExpenses =>
          prevExpenses.map((expense) =>
            getObjectId(expense as unknown as Record<string, unknown>) === getObjectId(editExpense as unknown as Record<string, unknown>) ? updatedExpense : expense
          )
        );
      }

      setEditExpense(null);
    }
  };

  const startEditingExpense = (expense: ExpenseEntry) => {
    const expenseWithValidId = {
      ...expense,
      id: getObjectId(expense as unknown as Record<string, unknown>),
      amount: expense.amount.toString(),
    };

    setEditExpense(expenseWithValidId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{(t as any)?.navigation?.expenseHistory || 'Expense History'}</h1>
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
        <main className="flex-grow overflow-auto transition-colors">
          <PageContainer className="p-3 md:p-6">
            <TranslatedExpenseTab
              cars={cars}
              expenses={expenses}
              showExpenseDetails={showExpenseDetails}
              itemsPerPage={itemsPerPage}
              setShowExpenseDetails={setShowExpenseDetails}
              deleteExpense={handleDeleteExpense}
              startEditingExpense={startEditingExpense}
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
        fuelCompanies={[]}
        fuelTypes={[]}
        expenseCategories={availableCategories}
        editEntry={null}
        editExpense={editExpense}
        editCar={null}
        editFuelCompany={null}
        editFuelType={null}
        handleEditInputChange={() => {}}
        handleEditCarInputChange={() => {}}
        handleEditExpenseInputChange={handleEditExpenseInputChange}
        handleEditSubmit={() => {}}
        handleEditExpenseSubmit={handleEditExpenseSubmit}
        handleEditCarSubmit={() => {}}
        handleEditFuelCompanySubmit={() => {}}
        handleEditFuelTypeSubmit={() => {}}
        setEditEntry={() => {}}
        setEditExpense={setEditExpense}
        setEditCar={() => {}}
        setEditFuelCompany={() => {}}
        setEditFuelType={() => {}}
      />
    </div>
  );
}
