'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import StatsTab from '../components/StatsTab';
import withTranslations from '../components/withTranslations';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { useTranslation } from '../hooks/useTranslation';
import { currencies, distanceUnits, volumeUnits } from '../lib/vehicleData';
import { getCurrencyName } from '../lib/currencyUtils';


// Wrap component with translations HOC
const TranslatedStatsTab = withTranslations(StatsTab);

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
  distanceUnit: typeof distanceUnits[number];
  volume: number | string;
  volumeUnit: typeof volumeUnits[number];
  cost: number | string;
  currency: typeof currencies[number];
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
  currency: typeof currencies[number];
  date: string;
  notes: string;
}

interface IncomeEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [fuelConsumptionUnit, setFuelConsumptionUnit] = useState<'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L'>('L/100km');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');

  // Load data
  useEffect(() => {
    if (!user) return;

    // Fetch vehicles
    fetch('/api/vehicles')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.vehicles)) {
          // Normalize vehicle IDs
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
          console.log(`Loaded ${normalizedVehicles.length} vehicles in statistics page`);
        } else {
          console.error('Failed to load vehicles or invalid data format');
        }
      })
      .catch(error => {
        console.error('Error fetching vehicles:', error);
      });    // Fetch fuel entries
    fetch('/api/fuel-entries')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log(`Loaded ${data.entries.length} fuel entries in statistics page`);
          setEntries(data.entries);
        } else {
          console.error('Failed to load fuel entries or invalid data format');
        }
      })
      .catch(error => {
        console.error('Error fetching fuel entries:', error);
      });

    // Fetch expense entries
    fetch('/api/expense-entries')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log(`Loaded ${data.expenses.length} expense entries in statistics page`);
          setExpenses(data.expenses);
        } else {
          console.error('Failed to load expense entries or invalid data format');
        }
      })
      .catch(error => {
        console.error('Error fetching expense entries:', error);
      });

    // Fetch income entries
    fetch('/api/income-entries')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log(`Loaded ${data.entries.length} income entries in statistics page`);
          setIncomes(data.entries);
        } else {
          console.error('Failed to load income entries or invalid data format');
        }
      })
      .catch(error => {
        console.error('Error fetching income entries:', error);
      });

    // Load user preferences for fuel consumption unit and default currency
    fetch('/api/user-preferences')
      .then(response => response.json())
      .then(data => {
        if (data.preferences) {
          if (data.preferences.fuelConsumptionUnit) {
            setFuelConsumptionUnit(data.preferences.fuelConsumptionUnit);
          }
          if (data.preferences.defaultCurrency) {
            setPreferredCurrency(data.preferences.defaultCurrency);
          }
        }
      });
  }, [user]);

  // Save fuel consumption unit preference when it changes
  useEffect(() => {
    const saveConsumptionUnitPreference = async () => {
      if (!user) return;

      try {
        await fetch('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fuelConsumptionUnit }),
        });
      } catch (error) {
        console.error('Error saving fuel consumption unit preference:', error);
      }
    };

    saveConsumptionUnitPreference();
  }, [fuelConsumptionUnit, user]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{t?.navigation?.statistics || 'Statistics'}</h1>
            <div className="flex items-center gap-2">
              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="currency-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t?.payment?.currency || 'Currency'}:
                </label>
                <select
                  id="currency-select"
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency} - {getCurrencyName(currency)}
                    </option>
                  ))}
                </select>
              </div>
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border dark:border-gray-700 transition-colors">
            <TranslatedStatsTab
              cars={cars}
              entries={entries}
              expenses={expenses}
              incomes={incomes}
              fuelConsumptionUnit={fuelConsumptionUnit}
              setFuelConsumptionUnit={setFuelConsumptionUnit}
              preferredCurrency={preferredCurrency}
            />
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
