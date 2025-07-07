import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import IncomeCategory from '../../models/IncomeCategory';
import { authOptions } from '../auth/authOptions';
import { predefinedIncomeCategories } from '../../lib/predefinedData';

// GET /api/income-categories - Get all income categories for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // For non-authenticated users, return just predefined categories
      return new NextResponse(
        JSON.stringify({
          success: true,
          incomeCategories: predefinedIncomeCategories.map(name => ({
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

    // Get user-specific categories from database
    const userCategories = await IncomeCategory.find({ userId }).sort('name');

    // Create a set for efficient duplicate checking
    const categoryNamesSet = new Set(userCategories.map(category => category.name));

    // Add predefined categories that aren't already in the user's list
    const combinedCategories = [...userCategories];

    // For each predefined category, create a "virtual" category object if it doesn't exist
    for (const categoryName of predefinedIncomeCategories) {
      if (!categoryNamesSet.has(categoryName)) {
        combinedCategories.push({
          _id: `predefined-${categoryName.replace(/\s+/g, '-').toLowerCase()}`,
          userId: userId,
          name: categoryName,
          isPredefined: true
        });
      }
    }

    // Sort the combined list by name
    combinedCategories.sort((a, b) => a.name.localeCompare(b.name));

    return new NextResponse(
      JSON.stringify({ success: true, incomeCategories: combinedCategories }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting income categories:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error getting income categories' }),
      { status: 500 }
    );
  }
}

// POST /api/income-categories - Create a new income category
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
    const { name } = data;

    if (!name) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Name is required' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Check if this is a predefined category
    if (predefinedIncomeCategories.includes(name)) {
      // Return success but don't save predefined categories to DB
      return new NextResponse(
        JSON.stringify({
          success: true,
          incomeCategory: {
            _id: `predefined-${name.replace(/\s+/g, '-').toLowerCase()}`,
            userId,
            name,
            isPredefined: true
          }
        }),
        { status: 200 }
      );
    }

    // Check if category already exists for this user
    const existingCategory = await IncomeCategory.findOne({ userId, name });
    if (existingCategory) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Income category already exists' }),
        { status: 409 }
      );
    }

    // Create new category
    const category = await IncomeCategory.create({
      userId,
      name
    });

    return new NextResponse(
      JSON.stringify({ success: true, incomeCategory: category }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating income category:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error creating income category' }),
      { status: 500 }
    );
  }
} 