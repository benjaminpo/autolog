import mongoose from 'mongoose';
import config from '../config';

/**
 * MongoDB Connection Handler
 * This module handles MongoDB connections with proper caching and error handling
 */

const MONGODB_URI = process.env.MONGODB_URI || config.database.uri;
const DB_NAME = config.database.name;

// Define the shape of the mongoose cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to the NodeJS.Global interface
declare global {
  var mongoose: MongooseCache | undefined;
}

// Use the cached connection if available
const cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB with proper error handling
 */
async function dbConnect() {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create a new connection if none exists
  if (!cached.promise) {
    // For MongoDB Atlas, use a simpler connection approach
    const isMongoDB = MONGODB_URI.includes('mongodb+srv://');

    // Essential connection options
    const opts = {
      dbName: DB_NAME, // Critical: Explicit database name
      autoCreate: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Give up initial connection after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Simple, direct connection for MongoDB Atlas
    const connectionString = MONGODB_URI;

    // Log connection attempt (hide credentials)
    const sanitizedUri = connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`Connecting to MongoDB (${isMongoDB ? 'Atlas' : 'Local'}):`);
    console.log(`URI: ${sanitizedUri}`);
    console.log(`Database: ${DB_NAME}`);

    try {
      cached.promise = mongoose.connect(connectionString, opts).then((mongoose) => {
        console.log(`Connected to MongoDB (${config.env}) successfully`);
        if (mongoose.connection && mongoose.connection.db) {
          console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);
          console.log(`Models registered: ${Object.keys(mongoose.models).join(', ') || 'None'}`);
        } else {
          console.log('Warning: Database information not available');
        }
        return mongoose;
      });
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Error in MongoDB connection:', error);
    throw error;
  }
}

export default dbConnect;
