import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelType extends Document {
  userId: string;
  name: string;
}

const FuelTypeSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique fuel types per user
FuelTypeSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.FuelType || mongoose.model<IFuelType>('FuelType', FuelTypeSchema);
