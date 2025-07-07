import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelCompany extends Document {
  name: string;
  isActive: boolean;
}

const FuelCompanySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Fuel company name is required'],
    trim: true,
    maxlength: [100, 'Fuel company name cannot exceed 100 characters'],
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  collection: 'fuelcompanies',
});

export default mongoose.models.FuelCompany || mongoose.model<IFuelCompany>('FuelCompany', FuelCompanySchema);
