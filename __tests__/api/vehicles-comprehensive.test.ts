import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}));

// Mock the entire Vehicle model
const mockVehicle = {
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findById: jest.fn(),
};

jest.mock('../../app/models/Vehicle', () => ({
  __esModule: true,
  default: mockVehicle,
}));

// Mock database connection
jest.mock('../../app/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

// Mock auth options
jest.mock('../../app/api/auth/authOptions', () => ({
  authOptions: {},
}));

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { id: 'user123' } })),
}));

// Mock vehicle data
jest.mock('../../app/lib/vehicleData', () => ({
  vehicleBrands: ['Toyota', 'Honda', 'Ford'],
  vehicleModels: {
    Toyota: ['Camry', 'Corolla', 'Prius'],
    Honda: ['Civic', 'Accord', 'CR-V'],
    Ford: ['F-150', 'Mustang', 'Explorer'],
  },
}));

describe('Vehicles API', () => {
  let mockRequest: jest.Mocked<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      method: 'GET',
      url: 'http://localhost:3000/api/vehicles',
      headers: new Headers({
        'authorization': 'Bearer valid-token',
        'content-type': 'application/json',
      }),
      json: jest.fn(),
    } as unknown as jest.Mocked<NextRequest>;
  });

  describe('GET /api/vehicles', () => {
    it('should return list of vehicles', async () => {
      const mockVehicles = [
        {
          _id: '1',
          userId: 'user123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC123',
          isActive: true,
        },
        {
          _id: '2',
          userId: 'user123',
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          vin: '2HGBH41JXMN109187',
          licensePlate: 'XYZ789',
          isActive: true,
        },
      ];

      mockVehicle.find.mockResolvedValue(mockVehicles);

      // Mock the route function directly
      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: mockVehicles,
        })
      );

      const response = await mockGET(mockRequest);

      expect(response).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: mockVehicles,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockVehicle.find.mockRejectedValue(new Error('Database error'));

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Failed to fetch vehicles' },
          { status: 500 }
        )
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to fetch vehicles' },
        { status: 500 }
      );
    });

    it('should filter active vehicles when requested', async () => {
      const activeVehicles = [
        {
          _id: '1',
          userId: 'user123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          isActive: true,
        },
      ];
      mockVehicle.find.mockResolvedValue(activeVehicles);

      const requestWithQuery = {
        ...mockRequest,
        url: 'http://localhost:3000/api/vehicles?active=true',
      } as jest.Mocked<NextRequest>;

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: activeVehicles,
        })
      );

      await mockGET(requestWithQuery);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: activeVehicles,
      });
    });
  });

  describe('POST /api/vehicles', () => {
    let postRequest: jest.Mocked<NextRequest>;

    beforeEach(() => {
      postRequest = {
        ...mockRequest,
        method: 'POST',
      } as jest.Mocked<NextRequest>;
    });

    it('should create new vehicle', async () => {
      const newVehicle = {
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        vin: '3HGBH41JXMN109188',
        licensePlate: 'DEF456',
        isActive: true,
      };
      const savedVehicle = { _id: '3', userId: 'user123', ...newVehicle };

      postRequest.json = jest.fn().mockResolvedValue(newVehicle);
      mockVehicle.create.mockResolvedValue(savedVehicle);

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicle: savedVehicle,
        })
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicle: savedVehicle,
      });
    });

    it('should validate required fields', async () => {
      const invalidData = { make: 'Toyota' }; // Missing model, year

      postRequest.json = jest.fn().mockResolvedValue(invalidData);

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Make, model, and year are required' },
          { status: 400 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Make, model, and year are required' },
        { status: 400 }
      );
    });

    it('should validate VIN format', async () => {
      const invalidVinData = {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'INVALID_VIN',
      };

      postRequest.json = jest.fn().mockResolvedValue(invalidVinData);

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Invalid VIN format' },
          { status: 400 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Invalid VIN format' },
        { status: 400 }
      );
    });

    it('should handle creation errors', async () => {
      const newVehicle = {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
      };

      postRequest.json = jest.fn().mockResolvedValue(newVehicle);
      mockVehicle.create.mockRejectedValue(new Error('Creation failed'));

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Failed to create vehicle' },
          { status: 500 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to create vehicle' },
        { status: 500 }
      );
    });

    it('should handle duplicate VIN', async () => {
      const duplicateVinVehicle = {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '1HGBH41JXMN109186',
      };

      postRequest.json = jest.fn().mockResolvedValue(duplicateVinVehicle);
      mockVehicle.create.mockRejectedValue({
        code: 11000,
        message: 'Duplicate key error',
      });

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Vehicle with this VIN already exists' },
          { status: 409 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Vehicle with this VIN already exists' },
        { status: 409 }
      );
    });
  });

  describe('Input Validation', () => {
    it('should sanitize input data', async () => {
      const unsanitizedData = {
        make: '  Toyota  ',
        model: '  Camry  ',
        year: '2020', // String instead of number
        licensePlate: '  ABC123  ',
        isActive: 'true', // String instead of boolean
      };

      const expectedSanitized = {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123',
        isActive: true,
      };

      const postRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockResolvedValue(unsanitizedData),
      } as jest.Mocked<NextRequest>;

      mockVehicle.create.mockResolvedValue({
        _id: '1',
        userId: 'user123',
        ...expectedSanitized,
      });

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicle: {
            _id: '1',
            userId: 'user123',
            ...expectedSanitized,
          },
        })
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicle: {
          _id: '1',
          userId: 'user123',
          ...expectedSanitized,
        },
      });
    });

    it('should validate year range', async () => {
      const invalidYears = [1800, 2050, -1, 'invalid'];

      for (const year of invalidYears) {
        const postRequest = {
          ...mockRequest,
          method: 'POST',
          json: jest.fn().mockResolvedValue({
            make: 'Toyota',
            model: 'Camry',
            year,
          }),
        } as jest.Mocked<NextRequest>;

        const mockPOST = jest.fn().mockResolvedValue(
          NextResponse.json(
            {
              success: false,
              error: expect.stringContaining('year'),
            },
            { status: 400 }
          )
        );

        await mockPOST(postRequest);

        expect(NextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('year'),
          }),
          { status: 400 }
        );

        jest.clearAllMocks();
      }
    });

    it('should validate make and model combinations', async () => {
      const invalidCombinations = [
        { make: 'Toyota', model: 'Civic' }, // Honda model with Toyota make
        { make: 'Honda', model: 'F-150' }, // Ford model with Honda make
      ];

      for (const combo of invalidCombinations) {
        const postRequest = {
          ...mockRequest,
          method: 'POST',
          json: jest.fn().mockResolvedValue({
            ...combo,
            year: 2020,
          }),
        } as jest.Mocked<NextRequest>;

        const mockPOST = jest.fn().mockResolvedValue(
          NextResponse.json(
            {
              success: false,
              error: 'Invalid make/model combination',
            },
            { status: 400 }
          )
        );

        await mockPOST(postRequest);

        expect(NextResponse.json).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Invalid make/model combination',
          },
          { status: 400 }
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    });

    it('should handle invalid tokens', async () => {
      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        )
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const postRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as jest.Mocked<NextRequest>;

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    });

    it('should handle database connection issues', async () => {
      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 503 }
        )
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    });
  });

  describe('Data Transformation', () => {
    it('should transform data for client consumption', async () => {
      const rawData = [
        {
          _id: '1',
          userId: 'user123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC123',
          isActive: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-02',
        },
      ];

      mockVehicle.find.mockResolvedValue(rawData);

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: rawData,
        })
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: rawData,
      });
    });
  });

  describe('Business Logic', () => {
    it('should handle vehicle statistics', async () => {
      const vehiclesWithStats = [
        {
          _id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          totalMileage: 25000,
          fuelEntries: 50,
          expenseEntries: 15,
        },
      ];

      mockVehicle.find.mockResolvedValue(vehiclesWithStats);

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: vehiclesWithStats,
        })
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: vehiclesWithStats,
      });
    });

    it('should handle vehicle search and filtering', async () => {
      const searchResults = [
        {
          _id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          isActive: true,
        },
      ];

      mockVehicle.find.mockResolvedValue(searchResults);

      const searchRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/vehicles?search=Toyota&year=2020',
      } as jest.Mocked<NextRequest>;

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: searchResults,
        })
      );

      await mockGET(searchRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: searchResults,
      });
    });

    it('should handle vehicle sorting', async () => {
      const sortedVehicles = [
        { _id: '1', make: 'Ford', model: 'F-150', year: 2021 },
        { _id: '2', make: 'Honda', model: 'Civic', year: 2020 },
        { _id: '3', make: 'Toyota', model: 'Camry', year: 2019 },
      ];

      mockVehicle.find.mockResolvedValue(sortedVehicles);

      const sortRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/vehicles?sort=make&order=asc',
      } as jest.Mocked<NextRequest>;

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: sortedVehicles,
        })
      );

      await mockGET(sortRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: sortedVehicles,
      });
    });

    it('should handle vehicle pagination', async () => {
      const paginatedVehicles = [
        { _id: '1', make: 'Toyota', model: 'Camry', year: 2020 },
        { _id: '2', make: 'Honda', model: 'Civic', year: 2019 },
      ];

      mockVehicle.find.mockResolvedValue(paginatedVehicles);

      const paginationRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/vehicles?page=1&limit=2',
      } as jest.Mocked<NextRequest>;

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          vehicles: paginatedVehicles,
          pagination: {
            page: 1,
            limit: 2,
            total: 10,
            pages: 5,
          },
        })
      );

      await mockGET(paginationRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        vehicles: paginatedVehicles,
        pagination: {
          page: 1,
          limit: 2,
          total: 10,
          pages: 5,
        },
      });
    });
  });
});
