import {
  convertCurrency,
  calculateCurrencyStats,
  formatCurrency,
  getCurrencyName,
  calculateCostPerDistance,
  CurrencyStats,
  CurrencyBreakdown
} from '../../app/lib/currencyUtils';

describe('Currency Utils', () => {
  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
      expect(convertCurrency(50, 'EUR', 'EUR')).toBe(50);
    });

    it('should convert between different currencies', () => {
      // USD to EUR (approximate rate: 1 USD = 0.85 EUR)
      const usdToEur = convertCurrency(100, 'USD', 'EUR');
      expect(usdToEur).toBeCloseTo(85, 0);

      // EUR to USD (approximate rate: 1 EUR = 1.18 USD)
      const eurToUsd = convertCurrency(85, 'EUR', 'USD');
      expect(eurToUsd).toBeCloseTo(100, 0);
    });

    it('should handle unknown currencies gracefully', () => {
      expect(convertCurrency(100, 'UNKNOWN', 'USD')).toBe(100);
      expect(convertCurrency(100, 'USD', 'UNKNOWN')).toBe(100);
    });
  });

  describe('calculateCurrencyStats', () => {
    const mockFuelEntries = [
      { cost: 50, currency: 'USD' },
      { cost: 75, currency: 'USD' },
      { cost: 60, currency: 'EUR' },
      { cost: 40, currency: 'EUR' }
    ];

    const mockExpenseEntries = [
      { amount: 25, currency: 'USD' },
      { amount: 30, currency: 'EUR' }
    ];

    const mockIncomeEntries = [
      { amount: 20, currency: 'USD' },
      { amount: 15, currency: 'EUR' }
    ];

    it('should calculate stats for each currency', () => {
      const result = calculateCurrencyStats(mockFuelEntries, mockExpenseEntries, mockIncomeEntries);

      expect(result.byCurrency).toHaveLength(2);
      expect(result.baseCurrency).toBe('USD');

      const usdStats = result.byCurrency.find(s => s.currency === 'USD');
      const eurStats = result.byCurrency.find(s => s.currency === 'EUR');

      expect(usdStats).toBeDefined();
      expect(eurStats).toBeDefined();

      if (usdStats) {
        expect(usdStats.totalFuelCost).toBe(125); // 50 + 75
        expect(usdStats.totalExpenseCost).toBe(25);
        expect(usdStats.totalIncome).toBe(20);
        expect(usdStats.netCost).toBe(130); // 125 + 25 - 20
        expect(usdStats.entryCount).toBe(4); // 2 fuel + 1 expense + 1 income
      }

      if (eurStats) {
        expect(eurStats.totalFuelCost).toBe(100); // 60 + 40
        expect(eurStats.totalExpenseCost).toBe(30);
        expect(eurStats.totalIncome).toBe(15);
        expect(eurStats.netCost).toBe(115); // 100 + 30 - 15
        expect(eurStats.entryCount).toBe(4); // 2 fuel + 1 expense + 1 income (all entries are counted)
      }
    });

    it('should handle empty entries', () => {
      const result = calculateCurrencyStats([], [], []);
      expect(result.byCurrency).toHaveLength(0);
      expect(result.totalInBaseCurrency).toBe(0);
    });

    it('should filter out currencies with no entries', () => {
      const result = calculateCurrencyStats(
        [{ cost: 100, currency: 'USD' }],
        [],
        []
      );

      expect(result.byCurrency).toHaveLength(1);
      expect(result.byCurrency[0].currency).toBe('USD');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(123.45, 'USD')).toBe('$123.45');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
      expect(formatCurrency(-50.25, 'USD')).toBe('-$50.25');
    });

    it('should format EUR correctly', () => {
      expect(formatCurrency(123.45, 'EUR')).toContain('123.45');
      expect(formatCurrency(0, 'EUR')).toContain('0.00');
    });

    it('should handle unknown currencies gracefully', () => {
      expect(formatCurrency(123.45, 'UNKNOWN')).toBe('UNKNOWN 123.45');
    });
  });

  describe('getCurrencyName', () => {
    it('should return correct currency names', () => {
      expect(getCurrencyName('USD')).toBe('US Dollar');
      expect(getCurrencyName('EUR')).toBe('Euro');
      expect(getCurrencyName('GBP')).toBe('British Pound');
      expect(getCurrencyName('JPY')).toBe('Japanese Yen');
    });

    it('should return code for unknown currencies', () => {
      expect(getCurrencyName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('calculateCostPerDistance', () => {
    const mockFuelEntriesUSD = [
      {
        cost: 50,
        currency: 'USD',
        mileage: 1000,
        distanceUnit: 'km',
        date: '2024-01-01'
      },
      {
        cost: 75,
        currency: 'USD',
        mileage: 1200,
        distanceUnit: 'km',
        date: '2024-01-02'
      }
    ];

    const mockFuelEntriesEUR = [
      {
        cost: 60,
        currency: 'EUR',
        mileage: 1500,
        distanceUnit: 'km',
        date: '2024-01-03'
      },
      {
        cost: 40,
        currency: 'EUR',
        mileage: 1700,
        distanceUnit: 'km',
        date: '2024-01-04'
      }
    ];

    it('should calculate cost per distance for USD', () => {
      const result = calculateCostPerDistance(mockFuelEntriesUSD, 'USD');

      expect(result.totalCost).toBe(75); // Only the second entry cost
      expect(result.totalDistance).toBe(200); // 1200 - 1000
      expect(result.costPerDistance).toBe(0.375); // 75 / 200
    });

    it('should calculate cost per distance for EUR', () => {
      const result = calculateCostPerDistance(mockFuelEntriesEUR, 'EUR');

      expect(result.totalCost).toBe(40); // Only the second entry cost
      expect(result.totalDistance).toBe(200); // 1700 - 1500
      expect(result.costPerDistance).toBe(0.2); // 40 / 200
    });

    it('should handle insufficient entries', () => {
      const result = calculateCostPerDistance([mockFuelEntriesUSD[0]], 'USD');
      expect(result.totalCost).toBe(0);
      expect(result.totalDistance).toBe(0);
      expect(result.costPerDistance).toBeNull();
    });

    it('should handle invalid data', () => {
      const invalidEntries = [
        {
          cost: 'invalid',
          currency: 'USD',
          mileage: 'invalid',
          distanceUnit: 'km',
          date: '2024-01-01'
        },
        {
          cost: 50,
          currency: 'USD',
          mileage: 1000,
          distanceUnit: 'km',
          date: '2024-01-02'
        }
      ];

      const result = calculateCostPerDistance(invalidEntries, 'USD');
      expect(result.totalCost).toBe(0);
      expect(result.totalDistance).toBe(0);
      expect(result.costPerDistance).toBeNull();
    });
  });

  describe('Fuel Price Trends by Currency', () => {
    const mockFuelEntries = [
      {
        cost: 50,
        currency: 'USD',
        volume: 20,
        volumeUnit: 'liters',
        date: '2024-01-01'
      },
      {
        cost: 60,
        currency: 'USD',
        volume: 25,
        volumeUnit: 'liters',
        date: '2024-01-02'
      },
      {
        cost: 45,
        currency: 'EUR',
        volume: 18,
        volumeUnit: 'liters',
        date: '2024-01-03'
      },
      {
        cost: 55,
        currency: 'EUR',
        volume: 22,
        volumeUnit: 'liters',
        date: '2024-01-04'
      }
    ];

    it('should group fuel prices by currency', () => {
      const fuelPricesByCurrency: { [currency: string]: any[] } = {};
      
      mockFuelEntries.forEach(entry => {
        const volume = entry.volumeUnit === 'liters' ? Number(entry.volume) : Number(entry.volume) * 3.78541;
        const pricePerLiter = volume > 0 ? Number(entry.cost) / volume : 0;
        
        if (pricePerLiter > 0) {
          const priceData = {
            date: entry.date,
            pricePerLiter,
            cost: Number(entry.cost),
            volume,
            currency: entry.currency
          };

          if (!fuelPricesByCurrency[entry.currency]) {
            fuelPricesByCurrency[entry.currency] = [];
          }
          fuelPricesByCurrency[entry.currency].push(priceData);
        }
      });

      expect(Object.keys(fuelPricesByCurrency)).toHaveLength(2);
      expect(fuelPricesByCurrency['USD']).toHaveLength(2);
      expect(fuelPricesByCurrency['EUR']).toHaveLength(2);

      // Check USD prices
      const usdPrices = fuelPricesByCurrency['USD'];
      expect(usdPrices[0].pricePerLiter).toBe(2.5); // 50 / 20
      expect(usdPrices[1].pricePerLiter).toBe(2.4); // 60 / 25

      // Check EUR prices
      const eurPrices = fuelPricesByCurrency['EUR'];
      expect(eurPrices[0].pricePerLiter).toBe(2.5); // 45 / 18
      expect(eurPrices[1].pricePerLiter).toBe(2.5); // 55 / 22
    });

    it('should calculate price statistics correctly', () => {
      const usdPrices = [2.5, 2.4, 2.6];
      const eurPrices = [2.5, 2.5, 2.4];

      const usdMin = Math.min(...usdPrices);
      const usdMax = Math.max(...usdPrices);
      const usdAvg = usdPrices.reduce((sum, p) => sum + p, 0) / usdPrices.length;

      const eurMin = Math.min(...eurPrices);
      const eurMax = Math.max(...eurPrices);
      const eurAvg = eurPrices.reduce((sum, p) => sum + p, 0) / eurPrices.length;

      expect(usdMin).toBe(2.4);
      expect(usdMax).toBe(2.6);
      expect(usdAvg).toBeCloseTo(2.5, 1);

      expect(eurMin).toBe(2.4);
      expect(eurMax).toBe(2.5);
      expect(eurAvg).toBeCloseTo(2.47, 1);
    });
  });

  describe('Monthly Trends by Currency', () => {
    const mockFuelEntries = [
      {
        cost: 50,
        currency: 'USD',
        volume: 20,
        volumeUnit: 'liters',
        date: '2024-01-01',
        mileage: 1000,
        distanceUnit: 'km'
      },
      {
        cost: 60,
        currency: 'USD',
        volume: 25,
        volumeUnit: 'liters',
        date: '2024-01-15',
        mileage: 1200,
        distanceUnit: 'km'
      },
      {
        cost: 45,
        currency: 'EUR',
        volume: 18,
        volumeUnit: 'liters',
        date: '2024-01-10',
        mileage: 1100,
        distanceUnit: 'km'
      },
      {
        cost: 55,
        currency: 'EUR',
        volume: 22,
        volumeUnit: 'liters',
        date: '2024-01-25',
        mileage: 1300,
        distanceUnit: 'km'
      }
    ];

    const mockExpenses = [
      {
        amount: 30,
        currency: 'USD',
        date: '2024-01-05'
      },
      {
        amount: 25,
        currency: 'EUR',
        date: '2024-01-20'
      }
    ];

    it('should group monthly data by currency', () => {
      const monthlyTrendsByCurrency: { [currency: string]: any[] } = {};
      
      // Group entries by currency
      const entriesByCurrency: { [currency: string]: any[] } = {};
      const expensesByCurrency: { [currency: string]: any[] } = {};
      
      mockFuelEntries.forEach(entry => {
        if (!entriesByCurrency[entry.currency]) {
          entriesByCurrency[entry.currency] = [];
        }
        entriesByCurrency[entry.currency].push(entry);
      });
      
      mockExpenses.forEach(expense => {
        if (!expensesByCurrency[expense.currency]) {
          expensesByCurrency[expense.currency] = [];
        }
        expensesByCurrency[expense.currency].push(expense);
      });
      
      // Calculate monthly trends for each currency
      Object.keys(entriesByCurrency).forEach(currency => {
        const currencyEntries = entriesByCurrency[currency];
        const currencyExpenses = expensesByCurrency[currency] || [];
        
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
              fillUps: 0,
              distance: 0
            };
          }
          
          monthlyData[month].fuelCost += Number(entry.cost);
          monthlyData[month].totalCost += Number(entry.cost);
          monthlyData[month].fillUps += 1;
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
              fillUps: 0,
              distance: 0
            };
          }
          
          monthlyData[month].expenseCost += Number(expense.amount);
          monthlyData[month].totalCost += Number(expense.amount);
        });
        
        // Convert to array and sort by month
        monthlyTrendsByCurrency[currency] = Object.values(monthlyData)
          .sort((a, b) => a.month.localeCompare(b.month));
      });

      expect(Object.keys(monthlyTrendsByCurrency)).toHaveLength(2);
      expect(monthlyTrendsByCurrency['USD']).toHaveLength(1); // All USD entries are in 2024-01
      expect(monthlyTrendsByCurrency['EUR']).toHaveLength(1); // All EUR entries are in 2024-01

      // Check USD monthly data
      const usdMonthly = monthlyTrendsByCurrency['USD'][0];
      expect(usdMonthly.fuelCost).toBe(110); // 50 + 60
      expect(usdMonthly.expenseCost).toBe(30);
      expect(usdMonthly.totalCost).toBe(140); // 110 + 30
      expect(usdMonthly.fillUps).toBe(2);

      // Check EUR monthly data
      const eurMonthly = monthlyTrendsByCurrency['EUR'][0];
      expect(eurMonthly.fuelCost).toBe(100); // 45 + 55
      expect(eurMonthly.expenseCost).toBe(25);
      expect(eurMonthly.totalCost).toBe(125); // 100 + 25
      expect(eurMonthly.fillUps).toBe(2);
    });

    it('should calculate cost per km correctly by currency', () => {
      const monthlyData = [
        { totalCost: 140, distance: 200 }, // USD: 140 USD / 200 km = 0.7 USD/km
        { totalCost: 125, distance: 200 }  // EUR: 125 EUR / 200 km = 0.625 EUR/km
      ];

      const usdCostPerKm = monthlyData[0].distance > 0 ? monthlyData[0].totalCost / monthlyData[0].distance : 0;
      const eurCostPerKm = monthlyData[1].distance > 0 ? monthlyData[1].totalCost / monthlyData[1].distance : 0;

      expect(usdCostPerKm).toBe(0.7);
      expect(eurCostPerKm).toBe(0.625);
    });
  });
}); 

