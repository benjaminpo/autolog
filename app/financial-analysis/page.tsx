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
import { getObjectId } from '../lib/idUtils';
import { currencies, distanceUnits, volumeUnits } from '../lib/vehicleData';
import Image from 'next/image';

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

export default function FinancialAnalysisPage() {
  const { user, loading } = useAuth();
  useLanguage();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to match car IDs
  const matchesCarId = (entryCarId: string, targetCarId: string): boolean => {
    if (!entryCarId || !targetCarId) return false;

    const normalizedEntryId = entryCarId.toString();
    const normalizedTargetId = targetCarId.toString();

    return normalizedEntryId === normalizedTargetId;
  };

  // Load data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [vehiclesResponse, fuelResponse, expenseResponse, incomeResponse] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/fuel-entries'),
          fetch('/api/expense-entries'),
          fetch('/api/income-entries')
        ]);

        // Process vehicles
        const vehiclesData = await vehiclesResponse.json();
        if (vehiclesData.success && Array.isArray(vehiclesData.vehicles)) {
          const normalizedVehicles = vehiclesData.vehicles.map((vehicle: any) => {
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

        // Process fuel entries
        const fuelData = await fuelResponse.json();
        if (fuelData.success) {
          setEntries(fuelData.entries);
        }

        // Process expense entries
        const expenseData = await expenseResponse.json();
        if (expenseData.success) {
          setExpenses(expenseData.expenses);
        }

        // Process income entries
        const incomeData = await incomeResponse.json();
        if (incomeData.success) {
          setIncomes(incomeData.entries);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Calculate aggregate statistics
  const calculateAggregateStats = () => {
    const totalFuelCosts = entries.reduce((sum, entry) => sum + Number(entry.cost), 0);
    const totalExpenseCosts = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalIncomeCosts = incomes.reduce((sum, income) => sum + Number(income.amount), 0);

    return {
      totalFuelCosts: Number(totalFuelCosts.toFixed(2)),
      totalExpenseCosts: Number(totalExpenseCosts.toFixed(2)),
      totalIncomeCosts: Number(totalIncomeCosts.toFixed(2))
    };
  };

  // Calculate break-even analysis and profitability metrics
  const calculateFinancialAnalysis = (carId: string) => {
    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

    // Calculate totals
    const totalFuelCosts = carFuelEntries.reduce((sum, entry) => sum + Number(entry.cost), 0);
    const totalExpenses = carExpenseEntries.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalIncome = carIncomeEntries.reduce((sum, income) => sum + Number(income.amount), 0);
    const totalCosts = totalFuelCosts + totalExpenses;
    const netProfit = totalIncome - totalCosts;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    // Calculate break-even point (when income equals costs)
    const breakEvenPoint = totalCosts;
    const breakEvenDeficit = Math.max(0, totalCosts - totalIncome);
    const breakEvenSurplus = Math.max(0, totalIncome - totalCosts);

    // Calculate monthly averages
    const sortedEntries = [...carFuelEntries, ...carExpenseEntries, ...carIncomeEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedEntries.length === 0) {
      return {
        totalIncome: 0,
        totalCosts: 0,
        netProfit: 0,
        profitMargin: 0,
        roi: 0,
        breakEvenPoint: 0,
        breakEvenDeficit: 0,
        breakEvenSurplus: 0,
        monthlyAvgIncome: 0,
        monthlyAvgCosts: 0,
        monthlyAvgProfit: 0,
        isBreakEven: false,
        isProfitable: false
      };
    }

    const firstDate = new Date(sortedEntries[0].date);
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date);
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
                      (lastDate.getMonth() - firstDate.getMonth()) + 1;

    const monthlyAvgIncome = monthsDiff > 0 ? totalIncome / monthsDiff : 0;
    const monthlyAvgCosts = monthsDiff > 0 ? totalCosts / monthsDiff : 0;
    const monthlyAvgProfit = monthlyAvgIncome - monthlyAvgCosts;

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalCosts: Number(totalCosts.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
      roi: Number(roi.toFixed(2)),
      breakEvenPoint: Number(breakEvenPoint.toFixed(2)),
      breakEvenDeficit: Number(breakEvenDeficit.toFixed(2)),
      breakEvenSurplus: Number(breakEvenSurplus.toFixed(2)),
      monthlyAvgIncome: Number(monthlyAvgIncome.toFixed(2)),
      monthlyAvgCosts: Number(monthlyAvgCosts.toFixed(2)),
      monthlyAvgProfit: Number(monthlyAvgProfit.toFixed(2)),
      isBreakEven: Math.abs(netProfit) < 1, // Within $1 of break-even
      isProfitable: netProfit > 0
    };
  };

  // Calculate cost per distance and efficiency metrics
  const calculateEfficiencyMetrics = (carId: string) => {
    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

    if (carFuelEntries.length < 2) {
      return {
        costPerKm: 0,
        incomePerKm: 0,
        profitPerKm: 0,
        totalDistance: 0
      };
    }

    // Calculate total distance
    const sortedFuelEntries = carFuelEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let totalDistance = 0;

    for (let i = 1; i < sortedFuelEntries.length; i++) {
      const curr = sortedFuelEntries[i];
      const prev = sortedFuelEntries[i - 1];
      const distance = curr.distanceUnit === 'km'
        ? Number(curr.mileage) - Number(prev.mileage)
        : (Number(curr.mileage) - Number(prev.mileage)) * 1.60934;

      if (distance > 0 && distance <= 2000) {
        totalDistance += distance;
      }
    }

    if (totalDistance === 0) {
      return {
        costPerKm: 0,
        incomePerKm: 0,
        profitPerKm: 0,
        totalDistance: 0
      };
    }

    const totalFuelCosts = carFuelEntries.reduce((sum, entry) => sum + Number(entry.cost), 0);
    const totalExpenses = carExpenseEntries.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalIncome = carIncomeEntries.reduce((sum, income) => sum + Number(income.amount), 0);
    const totalCosts = totalFuelCosts + totalExpenses;

    const costPerKm = totalCosts / totalDistance;
    const incomePerKm = totalIncome / totalDistance;
    const profitPerKm = incomePerKm - costPerKm;

    return {
      costPerKm: Number(costPerKm.toFixed(4)),
      incomePerKm: Number(incomePerKm.toFixed(4)),
      profitPerKm: Number(profitPerKm.toFixed(4)),
      totalDistance: Number(totalDistance.toFixed(0))
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const currency = entries.length > 0 ? entries[0].currency :
                   expenses.length > 0 ? expenses[0].currency :
                   incomes.length > 0 ? incomes[0].currency : currencies[0];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{(t as any)?.navigation?.financialAnalysis || 'Financial Analysis'}</h1>
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
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-300">{(t as any)?.common?.loading || 'Loading...'}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 mx-4 mt-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
      <main className="flex-grow overflow-auto transition-colors">
        <PageContainer className="p-3 md:p-6">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{(t as any)?.stats?.financialAnalysisBreakEven || 'Financial Analysis & Break-Even'}</h2>

            {cars.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 mb-4">{(t as any)?.stats?.noVehiclesFound || 'No vehicles found. Add vehicles to see financial analysis.'}</p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Overall Financial Summary */}
                {(() => {
                  const aggregateStats = calculateAggregateStats();
                  const totalIncome = aggregateStats.totalIncomeCosts || 0;
                  const totalCosts = (aggregateStats.totalFuelCosts || 0) + (aggregateStats.totalExpenseCosts || 0);
                  const netProfit = totalIncome - totalCosts;
                  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
                  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
                  const isBreakEven = Math.abs(netProfit) < 1;
                  const isProfitable = netProfit > 0;

                  return (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border dark:border-gray-700 transition-colors">
                      <h3 className="font-medium text-xl mb-4 text-purple-700">{(t as any)?.stats?.overallFinancialSummary || 'Overall Financial Summary'}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border dark:border-green-800 transition-colors">
                          <div className="font-medium text-sm text-green-600">{(t as any)?.stats?.financialTotalIncome || 'Total Income'}</div>
                          <div className="text-xl font-semibold text-green-700">{totalIncome.toFixed(2)} {currency}</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border dark:border-red-800 transition-colors">
                          <div className="font-medium text-sm text-red-600">{(t as any)?.stats?.financialTotalCosts || 'Total Costs'}</div>
                          <div className="text-xl font-semibold text-red-700">{totalCosts.toFixed(2)} {currency}</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${isProfitable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : isBreakEven ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} transition-colors`}>
                          <div className={`font-medium text-sm ${isProfitable ? 'text-green-600' : isBreakEven ? 'text-yellow-600' : 'text-red-600'}`}>{(t as any)?.stats?.netProfit || 'Net Profit'}</div>
                          <div className={`text-xl font-semibold ${isProfitable ? 'text-green-700' : isBreakEven ? 'text-yellow-700' : 'text-red-700'}`}>
                            {netProfit.toFixed(2)} {currency}
                          </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border">
                          <div className="font-medium text-sm text-blue-600">{(t as any)?.stats?.profitMargin || 'Profit Margin'}</div>
                          <div className="text-xl font-semibold text-blue-700">{profitMargin.toFixed(1)}%</div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg border">
                          <div className="font-medium text-sm text-indigo-600">{(t as any)?.stats?.roi || 'ROI'}</div>
                          <div className="text-xl font-semibold text-indigo-700">{roi.toFixed(1)}%</div>
                        </div>
                        <div className={`p-4 rounded-lg border ${isProfitable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : isBreakEven ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} transition-colors`}>
                          <div className={`font-medium text-sm ${isProfitable ? 'text-green-600' : isBreakEven ? 'text-yellow-600' : 'text-red-600'}`}>{(t as any)?.stats?.financialStatus || 'Status'}</div>
                          <div className={`text-lg font-semibold ${isProfitable ? 'text-green-700' : isBreakEven ? 'text-yellow-700' : 'text-red-700'}`}>
                            {isProfitable ? ((t as any)?.stats?.profitable || 'Profitable') : isBreakEven ? ((t as any)?.stats?.breakEven || 'Break-Even') : ((t as any)?.stats?.loss || 'Loss')}
                          </div>
                        </div>
                      </div>

                      {/* Break-even analysis */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100 mb-3">{(t as any)?.stats?.breakEvenAnalysis || 'Break-Even Analysis'}</h4>
                        <div className="text-base">
                          {isProfitable ? (
                            <div className="text-green-700">
                              ✅ {(t as any)?.stats?.aboveBreakEven || 'You are'} <strong>{Math.abs(netProfit).toFixed(2)} {currency}</strong> {(t as any)?.stats?.aboveBreakEven || 'above break-even point'}.
                              {(t as any)?.stats?.businessGeneratingProfit || 'Your business is generating profit!'}
                            </div>
                          ) : isBreakEven ? (
                            <div className="text-yellow-700">
                              ⚖️ {(t as any)?.stats?.atBreakEvenPoint || 'You are at break-even point. Income equals costs.'}
                            </div>
                          ) : (
                            <div className="text-red-700">
                              ❌ {(t as any)?.stats?.needMoreIncome || 'You need'} <strong>{Math.abs(netProfit).toFixed(2)} {currency}</strong> {(t as any)?.stats?.needMoreIncome || 'more income to reach break-even'}.
                              {(t as any)?.stats?.considerOptimizing || 'Consider optimizing costs or increasing income.'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Per-Vehicle Financial Analysis */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border dark:border-gray-700 transition-colors">
                  <h3 className="font-medium text-xl mb-4 text-purple-700">{(t as any)?.stats?.perVehicleAnalysis || 'Per-Vehicle Financial Analysis'}</h3>
                  <div className="space-y-6">
                    {cars.map((car) => {
                      const carId = getObjectId(car as unknown as Record<string, unknown>);
                      const financialAnalysis = calculateFinancialAnalysis(carId);
                      const efficiencyMetrics = calculateEfficiencyMetrics(carId);

                      if (financialAnalysis.totalCosts === 0 && financialAnalysis.totalIncome === 0) {
                        return (
                          <div key={carId} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                              {car.photo ? (
                                <Image
                                  src={car.photo}
                                  alt={car.name}
                                  width={48}
                                  height={48}
                                  className="object-cover rounded"
                                  unoptimized={true}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">{(t as any)?.stats?.noPhoto || 'No Photo'}</span>
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{car.name}</h4>
                                <p className="text-sm text-gray-600">{car.brand} {car.model}{car.year ? ` (${car.year})` : ''}</p>
                              </div>
                            </div>
                            <p className="text-gray-500 text-center py-4">{(t as any)?.stats?.noFinancialData || 'No financial data available for this vehicle.'}</p>
                          </div>
                        );
                      }

                      return (
                        <div key={carId} className="border rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            {car.photo ? (
                              <Image
                                src={car.photo}
                                alt={car.name}
                                width={64}
                                height={64}
                                className="object-cover rounded"
                                unoptimized={true}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500 text-xs">{(t as any)?.stats?.noPhoto || 'No Photo'}</span>
                              </div>
                            )}
                            <div className="flex-grow">
                              <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100">{car.name}</h4>
                              <p className="text-gray-600">{car.brand} {car.model}{car.year ? ` (${car.year})` : ''}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                              financialAnalysis.isProfitable ? 'bg-green-100 text-green-800' :
                              financialAnalysis.isBreakEven ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {financialAnalysis.isProfitable ? ((t as any)?.stats?.profitable || 'Profitable') :
                               financialAnalysis.isBreakEven ? ((t as any)?.stats?.breakEven || 'Break-Even') : ((t as any)?.stats?.loss || 'Loss')}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border dark:border-green-800 transition-colors">
                              <div className="text-sm text-green-600">{(t as any)?.stats?.financialIncome || 'Income'}</div>
                              <div className="font-semibold text-green-700">{financialAnalysis.totalIncome} {currency}</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border dark:border-red-800 transition-colors">
                              <div className="text-sm text-red-600">{(t as any)?.stats?.financialCosts || 'Costs'}</div>
                              <div className="font-semibold text-red-700">{financialAnalysis.totalCosts} {currency}</div>
                            </div>
                            <div className={`p-3 rounded-lg ${financialAnalysis.isProfitable ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border transition-colors`}>
                              <div className={`text-sm ${financialAnalysis.isProfitable ? 'text-green-600' : 'text-red-600'}`}>{(t as any)?.stats?.netProfit || 'Net Profit'}</div>
                              <div className={`font-semibold ${financialAnalysis.isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                                {financialAnalysis.netProfit} {currency}
                              </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-sm text-blue-600">{(t as any)?.stats?.profitMargin || 'Profit Margin'}</div>
                              <div className="font-semibold text-blue-700">{financialAnalysis.profitMargin}%</div>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-lg">
                              <div className="text-sm text-indigo-600">{(t as any)?.stats?.roi || 'ROI'}</div>
                              <div className="font-semibold text-indigo-700">{financialAnalysis.roi}%</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-sm text-purple-600">{(t as any)?.stats?.monthlyAvgProfit || 'Monthly Avg Profit'}</div>
                              <div className="font-semibold text-purple-700">{financialAnalysis.monthlyAvgProfit} {currency}</div>
                            </div>
                          </div>

                          {/* Efficiency Metrics */}
                          {efficiencyMetrics.totalDistance > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm text-gray-600">{(t as any)?.stats?.costPerKm || 'Cost per km'}</div>
                                <div className="font-semibold">{efficiencyMetrics.costPerKm} {currency}/km</div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm text-gray-600">{(t as any)?.stats?.incomePerKm || 'Income per km'}</div>
                                <div className="font-semibold">{efficiencyMetrics.incomePerKm} {currency}/km</div>
                              </div>
                              <div className={`p-3 rounded-lg ${efficiencyMetrics.profitPerKm >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border transition-colors`}>
                                <div className={`text-sm ${efficiencyMetrics.profitPerKm >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(t as any)?.stats?.profitPerKm || 'Profit per km'}</div>
                                <div className={`font-semibold ${efficiencyMetrics.profitPerKm >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  {efficiencyMetrics.profitPerKm} {currency}/km
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Break-even recommendation */}
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium mb-2">{(t as any)?.stats?.breakEvenAnalysis || 'Break-Even Analysis'}:</div>
                            <div className="text-sm">
                              {financialAnalysis.isProfitable ? (
                                <span className="text-green-700">
                                  ✅ {(t as any)?.stats?.surplusAboveBreakEven || 'Surplus of'} {financialAnalysis.breakEvenSurplus} {currency} {(t as any)?.stats?.surplusAboveBreakEven || 'above break-even'}
                                </span>
                              ) : financialAnalysis.isBreakEven ? (
                                <span className="text-yellow-700">⚖️ {(t as any)?.stats?.atBreakEvenPointShort || 'At break-even point'}</span>
                              ) : (
                                <span className="text-red-700">
                                  ❌ {(t as any)?.stats?.needToBreakEven || 'Need'} {financialAnalysis.breakEvenDeficit} {currency} {(t as any)?.stats?.needToBreakEven || 'more income to break even'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageContainer>
      </main>
      )}
    </div>
  );
}
