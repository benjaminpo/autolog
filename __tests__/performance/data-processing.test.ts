// Performance tests for data processing functions

describe('Performance Tests - Data Processing', () => {
  // Generate large test datasets
  const generateLargeDataset = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: `item_${i}`,
      timestamp: new Date(Date.now() + i * 1000),
      value: Math.random() * 1000,
      category: ['fuel', 'maintenance', 'insurance', 'parking'][i % 4],
      amount: Math.random() * 500,
      description: `Test item ${i}`,
      vehicle: `vehicle_${i % 10}`,
      odometer: 10000 + i * 50,
    }));
  };

  const generateFuelEntries = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: `fuel_${i}`,
      date: new Date(Date.now() + i * 86400000), // One day apart
      amount: 50 + Math.random() * 20,
      pricePerLiter: 1.20 + Math.random() * 0.40,
      odometer: 10000 + i * 300,
      fuelType: ['gasoline', 'diesel', 'electric'][i % 3],
      station: `Station ${i % 20}`,
      vehicleId: `vehicle_${i % 5}`,
    }));
  };

  describe('Array Processing Performance', () => {
    it('should filter large arrays efficiently', () => {
      const largeDataset = generateLargeDataset(10000);
      
      const startTime = performance.now();
      const filtered = largeDataset.filter(item => item.category === 'fuel');
      const endTime = performance.now();
      
      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should sort large arrays efficiently', () => {
      const largeDataset = generateLargeDataset(10000);
      
      const startTime = performance.now();
      const sorted = [...largeDataset].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const endTime = performance.now();
      
      expect(sorted[0].timestamp.getTime()).toBeLessThanOrEqual(sorted[sorted.length - 1].timestamp.getTime());
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });

    it('should group large arrays efficiently', () => {
      const largeDataset = generateLargeDataset(10000);
      
      const startTime = performance.now();
      const grouped = largeDataset.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof largeDataset>);
      const endTime = performance.now();
      
      expect(Object.keys(grouped)).toHaveLength(4);
      expect(endTime - startTime).toBeLessThan(150); // Should complete in less than 150ms
    });

    it('should map large arrays efficiently', () => {
      const largeDataset = generateLargeDataset(10000);
      
      const startTime = performance.now();
      const mapped = largeDataset.map(item => ({
        ...item,
        formattedValue: `$${item.value.toFixed(2)}`,
        computedField: item.value * 1.1,
      }));
      const endTime = performance.now();
      
      expect(mapped).toHaveLength(largeDataset.length);
      expect(mapped[0].formattedValue).toMatch(/^\$\d+\.\d{2}$/);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });
  });

  describe('Statistical Calculations Performance', () => {
    it('should calculate sum of large datasets efficiently', () => {
      const largeDataset = generateLargeDataset(50000);
      
      const startTime = performance.now();
      const sum = largeDataset.reduce((acc, item) => acc + item.value, 0);
      const endTime = performance.now();
      
      expect(sum).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });

    it('should calculate average of large datasets efficiently', () => {
      const largeDataset = generateLargeDataset(50000);
      
      const startTime = performance.now();
      const sum = largeDataset.reduce((acc, item) => acc + item.value, 0);
      const average = sum / largeDataset.length;
      const endTime = performance.now();
      
      expect(average).toBeGreaterThan(0);
      expect(average).toBeLessThan(1000);
      expect(endTime - startTime).toBeLessThan(150); // Should complete in less than 150ms
    });

    it('should find min/max of large datasets efficiently', () => {
      const largeDataset = generateLargeDataset(50000);
      
      const startTime = performance.now();
      const values = largeDataset.map(item => item.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const endTime = performance.now();
      
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeLessThanOrEqual(1000);
      expect(min).toBeLessThan(max);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });

    it('should calculate standard deviation efficiently', () => {
      const dataset = generateLargeDataset(10000);
      const values = dataset.map(item => item.value);
      
      const startTime = performance.now();
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const endTime = performance.now();
      
      expect(stdDev).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });
  });

  describe('Date Processing Performance', () => {
    it('should process date filtering efficiently', () => {
      const largeDataset = generateLargeDataset(20000);
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();
      
      const startTime = performance.now();
      const filtered = largeDataset.filter(item => 
        item.timestamp >= startDate && item.timestamp <= endDate
      );
      const endTime = performance.now();
      
      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });

    it('should group by date efficiently', () => {
      const fuelEntries = generateFuelEntries(5000);
      
      const startTime = performance.now();
      const groupedByDate = fuelEntries.reduce((acc, entry) => {
        const dateKey = entry.date.toISOString().split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(entry);
        return acc;
      }, {} as Record<string, typeof fuelEntries>);
      const endTime = performance.now();
      
      expect(Object.keys(groupedByDate).length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(300); // Should complete in less than 300ms
    });

    it('should calculate monthly aggregations efficiently', () => {
      const fuelEntries = generateFuelEntries(10000);
      
      const startTime = performance.now();
      const monthlyData = fuelEntries.reduce((acc, entry) => {
        const monthKey = `${entry.date.getFullYear()}-${(entry.date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, count: 0, avgPrice: 0 };
        }
        acc[monthKey].total += entry.amount * entry.pricePerLiter;
        acc[monthKey].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number; avgPrice: number }>);

      // Calculate average prices
      Object.keys(monthlyData).forEach(month => {
        monthlyData[month].avgPrice = monthlyData[month].total / monthlyData[month].count;
      });
      
      const endTime = performance.now();
      
      expect(Object.keys(monthlyData).length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should handle large array operations without memory leaks', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple large datasets
      for (let i = 0; i < 5; i++) {
        const dataset = generateLargeDataset(10000);
        const processed = dataset
          .filter(item => item.value > 500)
          .map(item => ({ ...item, processed: true }))
          .sort((a, b) => b.value - a.value);
        
        // Ensure the processed data is used
        expect(processed.length).toBeGreaterThanOrEqual(0);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle string operations efficiently', () => {
      const largeStringArray = Array.from({ length: 10000 }, (_, i) => 
        `This is a test string number ${i} with some additional content to make it longer`
      );
      
      const startTime = performance.now();
      const processed = largeStringArray
        .filter(str => str.includes('test'))
        .map(str => str.toUpperCase())
        .sort((a, b) => a.localeCompare(b));
      const endTime = performance.now();
      
      expect(processed.length).toBe(largeStringArray.length);
      expect(processed[0]).toMatch(/^THIS IS A TEST/);
      expect(endTime - startTime).toBeLessThan(300); // Should complete in less than 300ms
    });
  });

  describe('Complex Data Processing Scenarios', () => {
    it('should handle multi-step data processing pipeline efficiently', () => {
      const rawData = generateLargeDataset(15000);
      
      const startTime = performance.now();
      
      // Step 1: Filter and categorize
      const categorized = rawData
        .filter(item => item.value > 100)
        .map(item => ({
          ...item,
          category: item.category === 'fuel' ? 'primary' : 'secondary',
          quarter: Math.ceil((item.timestamp.getMonth() + 1) / 3)
        }));
      
      // Step 2: Group by quarter and category
      const grouped = categorized.reduce((acc, item) => {
        const key = `${item.quarter}-${item.category}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, typeof categorized>);
      
      // Step 3: Calculate aggregations
      const aggregated = Object.entries(grouped).map(([key, items]) => ({
        key,
        count: items.length,
        totalValue: items.reduce((sum, item) => sum + item.value, 0),
        avgValue: items.reduce((sum, item) => sum + item.value, 0) / items.length,
        maxValue: Math.max(...items.map(item => item.value)),
        minValue: Math.min(...items.map(item => item.value))
      }));
      
      const endTime = performance.now();
      
      expect(aggregated.length).toBeGreaterThan(0);
      expect(aggregated[0]).toHaveProperty('count');
      expect(aggregated[0]).toHaveProperty('totalValue');
      expect(aggregated[0]).toHaveProperty('avgValue');
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should handle concurrent data processing efficiently', async () => {
      const datasets = Array.from({ length: 5 }, () => generateLargeDataset(2000));
      
      const startTime = performance.now();
      
      // Process multiple datasets concurrently
      const results = await Promise.all(
        datasets.map(async (dataset, index) => {
          // Simulate async processing
          await new Promise(resolve => setTimeout(resolve, 10));
          
          return {
            index,
            filtered: dataset.filter(item => item.category === 'fuel'),
            sum: dataset.reduce((acc, item) => acc + item.value, 0),
            count: dataset.length
          };
        })
      );
      
      const endTime = performance.now();
      
      expect(results).toHaveLength(5);
      expect(results[0]).toHaveProperty('filtered');
      expect(results[0]).toHaveProperty('sum');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
}); 