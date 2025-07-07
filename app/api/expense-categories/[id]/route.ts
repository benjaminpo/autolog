import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import ExpenseCategory from '../../../models/ExpenseCategory';
import { authOptions } from '../../../api/auth/authOptions';

// GET specific expense category
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
        JSON.stringify({ message: 'Missing category ID' }),
        { status: 400 }
      );
    }

    const category = await ExpenseCategory.findOne({ _id: id, userId });

    if (!category) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense category not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, expenseCategory: category }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expense category:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
      { status: 500 }
    );
  }
}

// Update expense category
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
        JSON.stringify({ message: 'Missing category ID' }),
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const { name } = updateData;

    if (!name) {
      return new NextResponse(
        JSON.stringify({ message: 'Name is required' }),
        { status: 400 }
      );
    }

    // Find the category
    const category = await ExpenseCategory.findOne({ _id: id, userId });

    if (!category) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense category not found' }),
        { status: 404 }
      );
    }

    // Check if it's a predefined category
    if (category.isPredefined) {
      return new NextResponse(
        JSON.stringify({ message: 'Cannot modify predefined categories' }),
        { status: 403 }
      );
    }

    // Check if a category with the new name already exists
    if (name !== category.name) {
      const existingCategory = await ExpenseCategory.findOne({
        userId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingCategory) {
        return new NextResponse(
          JSON.stringify({ message: 'Another category with this name already exists' }),
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await ExpenseCategory.findOneAndUpdate(
      { _id: id, userId },
      { name },
      { new: true, runValidators: true }
    );

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Expense category updated successfully',
        expenseCategory: updatedCategory
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expense category:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
      { status: 500 }
    );
  }
}

// Delete expense category
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
        JSON.stringify({ message: 'Missing category ID' }),
        { status: 400 }
      );
    }

    // Find the category
    const category = await ExpenseCategory.findOne({ _id: id, userId });

    if (!category) {
      return new NextResponse(
        JSON.stringify({ message: 'Expense category not found' }),
        { status: 404 }
      );
    }

    // Check if it's a predefined category
    if (category.isPredefined) {
      return new NextResponse(
        JSON.stringify({ message: 'Cannot delete predefined categories' }),
        { status: 403 }
      );
    }

    await ExpenseCategory.findOneAndDelete({ _id: id, userId });

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Expense category deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expense category:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
      { status: 500 }
    );
  }
}
