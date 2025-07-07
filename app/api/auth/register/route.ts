import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import debugMongoConnection from '../../../lib/debugMongo';
import config from '../../../config';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return new NextResponse(
        JSON.stringify({ message: 'Please provide all required fields' }),
        { status: 400 }
      );
    }

    // Get connection string for debugging
    const connectionString = process.env.MONGODB_URI || config.database.uri;
    if (connectionString) {
      await debugMongoConnection(connectionString);
    }

    await dbConnect();

    // Log mongoose connection and model information
    console.log('MongoDB Connection Status:', {
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.db?.databaseName || 'Not available',
      modelName: User.modelName,
      collectionName: User.collection.name
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ message: 'User with this email already exists' }),
        { status: 409 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Return success without exposing password
    return new NextResponse(
      JSON.stringify({
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    // Include more detailed error info in development environment
    const errorDetails = process.env.NODE_ENV === 'development'
      ? { error: error instanceof Error ? error.message : String(error) }
      : {};

    return new NextResponse(
      JSON.stringify({
        message: 'Internal server error',
        ...errorDetails
      }),
      { status: 500 }
    );
  }
}
