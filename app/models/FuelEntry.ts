import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelEntry extends Document {
  userId: string;
  carId: string;
  fuelCompany: string;
  fuelType: string;
  mileage: number;
  distanceUnit: string;
  volume: number;
  volumeUnit: string;
  cost: number;
  currency: string;
  date: string;
  time: string;
  location: string;
  partialFuelUp: boolean;
  paymentType: string;
  tyrePressure?: number;
  tyrePressureUnit?: string;
  tags: string[];
  notes: string;
  images: string[];
}

const FuelEntrySchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carId: {
    type: String,
    required: true
  },
  fuelCompany: {
    type: String,
    required: true
  },
  fuelType: {
    type: String,
    required: true
  },
  mileage: {
    type: Number,
    required: true
  },
  distanceUnit: {
    type: String,
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  volumeUnit: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0 // Allow zero cost for free fuel
  },
  currency: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true,
    default: () => new Date().toTimeString().slice(0, 5) // HH:MM format
  },
  location: {
    type: String,
    default: ''
  },
  partialFuelUp: {
    type: Boolean,
    default: false
  },
  paymentType: {
    type: String,
    required: true
  },
  tyrePressure: {
    type: Number
  },
  tyrePressureUnit: {
    type: String
  },
  tags: {
    type: [String],
    default: []
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

export default mongoose.models.FuelEntry || mongoose.model<IFuelEntry>('FuelEntry', FuelEntrySchema);
