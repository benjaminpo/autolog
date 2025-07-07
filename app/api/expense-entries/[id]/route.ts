import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import ExpenseEntry from '../../../models/ExpenseEntry';
import { authOptions } from '../../auth/authOptions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { id } = await params;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing entry ID' }),
        { status: 400 }
      );
    }

    const entry = await ExpenseEntry.findOne({ _id: id, userId });

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ entry }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expense entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { id } = await params;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing entry ID' }),
        { status: 400 }
      );
    }

    const updateData = await request.json();

    const entry = await ExpenseEntry.findOneAndUpdate(
      { _id: id, userId },
      { ...updateData, userId },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Expense entry updated successfully', entry }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expense entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const { id } = await params;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing entry ID' }),
        { status: 400 }
      );
    }

    const entry = await ExpenseEntry.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense entry not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Expense entry deleted successfully' }),
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
