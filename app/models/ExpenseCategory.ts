import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseCategory extends Document {
  userId: string;
  name: string;
  isPredefined?: boolean;
}

const ExpenseCategorySchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isPredefined: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique expense categories per user
ExpenseCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.ExpenseCategory || mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);
