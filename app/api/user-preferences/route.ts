import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import UserPreferences from '../../models/UserPreferences';
import { authOptions } from '../auth/authOptions';

// GET /api/user-preferences - Get user preferences
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
    let preferences = await UserPreferences.findOne({ userId });

    // Create default preferences if not found
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId,
        fuelCompanies: ['BP', 'Shell', 'Esso'],
        fuelTypes: ['Diesel', 'Unleaded', 'Premium']
      });
    }

    return new NextResponse(
      JSON.stringify({ preferences }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// PUT /api/user-preferences - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const preferencesData = await req.json();
    await dbConnect();

    const userId = session.user.id;

    // Upsert - create if not exists, update if exists
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { ...preferencesData },
      { new: true, upsert: true, runValidators: true }
    );

    return new NextResponse(
      JSON.stringify({ message: 'Preferences updated successfully', preferences }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// POST /api/user-preferences - Create/Update user preferences (alias for PUT)
export async function POST(req: NextRequest) {
  return PUT(req);
}
