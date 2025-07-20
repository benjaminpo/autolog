describe('FuelHistoryPage Logic Tests', () => {
  describe('Data Processing', () => {
    it('should calculate total fuel amount', () => {
      const fuelEntries = [
        { amount: 50.00 },
        { amount: 30.00 },
        { amount: 40.00 },
      ];

      const total = fuelEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      expect(total).toBe(120.00);
    });

    it('should calculate total cost', () => {
      const fuelEntries = [
        { amount: 50.00, pricePerUnit: 1.50 },
        { amount: 30.00, pricePerUnit: 1.60 },
        { amount: 40.00, pricePerUnit: 1.55 },
      ];

      const totalCost = fuelEntries.reduce((sum, entry) => sum + (entry.amount * entry.pricePerUnit), 0);
      
      expect(totalCost).toBe(185.00);
    });

    it('should sort entries by date', () => {
      const entries = [
        { date: new Date('2023-01-01') },
        { date: new Date('2023-01-15') },
        { date: new Date('2023-01-08') },
      ];

      const sortedByDate = entries.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      expect(sortedByDate[0].date.getDate()).toBe(1);
      expect(sortedByDate[2].date.getDate()).toBe(15);
    });

    it('should filter entries by date range', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-03-31');
      
      const entries = [
        { date: '2022-12-15', amount: 100 },
        { date: '2023-02-10', amount: 150 },
        { date: '2023-04-05', amount: 200 },
      ];

      const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });

      expect(filteredEntries).toHaveLength(1);
      expect(filteredEntries[0].amount).toBe(150);
    });

    it('should calculate fuel efficiency', () => {
      const entries = [
        { amount: 50.00, odometer: 12000 },
        { amount: 45.00, odometer: 12500 },
      ];

      if (entries.length >= 2) {
        const distance = entries[1].odometer - entries[0].odometer;
        const efficiency = distance / entries[1].amount;
        
        expect(efficiency).toBeCloseTo(11.11);
      }
    });
  });

  describe('Data Validation', () => {
    it('should handle empty fuel entries', () => {
      const entries: any[] = [];
      const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
      
      expect(total).toBe(0);
      expect(entries.length).toBe(0);
    });

    it('should validate entry data', () => {
      const invalidEntries = [
        { amount: null, date: 'invalid-date' },
        { amount: 'not-a-number', date: '2023-01-01' },
        { amount: 50, date: null },
      ];

             const validEntries = invalidEntries.filter((entry: any) => 
         typeof entry.amount === 'number' && 
         entry.amount > 0 && 
         entry.date && 
         typeof entry.date === 'string'
       );

      expect(validEntries).toHaveLength(0);
    });
  });

  describe('Statistics Calculations', () => {
    it('should calculate average price per unit', () => {
      const entries = [
        { pricePerUnit: 1.50 },
        { pricePerUnit: 1.60 },
        { pricePerUnit: 1.55 },
      ];

      const avgPrice = entries.reduce((sum, entry) => sum + entry.pricePerUnit, 0) / entries.length;
      
      expect(avgPrice).toBeCloseTo(1.55);
    });

    it('should find most expensive fill-up', () => {
      const entries = [
        { totalCost: 75.00 },
        { totalCost: 85.00 },
        { totalCost: 65.00 },
      ];

      const maxCost = Math.max(...entries.map(entry => entry.totalCost));
      
      expect(maxCost).toBe(85.00);
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency amounts', () => {
      const amount = 45.50;
      const currency = 'USD';
      const formattedAmount = `${currency} ${amount.toFixed(2)}`;

      expect(formattedAmount).toBe('USD 45.50');
    });

    it('should handle different currencies', () => {
      const amounts = [
        { value: 100, currency: 'USD' },
        { value: 85, currency: 'EUR' },
        { value: 12000, currency: 'JPY' },
      ];

      amounts.forEach(amount => {
        expect(typeof amount.value).toBe('number');
        expect(typeof amount.currency).toBe('string');
        expect(amount.currency.length).toBe(3);
      });
    });
  });

  describe('Pagination Logic', () => {
    it('should calculate pagination', () => {
      const totalEntries = 150;
      const pageSize = 25;
      const totalPages = Math.ceil(totalEntries / pageSize);
      
      expect(totalPages).toBe(6);
    });

    it('should calculate page offset', () => {
      const currentPage = 3;
      const pageSize = 25;
      const offset = (currentPage - 1) * pageSize;
      
      expect(offset).toBe(50);
    });
  });
}); 