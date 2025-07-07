import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../../lib/dbConnect';
import FuelEntry from '../../../models/FuelEntry';
import { authOptions } from '../../auth/authOptions';

// GET /api/fuel-entries/[id] - Get a specific fuel entry
export async function GET(
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
                JSON.stringify({ message: 'Missing entry ID' }),
                { status: 400 }
            );
        }
        const entry = await FuelEntry.findOne({ _id: id, userId });
        if (!entry) {
            return new NextResponse(
                JSON.stringify({ message: 'Fuel entry not found' }),
                { status: 404 }
            );
        }
        return new NextResponse(
            JSON.stringify({ entry }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching fuel entry:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Internal server error' }),
            { status: 500 }
        );
    }
}
// PUT /api/fuel-entries/[id] - Update a specific fuel entry
export async function PUT(
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

        // Log the ID for debugging
        console.log('PUT /api/fuel-entries/[id] - ID received:', id);

        if (!id || id === 'undefined' || id === 'null') {
            return new NextResponse(
                JSON.stringify({ message: 'Missing or invalid entry ID' }),
                { status: 400 }
            );
        }

        // Validate that the ID is a valid MongoDB ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return new NextResponse(
                JSON.stringify({ message: 'Invalid entry ID format' }),
                { status: 400 }
            );
        }

        const updateData = await request.json();
        const entry = await FuelEntry.findOneAndUpdate(
            { _id: id, userId },
            { ...updateData, userId },
            { new: true, runValidators: true }
        );
        if (!entry) {
            return new NextResponse(
                JSON.stringify({ message: 'Fuel entry not found' }),
                { status: 404 }
            );
        }

        // Transform the entry for client consistency
        const entryObj = entry.toObject();
        const entryId = entry._id ? entry._id.toString() : '';
        const transformedEntry = {
            ...entryObj,
            // Ensure the entry has an id field for client-side compatibility
            id: entryId
        };

        return new NextResponse(
            JSON.stringify({ message: 'Fuel entry updated successfully', entry: transformedEntry }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating fuel entry:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Internal server error', error: (error as Error).message }),
            { status: 500 }
        );
    }
}
// DELETE /api/fuel-entries/[id] - Delete a specific fuel entry
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

        // Log the ID for debugging
        console.log('DELETE /api/fuel-entries/[id] - ID received:', id);

        if (!id || id === 'undefined' || id === 'null') {
            return new NextResponse(
                JSON.stringify({ message: 'Missing or invalid entry ID' }),
                { status: 400 }
            );
        }

        // Validate that the ID is a valid MongoDB ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return new NextResponse(
                JSON.stringify({ message: 'Invalid entry ID format' }),
                { status: 400 }
            );
        }

        const entry = await FuelEntry.findOneAndDelete({ _id: id, userId });
        if (!entry) {
            return new NextResponse(
                JSON.stringify({ message: 'Fuel entry not found' }),
                { status: 404 }
            );
        }

        return new NextResponse(
            JSON.stringify({ message: 'Fuel entry deleted successfully' }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting fuel entry:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Internal server error' }),
            { status: 500 }
        );
    }
}
