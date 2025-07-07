// Test utility for MongoDB connection
import dbConnect from './dbConnect';
import User from '../models/User';
import config from '../config';
import debugMongoConnection from './debugMongo';

export async function testMongoConnection() {
  try {
    console.log('=== Testing MongoDB Connection ===');

    // Debug connection string first
    const connectionString = process.env.MONGODB_URI || config.database.uri;
    if (connectionString) {
      await debugMongoConnection(connectionString);
    }

    // Connect to the database
    console.log('Attempting to connect to MongoDB...');
    const mongoose = await dbConnect();
    console.log('Connection successful!');

    // Get database info
    if (mongoose.connection && mongoose.connection.db) {
      console.log('Connected to database:', mongoose.connection.db.databaseName);

      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Collections:', collections.map(c => c.name).join(', ') || 'None');
    }

    // Try to create a test user
    console.log('Attempting to create a test user...');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
    } else {
      // Create a new test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();
      console.log('Test user created successfully');
    }

    // Query the user
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);

    return { success: true };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error };
  }
}

export default testMongoConnection;
