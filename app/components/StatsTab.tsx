import React from 'react';
import { LineChart, Line, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { currencies } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import { useLanguage } from '../context/LanguageContext';
import { EnhancedTranslationType } from '../translations';
import { calculateCurrencyStats, formatCurrency, getCurrencyName, calculateCostPerDistance } from '../lib/currencyUtils';
import { Car, FuelEntry, ExpenseEntry, IncomeEntry } from '../types/common';

interface StatsTabProps {
  t?: EnhancedTranslationType;
  cars: Car[];
  entries: FuelEntry[];
  expenses: ExpenseEntry[];
  incomes: IncomeEntry[];
  fuelConsumptionUnit: 'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L';
  setFuelConsumptionUnit: (unit: 'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L') => void;
}

export default function StatsTab({
  t: propT,
  cars,
  entries,
  expenses,
  incomes,
  fuelConsumptionUnit,
  setFuelConsumptionUnit,
}: StatsTabProps) {
  // Use translations from context if not provided as props
  const { t: contextT } = useLanguage();
  const t = propT || contextT;

  // Helper function to safely access translations including nested keys
  const getTranslation = (key: string, fallback: string = key): string => {
    if (t && typeof t._ === 'function') {
      // Use the built-in translation function that handles nested keys properly
      const translation = t._(key);
      // If the translation function returns the key itself, it means the key wasn't found
      if (translation !== key) {
        return translation;
      }
    }
    return fallback;
  };

  // Helper function to aggregate monthly consumption data for charts
  const aggregateMonthlyConsumption = (trends: any[], carName: string) => {
    const monthlyData: { [key: string]: { consumption: number; count: number } } = {};

    trends.forEach((trend: any) => {
      if (!monthlyData[trend.month]) {
        monthlyData[trend.month] = { consumption: 0, count: 0 };
      }
      monthlyData[trend.month].consumption += trend.consumption;
      monthlyData[trend.month].count++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      consumption: data.consumption / data.count,
      carName
    }));
  };

  const consumptionUnitTranslations: { [key: string]: string } = {
    'L/100km': 'units.consumption.per100km',
    'km/L': 'units.consumption.kmPerLiter',
    'G/100mi': 'units.consumption.per100miles',
    'km/G': 'units.consumption.kmPerGallon',
    'mi/L': 'units.consumption.miPerLiter',
  };

  // Helper function to match car IDs with entries - handles string vs ObjectId comparison
  const matchesCarId = (entryCarId: string, targetCarId: string): boolean => {
    if (!entryCarId || !targetCarId) return false;

    // Direct string comparison
    if (entryCarId === targetCarId) return true;

    // Compare string representations
    if (entryCarId.toString() === targetCarId.toString()) return true;

    return false;
  };

  const calculateStats = (carId: string) => {
    const carEntries = entries.filter((entry) => {
      const match = matchesCarId(entry.carId, carId);
      return match;
    });

    if (carEntries.length < 2) return { avgConsumption: null, avgCost: null, totalDistance: 0 };

    const sortedEntries = carEntries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let totalDistanceConsumption = 0;
    let totalDistanceOverall = 0;
    let totalVolume = 0;
    let totalDistanceCost = 0;
    let totalCost = 0;
    let validConsumptionEntries = 0;
    let validDistanceEntries = 0;
    let hasNonPartial = false;

    // Check for non-partial entries first - OUTSIDE the loop
    for (let j = 0; j < sortedEntries.length; j++) {
      if (!sortedEntries[j].partialFuelUp) {
        hasNonPartial = true;
        break;
      }
    }

    // Track problematic entries for debugging
    let skippedEntries = 0;
    let negativeDistances = 0;
    let longIntervals = 0;

    for (let i = 1; i < sortedEntries.length; i++) {
      const curr = sortedEntries[i];
      const prev = sortedEntries[i - 1];

      const mileage = Number(curr.mileage);
      const prevMileage = Number(prev.mileage);
      const volume = curr.volumeUnit === 'liters' ? Number(curr.volume) : Number(curr.volume) * 3.78541;
      const cost = Number(curr.cost);

      if (isNaN(mileage) || isNaN(prevMileage) || isNaN(volume) || isNaN(cost)) {
        skippedEntries++;
        continue;
      }

      const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

      // Validate distance - but be more lenient and provide debugging info
      if (distance <= 0) {
        negativeDistances++;
        // Skip negative distances but don't fail completely
        continue;
      }

      if (distance > 2000) {
        // Skip unreasonably large distances
        continue;
      }

      // Validate time interval - skip intervals longer than 60 days to avoid skewed averages
      const timeDiff = new Date(curr.date).getTime() - new Date(prev.date).getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      if (daysDiff > 60) {
        longIntervals++;
        continue;
      }

      // Always add to total distance for valid intervals
      totalDistanceOverall += distance;
      totalDistanceCost += distance;
      totalCost += cost;
      validDistanceEntries++;

      // Use non-partial entries for consumption, fall back to partial if none available
      // FIX: Handle data inconsistency where entries are incorrectly marked as partial
      const shouldUseForConsumption = !hasNonPartial || !curr.partialFuelUp;

      if (shouldUseForConsumption) {
        if (volume > 0) {
          totalDistanceConsumption += distance;
          totalVolume += volume;
          validConsumptionEntries++;
        }
      }
    }

    // Calculate consumption and cost per distance
    const avgConsumption = totalDistanceConsumption > 0 && totalVolume > 0 && validConsumptionEntries > 0
      ? fuelConsumptionUnit === 'L/100km'
        ? (totalVolume / totalDistanceConsumption) * 100
        : fuelConsumptionUnit === 'km/L'
          ? totalDistanceConsumption / totalVolume
          : fuelConsumptionUnit === 'G/100mi'
            ? (totalVolume / 3.78541 / (totalDistanceConsumption / 1.60934)) * 100
            : fuelConsumptionUnit === 'km/G'
              ? totalDistanceConsumption / (totalVolume / 3.78541)
              : totalDistanceConsumption / 1.60934 / totalVolume
      : null;

    const avgCost = totalDistanceCost > 0 && totalCost > 0 ? totalCost / totalDistanceCost : null;

    return {
      avgConsumption: avgConsumption ? Number(avgConsumption.toFixed(2)) : null,
      avgCost: avgCost ? Number(avgCost.toFixed(2)) : null,
      totalDistance: Number(totalDistanceOverall.toFixed(2)),
    };
  };

  const calculateTotalCosts = (carId: string) => {
    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

    const carFuelCost = carFuelEntries.reduce((sum, entry) => sum + Number(entry.cost), 0);
    const carExpenseCost = carExpenseEntries.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const carIncomeCost = carIncomeEntries.reduce((sum, income) => sum + Number(income.amount), 0);
    return Number((carFuelCost + carExpenseCost + carIncomeCost).toFixed(2));
  };

  const calculateMonthlyCosts = (carId: string) => {
    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

    const monthlyData: {
      [key: string]: {
        fuel: number;
        expenses: number;
        incomes: number;
        total: number;
        avgConsumption: number | null;
        avgCostPerDistance: number | null;
        totalDistance: number;
        totalVolume: number;
        consumptionData?: Array<{ consumption: number; distance: number; volume: number }>;
        costData?: { totalCost: number; totalDistance: number };
      }
    } = {};

    // Process fuel entries
    carFuelEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          fuel: 0,
          expenses: 0,
          incomes: 0,
          total: 0,
          avgConsumption: null,
          avgCostPerDistance: null,
          totalDistance: 0,
          totalVolume: 0
        };
      }

      monthlyData[monthKey].fuel += Number(entry.cost);
    });

    // Process expense entries
    carExpenseEntries.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          fuel: 0,
          expenses: 0,
          incomes: 0,
          total: 0,
          avgConsumption: null,
          avgCostPerDistance: null,
          totalDistance: 0,
          totalVolume: 0
        };
      }

      monthlyData[monthKey].expenses += Number(expense.amount);
    });

    // Process income entries
    carIncomeEntries.forEach((income) => {
      const date = new Date(income.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          fuel: 0,
          expenses: 0,
          incomes: 0,
          total: 0,
          avgConsumption: null,
          avgCostPerDistance: null,
          totalDistance: 0,
          totalVolume: 0
        };
      }

      monthlyData[monthKey].incomes += Number(income.amount);
    });

    // Calculate distance across all fuel entries for proper monthly attribution
    if (carFuelEntries.length >= 2) {
      const sortedAllEntries = carFuelEntries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let hasNonPartial = false;
      // Check for non-partial entries across all entries
      for (let j = 0; j < sortedAllEntries.length; j++) {
        if (!sortedAllEntries[j].partialFuelUp) {
          hasNonPartial = true;
          break;
        }
      }

      for (let i = 1; i < sortedAllEntries.length; i++) {
        const curr = sortedAllEntries[i];
        const prev = sortedAllEntries[i - 1];

        const mileage = Number(curr.mileage);
        const prevMileage = Number(prev.mileage);
        const volume = curr.volumeUnit === 'liters' ? Number(curr.volume) : Number(curr.volume) * 3.78541;
        const cost = Number(curr.cost);

        if (isNaN(mileage) || isNaN(prevMileage) || isNaN(volume) || isNaN(cost)) continue;

        const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

        // Validate distance
        if (distance <= 0 || distance > 2000) {
          continue;
        }

        // Validate time interval - skip intervals longer than 60 days to avoid skewed averages
        const timeDiff = new Date(curr.date).getTime() - new Date(prev.date).getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        if (daysDiff > 60) {
          continue;
        }

        // Attribute the distance to the month of the current (later) fuel entry
        const currDate = new Date(curr.date);
        const currMonthKey = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}`;

        // Make sure the month exists in our data
        if (!monthlyData[currMonthKey]) {
          monthlyData[currMonthKey] = {
            fuel: 0,
            expenses: 0,
            incomes: 0,
            total: 0,
            avgConsumption: null,
            avgCostPerDistance: null,
            totalDistance: 0,
            totalVolume: 0
          };
        }

        // Add distance to the current month
        monthlyData[currMonthKey].totalDistance += distance;

        // Handle consumption calculation
        const shouldUseForConsumption = !hasNonPartial || !curr.partialFuelUp;

        if (shouldUseForConsumption) {
          if (volume > 0) {
            monthlyData[currMonthKey].totalVolume += volume;

            // Calculate consumption for this interval and add to month
            const intervalConsumption = fuelConsumptionUnit === 'L/100km'
              ? (volume / distance) * 100
              : fuelConsumptionUnit === 'km/L'
                ? distance / volume
                : fuelConsumptionUnit === 'G/100mi'
                  ? (volume / 3.78541 / (distance / 1.60934)) * 100
                  : fuelConsumptionUnit === 'km/G'
                    ? distance / (volume / 3.78541)
                    : distance / 1.60934 / volume;

            // Store individual consumption data for later averaging
            if (!monthlyData[currMonthKey].consumptionData) {
              monthlyData[currMonthKey].consumptionData = [];
            }
            monthlyData[currMonthKey].consumptionData.push({
              consumption: intervalConsumption,
              distance: distance,
              volume: volume
            });
          }
        }

        // Handle cost per distance
        if (cost > 0) {
          if (!monthlyData[currMonthKey].costData) {
            monthlyData[currMonthKey].costData = { totalCost: 0, totalDistance: 0 };
          }
          monthlyData[currMonthKey].costData.totalCost += cost;
          monthlyData[currMonthKey].costData.totalDistance += distance;
        }
      }
    }

    // Calculate averages and finalize monthly data
    Object.keys(monthlyData).forEach((monthKey) => {
      const monthData = monthlyData[monthKey];

      // Calculate average consumption from consumption data
      if (monthData.consumptionData && monthData.consumptionData.length > 0) {
        const totalConsumptionDistance = monthData.consumptionData.reduce((sum, data) => sum + data.distance, 0);
        const totalVolume = monthData.consumptionData.reduce((sum, data) => sum + data.volume, 0);

        if (totalConsumptionDistance > 0 && totalVolume > 0) {
          const avgConsumption = fuelConsumptionUnit === 'L/100km'
            ? (totalVolume / totalConsumptionDistance) * 100
            : fuelConsumptionUnit === 'km/L'
              ? totalConsumptionDistance / totalVolume
              : fuelConsumptionUnit === 'G/100mi'
                ? (totalVolume / 3.78541 / (totalConsumptionDistance / 1.60934)) * 100
                : fuelConsumptionUnit === 'km/G'
                  ? totalConsumptionDistance / (totalVolume / 3.78541)
                  : totalConsumptionDistance / 1.60934 / totalVolume;

          monthData.avgConsumption = Number(avgConsumption.toFixed(2));
        }
        delete monthData.consumptionData; // Clean up temporary data
      }

      // Calculate cost per distance
      if (monthData.costData && monthData.costData.totalDistance > 0 && monthData.costData.totalCost > 0) {
        monthData.avgCostPerDistance = Number((monthData.costData.totalCost / monthData.costData.totalDistance).toFixed(2));
        delete monthData.costData; // Clean up temporary data
      }

      // Calculate totals
      monthData.total = monthData.fuel + monthData.expenses + monthData.incomes;
      monthData.fuel = Number(monthData.fuel.toFixed(2));
      monthData.expenses = Number(monthData.expenses.toFixed(2));
      monthData.incomes = Number(monthData.incomes.toFixed(2));
      monthData.total = Number(monthData.total.toFixed(2));
      monthData.totalDistance = Number(monthData.totalDistance.toFixed(2));
    });

    return monthlyData;
  };

  const calculateYearlyCosts = (carId: string) => {
    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

    const yearlyData: {
      [key: string]: {
        fuel: number;
        expenses: number;
        incomes: number;
        total: number;
        avgConsumption: number | null;
        avgCostPerDistance: number | null;
        totalDistance: number;
        totalVolume: number;
      }
    } = {};

    // Process fuel entries
    carFuelEntries.forEach((entry) => {
      const year = new Date(entry.date).getFullYear().toString();

      if (!yearlyData[year]) {
        yearlyData[year] = {
          fuel: 0,
          expenses: 0,
          incomes: 0,
          total: 0,
          avgConsumption: null,
          avgCostPerDistance: null,
          totalDistance: 0,
          totalVolume: 0
        };
      }

      yearlyData[year].fuel += Number(entry.cost);
    });

    // Process expense entries
    carExpenseEntries.forEach((expense) => {
      const year = new Date(expense.date).getFullYear().toString();

      if (!yearlyData[year]) {
        yearlyData[year] = {
          fuel: 0,
          expenses: 0,
          incomes: 0,
          total: 0,
          avgConsumption: null,
          avgCostPerDistance: null,
          totalDistance: 0,
          totalVolume: 0
        };
      }

      yearlyData[year].expenses += Number(expense.amount);
    });

    // Process income entries
    carIncomeEntries.forEach((income) => {
      const year = new Date(income.date).getFullYear().toString();

      if (!yearlyData[year]) {
        yearlyData[year] = {
          fuel: 0,
          expenses: 0,
          incomes: 0,
          total: 0,
          avgConsumption: null,
          avgCostPerDistance: null,
          totalDistance: 0,
          totalVolume: 0
        };
      }

      yearlyData[year].incomes += Number(income.amount);
    });

    // Calculate consumption and cost per distance for each year
    Object.keys(yearlyData).forEach((year) => {
      const yearFuelEntries = carFuelEntries.filter((entry) => {
        const entryYear = new Date(entry.date).getFullYear().toString();
        return entryYear === year;
      });

      if (yearFuelEntries.length >= 2) {
        const sortedEntries = yearFuelEntries.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let totalDistanceConsumption = 0;
        let totalDistanceOverall = 0;
        let totalVolume = 0;
        let totalCost = 0;
        let totalDistanceCost = 0;
        let validEntries = 0;
        let hasNonPartial = false;

        // Check if there are any non-partial entries in this year
        for (let j = 0; j < sortedEntries.length; j++) {
          if (!sortedEntries[j].partialFuelUp) {
            hasNonPartial = true;
            break;
          }
        }

        for (let i = 1; i < sortedEntries.length; i++) {
          const curr = sortedEntries[i];
          const prev = sortedEntries[i - 1];

          const mileage = Number(curr.mileage);
          const prevMileage = Number(prev.mileage);
          const volume = curr.volumeUnit === 'liters' ? Number(curr.volume) : Number(curr.volume) * 3.78541;
          const cost = Number(curr.cost);

          if (isNaN(mileage) || isNaN(prevMileage) || isNaN(volume) || isNaN(cost)) continue;

          const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

          // Validate distance
          if (distance <= 0 || distance > 2000) {
            continue;
          }

          // Validate time interval - skip intervals longer than 60 days to avoid skewed averages
          const timeDiff = new Date(curr.date).getTime() - new Date(prev.date).getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          if (daysDiff > 60) {
            continue;
          }

          // Always include for distance and cost calculation
          totalDistanceOverall += distance;
          totalDistanceCost += distance;
          totalCost += cost;

          // Use non-partial entries for consumption, fall back to partial if none available
          // FIX: Handle data inconsistency where entries are incorrectly marked as partial
          const shouldUseForConsumption = !hasNonPartial || !curr.partialFuelUp;

          if (shouldUseForConsumption) {
            if (volume > 0) {
              totalDistanceConsumption += distance;
              totalVolume += volume;
              validEntries++;
            }
          }
        }

        // Always set the total distance for the year
        yearlyData[year].totalDistance = totalDistanceOverall;

        if (validEntries > 0 && totalDistanceConsumption > 0) {
          yearlyData[year].totalVolume = totalVolume;

          // Calculate average consumption
          const avgConsumption = fuelConsumptionUnit === 'L/100km'
            ? (totalVolume / totalDistanceConsumption) * 100
            : fuelConsumptionUnit === 'km/L'
              ? totalDistanceConsumption / totalVolume
              : fuelConsumptionUnit === 'G/100mi'
                ? (totalVolume / 3.78541 / (totalDistanceConsumption / 1.60934)) * 100
                : fuelConsumptionUnit === 'km/G'
                  ? totalDistanceConsumption / (totalVolume / 3.78541)
                  : totalDistanceConsumption / 1.60934 / totalVolume;

          yearlyData[year].avgConsumption = Number(avgConsumption.toFixed(2));
        }

        if (totalDistanceCost > 0 && totalCost > 0) {
          yearlyData[year].avgCostPerDistance = Number((totalCost / totalDistanceCost).toFixed(2));
        }
      }

      // Calculate totals
      yearlyData[year].total = yearlyData[year].fuel + yearlyData[year].expenses + yearlyData[year].incomes;
      yearlyData[year].fuel = Number(yearlyData[year].fuel.toFixed(2));
      yearlyData[year].expenses = Number(yearlyData[year].expenses.toFixed(2));
      yearlyData[year].incomes = Number(yearlyData[year].incomes.toFixed(2));
      yearlyData[year].total = Number(yearlyData[year].total.toFixed(2));
    });

    return yearlyData;
  };

  const calculateCategoryCosts = (carId: string) => {
    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

    const categoryData: { [key: string]: number } = {};

    // Add fuel as a category
    const fuelTotal = carFuelEntries.reduce((sum, entry) => sum + Number(entry.cost), 0);
    if (fuelTotal > 0) {
      categoryData['Fuel'] = Number(fuelTotal.toFixed(2));
    }

    // Process expense categories
    carExpenseEntries.forEach((expense) => {
      const category = expense.category || 'Other';

      if (!categoryData[category]) {
        categoryData[category] = 0;
      }

      categoryData[category] += Number(expense.amount);
    });

    // Process income categories
    carIncomeEntries.forEach((income) => {
      const category = income.category || 'Other';

      if (!categoryData[category]) {
        categoryData[category] = 0;
      }

      categoryData[category] += Number(income.amount);
    });

    // Round all category totals
    Object.keys(categoryData).forEach((category) => {
      categoryData[category] = Number(categoryData[category].toFixed(2));
    });

    return categoryData;
  };

  // Calculate currency-specific statistics
  const calculateCurrencySpecificStats = () => {
    const currencyBreakdown = calculateCurrencyStats(entries, expenses, incomes);

    // Add cost per distance calculations for each currency
    const currencyStatsWithCostPerDistance = currencyBreakdown.byCurrency.map(currencyStat => {
      const costPerDistanceData = calculateCostPerDistance(entries, currencyStat.currency);

      return {
        ...currencyStat,
        costPerDistance: costPerDistanceData.costPerDistance,
        totalDistance: costPerDistanceData.totalDistance,
        avgCostPerKm: costPerDistanceData.costPerDistance,
        avgCostPerMile: costPerDistanceData.costPerDistance ? costPerDistanceData.costPerDistance * 1.60934 : null
      };
    });

    return {
      ...currencyBreakdown,
      byCurrency: currencyStatsWithCostPerDistance
    };
  };

  // Calculate comprehensive aggregate statistics across all cars
  const calculateAggregateStats = () => {
    if (entries.length === 0) {
      return {
        totalFillUps: 0,
        totalVolume: 0,
        minVolume: null,
        maxVolume: null,
        avgConsumption: null,
        bestConsumption: null,
        worstConsumption: null,
        totalCosts: 0,
        lowestBill: null,
        highestBill: null,
        bestPrice: null,
        worstPrice: null,
        avgCostPerDistance: null,
        bestCostPerDistance: null,
        worstCostPerDistance: null,
        avgCostPerDay: null,
        avgCostPerMonth: null,
        avgCostPerYear: null,
        totalDistance: 0,
        avgDistancePerDay: null,
        avgDistancePerMonth: null,
        avgDistancePerYear: null,
        lastOdometer: null,
        monthlyStats: {},
        yearlyStats: {}
      };
    }

    // Sort all entries by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Basic fuel statistics
    const totalFillUps = entries.length;
    const volumes = entries.map(entry => entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541);
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    const minVolume = Math.min(...volumes);
    const maxVolume = Math.max(...volumes);

    // Cost statistics
    const fuelCosts = entries.map(entry => Number(entry.cost));
    const expenseCosts = expenses.map(expense => Number(expense.amount));
    const incomeCosts = incomes.map(income => Number(income.amount));
    const allCosts = [...fuelCosts, ...expenseCosts, ...incomeCosts];
    const totalFuelCosts = fuelCosts.reduce((sum, cost) => sum + cost, 0);
    const totalExpenseCosts = expenseCosts.reduce((sum, cost) => sum + cost, 0);
    const totalIncomeCosts = incomeCosts.reduce((sum, cost) => sum + cost, 0);
    const totalCosts = totalFuelCosts + totalExpenseCosts + totalIncomeCosts;
    const lowestBill = allCosts.length > 0 ? Math.min(...allCosts.filter(cost => cost > 0)) : null;
    const highestBill = allCosts.length > 0 ? Math.max(...allCosts) : null;

    // Price per liter statistics
    const pricesPerLiter = entries.map(entry => {
      const volume = entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541;
      return volume > 0 ? Number(entry.cost) / volume : 0;
    }).filter(price => price > 0);
    const bestPrice = pricesPerLiter.length > 0 ? Math.min(...pricesPerLiter) : null;
    const worstPrice = pricesPerLiter.length > 0 ? Math.max(...pricesPerLiter) : null;

    // Calculate consumption and distance statistics
    let totalDistance = 0;
    let totalConsumptionVolume = 0;
    let totalCostDistance = 0;
    let totalCostAmount = 0;
    const consumptionRates: number[] = [];
    const costPerDistanceRates: number[] = [];
    let hasNonPartial = false;

    // Check for non-partial entries across all cars
    for (const entry of sortedEntries) {
      if (!entry.partialFuelUp) {
        hasNonPartial = true;
        break;
      }
    }

    // Group entries by car for proper distance calculation
    const entriesByCarId: { [key: string]: FuelEntry[] } = {};
    sortedEntries.forEach(entry => {
      const carId = entry.carId;
      if (!entriesByCarId[carId]) {
        entriesByCarId[carId] = [];
      }
      entriesByCarId[carId].push(entry);
    });

    // Calculate distances and consumption for each car
    let totalSkippedEntries = 0;
    let totalNegativeDistances = 0;
    let totalLongIntervals = 0;

    Object.keys(entriesByCarId).forEach(carId => {
      const carEntries = entriesByCarId[carId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (let i = 1; i < carEntries.length; i++) {
        const curr = carEntries[i];
        const prev = carEntries[i - 1];

        const mileage = Number(curr.mileage);
        const prevMileage = Number(prev.mileage);
        const volume = curr.volumeUnit === 'liters' ? Number(curr.volume) : Number(curr.volume) * 3.78541;
        const cost = Number(curr.cost);

        if (isNaN(mileage) || isNaN(prevMileage) || isNaN(volume) || isNaN(cost)) {
          totalSkippedEntries++;
          continue;
        }

        const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

        // Validate distance - be more lenient and provide debugging info
        if (distance <= 0) {
          totalNegativeDistances++;
          continue;
        }

        if (distance > 2000) {
          continue;
        }

        const timeDiff = new Date(curr.date).getTime() - new Date(prev.date).getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        if (daysDiff > 60) {
          totalLongIntervals++;
          continue;
        }

        // Always include for cost calculation
        totalCostDistance += distance;
        totalCostAmount += cost;

        if (distance > 0 && cost > 0) {
          costPerDistanceRates.push(cost / distance);
        }

        // Use non-partial entries for consumption, fall back to partial if none available
        // FIX: Handle data inconsistency where entries are incorrectly marked as partial
        const shouldUseForConsumption = !hasNonPartial || !curr.partialFuelUp;

        if (shouldUseForConsumption) {
          if (volume > 0 && distance > 0) {
            totalDistance += distance;
            totalConsumptionVolume += volume;

            // Calculate consumption rate for this interval
            const consumptionRate = fuelConsumptionUnit === 'L/100km'
              ? (volume / distance) * 100
              : fuelConsumptionUnit === 'km/L'
                ? distance / volume
                : fuelConsumptionUnit === 'G/100mi'
                  ? (volume / 3.78541 / (distance / 1.60934)) * 100
                  : fuelConsumptionUnit === 'km/G'
                    ? distance / (volume / 3.78541)
                    : distance / 1.60934 / volume;

            consumptionRates.push(consumptionRate);
          }
        }
      }
    });

    // Calculate averages and extremes
    const avgConsumption = totalDistance > 0 && totalConsumptionVolume > 0
      ? fuelConsumptionUnit === 'L/100km'
        ? (totalConsumptionVolume / totalDistance) * 100
        : fuelConsumptionUnit === 'km/L'
          ? totalDistance / totalConsumptionVolume
          : fuelConsumptionUnit === 'G/100mi'
            ? (totalConsumptionVolume / 3.78541 / (totalDistance / 1.60934)) * 100
            : fuelConsumptionUnit === 'km/G'
              ? totalDistance / (totalConsumptionVolume / 3.78541)
              : totalDistance / 1.60934 / totalConsumptionVolume
      : null;

    const bestConsumption = consumptionRates.length > 0
      ? (fuelConsumptionUnit === 'L/100km' || fuelConsumptionUnit === 'G/100mi')
        ? Math.min(...consumptionRates)
        : Math.max(...consumptionRates)
      : null;

    const worstConsumption = consumptionRates.length > 0
      ? (fuelConsumptionUnit === 'L/100km' || fuelConsumptionUnit === 'G/100mi')
        ? Math.max(...consumptionRates)
        : Math.min(...consumptionRates)
      : null;

    const avgCostPerDistance = totalCostDistance > 0 && totalCostAmount > 0 ? totalCostAmount / totalCostDistance : null;
    const bestCostPerDistance = costPerDistanceRates.length > 0 ? Math.min(...costPerDistanceRates) : null;
    const worstCostPerDistance = costPerDistanceRates.length > 0 ? Math.max(...costPerDistanceRates) : null;

    // Time-based averages
    const firstDate = sortedEntries.length > 0 ? new Date(sortedEntries[0].date) : null;
    const lastDate = sortedEntries.length > 0 ? new Date(sortedEntries[sortedEntries.length - 1].date) : null;
    const totalDays = firstDate && lastDate ? (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24) + 1 : 0;
    const totalMonths = totalDays / 30.44; // Average days per month
    const totalYears = totalDays / 365.25; // Average days per year

    const avgCostPerDay = totalDays > 0 ? totalCosts / totalDays : null;
    const avgCostPerMonth = totalMonths > 0 ? totalCosts / totalMonths : null;
    const avgCostPerYear = totalYears > 0 ? totalCosts / totalYears : null;

    const avgDistancePerDay = totalDays > 0 && totalDistance > 0 ? totalDistance / totalDays : null;
    const avgDistancePerMonth = totalMonths > 0 && totalDistance > 0 ? totalDistance / totalMonths : null;
    const avgDistancePerYear = totalYears > 0 && totalDistance > 0 ? totalDistance / totalYears : null;

    // Last odometer reading
    const lastOdometer = sortedEntries.length > 0 ? Number(sortedEntries[sortedEntries.length - 1].mileage) : null;

    // Monthly and yearly breakdowns
    const monthlyStats: {
      [key: string]: {
        fillUps: number;
        volume: number;
        fuelCost: number;
        expenseCost: number;
        incomeCost: number;
        totalCost: number;
        distance: number;
      }
    } = {};
    const yearlyStats: {
      [key: string]: {
        fillUps: number;
        volume: number;
        fuelCost: number;
        expenseCost: number;
        incomeCost: number;
        totalCost: number;
        distance: number;
      }
    } = {};

    // Process monthly statistics
    [...sortedEntries, ...sortedExpenses].forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = date.getFullYear().toString();

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          fillUps: 0,
          volume: 0,
          fuelCost: 0,
          expenseCost: 0,
          incomeCost: 0,
          totalCost: 0,
          distance: 0
        };
      }

      if (!yearlyStats[yearKey]) {
        yearlyStats[yearKey] = {
          fillUps: 0,
          volume: 0,
          fuelCost: 0,
          expenseCost: 0,
          incomeCost: 0,
          totalCost: 0,
          distance: 0
        };
      }

      if ('volume' in item) { // Fuel entry
        const volume = item.volumeUnit === 'liters' ? Number(item.volume) : Number(item.volume) * 3.78541;
        monthlyStats[monthKey].fillUps++;
        monthlyStats[monthKey].volume += volume;
        monthlyStats[monthKey].fuelCost += Number(item.cost);
        monthlyStats[monthKey].totalCost += Number(item.cost);

        yearlyStats[yearKey].fillUps++;
        yearlyStats[yearKey].volume += volume;
        yearlyStats[yearKey].fuelCost += Number(item.cost);
        yearlyStats[yearKey].totalCost += Number(item.cost);
      } else { // Expense entry
        monthlyStats[monthKey].expenseCost += Number(item.amount);
        monthlyStats[monthKey].totalCost += Number(item.amount);

        yearlyStats[yearKey].expenseCost += Number(item.amount);
        yearlyStats[yearKey].totalCost += Number(item.amount);
      }
    });

    // Calculate distances for monthly/yearly stats
    Object.keys(entriesByCarId).forEach(carId => {
      const carEntries = entriesByCarId[carId];

      for (let i = 1; i < carEntries.length; i++) {
        const curr = carEntries[i];
        const prev = carEntries[i - 1];

        const mileage = Number(curr.mileage);
        const prevMileage = Number(prev.mileage);

        if (isNaN(mileage) || isNaN(prevMileage)) continue;

        const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

        if (distance <= 0 || distance > 2000) continue;

        const timeDiff = new Date(curr.date).getTime() - new Date(prev.date).getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        if (daysDiff > 60) continue;

        const currDate = new Date(curr.date);
        const monthKey = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = currDate.getFullYear().toString();

        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].distance += distance;
        }
        if (yearlyStats[yearKey]) {
          yearlyStats[yearKey].distance += distance;
        }
      }
    });

    return {
      totalFillUps,
      totalVolume: Number(totalVolume.toFixed(2)),
      minVolume: minVolume ? Number(minVolume.toFixed(2)) : null,
      maxVolume: maxVolume ? Number(maxVolume.toFixed(2)) : null,
      avgConsumption: avgConsumption ? Number(avgConsumption.toFixed(2)) : null,
      bestConsumption: bestConsumption ? Number(bestConsumption.toFixed(2)) : null,
      worstConsumption: worstConsumption ? Number(worstConsumption.toFixed(2)) : null,
      totalCosts: Number(totalCosts.toFixed(2)),
      totalFuelCosts: Number(totalFuelCosts.toFixed(2)),
      totalExpenseCosts: Number(totalExpenseCosts.toFixed(2)),
      totalIncomeCosts: Number(totalIncomeCosts.toFixed(2)),
      lowestBill: lowestBill ? Number(lowestBill.toFixed(2)) : null,
      highestBill: highestBill ? Number(highestBill.toFixed(2)) : null,
      bestPrice: bestPrice ? Number(bestPrice.toFixed(2)) : null,
      worstPrice: worstPrice ? Number(worstPrice.toFixed(2)) : null,
      avgCostPerDistance: avgCostPerDistance ? Number(avgCostPerDistance.toFixed(2)) : null,
      bestCostPerDistance: bestCostPerDistance ? Number(bestCostPerDistance.toFixed(2)) : null,
      worstCostPerDistance: worstCostPerDistance ? Number(worstCostPerDistance.toFixed(2)) : null,
      avgCostPerDay: avgCostPerDay ? Number(avgCostPerDay.toFixed(2)) : null,
      avgCostPerMonth: avgCostPerMonth ? Number(avgCostPerMonth.toFixed(2)) : null,
      avgCostPerYear: avgCostPerYear ? Number(avgCostPerYear.toFixed(2)) : null,
      totalDistance: Number(totalDistance.toFixed(2)),
      avgDistancePerDay: avgDistancePerDay ? Number(avgDistancePerDay.toFixed(2)) : null,
      avgDistancePerMonth: avgDistancePerMonth ? Number(avgDistancePerMonth.toFixed(2)) : null,
      avgDistancePerYear: avgDistancePerYear ? Number(avgDistancePerYear.toFixed(2)) : null,
      lastOdometer,
      monthlyStats,
      yearlyStats
    };
  };

  // Generate chart data
  const generateChartData = () => {
    if (entries.length === 0) return { monthlyTrends: [], monthlyTrendsByCurrency: {}, fuelPrices: [], fuelPricesByCurrency: {}, consumptionTrends: [], carComparison: [] };

    // Monthly trends data by currency
    const monthlyTrendsByCurrency: { [currency: string]: any[] } = {};

    // Group entries by currency and calculate monthly stats for each currency
    const entriesByCurrency: { [currency: string]: FuelEntry[] } = {};
    const expensesByCurrency: { [currency: string]: ExpenseEntry[] } = {};
    const incomesByCurrency: { [currency: string]: IncomeEntry[] } = {};

    // Group fuel entries by currency
    entries.forEach(entry => {
      if (!entriesByCurrency[entry.currency]) {
        entriesByCurrency[entry.currency] = [];
      }
      entriesByCurrency[entry.currency].push(entry);
    });

    // Group expenses by currency
    expenses.forEach(expense => {
      if (!expensesByCurrency[expense.currency]) {
        expensesByCurrency[expense.currency] = [];
      }
      expensesByCurrency[expense.currency].push(expense);
    });

    // Group incomes by currency
    incomes.forEach(income => {
      if (!incomesByCurrency[income.currency]) {
        incomesByCurrency[income.currency] = [];
      }
      incomesByCurrency[income.currency].push(income);
    });

    // Calculate monthly trends for each currency
    Object.keys(entriesByCurrency).forEach(currency => {
      const currencyEntries = entriesByCurrency[currency];
      const currencyExpenses = expensesByCurrency[currency] || [];
      const currencyIncomes = incomesByCurrency[currency] || [];

      // Group by month
      const monthlyData: { [month: string]: any } = {};

      // Process fuel entries
      currencyEntries.forEach(entry => {
        const month = entry.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            totalCost: 0,
            fuelCost: 0,
            expenseCost: 0,
            incomeCost: 0,
            distance: 0,
            volume: 0,
            fillUps: 0
          };
        }

        monthlyData[month].fuelCost += Number(entry.cost);
        monthlyData[month].totalCost += Number(entry.cost);
        monthlyData[month].fillUps += 1;

        const volume = entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541;
        monthlyData[month].volume += volume;
      });

      // Process expenses
      currencyExpenses.forEach(expense => {
        const month = expense.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            totalCost: 0,
            fuelCost: 0,
            expenseCost: 0,
            incomeCost: 0,
            distance: 0,
            volume: 0,
            fillUps: 0
          };
        }

        monthlyData[month].expenseCost += Number(expense.amount);
        monthlyData[month].totalCost += Number(expense.amount);
      });

      // Process incomes
      currencyIncomes.forEach(income => {
        const month = income.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            totalCost: 0,
            fuelCost: 0,
            expenseCost: 0,
            incomeCost: 0,
            distance: 0,
            volume: 0,
            fillUps: 0
          };
        }

        monthlyData[month].incomeCost += Number(income.amount);
        monthlyData[month].totalCost -= Number(income.amount); // Income reduces total cost
      });

      // Calculate distance and cost per km for each month
      Object.values(monthlyData).forEach(monthData => {
        // Calculate distance from fuel entries for this month
        const monthEntries = currencyEntries.filter(entry => entry.date.startsWith(monthData.month));
        if (monthEntries.length >= 2) {
          const sortedEntries = monthEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const firstEntry = sortedEntries[0];
          const lastEntry = sortedEntries[sortedEntries.length - 1];

          const firstMileage = Number(firstEntry.mileage);
          const lastMileage = Number(lastEntry.mileage);

          if (!isNaN(firstMileage) && !isNaN(lastMileage) && lastMileage > firstMileage) {
            monthData.distance = firstEntry.distanceUnit === 'km' ?
              lastMileage - firstMileage :
              (lastMileage - firstMileage) * 1.60934;
          }
        }

        // Calculate cost per km
        monthData.costPerKm = monthData.distance > 0 ? monthData.totalCost / monthData.distance : 0;
        monthData.consumption = monthData.distance > 0 && monthData.volume > 0 ? (monthData.volume / monthData.distance) * 100 : 0;
      });

      // Convert to array and sort by month
      monthlyTrendsByCurrency[currency] = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month));
    });

    // Legacy monthly trends data (for backward compatibility)
    const monthlyTrends = Object.entries(calculateAggregateStats().monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        totalCost: stats.totalCost,
        fuelCost: stats.fuelCost,
        expenseCost: stats.expenseCost,
        incomeCost: stats.incomeCost,
        distance: stats.distance,
        volume: stats.volume,
        fillUps: stats.fillUps,
        costPerKm: stats.distance > 0 ? stats.totalCost / stats.distance : 0,
        consumption: stats.distance > 0 && stats.volume > 0 ? (stats.volume / stats.distance) * 100 : 0
      }));

    // Fuel price trends by currency
    const fuelPricesByCurrency: { [currency: string]: any[] } = {};

    // Group entries by currency
    entries.forEach(entry => {
      const volume = entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541;
      const pricePerLiter = volume > 0 ? Number(entry.cost) / volume : 0;

      if (pricePerLiter > 0) {
        const priceData = {
          date: entry.date,
          month: entry.date.substring(0, 7),
          pricePerLiter,
          cost: Number(entry.cost),
          volume,
          fuelCompany: entry.fuelCompany,
          fuelType: entry.fuelType,
          currency: entry.currency
        };

        if (!fuelPricesByCurrency[entry.currency]) {
          fuelPricesByCurrency[entry.currency] = [];
        }
        fuelPricesByCurrency[entry.currency].push(priceData);
      }
    });

    // Sort each currency's data by date
    Object.keys(fuelPricesByCurrency).forEach(currency => {
      fuelPricesByCurrency[currency].sort((a, b) => a.date.localeCompare(b.date));
    });

    // Legacy fuel price trends (for backward compatibility)
    const fuelPrices = entries
      .map(entry => {
        const volume = entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541;
        const pricePerLiter = volume > 0 ? Number(entry.cost) / volume : 0;
        return {
          date: entry.date,
          month: entry.date.substring(0, 7),
          pricePerLiter,
          cost: Number(entry.cost),
          volume,
          fuelCompany: entry.fuelCompany,
          fuelType: entry.fuelType
        };
      })
      .filter(item => item.pricePerLiter > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Consumption trends by car
    const consumptionTrends: { [key: string]: any[] } = {};
    cars.forEach(car => {
      const carId = getObjectId(car as unknown as Record<string, unknown>);
      const carEntries = entries.filter(entry => matchesCarId(entry.carId, carId));

      if (carEntries.length >= 2) {
        const sortedEntries = carEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const carTrends: any[] = [];

        for (let i = 1; i < sortedEntries.length; i++) {
          const curr = sortedEntries[i];
          const prev = sortedEntries[i - 1];

          const mileage = Number(curr.mileage);
          const prevMileage = Number(prev.mileage);
          const volume = curr.volumeUnit === 'liters' ? Number(curr.volume) : Number(curr.volume) * 3.78541;

          if (!isNaN(mileage) && !isNaN(prevMileage) && !isNaN(volume)) {
            const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

            if (distance > 0 && distance <= 2000 && volume > 0) {
              const consumption = fuelConsumptionUnit === 'L/100km'
                ? (volume / distance) * 100
                : distance / volume;

              carTrends.push({
                date: curr.date,
                month: curr.date.substring(0, 7),
                consumption,
                distance,
                volume,
                cost: Number(curr.cost),
                mileage
              });
            }
          }
        }

        if (carTrends.length > 0) {
          consumptionTrends[car.name] = carTrends;
        }
      }
    });

    // Car comparison data
    const carComparison = cars.map(car => {
      const carId = getObjectId(car as unknown as Record<string, unknown>);
      const { avgConsumption, avgCost, totalDistance } = calculateStats(carId);
      const totalCost = calculateTotalCosts(carId);
      const carEntries = entries.filter(entry => matchesCarId(entry.carId, carId));
      const totalFillUps = carEntries.length;
      const totalVolume = carEntries.reduce((sum, entry) => {
        const volume = entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541;
        return sum + volume;
      }, 0);

      return {
        name: car.name,
        avgConsumption: avgConsumption || 0,
        avgCost: avgCost || 0,
        totalDistance: totalDistance || 0,
        totalCost,
        totalFillUps,
        totalVolume: Number(totalVolume.toFixed(2)),
        brand: car.brand,
        model: car.model,
        year: car.year
      };
    }).filter(car => car.totalFillUps > 0);

    return { monthlyTrends, monthlyTrendsByCurrency, fuelPrices, fuelPricesByCurrency, consumptionTrends, carComparison };
  };

  // Default arrays to empty if null/undefined
  cars = cars ?? [];
  entries = entries ?? [];
  expenses = expenses ?? [];
  incomes = incomes ?? [];

  return (
    <div className="p-3 max-w-7xl mx-auto flex-grow" data-testid="stats-tab">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{getTranslation('stats.show', 'Statistics')}</h2>
        {/* Summary Section for Integration Tests */}
        <div>
          <div>Cars: {cars?.length || 0}</div>
          <div>Fuel Entries: {entries?.length || 0}</div>
          <div>Expenses: {expenses?.length || 0}</div>
          <div>Incomes: {incomes?.length || 0}</div>
          <div>Fuel Unit: {fuelConsumptionUnit}</div>
        </div>
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-800 dark:text-gray-200">{getTranslation('vehicle.labels.consumptionUnit', 'Consumption Unit')}</label>
          <select
            value={fuelConsumptionUnit}
            onChange={(e) => setFuelConsumptionUnit(e.target.value as 'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L')}
            className="p-2 border rounded w-full text-sm text-gray-800 dark:text-gray-200"
            aria-label={getTranslation('vehicle.labels.consumptionUnit', "Consumption Unit")}
            title={getTranslation('vehicle.labels.consumptionUnit', "Consumption Unit")}
          >
            <option key="consumption-l100km" value="L/100km">{getTranslation('units.consumption.per100km', 'L/100km')}</option>
            <option key="consumption-kml" value="km/L">{getTranslation('units.consumption.kmPerLiter', 'km/L')}</option>
            <option key="consumption-g100mi" value="G/100mi">{getTranslation('units.consumption.per100miles', 'G/100mi')}</option>
            <option key="consumption-kmg" value="km/G">{getTranslation('units.consumption.kmPerGallon', 'km/G')}</option>
            <option key="consumption-mil" value="mi/L">{getTranslation('units.consumption.miPerLiter', 'mi/L')}</option>
          </select>
        </div>

        {cars.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
            <p className="text-gray-800 dark:text-gray-200 mb-4">{getTranslation('stats.noVehicles', 'No vehicles found')}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{getTranslation('stats.addVehicleFirst', 'Please add a vehicle first to view statistics')}</p>
          </div>
        ) : (
          <>
            {/* Comprehensive Aggregate Statistics */}
            {(() => {
              const aggregateStats = calculateAggregateStats();
              const currency = entries.length > 0 ? entries[0].currency : currencies[0];

              return (
                <div className="mb-6 p-4 rounded-lg border transition-colors">
                  <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-gray-200">{getTranslation('stats.aggregateStats', 'Overall Fleet Statistics')}</h3>

                  {/* Fuel Statistics */}
                  <div className="mb-4 border-b border-green-200 pb-3">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('stats.fuelStats', 'Fuel Statistics')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.totalFillUps', 'Total Fill-ups')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalFillUps}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.totalVolume', 'Total Volume')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalVolume} L</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.minVolume', 'Min Fill-up')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.minVolume || 'N/A'} L</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.maxVolume', 'Max Fill-up')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.maxVolume || 'N/A'} L</div>
                      </div>
                    </div>
                  </div>

                  {/* Consumption Statistics */}
                  <div className="mb-4 border-b border-green-200 pb-3">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('stats.consumptionStats', 'Consumption Statistics')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.avgConsumption', 'Average Consumption')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {aggregateStats.avgConsumption !== null ?
                            `${aggregateStats.avgConsumption} ${getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}` :
                            'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.bestConsumption', 'Best Consumption')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {aggregateStats.bestConsumption !== null ?
                            `${aggregateStats.bestConsumption} ${getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}` :
                            'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('stats.worstConsumption', 'Worst Consumption')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {aggregateStats.worstConsumption !== null ?
                            `${aggregateStats.worstConsumption} ${getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}` :
                            'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Statistics */}
                  <div className="mb-4 border-b border-blue-200 pb-3">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('stats.costStats', 'Cost Statistics')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('totalCosts', 'Total Costs')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalCosts} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('fuelCosts', 'Fuel Costs')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalFuelCosts} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('expenseCosts', 'Other Expenses')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalExpenseCosts} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('incomeCosts', 'Income')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalIncomeCosts} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('lastOdometer', 'Last Odometer')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.lastOdometer || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('lowestBill', 'Lowest Bill')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.lowestBill || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('highestBill', 'Highest Bill')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.highestBill || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('bestPrice', 'Best Price/L')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.bestPrice || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('worstPrice', 'Worst Price/L')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.worstPrice || 'N/A'} {currency}</div>
                      </div>
                    </div>
                  </div>

                  {/* Currency-specific Statistics */}
                  {(() => {
                    const currencyStats = calculateCurrencySpecificStats();
                    if (currencyStats.byCurrency.length === 0) return null;

                    return (
                      <div className="mb-4 border-b border-purple-200 pb-3">
                        <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">
                          {getTranslation('stats.currencyBreakdown', 'Costs by Currency')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {currencyStats.byCurrency.map((currencyStat) => (
                            <div key={currencyStat.currency} className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                  {getCurrencyName(currencyStat.currency)} ({currencyStat.currency})
                                </div>
                                <div className="text-xs text-gray-800 dark:text-gray-200">
                                  {currencyStat.entryCount} {getTranslation('stats.entries', 'entries')}
                                </div>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-800 dark:text-gray-200">{getTranslation('stats.fuelCosts', 'Fuel')}:</span>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(currencyStat.totalFuelCost, currencyStat.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-800 dark:text-gray-200">{getTranslation('stats.expenseCosts', 'Expenses')}:</span>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(currencyStat.totalExpenseCost, currencyStat.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-800 dark:text-gray-200">{getTranslation('stats.incomeCosts', 'Income')}:</span>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(currencyStat.totalIncome, currencyStat.currency)}</span>
                                </div>
                                <div className="border-t pt-1 flex justify-between">
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{getTranslation('stats.netCost', 'Net Cost')}:</span>
                                  <span className={`font-bold ${currencyStat.netCost >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(Math.abs(currencyStat.netCost), currencyStat.currency)}
                                    {currencyStat.netCost >= 0 ? ' (Cost)' : ' (Profit)'}
                                  </span>
                                </div>
                                {currencyStat.costPerDistance !== null && (
                                  <div className="flex justify-between text-gray-800 dark:text-gray-200">
                                    <span>{getTranslation('stats.avgCostPerKm', 'Cost/km')}:</span>
                                    <span className="font-medium">{formatCurrency(currencyStat.costPerDistance, currencyStat.currency)}</span>
                                  </div>
                                )}
                                {currencyStat.totalDistance > 0 && (
                                  <div className="flex justify-between text-gray-800 dark:text-gray-200">
                                    <span>{getTranslation('stats.totalDistance', 'Distance')}:</span>
                                    <span>{currencyStat.totalDistance.toFixed(0)} km</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {currencyStats.byCurrency.length > 1 && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                            <div className="text-gray-600 dark:text-gray-300">
                              {getTranslation('stats.totalInBaseCurrency', 'Total in USD')}: {formatCurrency(currencyStats.totalInBaseCurrency, 'USD')}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Distance & Cost per Distance */}
                  <div className="mb-4 border-b border-blue-200 pb-3">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('distanceStats', 'Distance & Cost per Distance')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('totalDistance', 'Total Distance')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.totalDistance} km</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgCostPerDistance', 'Avg Cost/km')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgCostPerDistance || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('bestCostPerDistance', 'Best Cost/km')}</div>
                        <div className="text-lg font-semibold text-green-600">{aggregateStats.bestCostPerDistance || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('worstCostPerDistance', 'Worst Cost/km')}</div>
                        <div className="text-lg font-semibold text-red-600">{aggregateStats.worstCostPerDistance || 'N/A'} {currency}</div>
                      </div>
                    </div>
                  </div>

                  {/* Time-based Averages */}
                  <div className="mb-4 border-b border-blue-200 pb-3">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('timeBasedStats', 'Time-based Averages')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgCostPerDay', 'Avg Cost/Day')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgCostPerDay || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgCostPerMonth', 'Avg Cost/Month')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgCostPerMonth || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgCostPerYear', 'Avg Cost/Year')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgCostPerYear || 'N/A'} {currency}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgDistancePerDay', 'Avg Distance/Day')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgDistancePerDay || 'N/A'} km</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgDistancePerMonth', 'Avg Distance/Month')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgDistancePerMonth || 'N/A'} km</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{getTranslation('avgDistancePerYear', 'Avg Distance/Year')}</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{aggregateStats.avgDistancePerYear || 'N/A'} km</div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Breakdown */}
                  <div className="mb-4 border-b border-blue-200 pb-3">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('monthlyBreakdown', 'Monthly Breakdown')}</h4>
                    {Object.keys(aggregateStats.monthlyStats).length === 0 ? (
                      <p className="text-gray-800 dark:text-gray-200 text-sm">{getTranslation('noData')}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {Object.entries(aggregateStats.monthlyStats)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([month, stats]) => (
                            <div key={month} className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                              <div className="font-medium text-xs mb-1 text-gray-800 dark:text-gray-200">{month}</div>
                              <div className="text-xs text-gray-800 dark:text-gray-200">
                                <div>{getTranslation('stats.fillUps', 'Fill-ups')}: {stats.fillUps}</div>
                                <div>{getTranslation('stats.totalVolume', 'Volume')}: {stats.volume.toFixed(1)} L</div>
                                <div>{getTranslation('stats.distance', 'Distance')}: {stats.distance.toFixed(0)} km</div>
                                <div className="font-medium border-t pt-1">
                                  {getTranslation('stats.totalCosts', 'Total')}: {stats.totalCost.toFixed(2)} {currency}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Yearly Breakdown */}
                  <div className="mb-4">
                    <h4 className="font-medium text-lg mb-2 text-gray-800 dark:text-gray-200">{getTranslation('stats.yearlyBreakdown', 'Yearly Breakdown')}</h4>
                    {Object.keys(aggregateStats.yearlyStats).length === 0 ? (
                      <p className="text-gray-800 dark:text-gray-200 text-sm">{getTranslation('noData')}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(aggregateStats.yearlyStats)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([year, stats]) => (
                            <div key={year} className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 transition-colors">
                              <div className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">{year}</div>
                              <div className="text-sm grid grid-cols-2 gap-2 text-gray-800 dark:text-gray-200">
                                <div>{getTranslation('stats.fillUps', 'Fill-ups')}: {stats.fillUps}</div>
                                <div>{getTranslation('stats.totalVolume', 'Volume')}: {stats.volume.toFixed(1)} L</div>
                                <div>{getTranslation('stats.distance', 'Distance')}: {stats.distance.toFixed(0)} km</div>
                                <div>{getTranslation('stats.fuelCost', 'Fuel')}: {stats.fuelCost.toFixed(2)} {currency}</div>
                                <div>{getTranslation('stats.expenseCost', 'Expenses')}: {stats.expenseCost.toFixed(2)} {currency}</div>
                                <div>{getTranslation('stats.incomeCost', 'Income')}: {stats.incomeCost.toFixed(2)} {currency}</div>
                                <div className="font-medium border-t pt-1 col-span-2">
                                  {getTranslation('stats.totalCosts', 'Total')}: {stats.totalCost.toFixed(2)} {currency}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Charts Section */}
            {(() => {
              const chartData = generateChartData();
              const currency = entries.length > 0 ? entries[0].currency : currencies[0];
              const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ffff00'];

              return (
                <div className="mb-6 p-4 rounded-lg border">
                  <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-gray-200">{getTranslation('stats.charts', 'Data Visualization')}</h3>

                  {chartData.monthlyTrends.length === 0 ? (
                    <p className="text-gray-800 dark:text-gray-200 text-center py-8">{getTranslation('stats.noDataForCharts', 'No data available for charts. Add some fuel entries to see visualizations.')}</p>
                  ) : (
                    <div className="space-y-6">

                      {/* Monthly Cost Trends */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                        <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">{getTranslation('stats.monthlyCostTrends', 'Monthly Cost Trends')}</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={chartData.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: any, name: string) => [
                              `${Number(value).toFixed(2)} ${currency}`,
                              name === 'totalCost' ? 'Total Cost' : name === 'fuelCost' ? 'Fuel Cost' : name === 'expenseCost' ? 'Other Expenses' : 'Income'
                            ]} />
                            <Legend />
                            <Area type="monotone" dataKey="fuelCost" stackId="1" stroke="#8884d8" fill="#8884d8" name="Fuel Cost" />
                            <Area type="monotone" dataKey="expenseCost" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Other Expenses" />
                            <Area type="monotone" dataKey="incomeCost" stackId="1" stroke="#ffc658" fill="#ffc658" name="Income" />
                            <Line type="monotone" dataKey="totalCost" stroke="#ff7300" strokeWidth={3} dot={{ r: 4 }} name="Total Cost" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Monthly Distance and Volume */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                        <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">{getTranslation('stats.monthlyDistanceVolume', 'Monthly Distance & Volume')}</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value: any, name: string) => [
                              name === 'distance' ? `${Number(value).toFixed(0)} km` : `${Number(value).toFixed(1)} L`,
                              name === 'distance' ? 'Distance' : 'Volume'
                            ]} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="distance" fill="#8884d8" name="Distance (km)" />
                            <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" name="Volume (L)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Fuel Price Trends by Currency */}
                      {Object.keys(chartData.fuelPricesByCurrency).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">
                            {getTranslation('stats.fuelPriceTrends', 'Fuel Price Trends')} - {getTranslation('stats.byCurrency', 'By Currency')}
                          </h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value: any, name: string) => {
                                const currency = name.split(' - ')[1];
                                return [`${Number(value).toFixed(2)} ${currency}/L`, 'Price per Liter'];
                              }} />
                              <Legend />
                              {Object.entries(chartData.fuelPricesByCurrency).map(([currency, prices], index) => {
                                const color = colors[index % colors.length];
                                return (
                                  <Line
                                    key={currency}
                                    type="monotone"
                                    dataKey="pricePerLiter"
                                    data={prices}
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name={`Price per Liter - ${currency}`}
                                  />
                                );
                              })}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Individual Currency Fuel Price Trends */}
                      {Object.keys(chartData.fuelPricesByCurrency).length > 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {Object.entries(chartData.fuelPricesByCurrency).map(([currency, prices]) => (
                            <div key={currency} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                              <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">
                                {getTranslation('stats.fuelPriceTrends', 'Fuel Price Trends')} - {getCurrencyName(currency)} ({currency})
                              </h4>
                              <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={prices}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)} ${currency}/L`, 'Price per Liter']} />
                                  <Line
                                    type="monotone"
                                    dataKey="pricePerLiter"
                                    stroke="#ff7300"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name={`Price per Liter (${currency})`}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <div>Min: {Math.min(...prices.map(p => p.pricePerLiter)).toFixed(2)} {currency}/L</div>
                                <div>Max: {Math.max(...prices.map(p => p.pricePerLiter)).toFixed(2)} {currency}/L</div>
                                <div>Avg: {(prices.reduce((sum, p) => sum + p.pricePerLiter, 0) / prices.length).toFixed(2)} {currency}/L</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Vehicle Comparison */}
                      {chartData.carComparison.length > 1 && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">{getTranslation('stats.vehicleComparison', 'Vehicle Comparison')}</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Consumption Comparison */}
                            <div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{getTranslation('stats.avgConsumption', 'Average Consumption')}</h5>
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.carComparison}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip formatter={(value: any) => [
                                    `${Number(value).toFixed(2)} ${getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}`,
                                    'Avg Consumption'
                                  ]} />
                                  <Bar dataKey="avgConsumption" fill="#8884d8" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Total Distance Comparison */}
                            <div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{getTranslation('stats.totalDistance', 'Total Distance')}</h5>
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.carComparison}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip formatter={(value: any) => [`${Number(value).toFixed(0)} km`, 'Total Distance']} />
                                  <Bar dataKey="totalDistance" fill="#82ca9d" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cost Distribution Pie Chart */}
                      {(() => {
                        const aggregateStats = calculateAggregateStats();
                        const pieData = [
                          { name: 'Fuel Costs', value: Number(aggregateStats.totalFuelCosts), color: '#8884d8' },
                          { name: 'Other Expenses', value: Number(aggregateStats.totalExpenseCosts), color: '#82ca9d' },
                          { name: 'Income', value: Number(aggregateStats.totalIncomeCosts), color: '#ffc658' }
                        ].filter(item => item.value > 0);

                        return pieData.length > 0 ? (
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                            <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">{getTranslation('stats.costDistribution', 'Cost Distribution')}</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }: { name: string; percent?: number }) => 
                                    percent !== undefined ? `${name} ${(percent * 100).toFixed(1)}%` : name
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value.toFixed(2)} ${currency}`, 'Amount']} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : null;
                      })()}

                      {/* Consumption Trends by Vehicle */}
                      {Object.keys(chartData.consumptionTrends).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">{getTranslation('consumptionTrendsByVehicle', 'Consumption Trends by Vehicle')}</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value: any) => [
                                `${Number(value).toFixed(2)} ${getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}`,
                                'Consumption'
                              ]} />
                              <Legend />
                              {Object.entries(chartData.consumptionTrends).map(([carName, trends], index) => {
                                const avgMonthlyData = aggregateMonthlyConsumption(trends, carName);

                                return (
                                  <Line
                                    key={carName}
                                    type="monotone"
                                    dataKey="consumption"
                                    data={avgMonthlyData}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name={carName}
                                  />
                                );
                              })}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Monthly Fill-ups and Cost per KM by Currency */}
                      {Object.keys(chartData.monthlyTrendsByCurrency).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-colors">
                          <h4 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">
                            {getTranslation('stats.monthlyFillUpsAndCostPerKm', 'Monthly Fill-ups & Cost per KM')} - {getTranslation('stats.byCurrency', 'By Currency')}
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {Object.entries(chartData.monthlyTrendsByCurrency).map(([currency, monthlyData]) => (
                              <div key={currency} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 transition-colors">
                                <h5 className="font-medium text-base mb-2 text-gray-800 dark:text-gray-200">
                                  {getCurrencyName(currency)} ({currency})
                                </h5>
                                <ResponsiveContainer width="100%" height={250}>
                                  <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip formatter={(value: any, name: string) => [
                                      name === 'fillUps' ? `${Number(value)} fill-ups` : `${Number(value).toFixed(3)} ${currency}/km`,
                                      name === 'fillUps' ? 'Fill-ups' : 'Cost per KM'
                                    ]} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="fillUps" fill="#ffc658" name="Fill-ups" />
                                    <Bar yAxisId="right" dataKey="costPerKm" fill="#ff7300" name="Cost per KM" />
                                  </BarChart>
                                </ResponsiveContainer>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div>Total Fill-ups: {monthlyData.reduce((sum, month) => sum + month.fillUps, 0)}</div>
                                  <div>Avg Cost per KM: {(monthlyData.reduce((sum, month) => sum + month.costPerKm, 0) / monthlyData.length).toFixed(3)} {currency}/km</div>
                                  <div>Total Distance: {monthlyData.reduce((sum, month) => sum + month.distance, 0).toFixed(0)} km</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })()}

            {/* Individual Car Statistics */}
            {cars.map((car, index) => {
              const carId = getObjectId(car as unknown as Record<string, unknown>);
              const { avgConsumption, avgCost, totalDistance } = calculateStats(carId);
              const totalCost = calculateTotalCosts(carId);
              const monthlyCosts = calculateMonthlyCosts(carId);
              const yearlyCosts = calculateYearlyCosts(carId);
              const categoryCosts = calculateCategoryCosts(carId);
              const currency = entries.find((entry) => matchesCarId(entry.carId, carId))?.currency ||
                expenses.find((expense) => matchesCarId(expense.carId, carId))?.currency ||
                incomes.find((income) => matchesCarId(income.carId, carId))?.currency ||
                currencies[0];

              return (
                <div key={`stats-car-${carId || index}`} className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg text-sm border dark:border-gray-600 transition-colors">
                  <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200 mb-2">{car.name}</h3>

                  {/* Overall Statistics */}
                  <div className="mb-4 border-b pb-2">
                    <h4 className="font-medium text-base text-gray-800 dark:text-gray-200 mb-1">{getTranslation('stats.overallStats', 'Overall Statistics')}</h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {getTranslation('stats.avgConsumption')}: {avgConsumption !== null ?
                        `${avgConsumption} ${getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}` :
                        getTranslation('noData')}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {getTranslation('stats.avgCost')}: {avgCost !== null ?
                        `${avgCost} ${currency}${getTranslation(fuelConsumptionUnit.includes('km') ? 'units.consumption.perKm' : 'units.consumption.perMile')}` :
                        getTranslation('noData')}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">{getTranslation('stats.totalCost')}: {totalCost} {currency}</p>
                    <p className="text-gray-800 dark:text-gray-200">{getTranslation('stats.totalDistance', 'Total Distance')}: {totalDistance} km</p>
                  </div>

                  {/* Monthly Costs */}
                  <div className="mb-4 border-b pb-2">
                    <h4 className="font-medium text-base text-gray-800 dark:text-gray-200 mb-1">{getTranslation('stats.monthlyCosts', 'Monthly Costs')}</h4>
                    {Object.keys(monthlyCosts).length === 0 ? (
                      <p className="text-gray-800 dark:text-gray-200">{getTranslation('noData')}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {Object.entries(monthlyCosts)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([month, costs]) => (
                            <div key={month} className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                              <div className="font-medium text-xs mb-1 text-gray-800 dark:text-gray-200">{month}</div>
                              <div className="text-xs text-gray-800 dark:text-gray-200">
                                <div>{getTranslation('common.fuel', 'Fuel')}: {costs.fuel} {currency}</div>
                                <div>{getTranslation('common.expenses', 'Expenses')}: {costs.expenses} {currency}</div>
                                <div>{getTranslation('common.income', 'Income')}: {costs.incomes} {currency}</div>
                                <div>{getTranslation('distance', 'Distance')}: {costs.totalDistance.toFixed(0)} km</div>
                                <div className="font-medium border-t pt-1">
                                  {getTranslation('common.total', 'Total')}: {costs.total} {currency}
                                </div>
                                {costs.avgConsumption !== null && (
                                  <div className="text-blue-600 mt-1">
                                    {getTranslation('stats.avgConsumption')}: {costs.avgConsumption} {getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}
                                  </div>
                                )}
                                {costs.avgCostPerDistance !== null && (
                                  <div className="text-green-600">
                                    {getTranslation('stats.avgCost')}: {costs.avgCostPerDistance} {currency}{getTranslation(fuelConsumptionUnit.includes('km') ? 'units.consumption.perKm' : 'units.consumption.perMile')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Yearly Costs */}
                  <div className="mb-4 border-b pb-2">
                    <h4 className="font-medium text-base text-gray-800 dark:text-gray-200 mb-1">{getTranslation('stats.yearlyCosts', 'Yearly Costs')}</h4>
                    {Object.keys(yearlyCosts).length === 0 ? (
                      <p className="text-gray-800 dark:text-gray-200">{getTranslation('noData')}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(yearlyCosts)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([year, costs]) => (
                            <div key={year} className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                              <div className="font-medium text-sm mb-1 text-gray-800 dark:text-gray-200">{year}</div>
                              <div className="text-xs text-gray-800 dark:text-gray-200">
                                <div>{getTranslation('common.fuel', 'Fuel')}: {costs.fuel} {currency}</div>
                                <div>{getTranslation('common.expenses', 'Expenses')}: {costs.expenses} {currency}</div>
                                <div>{getTranslation('common.income', 'Income')}: {costs.incomes} {currency}</div>
                                <div>{getTranslation('distance', 'Distance')}: {costs.totalDistance.toFixed(0)} km</div>
                                <div className="font-medium border-t pt-1">
                                  {getTranslation('common.total', 'Total')}: {costs.total} {currency}
                                </div>
                                {costs.avgConsumption !== null && (
                                  <div className="text-blue-600 mt-1">
                                    {getTranslation('stats.avgConsumption')}: {costs.avgConsumption} {getTranslation(consumptionUnitTranslations[fuelConsumptionUnit])}
                                  </div>
                                )}
                                {costs.avgCostPerDistance !== null && (
                                  <div className="text-green-600">
                                    {getTranslation('stats.avgCost')}: {costs.avgCostPerDistance} {currency}{getTranslation(fuelConsumptionUnit.includes('km') ? 'units.consumption.perKm' : 'units.consumption.perMile')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Category Breakdown */}
                  <div className="mb-4 ">
                    <h4 className="font-medium text-base text-gray-800 dark:text-gray-200 mb-1">{getTranslation('stats.categoryBreakdown', 'Category Breakdown')}</h4>
                    {Object.keys(categoryCosts).length === 0 ? (
                      <p className="text-gray-800 dark:text-gray-200">{getTranslation('noData')}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(categoryCosts)
                          .sort(([, a], [, b]) => b - a)
                          .map(([category, cost]) => (
                            <div key={category} className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                              <div className="font-medium text-xs text-gray-800 dark:text-gray-200">{category}</div>
                              <div className="text-sm text-gray-800 dark:text-gray-200">{cost} {currency}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Currency-specific Breakdown for this car */}
                  {(() => {
                    const carFuelEntries = entries.filter((entry) => matchesCarId(entry.carId, carId));
                    const carExpenseEntries = expenses.filter((expense) => matchesCarId(expense.carId, carId));
                    const carIncomeEntries = incomes.filter((income) => matchesCarId(income.carId, carId));

                    const carCurrencyBreakdown = calculateCurrencyStats(carFuelEntries, carExpenseEntries, carIncomeEntries);

                    if (carCurrencyBreakdown.byCurrency.length === 0) return null;

                    return (
                      <div className="mb-4">
                        <h4 className="font-medium text-base text-gray-800 dark:text-gray-200 mb-1">
                          {getTranslation('stats.currencyBreakdown', 'Costs by Currency')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {carCurrencyBreakdown.byCurrency.map((currencyStat) => {
                            const costPerDistanceData = calculateCostPerDistance(carFuelEntries, currencyStat.currency);

                            return (
                              <div key={currencyStat.currency} className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-xs text-gray-800 dark:text-gray-200">
                                    {getCurrencyName(currencyStat.currency)} ({currencyStat.currency})
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {currencyStat.entryCount} {getTranslation('stats.entries', 'entries')}
                                  </div>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">{getTranslation('stats.fuelCosts', 'Fuel')}:</span>
                                    <span className="font-medium">{formatCurrency(currencyStat.totalFuelCost, currencyStat.currency)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">{getTranslation('stats.expenseCosts', 'Expenses')}:</span>
                                    <span className="font-medium">{formatCurrency(currencyStat.totalExpenseCost, currencyStat.currency)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">{getTranslation('stats.incomeCosts', 'Income')}:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(currencyStat.totalIncome, currencyStat.currency)}</span>
                                  </div>
                                  <div className="border-t pt-1 flex justify-between">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{getTranslation('stats.netCost', 'Net Cost')}:</span>
                                    <span className={`font-bold ${currencyStat.netCost >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatCurrency(Math.abs(currencyStat.netCost), currencyStat.currency)}
                                      {currencyStat.netCost >= 0 ? ' (Cost)' : ' (Profit)'}
                                    </span>
                                  </div>
                                  {costPerDistanceData.costPerDistance !== null && (
                                    <div className="flex justify-between text-blue-600">
                                      <span>{getTranslation('stats.avgCostPerKm', 'Cost/km')}:</span>
                                      <span className="font-medium">{formatCurrency(costPerDistanceData.costPerDistance, currencyStat.currency)}</span>
                                    </div>
                                  )}
                                  {costPerDistanceData.totalDistance > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                      <span>{getTranslation('stats.totalDistance', 'Distance')}:</span>
                                      <span>{costPerDistanceData.totalDistance.toFixed(0)} km</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {carCurrencyBreakdown.byCurrency.length > 1 && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                            <div className="text-gray-600 dark:text-gray-300">
                              {getTranslation('stats.totalInBaseCurrency', 'Total in USD')}: {formatCurrency(carCurrencyBreakdown.totalInBaseCurrency, 'USD')}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Financial Analysis Section has been moved to dedicated page */}
          </>
        )}
      </div>
    </div>
  );
}
