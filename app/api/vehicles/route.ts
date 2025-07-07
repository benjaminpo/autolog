import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import Vehicle from '../../models/Vehicle';
import { authOptions } from '../auth/authOptions';

// GET /api/vehicles - Get all vehicles for the current user
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
    console.log(`Fetching vehicles for userId: ${userId}`);

    const vehicles = await Vehicle.find({ userId }).sort({ dateAdded: -1 });
    console.log(`Found ${vehicles.length} vehicles for user`);

    // First convert MongoDB documents to plain objects
    const plainVehicles = vehicles.map(vehicle => {
      const plainObject = vehicle.toObject() as any;
      // Ensure id field is present
      plainObject.id = plainObject._id.toString();
      return plainObject;
    });

    // Log sample vehicle structure
    if (plainVehicles.length > 0) {
      console.log('Sample vehicle structure:', JSON.stringify({
        id: plainVehicles[0].id,
        _id: plainVehicles[0]._id.toString(),
        name: plainVehicles[0].name
      }));
    }

    return new NextResponse(
      JSON.stringify({ success: true, vehicles: plainVehicles }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create a new vehicle for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const vehicleData = await req.json();
    await dbConnect();

    const userId = session.user.id;
    const vehicle = new Vehicle({
      ...vehicleData,
      userId,
      dateAdded: new Date()
    });

    await vehicle.save();

    // Prepare the response with both _id and id properties
    const savedVehicle = vehicle.toObject() as any;
    savedVehicle.id = savedVehicle._id.toString();

    console.log('Vehicle created successfully:', {
      id: (savedVehicle as any).id,
      _id: savedVehicle._id,
      name: savedVehicle.name,
      userId: savedVehicle.userId
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Vehicle created successfully',
        vehicle: savedVehicle
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
}
