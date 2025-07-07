import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import FuelCompany from '../../../models/FuelCompany';
import { authOptions } from '../../auth/authOptions';

// DELETE /api/fuel-companies/[id] - Delete a fuel company
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
    // Extract ID directly from params
    const { id } = await params;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing fuel company ID' }),
        { status: 400 }
      );
    }

    // Check if company exists and belongs to the user
    const company = await FuelCompany.findOne({ _id: id, userId });
    if (!company) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel company not found' }),
        { status: 404 }
      );
    }

    await FuelCompany.deleteOne({ _id: id });

    return new NextResponse(
      JSON.stringify({ message: 'Fuel company deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting fuel company:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error deleting fuel company' }),
      { status: 500 }
    );
  }
}

// PUT /api/fuel-companies/[id] - Update a fuel company
export async function PUT(
  request: NextRequest,
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
    const { id } = await params;
    const { name } = await request.json();

    if (!id) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Missing fuel company ID' }),
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Valid name is required' }),
        { status: 400 }
      );
    }

    // Check if company exists and belongs to the user
    const company = await FuelCompany.findOne({ _id: id, userId });
    if (!company) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Fuel company not found' }),
        { status: 404 }
      );
    }

    // Update the company name
    const updatedCompany = await FuelCompany.findOneAndUpdate(
      { _id: id, userId },
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Fuel company updated successfully',
        company: updatedCompany
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating fuel company:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error updating fuel company' }),
      { status: 500 }
    );
  }
}
