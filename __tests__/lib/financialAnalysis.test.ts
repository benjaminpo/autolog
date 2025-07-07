/**
 * Financial Analysis Utility Tests
 * Tests for financial calculations, metrics, and analysis functions
 */

describe('Financial Analysis Utils', () => {
  describe('Basic Financial Calculations', () => {
    const calculateProfit = (income: number, expenses: number): number => {
      return income - expenses;
    };

    const calculateProfitMargin = (profit: number, revenue: number): number => {
      if (revenue === 0) return 0;
      return (profit / revenue) * 100;
    };

    const calculateROI = (gain: number, cost: number): number => {
      if (cost === 0) return 0;
      return ((gain - cost) / cost) * 100;
    };

    const calculateBreakEven = (fixedCosts: number, pricePerUnit: number, variableCostPerUnit: number): number => {
      const contributionMargin = pricePerUnit - variableCostPerUnit;
      if (contributionMargin <= 0) return 0;
      return fixedCosts / contributionMargin;
    };

    it('should calculate profit correctly', () => {
      expect(calculateProfit(1000, 600)).toBe(400);
      expect(calculateProfit(500, 700)).toBe(-200);
      expect(calculateProfit(0, 0)).toBe(0);
      expect(calculateProfit(1500.50, 999.25)).toBeCloseTo(501.25, 2);
    });

    it('should calculate profit margin', () => {
      expect(calculateProfitMargin(400, 1000)).toBe(40);
      expect(calculateProfitMargin(-200, 500)).toBe(-40);
      expect(calculateProfitMargin(100, 0)).toBe(0);
      expect(calculateProfitMargin(0, 1000)).toBe(0);
    });

    it('should calculate ROI', () => {
      expect(calculateROI(1200, 1000)).toBe(20);
      expect(calculateROI(800, 1000)).toBe(-20);
      expect(calculateROI(1000, 0)).toBe(0);
      expect(calculateROI(0, 1000)).toBe(-100);
    });

    it('should calculate break-even point', () => {
      expect(calculateBreakEven(1000, 50, 30)).toBe(50);
      expect(calculateBreakEven(2000, 100, 60)).toBe(50);
      expect(calculateBreakEven(1000, 30, 30)).toBe(0); // No contribution margin
      expect(calculateBreakEven(1000, 20, 30)).toBe(0); // Negative contribution margin
    });
  });

  describe('Vehicle Cost Analysis', () => {
    interface VehicleCosts {
      fuelCosts: number;
      maintenanceCosts: number;
      insuranceCosts: number;
      depreciation: number;
      registration: number;
    }

    const calculateTotalCostOfOwnership = (costs: VehicleCosts, timeYears: number): number => {
      const annualCosts = costs.fuelCosts + costs.maintenanceCosts + costs.insuranceCosts + costs.registration;
      return (annualCosts * timeYears) + costs.depreciation;
    };

    const calculateCostPerMile = (totalCosts: number, totalMiles: number): number => {
      if (totalMiles === 0) return 0;
      return totalCosts / totalMiles;
    };

    const calculateMonthlyBudget = (annualCosts: number): number => {
      return annualCosts / 12;
    };

    const calculateDepreciation = (purchasePrice: number, currentValue: number, years: number): {
      totalDepreciation: number;
      annualDepreciation: number;
      depreciationRate: number;
    } => {
      const totalDepreciation = purchasePrice - currentValue;
      const annualDepreciation = years > 0 ? totalDepreciation / years : 0;
      const depreciationRate = purchasePrice > 0 ? (totalDepreciation / purchasePrice) * 100 : 0;

      return {
        totalDepreciation,
        annualDepreciation,
        depreciationRate
      };
    };

    it('should calculate total cost of ownership', () => {
      const costs: VehicleCosts = {
        fuelCosts: 2000,
        maintenanceCosts: 1000,
        insuranceCosts: 1200,
        depreciation: 5000,
        registration: 200
      };

      expect(calculateTotalCostOfOwnership(costs, 3)).toBe(18200);
      expect(calculateTotalCostOfOwnership(costs, 1)).toBe(9400);
      expect(calculateTotalCostOfOwnership(costs, 0)).toBe(5000);
    });

    it('should calculate cost per mile', () => {
      expect(calculateCostPerMile(5000, 10000)).toBe(0.5);
      expect(calculateCostPerMile(12000, 20000)).toBe(0.6);
      expect(calculateCostPerMile(1000, 0)).toBe(0);
      expect(calculateCostPerMile(0, 10000)).toBe(0);
    });

    it('should calculate monthly budget', () => {
      expect(calculateMonthlyBudget(12000)).toBe(1000);
      expect(calculateMonthlyBudget(3600)).toBe(300);
      expect(calculateMonthlyBudget(0)).toBe(0);
    });

    it('should calculate depreciation', () => {
      const depreciation = calculateDepreciation(25000, 15000, 5);
      expect(depreciation.totalDepreciation).toBe(10000);
      expect(depreciation.annualDepreciation).toBe(2000);
      expect(depreciation.depreciationRate).toBe(40);
    });
  });

  describe('Fuel Economy Analysis', () => {
    const calculateFuelEfficiency = (distance: number, volume: number, unit: 'mpg' | 'l100km'): number => {
      if (volume === 0) return 0;
      return unit === 'mpg' ? distance / volume : (volume / distance) * 100;
    };

    const calculateFuelCost = (distance: number, efficiency: number, fuelPrice: number, unit: 'mpg' | 'l100km'): number => {
      if (efficiency === 0) return 0;
      const fuelNeeded = unit === 'mpg' ? distance / efficiency : (distance / 100) * efficiency;
      return fuelNeeded * fuelPrice;
    };

    const compareFuelEfficiency = (
      vehicle1: { distance: number; volume: number },
      vehicle2: { distance: number; volume: number }
    ): { better: 'vehicle1' | 'vehicle2' | 'equal'; difference: number } => {
      const eff1 = vehicle1.volume > 0 ? vehicle1.distance / vehicle1.volume : 0;
      const eff2 = vehicle2.volume > 0 ? vehicle2.distance / vehicle2.volume : 0;

      if (eff1 === eff2) return { better: 'equal', difference: 0 };
      if (eff1 > eff2) return { better: 'vehicle1', difference: eff1 - eff2 };
      return { better: 'vehicle2', difference: eff2 - eff1 };
    };

    const calculateCostSavings = (
      currentMPG: number,
      newMPG: number,
      annualMiles: number,
      fuelPrice: number
    ): { annualSavings: number; monthlySavings: number } => {
      if (currentMPG === 0 || newMPG === 0) return { annualSavings: 0, monthlySavings: 0 };

      const currentFuelCost = (annualMiles / currentMPG) * fuelPrice;
      const newFuelCost = (annualMiles / newMPG) * fuelPrice;
      const annualSavings = currentFuelCost - newFuelCost;

      return {
        annualSavings,
        monthlySavings: annualSavings / 12
      };
    };

    it('should calculate fuel efficiency', () => {
      expect(calculateFuelEfficiency(300, 10, 'mpg')).toBe(30);
      expect(calculateFuelEfficiency(100, 8, 'l100km')).toBe(8);
      expect(calculateFuelEfficiency(400, 0, 'mpg')).toBe(0);
    });

    it('should calculate fuel cost', () => {
      expect(calculateFuelCost(300, 30, 3.5, 'mpg')).toBeCloseTo(35, 2);
      expect(calculateFuelCost(100, 8, 1.5, 'l100km')).toBeCloseTo(12, 2);
      expect(calculateFuelCost(100, 0, 3, 'mpg')).toBe(0);
    });

    it('should compare fuel efficiency', () => {
      const comparison = compareFuelEfficiency(
        { distance: 300, volume: 10 }, // 30 MPG
        { distance: 240, volume: 10 }  // 24 MPG
      );
      expect(comparison.better).toBe('vehicle1');
      expect(comparison.difference).toBe(6);
    });

    it('should calculate cost savings', () => {
      const savings = calculateCostSavings(20, 30, 12000, 3.5);
      expect(savings.annualSavings).toBeCloseTo(700, 2);
      expect(savings.monthlySavings).toBeCloseTo(58.33, 2);
    });
  });

  describe('Income Analysis', () => {
    interface IncomeStream {
      source: string;
      amount: number;
      frequency: 'daily' | 'weekly' | 'monthly' | 'annually';
    }

    const normalizeToAnnual = (income: IncomeStream): number => {
      const multipliers = {
        daily: 365,
        weekly: 52,
        monthly: 12,
        annually: 1
      };
      return income.amount * multipliers[income.frequency];
    };

    const calculateTotalAnnualIncome = (incomes: IncomeStream[]): number => {
      return incomes.reduce((total, income) => total + normalizeToAnnual(income), 0);
    };

    const calculateIncomePerMile = (totalIncome: number, totalMiles: number): number => {
      if (totalMiles === 0) return 0;
      return totalIncome / totalMiles;
    };

    const calculateNetIncomeAfterExpenses = (
      grossIncome: number,
      vehicleExpenses: number,
      otherExpenses: number = 0
    ): number => {
      return grossIncome - vehicleExpenses - otherExpenses;
    };

    it('should normalize income to annual amounts', () => {
      const dailyIncome: IncomeStream = { source: 'rideshare', amount: 100, frequency: 'daily' };
      const weeklyIncome: IncomeStream = { source: 'delivery', amount: 500, frequency: 'weekly' };
      const monthlyIncome: IncomeStream = { source: 'rental', amount: 1000, frequency: 'monthly' };

      expect(normalizeToAnnual(dailyIncome)).toBe(36500);
      expect(normalizeToAnnual(weeklyIncome)).toBe(26000);
      expect(normalizeToAnnual(monthlyIncome)).toBe(12000);
    });

    it('should calculate total annual income', () => {
      const incomes: IncomeStream[] = [
        { source: 'rideshare', amount: 50, frequency: 'daily' },
        { source: 'delivery', amount: 200, frequency: 'weekly' },
        { source: 'rental', amount: 500, frequency: 'monthly' }
      ];

      const total = calculateTotalAnnualIncome(incomes);
      expect(total).toBe(34650); // 18250 + 10400 + 6000
    });

    it('should calculate income per mile', () => {
      expect(calculateIncomePerMile(30000, 15000)).toBe(2);
      expect(calculateIncomePerMile(12000, 20000)).toBe(0.6);
      expect(calculateIncomePerMile(5000, 0)).toBe(0);
    });

    it('should calculate net income after expenses', () => {
      expect(calculateNetIncomeAfterExpenses(50000, 15000, 5000)).toBe(30000);
      expect(calculateNetIncomeAfterExpenses(25000, 20000)).toBe(5000);
      expect(calculateNetIncomeAfterExpenses(15000, 20000)).toBe(-5000);
    });
  });

  describe('Statistical Analysis', () => {
    const calculateStatistics = (values: number[]): {
      mean: number;
      median: number;
      mode: number[];
      standardDeviation: number;
      min: number;
      max: number;
      range: number;
    } => {
      if (values.length === 0) {
        return { mean: 0, median: 0, mode: [], standardDeviation: 0, min: 0, max: 0, range: 0 };
      }

      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      // Calculate mode
      const frequency: { [key: number]: number } = {};
      values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
      const maxFreq = Math.max(...Object.values(frequency));
      const mode = Object.keys(frequency)
        .filter(key => frequency[Number(key)] === maxFreq)
        .map(Number);

      // Calculate standard deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      return { mean, median, mode, standardDeviation, min, max, range };
    };

    const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
      if (values.length < 2) return 'stable';

      let increasing = 0;
      let decreasing = 0;

      for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1]) increasing++;
        else if (values[i] < values[i - 1]) decreasing++;
      }

      if (increasing > decreasing) return 'increasing';
      if (decreasing > increasing) return 'decreasing';
      return 'stable';
    };

    it('should calculate basic statistics', () => {
      const values = [10, 20, 30, 20, 40];
      const stats = calculateStatistics(values);

      expect(stats.mean).toBe(24);
      expect(stats.median).toBe(20);
      expect(stats.mode).toEqual([20]);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(40);
      expect(stats.range).toBe(30);
      expect(stats.standardDeviation).toBeCloseTo(10.20, 2);
    });

    it('should handle empty arrays', () => {
      const stats = calculateStatistics([]);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.mode).toEqual([]);
    });

    it('should calculate trends', () => {
      expect(calculateTrend([1, 2, 3, 4])).toBe('increasing');
      expect(calculateTrend([4, 3, 2, 1])).toBe('decreasing');
      expect(calculateTrend([2, 3, 2, 3])).toBe('increasing');
      expect(calculateTrend([5])).toBe('stable');
    });
  });

  describe('Forecasting and Projections', () => {
    const projectFutureCosts = (
      historicalData: number[],
      periodsToForecast: number,
      inflationRate: number = 0.03
    ): number[] => {
      if (historicalData.length === 0) return [];

      const lastValue = historicalData[historicalData.length - 1];
      const projections: number[] = [];

      for (let i = 1; i <= periodsToForecast; i++) {
        const projectedValue = lastValue * Math.pow(1 + inflationRate, i);
        projections.push(Number(projectedValue.toFixed(2)));
      }

      return projections;
    };

    const calculateMovingAverage = (data: number[], windowSize: number): number[] => {
      if (data.length < windowSize) return [];

      const averages: number[] = [];
      for (let i = windowSize - 1; i < data.length; i++) {
        const window = data.slice(i - windowSize + 1, i + 1);
        const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
        averages.push(Number(average.toFixed(2)));
      }

      return averages;
    };

    const calculateSeasonalAdjustment = (
      monthlyData: number[],
      targetMonth: number
    ): { baseValue: number; seasonalFactor: number; adjustedValue: number } => {
      if (monthlyData.length !== 12) {
        return { baseValue: 0, seasonalFactor: 1, adjustedValue: 0 };
      }

      const annualAverage = monthlyData.reduce((sum, val) => sum + val, 0) / 12;
      const monthValue = monthlyData[targetMonth - 1];
      const seasonalFactor = annualAverage > 0 ? monthValue / annualAverage : 1;
      const adjustedValue = monthValue / seasonalFactor;

      return {
        baseValue: Number(annualAverage.toFixed(2)),
        seasonalFactor: Number(seasonalFactor.toFixed(3)),
        adjustedValue: Number(adjustedValue.toFixed(2))
      };
    };

    it('should project future costs with inflation', () => {
      const historicalCosts = [1000, 1050, 1100];
      const projections = projectFutureCosts(historicalCosts, 3, 0.05);

      expect(projections).toHaveLength(3);
      expect(projections[0]).toBeCloseTo(1155, 0); // 1100 * 1.05
      expect(projections[1]).toBeCloseTo(1212.75, 0); // 1100 * 1.05^2
      expect(projections[2]).toBeCloseTo(1273.39, 0); // 1100 * 1.05^3
    });

    it('should calculate moving averages', () => {
      const data = [10, 15, 20, 25, 30, 35];
      const movingAvg = calculateMovingAverage(data, 3);

      expect(movingAvg).toHaveLength(4);
      expect(movingAvg[0]).toBe(15); // (10+15+20)/3
      expect(movingAvg[1]).toBe(20); // (15+20+25)/3
      expect(movingAvg[2]).toBe(25); // (20+25+30)/3
      expect(movingAvg[3]).toBe(30); // (25+30+35)/3
    });

    it('should calculate seasonal adjustments', () => {
      const monthlyData = [100, 95, 105, 110, 120, 130, 135, 125, 115, 105, 95, 90];
      const adjustment = calculateSeasonalAdjustment(monthlyData, 7); // July

      expect(adjustment.baseValue).toBeCloseTo(110.42, 2);
      expect(adjustment.seasonalFactor).toBeCloseTo(1.223, 3);
      expect(adjustment.adjustedValue).toBeCloseTo(110.42, 2);
    });

    it('should handle edge cases', () => {
      expect(projectFutureCosts([], 3)).toEqual([]);
      expect(calculateMovingAverage([1, 2], 3)).toEqual([]);
      
      const emptyAdjustment = calculateSeasonalAdjustment([100], 1);
      expect(emptyAdjustment.seasonalFactor).toBe(1);
    });
  });
}); 