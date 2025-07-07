// filepath: /Users/benjaminpo/vehicle-expense-tracker/app/models/Vehicle.ts
import mongoose, { Schema } from 'mongoose';

// Define the schema directly
const VehicleSchema = new Schema({
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
  vehicleType: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  customModel: {
    type: String
  },
  year: {
    type: Number,
    required: false
  },
  photo: {
    type: String,
    default: ''
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  distanceUnit: {
    type: String,
    default: 'km'
  },
  fuelUnit: {
    type: String,
    default: 'L'
  },
  consumptionUnit: {
    type: String,
    default: 'L/100km'
  },
  fuelType: {
    type: String,
    default: ''
  },
  tankCapacity: {
    type: Number,
    default: null
  },
  licensePlate: {
    type: String,
    default: ''
  },
  vin: {
    type: String,
    default: ''
  },
  insurancePolicy: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Simple export without type parameters to avoid TypeScript errors
// Force model recreation to ensure schema changes are applied
if (mongoose.models.Vehicle) {
  delete mongoose.models.Vehicle;
}
const Vehicle = mongoose.model('Vehicle', VehicleSchema);

export default Vehicle;
