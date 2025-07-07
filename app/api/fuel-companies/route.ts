import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import FuelCompany from '../../models/FuelCompany';
import { authOptions } from '../auth/authOptions';
import { predefinedFuelCompanies } from '../../lib/predefinedData';

// GET /api/fuel-companies - Get all fuel companies for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // For non-authenticated users, return just predefined companies
      return new NextResponse(
        JSON.stringify({
          companies: predefinedFuelCompanies.map(name => ({
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

    // Get user-specific companies from database
    const userCompanies = await FuelCompany.find({ userId }).sort('name');

    // Create a set for efficient duplicate checking
    const companyNamesSet = new Set(userCompanies.map(company => company.name));

    // Add predefined companies that aren't already in the user's list
    const combinedCompanies = [...userCompanies];

    // For each predefined company, create a "virtual" company object if it doesn't exist
    for (const companyName of predefinedFuelCompanies) {
      if (!companyNamesSet.has(companyName)) {
        combinedCompanies.push({
          _id: `predefined-${companyName.replace(/\s+/g, '-').toLowerCase()}`,
          userId: userId,
          name: companyName,
          isPredefined: true
        });
      }
    }

    // Sort the combined list by name
    combinedCompanies.sort((a, b) => a.name.localeCompare(b.name));

    return new NextResponse(
      JSON.stringify({ companies: combinedCompanies }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting fuel companies:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error getting fuel companies' }),
      { status: 500 }
    );
  }
}

// POST /api/fuel-companies - Create a new fuel company
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

    // Check if this is a predefined company
    if (predefinedFuelCompanies.includes(name)) {
      // Return success but don't save predefined companies to DB
      return new NextResponse(
        JSON.stringify({
          company: {
            _id: `predefined-${name.replace(/\s+/g, '-').toLowerCase()}`,
            userId,
            name,
            isPredefined: true
          }
        }),
        { status: 200 }
      );
    }

    // Check if company already exists for this user
    const existingCompany = await FuelCompany.findOne({ userId, name });
    if (existingCompany) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel company already exists' }),
        { status: 409 }
      );
    }

    // Create new company
    const company = await FuelCompany.create({
      userId,
      name
    });

    return new NextResponse(
      JSON.stringify({ company }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating fuel company:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error creating fuel company' }),
      { status: 500 }
    );
  }
}

// PUT /api/fuel-companies - Update a fuel company
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

    // Check if this is a predefined company (they can't be updated)
    if (id.startsWith('predefined-')) {
      return new NextResponse(
        JSON.stringify({ message: 'Predefined companies cannot be updated' }),
        { status: 403 }
      );
    }

    // Update the company
    const company = await FuelCompany.findOneAndUpdate(
      { _id: id, userId },
      { name },
      { new: true }
    );

    if (!company) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel company not found' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ company }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating fuel company:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error updating fuel company' }),
      { status: 500 }
    );
  }
}
