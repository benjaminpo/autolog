import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import IncomeEntry from '../../../models/IncomeEntry';
import { authOptions } from '../../auth/authOptions';

// DELETE /api/income-entries/[id] - Delete a specific income entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const { id: entryId } = await params;

    // Find and delete the income entry (only if it belongs to the user)
    const deletedEntry = await IncomeEntry.findOneAndDelete({
      _id: entryId,
      userId: userId
    });

    if (!deletedEntry) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Income entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Income entry deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting income entry:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error deleting income entry' }),
      { status: 500 }
    );
  }
}

// PUT /api/income-entries/[id] - Update a specific income entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const data = await req.json();
    const { carId, category, amount, currency, date, notes } = data;

    // Validate required fields
    if (!carId || !category || !amount || !currency || !date) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Amount must be a positive number' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const { id: entryId } = await params;

    // Find and update the income entry (only if it belongs to the user)
    const updatedEntry = await IncomeEntry.findOneAndUpdate(
      {
        _id: entryId,
        userId: userId
      },
      {
        carId,
        category,
        amount: numericAmount,
        currency,
        date,
        notes: notes || ''
      },
      { new: true }
    );

    if (!updatedEntry) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Income entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, entry: updatedEntry }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating income entry:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error updating income entry' }),
      { status: 500 }
    );
  }
} 