describe('Edge Cases for Currency/Country-Specific Statistics', () => {
  it('should handle missing currency gracefully', () => {
    const entries = [
      { cost: 100, currency: '', mileage: 1000, distanceUnit: 'km', date: '2024-01-01', volume: 10, volumeUnit: 'liters' },
      { cost: 50, currency: '', mileage: 1200, distanceUnit: 'km', date: '2024-01-02', volume: 5, volumeUnit: 'liters' },
    ];
    const stats = calculateCurrencyStats(entries, [], []);
    expect(stats.byCurrency.length).toBe(0);
  });

  it('should sum all costs, including zero or negative', () => {
    const entries = [
      { cost: 0, currency: 'USD', mileage: 1000, distanceUnit: 'km', date: '2024-01-01', volume: 10, volumeUnit: 'liters' },
      { cost: -10, currency: 'USD', mileage: 1200, distanceUnit: 'km', date: '2024-01-02', volume: 5, volumeUnit: 'liters' },
      { cost: 20, currency: 'USD', mileage: 1400, distanceUnit: 'km', date: '2024-01-03', volume: 8, volumeUnit: 'liters' },
    ];
    const stats = calculateCurrencyStats(entries, [], []);
    const usd = stats.byCurrency.find(s => s.currency === 'USD');
    expect(usd).toBeDefined();
    if (usd) {
      expect(usd.totalFuelCost).toBe(10); // 0 + (-10) + 20 = 10
    }
  });

  it('should handle unknown currency codes by filtering them out', () => {
    const entries = [
      { cost: 100, currency: 'XXX', mileage: 1000, distanceUnit: 'km', date: '2024-01-01', volume: 10, volumeUnit: 'liters' },
    ];
    const stats = calculateCurrencyStats(entries, [], []);
    expect(stats.byCurrency.length).toBe(0);
    expect(getCurrencyName('XXX')).toBe('XXX');
  });
}); 

