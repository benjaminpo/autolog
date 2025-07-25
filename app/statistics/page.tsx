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
import { distanceUnits, volumeUnits, currencies } from '../lib/vehicleData';


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
  images: string[];
}

interface ExpenseEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
  images: string[];
}

interface IncomeEntry {
  id: string;
  carId: string;
  category: string;
  amount: number | string;
  currency: typeof currencies[number];
  date: string;
  notes: string;
  images: string[];
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [fuelConsumptionUnit, setFuelConsumptionUnit] = useState<'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L'>('L/100km');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch vehicles
        const vehiclesResponse = await fetch('/api/vehicles');
        if (vehiclesResponse.ok) {
          const data = await vehiclesResponse.json();
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
            setError('Failed to load vehicles');
          }
        } else {
          console.error('Failed to load vehicles or invalid data format');
          setError('Failed to load vehicles');
        }

        // Fetch fuel entries
        const fuelEntriesResponse = await fetch('/api/fuel-entries');
        if (fuelEntriesResponse.ok) {
          const data = await fuelEntriesResponse.json();
          if (data.success) {
            console.log(`Loaded ${data.entries.length} fuel entries in statistics page`);
            setEntries(data.entries);
          } else {
            console.error('Failed to load fuel entries or invalid data format');
            setError('Failed to load fuel entries');
          }
        } else {
          console.error('Failed to load fuel entries or invalid data format');
          setError('Failed to load fuel entries');
        }

        // Fetch expense entries
        const expenseEntriesResponse = await fetch('/api/expense-entries');
        if (expenseEntriesResponse.ok) {
          const data = await expenseEntriesResponse.json();
          if (data.success) {
            console.log(`Loaded ${data.expenses.length} expense entries in statistics page`);
            setExpenses(data.expenses);
          } else {
            console.error('Failed to load expense entries or invalid data format');
            setError('Failed to load expense entries');
          }
        } else {
          console.error('Failed to load expense entries or invalid data format');
          setError('Failed to load expense entries');
        }

        // Fetch income entries
        const incomeEntriesResponse = await fetch('/api/income-entries');
        if (incomeEntriesResponse.ok) {
          const data = await incomeEntriesResponse.json();
          if (data.success) {
            console.log(`Loaded ${data.entries.length} income entries in statistics page`);
            setIncomes(data.entries);
          } else {
            console.error('Failed to load income entries or invalid data format');
            setError('Failed to load income entries');
          }
        } else {
          console.error('Failed to load income entries or invalid data format');
          setError('Failed to load income entries');
        }

        // Fetch user preferences for fuel consumption unit
        const preferencesResponse = await fetch('/api/user-preferences');
        if (preferencesResponse.ok) {
          const data = await preferencesResponse.json();
          if (data.success && data.preferences) {
            setFuelConsumptionUnit(data.preferences.fuelConsumptionUnit || 'L/100km');
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          <TranslatedStatsTab
              cars={cars}
              entries={entries}
              expenses={expenses}
              incomes={incomes}
              fuelConsumptionUnit={fuelConsumptionUnit}
              setFuelConsumptionUnit={setFuelConsumptionUnit}
            />
        </PageContainer>
      </main>
    </div>
  );
}
