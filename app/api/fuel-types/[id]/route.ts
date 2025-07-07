import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import FuelType from '../../../models/FuelType';
import { authOptions } from '../../auth/authOptions';

// DELETE /api/fuel-types/[id] - Delete a fuel type
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
    // Extract ID directly from params to ensure it's awaited
    const { id } = await params;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing fuel type ID' }),
        { status: 400 }
      );
    }

    // Check if type exists and belongs to the user
    const type = await FuelType.findOne({ _id: id, userId });
    if (!type) {
      return new NextResponse(
        JSON.stringify({ message: 'Fuel type not found' }),
        { status: 404 }
      );
    }

    await FuelType.deleteOne({ _id: id });

    return new NextResponse(
      JSON.stringify({ message: 'Fuel type deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting fuel type:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error deleting fuel type' }),
      { status: 500 }
    );
  }
}

// PUT /api/fuel-types/[id] - Update a fuel type
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
        JSON.stringify({ success: false, message: 'Missing fuel type ID' }),
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Valid name is required' }),
        { status: 400 }
      );
    }

    // Check if type exists and belongs to the user
    const type = await FuelType.findOne({ _id: id, userId });
    if (!type) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Fuel type not found' }),
        { status: 404 }
      );
    }

    // Update the type name
    const updatedType = await FuelType.findOneAndUpdate(
      { _id: id, userId },
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Fuel type updated successfully',
        type: updatedType
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating fuel type:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error updating fuel type' }),
      { status: 500 }
    );
  }
}
