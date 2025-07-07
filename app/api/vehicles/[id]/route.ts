import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import Vehicle from '../../../models/Vehicle';
import { authOptions } from '../../auth/authOptions';
import { normalizeId } from '../../../lib/idUtils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = await params;

    // Connect to database
    await dbConnect();

    const userId = session.user.id;
    console.log(`Fetching vehicle with id: ${id} for userId: ${userId}`);

    // Find the vehicle, ensuring it belongs to the current user
    const vehicle = await Vehicle.findOne({
      $or: [
        { _id: id, userId },
        { id: id, userId }
      ]
    });

    if (!vehicle) {
      console.log(`Vehicle not found with id: ${id}`);
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Vehicle not found' }),
        { status: 404 }
      );
    }

    // Normalize the vehicle ID
    const normalizedVehicle = normalizeId(vehicle);

    console.log(`Found vehicle: ${normalizedVehicle.name} with id: ${normalizedVehicle.id}`);

    return new NextResponse(
      JSON.stringify({ success: true, vehicle: normalizedVehicle }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error fetching vehicle', error: String(error) }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = await params;

    // Connect to database
    await dbConnect();

    // Find and delete the vehicle, ensuring it belongs to the current user
    const userId = session.user.id;
    const deletedVehicle = await Vehicle.findOneAndDelete({
      $or: [
        { _id: id, userId },
        { id: id, userId }
      ]
    });

    if (!deletedVehicle) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Vehicle not found or not authorized to delete' }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Vehicle deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error deleting vehicle', error: String(error) }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const updates = await request.json();

    // Connect to database
    await dbConnect();

    // Find and update the vehicle, ensuring it belongs to the current user
    const userId = session.user.id;
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      {
        $or: [
          { _id: id, userId },
          { id: id, userId }
        ]
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Vehicle not found or not authorized to update' }),
        { status: 404 }
      );
    }

    // Normalize the vehicle ID
    const normalizedVehicle = normalizeId(updatedVehicle);

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Vehicle updated successfully', vehicle: normalizedVehicle }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Error updating vehicle', error: String(error) }),
      { status: 500 }
    );
  }
}
