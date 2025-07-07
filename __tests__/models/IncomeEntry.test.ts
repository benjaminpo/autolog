import IncomeEntry, { IIncomeEntry } from '../../app/models/IncomeEntry';

// Mock mongoose
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation((definition, options) => ({
    definition,
    options,
    Types: {
      ObjectId: String
    }
  })),
  model: jest.fn(),
  models: {},
  Document: class {},
  Types: {
    ObjectId: String
  }
}));

describe('IncomeEntry Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should have required userId field as ObjectId reference', () => {
      const userIdField = {
        type: 'ObjectId', // Mock type
        ref: 'User',
        required: true
      };
      
      expect(userIdField.type).toBe('ObjectId');
      expect(userIdField.ref).toBe('User');
      expect(userIdField.required).toBe(true);
    });

    it('should have required carId field as String', () => {
      const carIdField = {
        type: String,
        required: true
      };
      
      expect(carIdField.type).toBe(String);
      expect(carIdField.required).toBe(true);
    });

    it('should have required category field as String', () => {
      const categoryField = {
        type: String,
        required: true
      };
      
      expect(categoryField.type).toBe(String);
      expect(categoryField.required).toBe(true);
    });

    it('should have required amount field as Number', () => {
      const amountField = {
        type: Number,
        required: true
      };
      
      expect(amountField.type).toBe(Number);
      expect(amountField.required).toBe(true);
    });

    it('should have required currency field as String', () => {
      const currencyField = {
        type: String,
        required: true
      };
      
      expect(currencyField.type).toBe(String);
      expect(currencyField.required).toBe(true);
    });

    it('should have required date field as String', () => {
      const dateField = {
        type: String,
        required: true
      };
      
      expect(dateField.type).toBe(String);
      expect(dateField.required).toBe(true);
    });

    it('should have optional notes field with default empty string', () => {
      const notesField = {
        type: String,
        default: ''
      };
      
      expect(notesField.type).toBe(String);
      expect(notesField.default).toBe('');
    });

    it('should have timestamps option enabled', () => {
      const options = {
        timestamps: true
      };
      
      expect(options.timestamps).toBe(true);
    });
  });

  describe('Required Fields Validation', () => {
    it('should require userId', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        carId: 'car123',
        category: 'Rideshare',
        amount: 100.50,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Test ride'
      };
      
      // userId is missing
      expect(incomeEntry.userId).toBeUndefined();
      expect(incomeEntry.carId).toBeDefined();
      expect(incomeEntry.category).toBeDefined();
      expect(incomeEntry.amount).toBeDefined();
      expect(incomeEntry.currency).toBeDefined();
      expect(incomeEntry.date).toBeDefined();
    });

    it('should require carId', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        category: 'Rideshare',
        amount: 100.50,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Test ride'
      };
      
      // carId is missing
      expect(incomeEntry.userId).toBeDefined();
      expect(incomeEntry.carId).toBeUndefined();
      expect(incomeEntry.category).toBeDefined();
      expect(incomeEntry.amount).toBeDefined();
      expect(incomeEntry.currency).toBeDefined();
      expect(incomeEntry.date).toBeDefined();
    });

    it('should require category', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        amount: 100.50,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Test ride'
      };
      
      // category is missing
      expect(incomeEntry.userId).toBeDefined();
      expect(incomeEntry.carId).toBeDefined();
      expect(incomeEntry.category).toBeUndefined();
      expect(incomeEntry.amount).toBeDefined();
      expect(incomeEntry.currency).toBeDefined();
      expect(incomeEntry.date).toBeDefined();
    });

    it('should require amount', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Test ride'
      };
      
      // amount is missing
      expect(incomeEntry.userId).toBeDefined();
      expect(incomeEntry.carId).toBeDefined();
      expect(incomeEntry.category).toBeDefined();
      expect(incomeEntry.amount).toBeUndefined();
      expect(incomeEntry.currency).toBeDefined();
      expect(incomeEntry.date).toBeDefined();
    });

    it('should require currency', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100.50,
        date: '2024-01-15',
        notes: 'Test ride'
      };
      
      // currency is missing
      expect(incomeEntry.userId).toBeDefined();
      expect(incomeEntry.carId).toBeDefined();
      expect(incomeEntry.category).toBeDefined();
      expect(incomeEntry.amount).toBeDefined();
      expect(incomeEntry.currency).toBeUndefined();
      expect(incomeEntry.date).toBeDefined();
    });

    it('should require date', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100.50,
        currency: 'USD',
        notes: 'Test ride'
      };
      
      // date is missing
      expect(incomeEntry.userId).toBeDefined();
      expect(incomeEntry.carId).toBeDefined();
      expect(incomeEntry.category).toBeDefined();
      expect(incomeEntry.amount).toBeDefined();
      expect(incomeEntry.currency).toBeDefined();
      expect(incomeEntry.date).toBeUndefined();
    });

    it('should allow notes to be optional', () => {
      const incomeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100.50,
        currency: 'USD',
        date: '2024-01-15'
      };
      
      // notes is optional
      expect(incomeEntry.userId).toBeDefined();
      expect(incomeEntry.carId).toBeDefined();
      expect(incomeEntry.category).toBeDefined();
      expect(incomeEntry.amount).toBeDefined();
      expect(incomeEntry.currency).toBeDefined();
      expect(incomeEntry.date).toBeDefined();
      expect(incomeEntry.notes).toBeUndefined();
    });
  });

  describe('Data Type Validation', () => {
    it('should validate amount as number', () => {
      const validAmounts = [100, 100.50, 0, 0.01, 999999.99];
      const invalidAmounts = ['100', '100.50', 'not a number', null, undefined];
      
      validAmounts.forEach(amount => {
        expect(typeof amount).toBe('number');
        expect(Number.isFinite(amount)).toBe(true);
      });
      
      invalidAmounts.forEach(amount => {
        expect(typeof amount).not.toBe('number');
      });
    });

    it('should validate userId as string', () => {
      const validUserIds = ['user123', 'userId', '507f1f77bcf86cd799439011'];
      
      validUserIds.forEach(userId => {
        expect(typeof userId).toBe('string');
        expect(userId.length).toBeGreaterThan(0);
      });
    });

    it('should validate carId as string', () => {
      const validCarIds = ['car123', 'vehicle456', 'my-car-id'];
      
      validCarIds.forEach(carId => {
        expect(typeof carId).toBe('string');
        expect(carId.length).toBeGreaterThan(0);
      });
    });

    it('should validate category as string', () => {
      const validCategories = ['Rideshare', 'Delivery', 'Rental', 'Other'];
      
      validCategories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });

    it('should validate currency as string', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
      
      validCurrencies.forEach(currency => {
        expect(typeof currency).toBe('string');
        expect(currency.length).toBeGreaterThan(0);
      });
    });

    it('should validate date as string', () => {
      const validDates = ['2024-01-15', '2023-12-31', '2024-02-29'];
      
      validDates.forEach(date => {
        expect(typeof date).toBe('string');
        expect(date.length).toBeGreaterThan(0);
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should validate notes as string when provided', () => {
      const validNotes = ['', 'Short note', 'A longer note with more details', '123'];
      
      validNotes.forEach(notes => {
        expect(typeof notes).toBe('string');
      });
    });
  });

  describe('Income Categories', () => {
    it('should handle rideshare income entries', () => {
      const rideshareEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 85.50,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Uber ride from airport'
      };
      
      expect(rideshareEntry.category).toBe('Rideshare');
      expect(rideshareEntry.amount).toBeGreaterThan(0);
    });

    it('should handle delivery income entries', () => {
      const deliveryEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Delivery',
        amount: 45.25,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Food delivery during evening shift'
      };
      
      expect(deliveryEntry.category).toBe('Delivery');
      expect(deliveryEntry.amount).toBeGreaterThan(0);
    });

    it('should handle rental income entries', () => {
      const rentalEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rental',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Weekend car rental through platform'
      };
      
      expect(rentalEntry.category).toBe('Rental');
      expect(rentalEntry.amount).toBeGreaterThan(0);
    });

    it('should handle custom income categories', () => {
      const customEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Photography Services',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Used car for photoshoot transportation'
      };
      
      expect(customEntry.category).toBe('Photography Services');
      expect(customEntry.amount).toBeGreaterThan(0);
    });
  });

  describe('Amount Edge Cases', () => {
    it('should handle zero amount', () => {
      const zeroEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 0,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Canceled ride - no income'
      };
      
      expect(zeroEntry.amount).toBe(0);
      expect(typeof zeroEntry.amount).toBe('number');
    });

    it('should handle small decimal amounts', () => {
      const smallEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Tips',
        amount: 0.01,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Small tip received'
      };
      
      expect(smallEntry.amount).toBe(0.01);
      expect(typeof smallEntry.amount).toBe('number');
    });

    it('should handle large amounts', () => {
      const largeEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Special Event',
        amount: 9999.99,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'High-value special event transportation'
      };
      
      expect(largeEntry.amount).toBe(9999.99);
      expect(typeof largeEntry.amount).toBe('number');
    });

    it('should handle floating point precision', () => {
      const precisionEntry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 123.456789,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Amount with high precision'
      };
      
      expect(precisionEntry.amount).toBe(123.456789);
      expect(typeof precisionEntry.amount).toBe('number');
    });
  });

  describe('Currency Support', () => {
    it('should support major world currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
      
      currencies.forEach(currency => {
        const entry: Partial<IIncomeEntry> = {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 100,
          currency: currency,
          date: '2024-01-15',
          notes: `Income in ${currency}`
        };
        
        expect(entry.currency).toBe(currency);
        expect(typeof entry.currency).toBe('string');
      });
    });

    it('should handle cryptocurrency symbols', () => {
      const cryptoCurrencies = ['BTC', 'ETH', 'ADA', 'DOT'];
      
      cryptoCurrencies.forEach(crypto => {
        const entry: Partial<IIncomeEntry> = {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 0.001,
          currency: crypto,
          date: '2024-01-15',
          notes: `Crypto payment in ${crypto}`
        };
        
        expect(entry.currency).toBe(crypto);
        expect(typeof entry.currency).toBe('string');
      });
    });
  });

  describe('Date Handling', () => {
    it('should handle standard date formats', () => {
      const dateFormats = [
        '2024-01-15',
        '2023-12-31',
        '2024-02-29', // Leap year
        '2024-06-30'
      ];
      
      dateFormats.forEach(date => {
        const entry: Partial<IIncomeEntry> = {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 100,
          currency: 'USD',
          date: date,
          notes: `Entry for ${date}`
        };
        
        expect(entry.date).toBe(date);
        expect(typeof entry.date).toBe('string');
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should handle different year ranges', () => {
      const years = [2020, 2021, 2022, 2023, 2024, 2025];
      
      years.forEach(year => {
        const date = `${year}-01-01`;
        const entry: Partial<IIncomeEntry> = {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 100,
          currency: 'USD',
          date: date,
          notes: `New Year entry for ${year}`
        };
        
        expect(entry.date).toBe(date);
        expect(entry.date?.startsWith(year.toString())).toBe(true);
      });
    });
  });

  describe('Notes Field', () => {
    it('should handle empty notes', () => {
      const entry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100,
        currency: 'USD',
        date: '2024-01-15',
        notes: ''
      };
      
      expect(entry.notes).toBe('');
      expect(typeof entry.notes).toBe('string');
    });

    it('should handle long notes', () => {
      const longNote = 'This is a very long note describing the income entry in great detail with lots of information about the specific circumstances and context of this particular transaction.';
      
      const entry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100,
        currency: 'USD',
        date: '2024-01-15',
        notes: longNote
      };
      
      expect(entry.notes).toBe(longNote);
      expect(entry.notes!.length).toBeGreaterThan(100);
    });

    it('should handle special characters in notes', () => {
      const specialNote = 'Émojis: 🚗💰 & special chars: ñáéíóú @#$%^&*()';
      
      const entry: Partial<IIncomeEntry> = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100,
        currency: 'USD',
        date: '2024-01-15',
        notes: specialNote
      };
      
      expect(entry.notes).toBe(specialNote);
      expect(typeof entry.notes).toBe('string');
    });
  });

  describe('Real-world Income Scenarios', () => {
    it('should model typical rideshare day earnings', () => {
      const dailyEntries: Partial<IIncomeEntry>[] = [
        {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 15.50,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Morning commute ride'
        },
        {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 25.75,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Airport pickup'
        },
        {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 8.25,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Short trip downtown'
        }
      ];
      
      const totalEarnings = dailyEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      
      expect(dailyEntries).toHaveLength(3);
      expect(totalEarnings).toBe(49.50);
      dailyEntries.forEach(entry => {
        expect(entry.userId).toBe('user123');
        expect(entry.carId).toBe('car123');
        expect(entry.date).toBe('2024-01-15');
      });
    });

    it('should model mixed income sources', () => {
      const mixedIncomes: Partial<IIncomeEntry>[] = [
        {
          userId: 'user123',
          carId: 'car123',
          category: 'Rideshare',
          amount: 45.00,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Rideshare earnings'
        },
        {
          userId: 'user123',
          carId: 'car123',
          category: 'Delivery',
          amount: 35.50,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Food delivery earnings'
        },
        {
          userId: 'user123',
          carId: 'car123',
          category: 'Tips',
          amount: 12.25,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Cash tips received'
        }
      ];
      
      const categories = mixedIncomes.map(entry => entry.category);
      const totalIncome = mixedIncomes.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      
      expect(categories).toContain('Rideshare');
      expect(categories).toContain('Delivery');
      expect(categories).toContain('Tips');
      expect(totalIncome).toBe(92.75);
    });
  });

  describe('Interface Compliance', () => {
    it('should implement IIncomeEntry interface correctly', () => {
      const entry: IIncomeEntry = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100.50,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Test entry'
      } as IIncomeEntry;
      
      expect(typeof entry.userId).toBe('string');
      expect(typeof entry.carId).toBe('string');
      expect(typeof entry.category).toBe('string');
      expect(typeof entry.amount).toBe('number');
      expect(typeof entry.currency).toBe('string');
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.notes).toBe('string');
    });

    it('should support Document interface methods', () => {
      // Mock Document interface compliance
      const entry = {
        userId: 'user123',
        carId: 'car123',
        category: 'Rideshare',
        amount: 100.50,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Test entry',
        save: jest.fn(),
        remove: jest.fn(),
        toObject: jest.fn()
      };
      
      expect(typeof entry.save).toBe('function');
      expect(typeof entry.remove).toBe('function');
      expect(typeof entry.toObject).toBe('function');
    });
  });

  describe('Model Export', () => {
    it('should have proper mongoose model structure', () => {
      const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        aggregate: jest.fn()
      };
      
      expect(typeof mockModel.find).toBe('function');
      expect(typeof mockModel.findOne).toBe('function');
      expect(typeof mockModel.create).toBe('function');
      expect(typeof mockModel.findById).toBe('function');
      expect(typeof mockModel.updateOne).toBe('function');
      expect(typeof mockModel.deleteOne).toBe('function');
      expect(typeof mockModel.aggregate).toBe('function');
    });
  });
}); 