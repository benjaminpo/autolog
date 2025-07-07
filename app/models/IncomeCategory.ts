import mongoose, { Schema, Document } from 'mongoose';

export interface IIncomeCategory extends Document {
  userId: string;
  name: string;
  isPredefined?: boolean;
}

const IncomeCategorySchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isPredefined: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create compound index to ensure unique category names per user
IncomeCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.IncomeCategory || mongoose.model<IIncomeCategory>('IncomeCategory', IncomeCategorySchema); 