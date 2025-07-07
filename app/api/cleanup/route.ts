import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../lib/dbConnect';
import Vehicle from '../../models/Vehicle';
import FuelEntry from '../../models/FuelEntry';
import ExpenseEntry from '../../models/ExpenseEntry';
import { authOptions } from '../auth/authOptions';
// POST /api/cleanup - Fix data inconsistencies for the current user
export async function POST() {
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
    const results = {
      vehicles: {
        before: 0,
        after: 0,
        fixed: 0
      },
      fuelEntries: {
        before: 0,
        after: 0,
        fixed: 0
      },
      expenseEntries: {
        before: 0,
        after: 0,
        fixed: 0
      }
    };

    // Fix vehicles
    const vehicles = await Vehicle.find({ userId });
    results.vehicles.before = vehicles.length;

    let vehiclesFixed = 0;
    for (const vehicle of vehicles) {
      let needsUpdate = false;

      // Add id if missing
      if (!vehicle.id && vehicle._id) {
        vehicle.id = vehicle._id.toString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await vehicle.save();
        vehiclesFixed++;
      }
    }

    results.vehicles.fixed = vehiclesFixed;
    results.vehicles.after = await Vehicle.countDocuments({ userId });

    // Fix fuel entries
    const fuelEntries = await FuelEntry.find({ userId });
    results.fuelEntries.before = fuelEntries.length;

    let fuelEntriesFixed = 0;
    for (const entry of fuelEntries) {
      let needsUpdate = false;

      // Add id if missing
      if (!entry.id && entry._id) {
        entry.id = entry._id.toString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await entry.save();
        fuelEntriesFixed++;
      }
    }

    results.fuelEntries.fixed = fuelEntriesFixed;
    results.fuelEntries.after = await FuelEntry.countDocuments({ userId });

    // Fix expense entries
    const expenseEntries = await ExpenseEntry.find({ userId });
    results.expenseEntries.before = expenseEntries.length;

    let expenseEntriesFixed = 0;
    for (const entry of expenseEntries) {
      let needsUpdate = false;

      // Add id if missing
      if (!entry.id && entry._id) {
        entry.id = entry._id.toString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await entry.save();
        expenseEntriesFixed++;
      }
    }

    results.expenseEntries.fixed = expenseEntriesFixed;
    results.expenseEntries.after = await ExpenseEntry.countDocuments({ userId });

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Data cleanup completed successfully',
        results
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cleaning up data:', error);
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
