import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import Vehicle from '../../models/Vehicle';
import { authOptions } from '../auth/authOptions';
import { normalizeIds, getObjectId } from '../../lib/idUtils';

// GET /api/diagnostic - Get diagnostic information about database
export async function GET(req: NextRequest) {
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

    // Get vehicles and add diagnostic information
    const vehicles = await Vehicle.find({ userId });

    // Get collection stats
    const vehicleCount = await Vehicle.countDocuments({ userId });

    // Get the raw vehicles (without any normalization)
    const rawVehicles = vehicles.map(v => v.toObject());

    // Get normalized vehicles (with consistent id properties)
    const normalizedVehicles = normalizeIds(rawVehicles);

    // Try to extract localStorage info if passed in query params
    let localStorageData = null;
    const localStorageCars = req.nextUrl.searchParams.get('localStorage');
    if (localStorageCars) {
      try {
        localStorageData = JSON.parse(localStorageCars);
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
      }
    }

    // Diagnostic information
    const diagnosticInfo = {
      userId,
      vehicleCount,
      vehicles: (normalizedVehicles || []).map((v: any) => ({
        id: getObjectId(v),
        _id: v._id?.toString(),
        name: v.name,
        vehicleType: v.vehicleType,
        brand: v.brand,
        model: v.model,
        year: v.year,
        dateAdded: v.dateAdded
      })),
      rawVehicles: rawVehicles.map((v: any) => ({
        _id: v._id?.toString(),
        id: getObjectId(v),
        name: v.name,
        vehicleType: v.vehicleType,
        userId: v.userId?.toString(),
        dateAdded: v.dateAdded
      })),
      localStorageVehicles: localStorageData,
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        expires: session.expires
      }
    };

    return new NextResponse(
      JSON.stringify({
        success: true,
        diagnosticInfo
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error running diagnostics:', error);
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