describe('Statistics Calculation Additional Edge Cases', () => {
  it('should return zero stats when all values are zero', () => {
    const entries = [
      { cost: 0, currency: 'USD', mileage: 0, distanceUnit: 'km', date: '2024-01-01', volume: 0, volumeUnit: 'liters' },
      { cost: 0, currency: 'USD', mileage: 0, distanceUnit: 'km', date: '2024-01-02', volume: 0, volumeUnit: 'liters' },
    ];
    const stats = calculateCurrencyStats(entries, [], []);
    const usd = stats.byCurrency.find(s => s.currency === 'USD');
    expect(usd).toBeDefined();
    if (usd) {
      expect(usd.totalFuelCost).toBe(0);
      // totalDistance is not part of CurrencyStats in this util
    }
  });

  it('should separate stats for mixed currencies', () => {
    const entries = [
      { cost: 10, currency: 'USD', mileage: 100, distanceUnit: 'km', date: '2024-01-01', volume: 5, volumeUnit: 'liters' },
      { cost: 20, currency: 'EUR', mileage: 200, distanceUnit: 'km', date: '2024-01-02', volume: 10, volumeUnit: 'liters' },
      { cost: 30, currency: 'USD', mileage: 300, distanceUnit: 'km', date: '2024-01-03', volume: 15, volumeUnit: 'liters' },
    ];
    const stats = calculateCurrencyStats(entries, [], []);
    const usd = stats.byCurrency.find(s => s.currency === 'USD');
    const eur = stats.byCurrency.find(s => s.currency === 'EUR');
    expect(usd).toBeDefined();
    expect(eur).toBeDefined();
    if (usd) expect(usd.totalFuelCost).toBe(40);
    if (eur) expect(eur.totalFuelCost).toBe(20);
  });
}); 