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
import { FormSelect, FormInput } from '../components/FormComponents';
import { exportFuelEntriesToCSV, exportExpenseEntriesToCSV, exportIncomeEntriesToCSV, exportFilteredFuelEntries, exportFilteredExpenseEntries, exportFilteredIncomeEntries } from '../lib/csvExport';
import { validateVehicles } from '../lib/idUtils';

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

interface FuelEntry {
  id: string;
  carId: string;
  fuelCompany: string;
  fuelType: string;
  mileage: number | string;
  distanceUnit: string;
  volume: number | string;
  volumeUnit: string;
  cost: number | string;
  currency: string;
  date: string;
  time: string;
  location: string;
  partialFuelUp: boolean;
  paymentType: string;
  tyrePressure: number | string;
  tyrePressureUnit: string;
  tags: string[];
  notes: string;
}

interface ExpenseEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: string;
  date: string;
  notes: string;
}

interface IncomeEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: string;
  date: string;
  notes: string;
}

interface ExpenseCategoryItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

interface IncomeCategoryItem {
  _id: string;
  userId: string;
  name: string;
  isPredefined?: boolean;
}

export default function ExportPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [exportType, setExportType] = useState<'fuel' | 'expenses' | 'income'>('fuel');
  const [cars, setCars] = useState<Car[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exportStats, setExportStats] = useState<{
    totalFuelEntries: number;
    totalExpenseEntries: number;
    totalIncomeEntries: number;
    dateRange: { start: string; end: string } | null;
  } | null>(null);

  // Export filters
  const [exportFilters, setExportFilters] = useState({
    carId: '',
    startDate: '',
    endDate: '',
    category: '', // For expenses only
  });

  // Load data on component mount
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load cars
        const carsResponse = await fetch('/api/vehicles');
        const carsData = await carsResponse.json();
        if (carsData.success && Array.isArray(carsData.vehicles)) {
          const validatedVehicles = validateVehicles(carsData.vehicles);
          setCars(validatedVehicles);
        }

        // Load fuel entries
        const fuelResponse = await fetch('/api/fuel-entries');
        const fuelData = await fuelResponse.json();
        if (fuelData.success) {
          setFuelEntries(fuelData.entries);
        }

        // Load expense entries
        const expenseResponse = await fetch('/api/expense-entries');
        const expenseData = await expenseResponse.json();
        if (expenseData.success) {
          setExpenseEntries(expenseData.expenses);
        }

        // Load income entries
        const incomeResponse = await fetch('/api/income-entries');
        const incomeData = await incomeResponse.json();
        if (incomeData.success) {
          setIncomeEntries(incomeData.entries);
        }

        // Load expense categories
        const categoriesResponse = await fetch('/api/expense-categories');
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          const categoryNames = categoriesData.expenseCategories.map((cat: ExpenseCategoryItem) => cat.name);
          setExpenseCategories(categoryNames);
        }

        // Load income categories
        const incomeCategoriesResponse = await fetch('/api/income-categories');
        const incomeCategoriesData = await incomeCategoriesResponse.json();
        if (incomeCategoriesData.success) {
          const incomeCategoryNames = incomeCategoriesData.incomeCategories.map((cat: IncomeCategoryItem) => cat.name);
          setIncomeCategories(incomeCategoryNames);
        }

        // Calculate stats
        const allEntries = [...fuelData.entries || [], ...expenseData.expenses || [], ...incomeData.entries || []];
        if (allEntries.length > 0) {
          const dates = allEntries.map(entry => entry.date).sort();
          setExportStats({
            totalFuelEntries: fuelData.entries?.length || 0,
            totalExpenseEntries: expenseData.expenses?.length || 0,
            totalIncomeEntries: incomeData.entries?.length || 0,
            dateRange: {
              start: dates[0],
              end: dates[dates.length - 1]
            }
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExportFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExportAll = () => {
    if (exportType === 'fuel') {
      exportFuelEntriesToCSV(fuelEntries, cars);
    } else if (exportType === 'expenses') {
      exportExpenseEntriesToCSV(expenseEntries, cars);
    } else {
      exportIncomeEntriesToCSV(incomeEntries, cars);
    }
  };

  const handleExportFiltered = () => {
    if (exportType === 'fuel') {
      exportFilteredFuelEntries(fuelEntries, cars, exportFilters);
    } else if (exportType === 'expenses') {
      exportFilteredExpenseEntries(expenseEntries, cars, exportFilters);
    } else {
      exportFilteredIncomeEntries(incomeEntries, cars, exportFilters);
    }
  };

  const getFilteredCount = () => {
    const entries = exportType === 'fuel' ? fuelEntries : exportType === 'expenses' ? expenseEntries : incomeEntries;
    let filtered = [...entries];

    if (exportFilters.carId) {
      filtered = filtered.filter(entry => entry.carId === exportFilters.carId);
    }
    if (exportFilters.startDate) {
      filtered = filtered.filter(entry => entry.date >= exportFilters.startDate);
    }
    if (exportFilters.endDate) {
      filtered = filtered.filter(entry => entry.date <= exportFilters.endDate);
    }
    if ((exportType === 'expenses' || exportType === 'income') && exportFilters.category) {
      filtered = filtered.filter(entry => (entry as ExpenseEntry | IncomeEntry).category === exportFilters.category);
    }

    return filtered.length;
  };

  const generateSampleCSV = () => {
    if (exportType === 'fuel') {
      const sampleData = `Car Name,Date,Time,Fuel Company,Fuel Type,Mileage,Distance Unit,Volume,Volume Unit,Cost,Currency,Location,Partial Fuel Up,Payment Type,Tyre Pressure,Tyre Pressure Unit,Tags,Notes
My Car,2024-01-15,14:30,Shell,Petrol,15000,km,45,liters,350,HKD,Central,No,Credit Card,32,psi,highway; city,Regular fill-up
My Car,2024-01-20,09:15,Caltex,Petrol,15250,km,40,liters,320,HKD,Tsim Sha Tsui,No,Cash,32,psi,city,Morning commute`;
      
      const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'sample_fuel_entries.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportType === 'expenses') {
      const sampleData = `Car Name,Date,Category,Amount,Currency,Notes
My Car,2024-01-15,Service,500,HKD,Oil change and filter replacement
My Car,2024-01-20,Parking,50,HKD,Shopping mall parking
My Car,2024-01-25,Insurance,2000,HKD,Annual insurance premium`;
      
      const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'sample_expense_entries.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const sampleData = `Car Name,Date,Category,Amount,Currency,Notes
My Car,2024-01-15,Ride Sharing,800,HKD,Uber driving earnings
My Car,2024-01-20,Delivery Services,450,HKD,Food delivery income
My Car,2024-01-25,Mileage Reimbursement,300,HKD,Business trip reimbursement`;
      
      const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'sample_income_entries.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          <h1 className="text-2xl font-bold mb-4">Please log in to export data</h1>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{(t as any)?.export?.export || 'Export Data'}</h1>
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
          {/* Export Type Selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{(t as any)?.export?.selectExportType || 'Select Export Type'}</h2>
            <div className="flex gap-4">
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="exportType"
                  value="fuel"
                  checked={exportType === 'fuel'}
                  onChange={(e) => setExportType(e.target.value as 'fuel' | 'expenses' | 'income')}
                  className="mr-2"
                />
                <span className="text-lg">{(t as any)?.export?.fuelEntries || 'Fuel Entries'}</span>
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="exportType"
                  value="expenses"
                  checked={exportType === 'expenses'}
                  onChange={(e) => setExportType(e.target.value as 'fuel' | 'expenses' | 'income')}
                  className="mr-2"
                />
                <span className="text-lg">{(t as any)?.export?.expenseEntries || 'Expense Entries'}</span>
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="exportType"
                  value="income"
                  checked={exportType === 'income'}
                  onChange={(e) => setExportType(e.target.value as 'fuel' | 'expenses' | 'income')}
                  className="mr-2"
                />
                <span className="text-lg">{(t as any)?.export?.incomeEntries || 'Income Entries'}</span>
              </label>
            </div>
          </div>

          {/* Data Overview */}
          {exportStats && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border dark:border-gray-700 transition-colors">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{(t as any)?.export?.dataOverview || 'Data Overview'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">{(t as any)?.export?.totalFuelEntries || 'Total Fuel Entries'}</h3>
                  <p className="text-2xl font-bold text-blue-600">{exportStats.totalFuelEntries}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border dark:border-green-800 transition-colors">
                  <h3 className="font-semibold text-green-800">{(t as any)?.export?.totalExpenseEntries || 'Total Expense Entries'}</h3>
                  <p className="text-2xl font-bold text-green-600">{exportStats.totalExpenseEntries}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">{(t as any)?.export?.totalIncomeEntries || 'Total Income Entries'}</h3>
                  <p className="text-2xl font-bold text-purple-600">{exportStats.totalIncomeEntries}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">{(t as any)?.export?.dateRange || 'Date Range'}</h3>
                  <p className="text-sm text-purple-600">
                    {exportStats.dateRange ? 
                      `${exportStats.dateRange.start} to ${exportStats.dateRange.end}` : 
                      (t as any)?.export?.noData || 'No data'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{(t as any)?.export?.exportOptions || 'Export Options'}</h2>
            
            {/* Quick Export */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">{(t as any)?.export?.quickExport || 'Quick Export'}</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportAll}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exportType === 'fuel' 
                    ? ((t as any)?.export?.exportAllFuelEntries || 'Export All Fuel Entries')
                    : exportType === 'expenses'
                      ? ((t as any)?.export?.exportAllExpenseEntries || 'Export All Expense Entries')
                      : ((t as any)?.export?.exportAllIncomeEntries || 'Export All Income Entries')
                  }
                </button>
                <button
                  onClick={generateSampleCSV}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {(t as any)?.export?.downloadSample || 'Download Sample CSV'}
                </button>
              </div>
            </div>

            {/* Filtered Export */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">{(t as any)?.export?.filteredExport || 'Filtered Export'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Car Filter */}
                <FormSelect
                  label={(t as any)?.car || 'Car'}
                  name="carId"
                  value={exportFilters.carId}
                  onChange={handleFilterChange}
                >
                  <option value="">{(t as any)?.export?.allCars || 'All Cars'}</option>
                  {cars.map((car) => (
                    <option key={car.id || car._id} value={car.id || car._id}>
                      {car.name}
                    </option>
                  ))}
                </FormSelect>

                {/* Category Filter (for expenses and income) */}
                {(exportType === 'expenses' || exportType === 'income') && (
                  <FormSelect
                    label={(t as any)?.category || 'Category'}
                    name="category"
                    value={exportFilters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">{(t as any)?.export?.allCategories || 'All Categories'}</option>
                    {(exportType === 'expenses' ? expenseCategories : incomeCategories).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </FormSelect>
                )}

                {/* Start Date Filter */}
                <FormInput
                  type="date"
                  label={(t as any)?.export?.startDate || 'Start Date'}
                  name="startDate"
                  value={exportFilters.startDate}
                  onChange={handleFilterChange}
                />

                {/* End Date Filter */}
                <FormInput
                  type="date"
                  label={(t as any)?.export?.endDate || 'End Date'}
                  name="endDate"
                  value={exportFilters.endDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {(t as any)?.export?.filteredResults || 'Filtered results'}: <span className="font-semibold">{getFilteredCount()}</span> {(t as any)?.export?.entries || 'entries'}
                </div>
                <button
                  onClick={handleExportFiltered}
                  disabled={isLoading || getFilteredCount() === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  {(t as any)?.export?.exportFiltered || 'Export Filtered'}
                </button>
              </div>
            </div>
          </div>

          {/* CSV Format Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{(t as any)?.export?.csvFormatInfo || 'CSV Format Information'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{(t as any)?.export?.fuelEntriesFormat || 'Fuel Entries Format'}</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="text-gray-700 dark:text-gray-300 mb-2">{(t as any)?.export?.csvHeaders || 'CSV Headers'}:</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                    Car Name, Date, Time, Fuel Company, Fuel Type, Mileage, Distance Unit, Volume, Volume Unit, Cost, Currency, Location, Partial Fuel Up, Payment Type, Tyre Pressure, Tyre Pressure Unit, Tags, Notes
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{(t as any)?.export?.expenseEntriesFormat || 'Expense Entries Format'}</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="text-gray-700 dark:text-gray-300 mb-2">{(t as any)?.export?.csvHeaders || 'CSV Headers'}:</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                    Car Name, Date, Category, Amount, Currency, Notes
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{(t as any)?.export?.incomeEntriesFormat || 'Income Entries Format'}</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="text-gray-700 dark:text-gray-300 mb-2">{(t as any)?.export?.csvHeaders || 'CSV Headers'}:</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                    Car Name, Date, Category, Amount, Currency, Notes
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">{(t as any)?.export?.exportNotes || 'Export Notes'}</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {(t as any)?.export?.csvUtf8 || 'CSV files are exported in UTF-8 encoding'}</li>
                <li>• {(t as any)?.export?.csvCompatible || 'Compatible with Excel, Google Sheets, and other spreadsheet applications'}</li>
                <li>• {(t as any)?.export?.csvCarNames || 'Car IDs are automatically converted to readable car names'}</li>
                <li>• {(t as any)?.export?.csvTags || 'Multiple tags are separated by semicolons'}</li>
                <li>• {(t as any)?.export?.csvDates || 'Dates are in YYYY-MM-DD format'}</li>
                <li>• {(t as any)?.export?.importCompatible || 'Import Compatible: Exported CSV files can be directly imported back using the Import Data page'}</li>
              </ul>
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
} 