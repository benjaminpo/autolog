// User model for authentication
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for Google OAuth users
  googleId?: string; // Google OAuth ID
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
  },  password: {
    type: String,
    required: false, // Not required for Google OAuth users
    minlength: [8, 'Password must be at least 8 characters'],
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'users', // Explicitly set collection name
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(this: IUser, next) {
  // Only hash password if it exists and is modified
  if (!this.password || !this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If no password is set (Google OAuth user), return false
    if (!this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

// Create or retrieve model - with explicit collection name to avoid namespace issues
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
export default User;
