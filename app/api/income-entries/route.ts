import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import IncomeEntry from '../../models/IncomeEntry';
import { authOptions } from '../auth/authOptions';

// GET /api/income-entries - Get all income entries for the user
export async function GET() {
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

    // Get all income entries for this user, sorted by date (newest first)
    const incomeEntries = await IncomeEntry.find({ userId }).sort({ date: -1, createdAt: -1 });

    return new NextResponse(
      JSON.stringify({ success: true, entries: incomeEntries }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting income entries:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error getting income entries' }),
      { status: 500 }
    );
  }
}

// POST /api/income-entries - Create a new income entry
export async function POST(req: NextRequest) {
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

    // Create new income entry
    const incomeEntry = await IncomeEntry.create({
      userId,
      carId,
      category,
      amount: numericAmount,
      currency,
      date,
      notes: notes || ''
    });

    return new NextResponse(
      JSON.stringify({ success: true, entry: incomeEntry }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating income entry:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error creating income entry' }),
      { status: 500 }
    );
  }
} 