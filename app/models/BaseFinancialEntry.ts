import mongoose, { Schema, Document } from 'mongoose';

// Base interface for financial entries (income/expense)
export interface IBaseFinancialEntry extends Document {
  userId: string;
  carId: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  notes: string;
  images: string[];
}

// Shared schema definition for financial entries
export const createBaseFinancialEntrySchema = () => new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'HKD'
  },
  date: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Base validation functions
export const validateFinancialEntry = {
  category: (category: string) => category && category.trim().length > 0,
  amount: (amount: number) => typeof amount === 'number' && amount > 0,
  currency: (currency: string) => currency && currency.trim().length > 0,
  date: (date: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  }
};
