import { currencies } from './vehicleData';

// Exchange rates (you can replace this with a real API call)
// These are approximate rates - in production, you'd want to use a real exchange rate API
const exchangeRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  HKD: 7.75,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  SGD: 1.35,
  NZD: 1.40,
  INR: 74.0,
  KRW: 1100.0,
  MXN: 20.0,
  BRL: 5.2,
  ZAR: 14.5,
  RUB: 75.0,
  SEK: 8.5,
  NOK: 8.8,
  DKK: 6.3
};

export interface CurrencyStats {
  currency: string;
  totalFuelCost: number;
  totalExpenseCost: number;
  totalIncome: number;
  netCost: number;
  entryCount: number;
}

export interface CurrencyBreakdown {
  byCurrency: CurrencyStats[];
  totalInBaseCurrency: number;
  baseCurrency: string;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = exchangeRates[fromCurrency] || 1.0;
  const toRate = exchangeRates[toCurrency] || 1.0;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

/**
 * Calculate statistics grouped by currency
 */
export function calculateCurrencyStats(
  fuelEntries: Array<{ cost: number | string; currency: string }>,
  expenseEntries: Array<{ amount: number | string; currency: string }>,
  incomeEntries: Array<{ amount: number | string; currency: string }>
): CurrencyBreakdown {
  const currencyMap = new Map<string, CurrencyStats>();

  // Initialize currency stats
  currencies.forEach(currency => {
    currencyMap.set(currency, {
      currency,
      totalFuelCost: 0,
      totalExpenseCost: 0,
      totalIncome: 0,
      netCost: 0,
      entryCount: 0
    });
  });

  // Process fuel entries
  fuelEntries.forEach(entry => {
    const currency = entry.currency;
    const cost = Number(entry.cost);

    if (!isNaN(cost) && currencyMap.has(currency)) {
      const stats = currencyMap.get(currency)!;
      stats.totalFuelCost += cost;
      stats.entryCount++;
    }
  });

  // Process expense entries
  expenseEntries.forEach(entry => {
    const currency = entry.currency;
    const amount = Number(entry.amount);

    if (!isNaN(amount) && currencyMap.has(currency)) {
      const stats = currencyMap.get(currency)!;
      stats.totalExpenseCost += amount;
      stats.entryCount++;
    }
  });

  // Process income entries
  incomeEntries.forEach(entry => {
    const currency = entry.currency;
    const amount = Number(entry.amount);

    if (!isNaN(amount) && currencyMap.has(currency)) {
      const stats = currencyMap.get(currency)!;
      stats.totalIncome += amount;
      stats.entryCount++;
    }
  });

  // Calculate net costs and filter out currencies with no entries
  const byCurrency: CurrencyStats[] = [];
  let totalInBaseCurrency = 0;
  const baseCurrency = 'USD';

  currencyMap.forEach((stats, currency) => {
    if (stats.entryCount > 0) {
      stats.netCost = stats.totalFuelCost + stats.totalExpenseCost - stats.totalIncome;
      byCurrency.push(stats);

      // Convert to base currency for total calculation
      totalInBaseCurrency += convertCurrency(stats.netCost, currency, baseCurrency);
    }
  });

  return {
    byCurrency: byCurrency.sort((a, b) => Math.abs(b.netCost) - Math.abs(a.netCost)),
    totalInBaseCurrency,
    baseCurrency
  };
}

/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting failed for', currency, error);
    // Fallback formatting if currency is not supported
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Get currency name from code
 */
export function getCurrencyName(code: string): string {
  const currencyNames: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    HKD: 'Hong Kong Dollar',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    SGD: 'Singapore Dollar',
    NZD: 'New Zealand Dollar',
    INR: 'Indian Rupee',
    KRW: 'South Korean Won',
    MXN: 'Mexican Peso',
    BRL: 'Brazilian Real',
    ZAR: 'South African Rand',
    RUB: 'Russian Ruble',
    SEK: 'Swedish Krona',
    NOK: 'Norwegian Krone',
    DKK: 'Danish Krone'
  };

  return currencyNames[code] || code;
}

/**
 * Calculate cost per distance for a specific currency
 */
export function calculateCostPerDistance(
  fuelEntries: Array<{ cost: number | string; currency: string; mileage: number | string; distanceUnit: string; date: string }>,
  currency: string
): { totalCost: number; totalDistance: number; costPerDistance: number | null } {
  const relevantEntries = fuelEntries.filter(entry => entry.currency === currency);

  if (relevantEntries.length < 2) {
    return { totalCost: 0, totalDistance: 0, costPerDistance: null };
  }

  const sortedEntries = relevantEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let totalCost = 0;
  let totalDistance = 0;

  for (let i = 1; i < sortedEntries.length; i++) {
    const curr = sortedEntries[i];
    const prev = sortedEntries[i - 1];

    const mileage = Number(curr.mileage);
    const prevMileage = Number(prev.mileage);
    const cost = Number(curr.cost);

    if (isNaN(mileage) || isNaN(prevMileage) || isNaN(cost)) continue;

    const distance = curr.distanceUnit === 'km' ? mileage - prevMileage : (mileage - prevMileage) * 1.60934;

    if (distance <= 0 || distance > 2000) continue;

    totalCost += cost;
    totalDistance += distance;
  }

  const costPerDistance = totalDistance > 0 ? totalCost / totalDistance : null;

  return {
    totalCost,
    totalDistance,
    costPerDistance
  };
}
