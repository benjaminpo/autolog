import mongoose, { Schema, Document } from 'mongoose';

export interface IIncomeEntry extends Document {
  userId: string;
  carId: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  notes: string;
}

const IncomeEntrySchema: Schema = new Schema({
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
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.models.IncomeEntry || mongoose.model<IIncomeEntry>('IncomeEntry', IncomeEntrySchema); 