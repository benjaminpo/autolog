import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: string;
  fuelCompanies: string[];
  fuelTypes: string[];
  customBrands: Record<string, string[]>;
  customModels: Record<string, Record<string, string[]>>;
  language: 'en' | 'zh';
  theme: 'light' | 'dark' | 'system';
  fuelConsumptionUnit: 'L/100km' | 'km/L' | 'G/100mi' | 'km/G' | 'mi/L';
  defaultCurrency: string;
  defaultDistanceUnit: string;
  defaultVolumeUnit: string;
  defaultTyrePressureUnit: string;
  defaultPaymentType: string;
}

const UserPreferencesSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fuelCompanies: {
    type: [String],
    default: ['BP', 'Shell', 'Esso']
  },
  fuelTypes: {
    type: [String],
    default: ['Diesel', 'Unleaded', 'Premium']
  },
  customBrands: {
    type: Map,
    of: [String],
    default: {}
  },
  customModels: {
    type: Map,
    of: Map,
    default: {}
  },
  language: {
    type: String,
    enum: ['en', 'zh'],
    default: 'en'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  fuelConsumptionUnit: {
    type: String,
    enum: ['L/100km', 'km/L', 'G/100mi', 'km/G', 'mi/L'],
    default: 'L/100km'
  },
  defaultCurrency: {
    type: String,
    default: 'USD'
  },
  defaultDistanceUnit: {
    type: String,
    default: 'km'
  },
  defaultVolumeUnit: {
    type: String,
    default: 'L'
  },
  defaultTyrePressureUnit: {
    type: String,
    default: 'bar'
  },
  defaultPaymentType: {
    type: String,
    default: 'Cash'
  }
}, {
  timestamps: true
});

export default mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
