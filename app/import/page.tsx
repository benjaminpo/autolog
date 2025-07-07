'use client';

import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageContainer from '../components/PageContainer';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { labelClasses } from '../components/FormComponents';

interface CSVRow {
  [key: string]: string;
}

interface FuelEntry {
  carId: string;
  fuelCompany: string;
  fuelType: string;
  mileage: number;
  distanceUnit: string;
  volume: number;
  volumeUnit: string;
  cost: number;
  currency: string;
  date: string;
  time: string;
  location: string;
  partialFuelUp: boolean;
  paymentType: string;
  tyrePressure: number;
  tyrePressureUnit: string;
  tags: string[];
  notes: string;
}

interface ExpenseEntry {
  carId: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  notes: string;
}

interface IncomeEntry {
  carId: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  notes: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

interface DuplicateWarning {
  row: number;
  message: string;
  existingEntry: string;
}

export default function ImportPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [importType, setImportType] = useState<'fuel' | 'expenses' | 'income'>('fuel');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validatedData, setValidatedData] = useState<(FuelEntry | ExpenseEntry | IncomeEntry)[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportItem, setCurrentImportItem] = useState('');

  // Load cars for validation
  useEffect(() => {
    if (user) {
      fetch('/api/vehicles')
        .then(response => response.json())
        .then(data => {
          if (data.success && Array.isArray(data.vehicles)) {
            setCars(data.vehicles);
          }
        })
        .catch(error => console.error('Error fetching vehicles:', error));
    }
  }, [user]);

  // CSV parsing function using papaparse
  const parseCSV = (csvText: string): CSVRow[] => {
    const result = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim()
    });

    if (result.errors && result.errors.length > 0) {
      console.warn('CSV parsing errors:', result.errors);
    }

    return result.data || [];
  };

  // Validation functions
  const validateFuelEntry = (row: CSVRow, index: number): { entry: FuelEntry | null; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];
    
    // Required fields validation - using export format field names
    const requiredFields = ['Car Name', 'Date', 'Mileage', 'Volume', 'Cost'];
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: index + 1,
          field,
          message: `${field} is required`,
          value: row[field] || ''
        });
      }
    });

    // Find car by name
    const car = cars.find(c => c.name.toLowerCase() === row['Car Name']?.toLowerCase());
    if (!car && row['Car Name']) {
      errors.push({
        row: index + 1,
        field: 'Car Name',
        message: 'Vehicle not found. Please create the vehicle first.',
        value: row['Car Name']
      });
    }

    // Validate numeric fields
    const numericFields = [
      { field: 'Mileage', value: row['Mileage'] },
      { field: 'Volume', value: row['Volume'] },
      { field: 'Cost', value: row['Cost'] },
      { field: 'Tyre Pressure', value: row['Tyre Pressure'] }
    ];
    numericFields.forEach(({ field, value }) => {
      if (value && isNaN(Number(value))) {
        errors.push({
          row: index + 1,
          field,
          message: `${field} must be a valid number`,
          value: value
        });
      }
    });

    // Validate date format
    if (row['Date'] && isNaN(Date.parse(row['Date']))) {
      errors.push({
        row: index + 1,
        field: 'Date',
        message: 'Date must be in valid format (YYYY-MM-DD)',
        value: row['Date']
      });
    }

    if (errors.length > 0) {
      return { entry: null, errors };
    }

    // Create fuel entry using export format field names
    const entry: FuelEntry = {
      carId: car?.id || car?._id || '',
      fuelCompany: row['Fuel Company'] || '',
      fuelType: row['Fuel Type'] || '',
      mileage: Number(row['Mileage']),
      distanceUnit: row['Distance Unit'] || 'km',
      volume: Number(row['Volume']),
      volumeUnit: row['Volume Unit'] || 'liters',
      cost: Number(row['Cost']),
      currency: row['Currency'] || 'HKD',
      date: row['Date'],
      time: row['Time'] || '12:00',
      location: row['Location'] || '',
      partialFuelUp: row['Partial Fuel Up']?.toLowerCase() === 'yes' || row['Partial Fuel Up']?.toLowerCase() === 'true',
      paymentType: row['Payment Type'] || '',
      tyrePressure: Number(row['Tyre Pressure']) || 0,
      tyrePressureUnit: row['Tyre Pressure Unit'] || 'psi',
      tags: row['Tags'] ? row['Tags'].split(';').map(t => t.trim()) : [],
      notes: row['Notes'] || ''
    };

    return { entry, errors: [] };
  };

  const validateExpenseEntry = (row: CSVRow, index: number): { entry: ExpenseEntry | null; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];
    
    // Required fields validation - using export format field names
    const requiredFields = ['Car Name', 'Date', 'Category', 'Amount'];
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: index + 1,
          field,
          message: `${field} is required`,
          value: row[field] || ''
        });
      }
    });

    // Find car by name
    const car = cars.find(c => c.name.toLowerCase() === row['Car Name']?.toLowerCase());
    if (!car && row['Car Name']) {
      errors.push({
        row: index + 1,
        field: 'Car Name',
        message: 'Vehicle not found. Please create the vehicle first.',
        value: row['Car Name']
      });
    }

    // Validate amount
    if (row['Amount'] && isNaN(Number(row['Amount']))) {
      errors.push({
        row: index + 1,
        field: 'Amount',
        message: 'Amount must be a valid number',
        value: row['Amount']
      });
    }

    // Validate date format
    if (row['Date'] && isNaN(Date.parse(row['Date']))) {
      errors.push({
        row: index + 1,
        field: 'Date',
        message: 'Date must be in valid format (YYYY-MM-DD)',
        value: row['Date']
      });
    }

    if (errors.length > 0) {
      return { entry: null, errors };
    }

    // Create expense entry using export format field names
    const entry: ExpenseEntry = {
      carId: car?.id || car?._id || '',
      category: row['Category'] || '',
      amount: Number(row['Amount']),
      currency: row['Currency'] || 'HKD',
      date: row['Date'],
      notes: row['Notes'] || ''
    };

    return { entry, errors: [] };
  };

  const validateIncomeEntry = (row: CSVRow, index: number): { entry: IncomeEntry | null; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];
    
    // Required fields validation - using export format field names
    const requiredFields = ['Car Name', 'Date', 'Category', 'Amount'];
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: index + 1,
          field,
          message: `${field} is required`,
          value: row[field] || ''
        });
      }
    });

    // Find car by name
    const car = cars.find(c => c.name.toLowerCase() === row['Car Name']?.toLowerCase());
    if (!car && row['Car Name']) {
      errors.push({
        row: index + 1,
        field: 'Car Name',
        message: 'Vehicle not found. Please create the vehicle first.',
        value: row['Car Name']
      });
    }

    // Validate amount
    if (row['Amount'] && isNaN(Number(row['Amount']))) {
      errors.push({
        row: index + 1,
        field: 'Amount',
        message: 'Amount must be a valid number',
        value: row['Amount']
      });
    }

    // Validate date format
    if (row['Date'] && isNaN(Date.parse(row['Date']))) {
      errors.push({
        row: index + 1,
        field: 'Date',
        message: 'Date must be in valid format (YYYY-MM-DD)',
        value: row['Date']
      });
    }

    if (errors.length > 0) {
      return { entry: null, errors };
    }

    // Create income entry using export format field names
    const entry: IncomeEntry = {
      carId: car?.id || car?._id || '',
      category: row['Category'] || '',
      amount: Number(row['Amount']),
      currency: row['Currency'] || 'HKD',
      date: row['Date'],
      notes: row['Notes'] || ''
    };

    return { entry, errors: [] };
  };

  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);
      setCsvData(parsedData);
      
      // Validate data
      const validEntries: (FuelEntry | ExpenseEntry | IncomeEntry)[] = [];
      const allErrors: ValidationError[] = [];

      parsedData.forEach((row, index) => {
        if (importType === 'fuel') {
          const { entry, errors } = validateFuelEntry(row, index);
          if (entry) validEntries.push(entry);
          allErrors.push(...errors);
        } else if (importType === 'expenses') {
          const { entry, errors } = validateExpenseEntry(row, index);
          if (entry) validEntries.push(entry);
          allErrors.push(...errors);
        } else {
          const { entry, errors } = validateIncomeEntry(row, index);
          if (entry) validEntries.push(entry);
          allErrors.push(...errors);
        }
      });

      setValidatedData(validEntries);
      setValidationErrors(allErrors);
      
      // Check for duplicates if there are valid entries
      if (validEntries.length > 0) {
        const duplicates = await checkForDuplicates(validEntries);
        setDuplicateWarnings(duplicates);
      } else {
        setDuplicateWarnings([]);
      }
    };

    reader.readAsText(file);
  }, [importType, cars]); // eslint-disable-line react-hooks/exhaustive-deps

  // Import data to database
  const handleImport = async () => {
    if (validatedData.length === 0) return;

    setIsProcessing(true);
    setImportProgress(0);
    let successCount = 0;
    let failedCount = 0;
    const failedEntries: string[] = [];

    try {
      for (let i = 0; i < validatedData.length; i++) {
        const entry = validatedData[i];
        const progress = Math.round(((i + 1) / validatedData.length) * 100);
        setImportProgress(progress);
        
        // Show current item being processed
        if (importType === 'fuel') {
          const fuelEntry = entry as FuelEntry;
          const carName = cars.find(c => c.id === fuelEntry.carId || c._id === fuelEntry.carId)?.name || 'Unknown';
          setCurrentImportItem(`${carName} - ${fuelEntry.date}`);
        } else if (importType === 'expenses') {
          const expenseEntry = entry as ExpenseEntry;
          const carName = cars.find(c => c.id === expenseEntry.carId || c._id === expenseEntry.carId)?.name || 'Unknown';
          setCurrentImportItem(`${carName} - ${expenseEntry.category}`);
        } else {
          const incomeEntry = entry as IncomeEntry;
          const carName = cars.find(c => c.id === incomeEntry.carId || c._id === incomeEntry.carId)?.name || 'Unknown';
          setCurrentImportItem(`${carName} - ${incomeEntry.category}`);
        }

        try {
          const endpoint = importType === 'fuel' ? '/api/fuel-entries' : importType === 'expenses' ? '/api/expenses' : '/api/income-entries';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
          });

          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            failedEntries.push(`Row ${i + 1}: ${errorData.error || 'Failed to import'}`);
          }
        } catch (error) {
          failedCount++;
          failedEntries.push(`Row ${i + 1}: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({ 
        success: successCount, 
        failed: failedCount,
        errors: failedEntries.length > 0 ? failedEntries : undefined 
      });
      
      // Clear data after import
      setCsvData([]);
      setValidatedData([]);
      setValidationErrors([]);
      
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({ 
        success: successCount, 
        failed: failedCount + (validatedData.length - successCount - failedCount),
        errors: [`General error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
      setCurrentImportItem('');
    }
  };

  // Generate sample CSV
  const generateSampleCSV = () => {
    if (importType === 'fuel') {
      const sampleData = [
        ['Car Name', 'Date', 'Time', 'Fuel Company', 'Fuel Type', 'Mileage', 'Distance Unit', 'Volume', 'Volume Unit', 'Cost', 'Currency', 'Location', 'Partial Fuel Up', 'Payment Type', 'Tyre Pressure', 'Tyre Pressure Unit', 'Tags', 'Notes'],
        ['My Car', '2024-01-15', '14:30', 'Shell', 'Petrol', '15000', 'km', '45', 'liters', '350', 'HKD', 'Central', 'No', 'Credit Card', '32', 'psi', 'highway; city', 'Regular fill-up'],
        ['My Car', '2024-01-20', '09:15', 'Caltex', 'Petrol', '15250', 'km', '40', 'liters', '320', 'HKD', 'Tsim Sha Tsui', 'No', 'Cash', '32', 'psi', 'city', 'Morning commute']
      ];
      
      const csvContent = Papa.unparse(sampleData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fuel_entries_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (importType === 'expenses') {
      const sampleData = [
        ['Car Name', 'Date', 'Category', 'Amount', 'Currency', 'Notes'],
        ['My Car', '2024-01-15', 'Service', '500', 'HKD', 'Oil change and filter replacement'],
        ['My Car', '2024-01-20', 'Parking', '50', 'HKD', 'Shopping mall parking'],
        ['My Car', '2024-01-25', 'Insurance', '2000', 'HKD', 'Annual insurance premium']
      ];
      
      const csvContent = Papa.unparse(sampleData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const sampleData = [
        ['Car Name', 'Date', 'Category', 'Amount', 'Currency', 'Notes'],
        ['My Car', '2024-01-15', 'Ride Sharing', '800', 'HKD', 'Uber driving earnings'],
        ['My Car', '2024-01-20', 'Delivery Services', '450', 'HKD', 'Food delivery income'],
        ['My Car', '2024-01-25', 'Mileage Reimbursement', '300', 'HKD', 'Business trip reimbursement']
      ];
      
      const csvContent = Papa.unparse(sampleData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'income_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Check for potential duplicates
  const checkForDuplicates = async (entries: (FuelEntry | ExpenseEntry | IncomeEntry)[]): Promise<DuplicateWarning[]> => {
    const warnings: DuplicateWarning[] = [];
    
    try {
      // Get existing entries for comparison
      const existingFuelResponse = await fetch('/api/fuel-entries');
      const existingExpenseResponse = await fetch('/api/expenses');
      const existingIncomeResponse = await fetch('/api/income-entries');
      
      if (existingFuelResponse.ok && existingExpenseResponse.ok && existingIncomeResponse.ok) {
        const existingFuel = await existingFuelResponse.json();
        const existingExpenses = await existingExpenseResponse.json();
        const existingIncome = await existingIncomeResponse.json();
        
        entries.forEach((entry, index) => {
          if (importType === 'fuel') {
            const fuelEntry = entry as FuelEntry;
            const duplicates = existingFuel.entries?.filter((existing: any) => 
              existing.carId === fuelEntry.carId &&
              existing.date === fuelEntry.date &&
              Math.abs(Number(existing.mileage) - fuelEntry.mileage) < 10 &&
              Math.abs(Number(existing.cost) - fuelEntry.cost) < 1
            ) || [];
            
            if (duplicates.length > 0) {
              warnings.push({
                row: index + 1,
                message: 'Potential duplicate fuel entry detected',
                existingEntry: `${duplicates[0].date} - ${duplicates[0].mileage}km - $${duplicates[0].cost}`
              });
            }
          } else if (importType === 'expenses') {
            const expenseEntry = entry as ExpenseEntry;
            const duplicates = existingExpenses.expenses?.filter((existing: any) => 
              existing.carId === expenseEntry.carId &&
              existing.date === expenseEntry.date &&
              existing.category === expenseEntry.category &&
              Math.abs(Number(existing.amount) - expenseEntry.amount) < 1
            ) || [];
            
            if (duplicates.length > 0) {
              warnings.push({
                row: index + 1,
                message: 'Potential duplicate expense detected',
                existingEntry: `${duplicates[0].date} - ${duplicates[0].category} - $${duplicates[0].amount}`
              });
            }
          } else {
            const incomeEntry = entry as IncomeEntry;
            const duplicates = existingIncome.entries?.filter((existing: any) => 
              existing.carId === incomeEntry.carId &&
              existing.date === incomeEntry.date &&
              existing.category === incomeEntry.category &&
              Math.abs(Number(existing.amount) - incomeEntry.amount) < 1
            ) || [];
            
            if (duplicates.length > 0) {
              warnings.push({
                row: index + 1,
                message: 'Potential duplicate income detected',
                existingEntry: `${duplicates[0].date} - ${duplicates[0].category} - $${duplicates[0].amount}`
              });
            }
          }
        });
      }
    } catch (error) {
      console.warn('Could not check for duplicates:', error);
    }
    
    return warnings;
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-lg">Please log in to access this page.</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{(t as any)?.navigation?.import || 'Import Data'}</h1>
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t?.import?.title || 'Import CSV Data'}</h2>

            {/* Import Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">{t?.import?.importType || 'Import Type'}</label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="fuel"
                    checked={importType === 'fuel'}
                    onChange={(e) => setImportType(e.target.value as 'fuel' | 'expenses' | 'income')}
                    className="mr-2"
                  />
                  {t?.import?.fuelEntries || 'Fuel Entries'}
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="expenses"
                    checked={importType === 'expenses'}
                    onChange={(e) => setImportType(e.target.value as 'fuel' | 'expenses' | 'income')}
                    className="mr-2"
                  />
                  {t?.import?.expenses || 'Expenses'}
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="income"
                    checked={importType === 'income'}
                    onChange={(e) => setImportType(e.target.value as 'fuel' | 'expenses' | 'income')}
                    className="mr-2"
                  />
                  {t?.import?.income || 'Income'}
                </label>
              </div>
            </div>

            {/* Sample CSV Download */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t?.import?.csvFormatRequirements || 'CSV Format Requirements'}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {t?.import?.csvFormatInfo || 'Download a sample CSV file to see the required format and column headers. This format matches the export format for easy round-trip data transfer.'}
              </p>
              <button
                onClick={generateSampleCSV}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                {t?.import?.downloadSample || 'Download Sample'} {importType === 'fuel' ? (t?.import?.fuelEntries || 'Fuel Entries') : importType === 'expenses' ? (t?.import?.expenses || 'Expenses') : (t?.import?.income || 'Income')} CSV
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className={labelClasses}>{t?.import?.uploadCsvFile || 'Upload CSV File'}</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-800/30 file:transition-colors"
              />
            </div>

            {/* Validation Results */}
            {csvData.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t?.import?.validationResults || 'Validation Results'}</h3>
                
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{t?.import?.totalRows || 'Total Rows'}</div>
                    <div className="text-lg font-semibold">{csvData.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{t?.import?.validEntries || 'Valid Entries'}</div>
                    <div className="text-lg font-semibold text-green-600">{validatedData.length}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded border">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{t?.import?.errors || 'Errors'}</div>
                    <div className="text-lg font-semibold text-red-600">{validationErrors.length}</div>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-600 mb-2">{t?.import?.validationErrors || 'Validation Errors'}</h4>
                    <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                      {validationErrors.map((error, index) => (
                        <div key={index} className="text-sm mb-1">
                          <span className="font-medium">Row {error.row}:</span> {error.message} 
                          <span className="text-gray-800 dark:text-gray-300"> (Value: &quot;{error.value}&quot;)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate Warnings */}
                {duplicateWarnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-orange-600 mb-2">Duplicate Warnings</h4>
                    <div className="max-h-48 overflow-y-auto bg-orange-50 border border-orange-200 rounded p-3">
                      {duplicateWarnings.map((warning, index) => (
                        <div key={index} className="text-sm mb-1">
                          <span className="font-medium">Row {warning.row}:</span> {warning.message}
                          <div className="text-gray-800 dark:text-gray-300 text-xs ml-4">Similar existing entry: {warning.existingEntry}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                      These entries may be duplicates. Review carefully before importing.
                    </p>
                  </div>
                )}

                {/* Preview Valid Data */}
                {validatedData.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-600 mb-2">{t?.import?.previewValidEntries || 'Preview Valid Entries (First 5)'}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs transition-colors">
                        <thead className="bg-gray-50">
                          <tr>
                            {importType === 'fuel' ? (
                              <>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.car || 'Car'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.date || 'Date'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.mileage || 'Mileage'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.volume || 'Volume'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.cost || 'Cost'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.company || 'Company'}</th>
                              </>
                            ) : importType === 'expenses' ? (
                              <>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.car || 'Car'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.date || 'Date'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.category || 'Category'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.amount || 'Amount'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.notes || 'Notes'}</th>
                              </>
                            ) : (
                              <>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.car || 'Car'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.date || 'Date'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.category || 'Category'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.amount || 'Amount'}</th>
                                <th className="px-2 py-1 border-b text-left">{t?.import?.notes || 'Notes'}</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {validatedData.slice(0, 5).map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {importType === 'fuel' ? (
                                <>
                                  <td className="px-2 py-1 border-b">{cars.find(c => c.id === entry.carId || c._id === entry.carId)?.name}</td>
                                  <td className="px-2 py-1 border-b">{(entry as FuelEntry).date}</td>
                                  <td className="px-2 py-1 border-b">{(entry as FuelEntry).mileage}</td>
                                  <td className="px-2 py-1 border-b">{(entry as FuelEntry).volume} {(entry as FuelEntry).volumeUnit}</td>
                                  <td className="px-2 py-1 border-b">{(entry as FuelEntry).cost} {(entry as FuelEntry).currency}</td>
                                  <td className="px-2 py-1 border-b">{(entry as FuelEntry).fuelCompany}</td>
                                </>
                              ) : importType === 'expenses' ? (
                                <>
                                  <td className="px-2 py-1 border-b">{cars.find(c => c.id === entry.carId || c._id === entry.carId)?.name}</td>
                                  <td className="px-2 py-1 border-b">{(entry as ExpenseEntry).date}</td>
                                  <td className="px-2 py-1 border-b">{(entry as ExpenseEntry).category}</td>
                                  <td className="px-2 py-1 border-b">{(entry as ExpenseEntry).amount} {(entry as ExpenseEntry).currency}</td>
                                  <td className="px-2 py-1 border-b">{(entry as ExpenseEntry).notes}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-2 py-1 border-b">{cars.find(c => c.id === entry.carId || c._id === entry.carId)?.name}</td>
                                  <td className="px-2 py-1 border-b">{(entry as IncomeEntry).date}</td>
                                  <td className="px-2 py-1 border-b">{(entry as IncomeEntry).category}</td>
                                  <td className="px-2 py-1 border-b">{(entry as IncomeEntry).amount} {(entry as IncomeEntry).currency}</td>
                                  <td className="px-2 py-1 border-b">{(entry as IncomeEntry).notes}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {validatedData.length > 0 && (
                  <div className="flex gap-4">
                    <button
                      onClick={handleImport}
                      disabled={isProcessing}
                      className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t?.import?.importing?.replace('{{progress}}', importProgress.toString()) || `Importing... ${importProgress}%`}
                        </div>
                      ) : (
                        t?.import?.importEntries?.replace('{{count}}', validatedData.length.toString()) || `Import ${validatedData.length} Entries`
                      )}
                    </button>
                    {isProcessing && currentImportItem && (
                      <div className="flex items-center text-sm text-gray-800 dark:text-gray-300">
                        {t?.import?.processing || 'Processing'}: {currentImportItem}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-colors">
                <h3 className="font-medium text-green-800 mb-2">{t?.import?.importComplete || 'Import Complete'}</h3>
                <p className="text-sm">
                  {t?.import?.successfullyImported || 'Successfully imported'}: <span className="font-semibold text-green-600">{importResults.success}</span> {t?.import?.entries || 'entries'}
                </p>
                {importResults.failed > 0 && (
                  <div>
                    <p className="text-sm">
                      {t?.import?.failedToImport || 'Failed to import'}: <span className="font-semibold text-red-600">{importResults.failed}</span> {t?.import?.entries || 'entries'}
                    </p>
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-medium text-red-600 text-sm mb-1">{t?.import?.errorDetails || 'Error Details'}:</h4>
                        <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded p-2">
                          {importResults.errors.map((error, index) => (
                            <div key={index} className="text-xs text-red-700 mb-1">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setImportResults(null)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  {t?.import?.importMoreData || 'Import More Data'}
                </button>
              </div>
            )}

            {/* CSV Format Information */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t?.import?.csvFormatRequirements || 'CSV Format Requirements'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t?.import?.fuelEntriesFormat || 'Fuel Entries Format'}</h4>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs border dark:border-gray-700 transition-colors">
                    <div className="text-gray-900 dark:text-gray-100 mb-2">{t?.import?.requiredCsvHeaders || 'Required CSV Headers (exact order)'}:</div>
                    <div className="text-xs break-all text-gray-700 dark:text-gray-300 font-mono">
                      Car Name, Date, Time, Fuel Company, Fuel Type, Mileage, Distance Unit, Volume, Volume Unit, Cost, Currency, Location, Partial Fuel Up, Payment Type, Tyre Pressure, Tyre Pressure Unit, Tags, Notes
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t?.import?.expenseEntriesFormat || 'Expense Entries Format'}</h4>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs border dark:border-gray-700 transition-colors">
                    <div className="text-gray-900 dark:text-gray-100 mb-2">{t?.import?.requiredCsvHeaders || 'Required CSV Headers (exact order)'}:</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                      Car Name, Date, Category, Amount, Currency, Notes
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-700 transition-colors">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">{t?.import?.importantFormatNotes || 'Important Format Notes'}</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• <strong>Car Name:</strong> {t?.import?.carNameNote || 'Must exactly match an existing vehicle name in your account'}</li>
                  <li>• <strong>Date:</strong> {t?.import?.dateNote || 'Use YYYY-MM-DD format (e.g., 2024-01-15)'}</li>
                  <li>• <strong>Time:</strong> {t?.import?.timeNote || 'Use HH:MM format (e.g., 14:30) - optional, defaults to 12:00'}</li>
                  <li>• <strong>Partial Fuel Up:</strong> {t?.import?.partialFuelUpNote || 'Use "Yes" or "No" (case insensitive)'}</li>
                  <li>• <strong>Tags:</strong> {t?.import?.tagsNote || 'Separate multiple tags with semicolons (e.g., "highway; city")'}</li>
                  <li>• <strong>Numbers:</strong> {t?.import?.numbersNote || 'Use decimal format without currency symbols (e.g., 45.5, not $45.5)'}</li>
                  <li>• <strong>CSV Compatibility:</strong> {t?.import?.csvCompatibleNote || 'This format matches the export format for easy round-trip data transfer'}</li>
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t?.import?.instructions || 'Instructions'}</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>1. {t?.import?.step1 || 'Select the type of data you want to import (Fuel Entries, Expenses, or Income)'}</p>
                <p>2. {t?.import?.step2 || 'Download the sample CSV file to see the required format'}</p>
                <p>3. {t?.import?.step3 || 'Prepare your CSV file with the correct column headers and data format'}</p>
                <p>4. {t?.import?.step4 || 'Upload your CSV file and review the validation results'}</p>
                <p>5. {t?.import?.step5 || 'Fix any validation errors in your CSV file and re-upload if needed'}</p>
                <p>6. {t?.import?.step6 || 'Click "Import" to add the valid entries to your database'}</p>
                <p className="font-medium text-orange-600">{t?.import?.noteVehiclesExist || 'Note: Make sure your vehicles exist in the system before importing fuel entries, expenses, or income.'}</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
} 