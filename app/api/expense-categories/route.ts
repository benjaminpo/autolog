import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import ExpenseCategory from '../../models/ExpenseCategory';
import { expenseCategories } from '../../lib/vehicleData';
import { authOptions } from '../../api/auth/authOptions';

// GET /api/expense-categories
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

    // Get custom expense categories
    const customCategories = await ExpenseCategory.find({ userId }).sort({ name: 1 });

    // Check if predefined categories should be initialized
    const shouldInitialize = customCategories.filter(c => c.isPredefined).length === 0;

    if (shouldInitialize) {
      // Initialize predefined categories for this user
      const predefinedCategoryDocs = expenseCategories.map(name => ({
        userId,
        name,
        isPredefined: true
      }));

      await ExpenseCategory.insertMany(predefinedCategoryDocs, { ordered: false });

      // Get all categories again after initialization
      const allCategories = await ExpenseCategory.find({ userId }).sort({ name: 1 });
      return new NextResponse(
        JSON.stringify({ success: true, expenseCategories: allCategories }),
        { status: 200 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, expenseCategories: customCategories }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
      { status: 500 }
    );
  }
}

// POST /api/expense-categories - Create a new expense category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name) {
      return new NextResponse(
        JSON.stringify({ message: 'Name is required' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Check if category already exists
    const existingCategory = await ExpenseCategory.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive matching
    });

    if (existingCategory) {
      return new NextResponse(
        JSON.stringify({ message: 'Category already exists' }),
        { status: 400 }
      );
    }

    // Create new category
    const expenseCategory = new ExpenseCategory({
      userId,
      name,
      isPredefined: false
    });

    await expenseCategory.save();

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Expense category created successfully',
        expenseCategory
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense category:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
      { status: 500 }
    );
  }
}
