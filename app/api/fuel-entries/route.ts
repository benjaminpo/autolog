import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import FuelEntry from '../../models/FuelEntry';
import { authOptions } from '../auth/authOptions';

// GET /api/fuel-entries - Get all fuel entries for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const rawEntries = await FuelEntry.find({ userId }).sort({ date: -1, time: -1 }).lean();

    // Transform entries to ensure they have client-compatible IDs
    const entries = rawEntries.map(entry => {
      // Use type assertion for TypeScript
      const entryWithId = entry as { _id: { toString(): string } } & Record<string, unknown>;
      return {
        ...entryWithId,
        // Add an id field for client-side compatibility
        id: entryWithId._id.toString()
      };
    });

    return new NextResponse(
      JSON.stringify({ success: true, entries }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching fuel entries:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// POST /api/fuel-entries - Create a new fuel entry for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const entryData = await req.json();
    await dbConnect();

    // Validate numeric fields
    const { volume, mileage, cost } = entryData;

    // Additional validation for required numeric fields
    if (isNaN(volume) || volume <= 0) {
      return new NextResponse(
        JSON.stringify({ message: 'Volume must be a valid positive number' }),
        { status: 400 }
      );
    }

    if (isNaN(mileage) || mileage < 0) {
      return new NextResponse(
        JSON.stringify({ message: 'Mileage must be a valid non-negative number' }),
        { status: 400 }
      );
    }

    if (isNaN(cost) || cost < 0) {
      return new NextResponse(
        JSON.stringify({ message: 'Cost must be a valid non-negative number' }),
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Ensure time has a default value if not provided
    const timeValue = entryData.time || new Date().toTimeString().slice(0, 5);

    const entry = new FuelEntry({
      ...entryData,
      userId,
      time: timeValue
    });

    try {
      await entry.save();
    } catch (error) {
      console.error('Validation error:', error);
      return new NextResponse(
        JSON.stringify({
          message: 'Failed to save fuel entry',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 400 }
      );
    }

    // Transform the returned entry to ensure it has client-compatible ID format
    const savedEntry = entry.toObject();
    const entryId = entry._id ? entry._id.toString() : '';
    const transformedEntry = {
      ...savedEntry,
      id: entryId
    };

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Fuel entry created successfully', entry: transformedEntry }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating fuel entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// PUT /api/fuel-entries - Update a fuel entry
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id, ...updateData } = await req.json();
    await dbConnect();

    const userId = session.user.id;

    const entry = await FuelEntry.findOneAndUpdate(
      { _id: id, userId },
      { ...updateData },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel entry not found' }),
        { status: 404 }
      );
    }

    // Transform the entry to ensure consistent ID format
    const updatedEntry = entry.toObject();
    const entryId = entry._id ? entry._id.toString() : '';
    const transformedEntry = {
      ...updatedEntry,
      id: entryId
    };

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Fuel entry updated successfully', entry: transformedEntry }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating fuel entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// DELETE /api/fuel-entries
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing fuel entry ID' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const entry = await FuelEntry.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Fuel entry deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting fuel entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
