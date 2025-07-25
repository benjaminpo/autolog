import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import ExpenseEntry from '../../models/ExpenseEntry';
import { authOptions } from '../auth/authOptions';

// GET /api/expense-entries - Get all expense entries for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    await dbConnect();

    // Parse pagination parameters from URL
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const userId = session.user.id;
    const rawEntries = await ExpenseEntry.find({ userId })
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

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
      JSON.stringify({ success: true, entries: entries }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expense entries:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// POST /api/expense-entries - Create a new expense entry for the current user
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

    const userId = session.user.id;
    const entry = new ExpenseEntry({
      ...entryData,
      userId
    });

    await entry.save();

    // Transform the returned entry to ensure it has client-compatible ID format
    const savedEntry = entry.toObject();
    const entryId = entry._id ? entry._id.toString() : '';
    const transformedEntry = {
      ...savedEntry,
      id: entryId
    };

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Expense entry created successfully', expense: transformedEntry }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// PUT /api/expense-entries - Update an expense entry
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

    const entry = await ExpenseEntry.findOneAndUpdate(
      { _id: id, userId },
      { ...updateData },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense entry not found' }),
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
      JSON.stringify({ success: true, message: 'Expense entry updated successfully', expense: transformedEntry }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expense entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// DELETE /api/expense-entries
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
        JSON.stringify({ message: 'Missing expense entry ID' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const entry = await ExpenseEntry.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Expense entry deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expense entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
