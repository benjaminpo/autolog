import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import FuelType from '../../models/FuelType';
import { authOptions } from '../auth/authOptions';
import { predefinedFuelTypes } from '../../lib/predefinedData';

// GET /api/fuel-types - Get all fuel types for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // For non-authenticated users, return just predefined types
      return new NextResponse(
        JSON.stringify({
          types: predefinedFuelTypes.map(name => ({
            _id: `predefined-${name.replace(/\s+/g, '-').toLowerCase()}`,
            name,
            isPredefined: true
          }))
        }),
        { status: 200 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Get user-specific types from database
    const userTypes = await FuelType.find({ userId }).sort('name');

    // Create a set for efficient duplicate checking
    const typeNamesSet = new Set(userTypes.map(type => type.name));

    // Add predefined types that aren't already in the user's list
    const combinedTypes = [...userTypes];

    // For each predefined type, create a "virtual" type object if it doesn't exist
    for (const typeName of predefinedFuelTypes) {
      if (!typeNamesSet.has(typeName)) {
        combinedTypes.push({
          _id: `predefined-${typeName.replace(/\s+/g, '-').toLowerCase()}`,
          userId: userId,
          name: typeName,
          isPredefined: true
        });
      }
    }

    // Sort the combined list by name
    combinedTypes.sort((a, b) => a.name.localeCompare(b.name));

    return new NextResponse(
      JSON.stringify({ types: combinedTypes }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting fuel types:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error getting fuel types' }),
      { status: 500 }
    );
  }
}

// POST /api/fuel-types - Create a new fuel type
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const data = await req.json();
    const { name } = data;

    if (!name) {
      return new NextResponse(
        JSON.stringify({ message: 'Name is required' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Check if this is a predefined type
    if (predefinedFuelTypes.includes(name)) {
      // Return success but don't save predefined types to DB
      return new NextResponse(
        JSON.stringify({
          type: {
            _id: `predefined-${name.replace(/\s+/g, '-').toLowerCase()}`,
            userId,
            name,
            isPredefined: true
          }
        }),
        { status: 200 }
      );
    }

    // Check if type already exists for this user
    const existingType = await FuelType.findOne({ userId, name });
    if (existingType) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel type already exists' }),
        { status: 409 }
      );
    }

    // Create new type
    const type = await FuelType.create({
      userId,
      name
    });

    return new NextResponse(
      JSON.stringify({ type }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating fuel type:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error creating fuel type' }),
      { status: 500 }
    );
  }
}

// PUT /api/fuel-types - Update a fuel type
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id, name } = await req.json();

    if (!id || !name) {
      return new NextResponse(
        JSON.stringify({ message: 'ID and name are required' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Check if this is a predefined type (they can't be updated)
    if (id.startsWith('predefined-')) {
      return new NextResponse(
        JSON.stringify({ message: 'Predefined types cannot be updated' }),
        { status: 403 }
      );
    }

    // Update the type
    const type = await FuelType.findOneAndUpdate(
      { _id: id, userId },
      { name },
      { new: true }
    );

    if (!type) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel type not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ type }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating fuel type:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error updating fuel type' }),
      { status: 500 }
    );
  }
}
