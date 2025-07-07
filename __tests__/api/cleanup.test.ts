import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../app/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../app/models/FuelEntry', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../app/models/ExpenseEntry', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../app/models/Vehicle', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('next/server', () => ({
  NextResponse: jest.fn().mockImplementation((body, options) => ({
    json: () => Promise.resolve(JSON.parse(body)),
    status: options?.status || 200,
  })),
}));

// Import after mocks
import { getServerSession } from 'next-auth/next';
import dbConnect from '../../app/lib/dbConnect';
import FuelEntry from '../../app/models/FuelEntry';
import ExpenseEntry from '../../app/models/ExpenseEntry';
import Vehicle from '../../app/models/Vehicle';
import { POST } from '../../app/api/cleanup/route';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockFuelEntry = FuelEntry as jest.Mocked<typeof FuelEntry>;
const mockExpenseEntry = ExpenseEntry as jest.Mocked<typeof ExpenseEntry>;
const mockVehicle = Vehicle as jest.Mocked<typeof Vehicle>;

describe('Cleanup API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/cleanup', () => {
    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await POST();

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    });

    it('should successfully clean up data with no fixes needed', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock vehicles with proper id fields
      const mockVehicles = [
        { _id: 'vehicle1', id: 'vehicle1', save: jest.fn() },
        { _id: 'vehicle2', id: 'vehicle2', save: jest.fn() },
      ];

      // Mock fuel entries with proper id fields
      const mockFuelEntries = [
        { _id: 'fuel1', id: 'fuel1', save: jest.fn() },
        { _id: 'fuel2', id: 'fuel2', save: jest.fn() },
      ];

      // Mock expense entries with proper id fields
      const mockExpenseEntries = [
        { _id: 'expense1', id: 'expense1', save: jest.fn() },
      ];

      mockVehicle.find.mockResolvedValue(mockVehicles as any);
      mockVehicle.countDocuments.mockResolvedValue(2);

      mockFuelEntry.find.mockResolvedValue(mockFuelEntries as any);
      mockFuelEntry.countDocuments.mockResolvedValue(2);

      mockExpenseEntry.find.mockResolvedValue(mockExpenseEntries as any);
      mockExpenseEntry.countDocuments.mockResolvedValue(1);

      await POST();

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockVehicle.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockFuelEntry.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockExpenseEntry.find).toHaveBeenCalledWith({ userId: 'user123' });

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: true,
          message: 'Data cleanup completed successfully',
          results: {
            vehicles: {
              before: 2,
              after: 2,
              fixed: 0,
            },
            fuelEntries: {
              before: 2,
              after: 2,
              fixed: 0,
            },
            expenseEntries: {
              before: 1,
              after: 1,
              fixed: 0,
            },
          },
        }),
        { status: 200 }
      );
    });

    it('should fix missing id fields', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock vehicles missing id fields
      const mockVehicles = [
        { 
          _id: { toString: () => 'vehicle1' }, 
          id: undefined, 
          save: jest.fn().mockResolvedValue(true) 
        },
        { 
          _id: { toString: () => 'vehicle2' }, 
          id: 'vehicle2', 
          save: jest.fn() 
        },
      ];

      // Mock fuel entries missing id fields
      const mockFuelEntries = [
        { 
          _id: { toString: () => 'fuel1' }, 
          id: undefined, 
          save: jest.fn().mockResolvedValue(true) 
        },
      ];

      // Mock expense entries with proper id fields
      const mockExpenseEntries = [
        { _id: { toString: () => 'expense1' }, id: 'expense1', save: jest.fn() },
      ];

      mockVehicle.find.mockResolvedValue(mockVehicles as any);
      mockVehicle.countDocuments.mockResolvedValue(2);

      mockFuelEntry.find.mockResolvedValue(mockFuelEntries as any);
      mockFuelEntry.countDocuments.mockResolvedValue(1);

      mockExpenseEntry.find.mockResolvedValue(mockExpenseEntries as any);
      mockExpenseEntry.countDocuments.mockResolvedValue(1);

      await POST();

      expect(mockVehicles[0].save).toHaveBeenCalled();
      expect(mockVehicles[1].save).not.toHaveBeenCalled();
      expect(mockFuelEntries[0].save).toHaveBeenCalled();

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: true,
          message: 'Data cleanup completed successfully',
          results: {
            vehicles: {
              before: 2,
              after: 2,
              fixed: 1,
            },
            fuelEntries: {
              before: 1,
              after: 1,
              fixed: 1,
            },
            expenseEntries: {
              before: 1,
              after: 1,
              fixed: 0,
            },
          },
        }),
        { status: 200 }
      );
    });

    it('should handle database connection errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await POST();

      expect(consoleSpy).toHaveBeenCalledWith('Error cleaning up data:', expect.any(Error));
      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: 'Database connection failed',
        }),
        { status: 500 }
      );

      consoleSpy.mockRestore();
    });

    it('should handle vehicle query errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock vehicle query error
      mockVehicle.find.mockRejectedValue(new Error('Vehicle query failed'));

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await POST();

      expect(consoleSpy).toHaveBeenCalledWith('Error cleaning up data:', expect.any(Error));
      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: 'Vehicle query failed',
        }),
        { status: 500 }
      );

      consoleSpy.mockRestore();
    });

    it('should handle save errors gracefully', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock vehicle with save error
      const mockVehicles = [
        { 
          _id: { toString: () => 'vehicle1' }, 
          id: undefined, 
          save: jest.fn().mockRejectedValue(new Error('Save failed')) 
        },
      ];

      mockVehicle.find.mockResolvedValue(mockVehicles as any);

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await POST();

      expect(consoleSpy).toHaveBeenCalledWith('Error cleaning up data:', expect.any(Error));
      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: 'Save failed',
        }),
        { status: 500 }
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty collections', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock empty collections
      mockVehicle.find.mockResolvedValue([]);
      mockVehicle.countDocuments.mockResolvedValue(0);

      mockFuelEntry.find.mockResolvedValue([]);
      mockFuelEntry.countDocuments.mockResolvedValue(0);

      mockExpenseEntry.find.mockResolvedValue([]);
      mockExpenseEntry.countDocuments.mockResolvedValue(0);

      await POST();

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: true,
          message: 'Data cleanup completed successfully',
          results: {
            vehicles: {
              before: 0,
              after: 0,
              fixed: 0,
            },
            fuelEntries: {
              before: 0,
              after: 0,
              fixed: 0,
            },
            expenseEntries: {
              before: 0,
              after: 0,
              fixed: 0,
            },
          },
        }),
        { status: 200 }
      );
    });
  });
}); 