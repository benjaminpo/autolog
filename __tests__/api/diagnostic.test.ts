import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../app/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../app/models/Vehicle', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../app/lib/idUtils', () => ({
  normalizeIds: jest.fn(),
  getObjectId: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: jest.fn().mockImplementation((body, options) => ({
    json: () => Promise.resolve(JSON.parse(body)),
    status: options?.status || 200,
  })),
}));

// Import after mocks
import { getServerSession } from 'next-auth/next';
import dbConnect from '../../app/lib/dbConnect';
import Vehicle from '../../app/models/Vehicle';
import { normalizeIds, getObjectId } from '../../app/lib/idUtils';
import { GET } from '../../app/api/diagnostic/route';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockVehicle = Vehicle as jest.Mocked<typeof Vehicle>;
const mockNormalizeIds = normalizeIds as jest.MockedFunction<typeof normalizeIds>;
const mockGetObjectId = getObjectId as jest.MockedFunction<typeof getObjectId>;

describe('Diagnostic API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock for getObjectId
    mockGetObjectId.mockReturnValue('default-id');
  });

  describe('GET /api/diagnostic', () => {
    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockReq = {
        nextUrl: { searchParams: { get: jest.fn().mockReturnValue(null) } },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    });

    it('should return diagnostic information successfully', async () => {
      const mockSession = { 
        user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z'
      };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock vehicles
      const mockVehicles = [
        {
          _id: 'vehicle1',
          id: 'vehicle1',
          name: 'Toyota Camry',
          vehicleType: 'car',
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
          dateAdded: '2023-01-01',
          toObject: jest.fn().mockReturnValue({
            _id: 'vehicle1',
            id: 'vehicle1',
            name: 'Toyota Camry',
            vehicleType: 'car',
            userId: 'user123',
            dateAdded: '2023-01-01',
          }),
        },
      ];

      const normalizedVehicles = [
        {
          _id: 'vehicle1',
          id: 'vehicle1',
          name: 'Toyota Camry',
          vehicleType: 'car',
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
          dateAdded: '2023-01-01',
        },
      ];

      mockVehicle.find.mockResolvedValue(mockVehicles as any);
      mockVehicle.countDocuments.mockResolvedValue(1);
      
      // The toObject() call returns a simplified vehicle object
      const expectedToObjectResult = [
        {
          _id: 'vehicle1',
          id: 'vehicle1',
          name: 'Toyota Camry',
          vehicleType: 'car',
          userId: 'user123',
          dateAdded: '2023-01-01',
        }
      ];
      
      mockNormalizeIds.mockReturnValue(normalizedVehicles as any);
      mockGetObjectId.mockReturnValue('vehicle1');

      const mockReq = {
        nextUrl: { searchParams: { get: jest.fn().mockReturnValue(null) } },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockVehicle.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockVehicle.countDocuments).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockNormalizeIds).toHaveBeenCalledWith(expectedToObjectResult);

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: true,
          diagnosticInfo: {
            userId: 'user123',
            vehicleCount: 1,
            vehicles: [
              {
                id: 'vehicle1',
                _id: 'vehicle1',
                name: 'Toyota Camry',
                vehicleType: 'car',
                brand: 'Toyota',
                model: 'Camry',
                year: 2020,
                dateAdded: '2023-01-01',
              },
            ],
            rawVehicles: [
              {
                _id: 'vehicle1',
                id: 'vehicle1',
                name: 'Toyota Camry',
                vehicleType: 'car',
                userId: 'user123',
                dateAdded: '2023-01-01',
              },
            ],
            localStorageVehicles: null,
            session: {
              user: {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
              },
              expires: '2024-12-31T23:59:59.999Z',
            },
          },
        }),
        { status: 200 }
      );
    });

    it('should handle localStorage data from query params', async () => {
      const mockSession = { 
        user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z'
      };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      mockVehicle.find.mockResolvedValue([]);
      mockVehicle.countDocuments.mockResolvedValue(0);
      mockNormalizeIds.mockReturnValue([]);

      const localStorageData = [{ id: 'car1', name: 'Local Car' }];
      const mockReq = {
        nextUrl: { 
          searchParams: { 
            get: jest.fn().mockReturnValue(JSON.stringify(localStorageData)) 
          } 
        },
      } as unknown as NextRequest;

      await GET(mockReq);

             expect(NextResponse).toHaveBeenCalledWith(
         JSON.stringify({
           success: true,
           diagnosticInfo: {
             userId: 'user123',
             vehicleCount: 0,
             vehicles: [],
             rawVehicles: [],
             localStorageVehicles: localStorageData,
             session: {
               user: {
                 id: 'user123',
                 name: 'Test User',
                 email: 'test@example.com',
               },
               expires: '2024-12-31T23:59:59.999Z',
             },
           },
         }),
         { status: 200 }
       );
    });

    it('should handle malformed localStorage data', async () => {
      const mockSession = { 
        user: { id: 'user123' },
        expires: '2024-12-31T23:59:59.999Z'
      };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      mockVehicle.find.mockResolvedValue([]);
      mockVehicle.countDocuments.mockResolvedValue(0);
      mockNormalizeIds.mockReturnValue([]);

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockReq = {
        nextUrl: { 
          searchParams: { 
            get: jest.fn().mockReturnValue('invalid-json') 
          } 
        },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse localStorage data:', expect.any(Error));
             expect(NextResponse).toHaveBeenCalledWith(
         JSON.stringify({
           success: true,
           diagnosticInfo: {
             userId: 'user123',
             vehicleCount: 0,
             vehicles: [],
             rawVehicles: [],
             localStorageVehicles: null,
             session: {
               user: {
                 id: 'user123',
               },
               expires: '2024-12-31T23:59:59.999Z',
             },
           },
         }),
         { status: 200 }
       );

      consoleSpy.mockRestore();
    });

    it('should handle database connection errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockReq = {
        nextUrl: { searchParams: { get: jest.fn().mockReturnValue(null) } },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(consoleSpy).toHaveBeenCalledWith('Error running diagnostics:', expect.any(Error));
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

      const mockReq = {
        nextUrl: { searchParams: { get: jest.fn().mockReturnValue(null) } },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(consoleSpy).toHaveBeenCalledWith('Error running diagnostics:', expect.any(Error));
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

    it('should handle empty vehicle collections', async () => {
      const mockSession = { 
        user: { id: 'user123', name: 'Test User', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z'
      };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      mockVehicle.find.mockResolvedValue([]);
      mockVehicle.countDocuments.mockResolvedValue(0);
      mockNormalizeIds.mockReturnValue([]);

      const mockReq = {
        nextUrl: { searchParams: { get: jest.fn().mockReturnValue(null) } },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(NextResponse).toHaveBeenCalledWith(
        JSON.stringify({
          success: true,
          diagnosticInfo: {
            userId: 'user123',
            vehicleCount: 0,
            vehicles: [],
            rawVehicles: [],
            localStorageVehicles: null,
            session: {
              user: {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
              },
              expires: '2024-12-31T23:59:59.999Z',
            },
          },
        }),
        { status: 200 }
      );
    });

    it('should handle vehicles with missing toObject method', async () => {
      const mockSession = { 
        user: { id: 'user123' },
        expires: '2024-12-31T23:59:59.999Z'
      };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      // Mock vehicles without toObject method
      const mockVehicles = [
        {
          _id: 'vehicle1',
          id: 'vehicle1',
          name: 'Toyota Camry',
          // Missing toObject method - should cause error
        },
      ];

      mockVehicle.find.mockResolvedValue(mockVehicles as any);

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockReq = {
        nextUrl: { searchParams: { get: jest.fn().mockReturnValue(null) } },
      } as unknown as NextRequest;

      await GET(mockReq);

      expect(consoleSpy).toHaveBeenCalledWith('Error running diagnostics:', expect.any(Error));
             expect(NextResponse).toHaveBeenCalledWith(
         JSON.stringify({
           success: false,
           message: 'Internal server error',
           error: 'v.toObject is not a function',
         }),
         { status: 500 }
       );

      consoleSpy.mockRestore();
    });
  });
}); 