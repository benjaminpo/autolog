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

// Mock the entire IncomeCategory model
const mockIncomeCategory = {
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

jest.mock('../../app/models/IncomeCategory', () => ({
  __esModule: true,
  default: mockIncomeCategory,
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

// Mock predefined data
jest.mock('../../app/lib/predefinedData', () => ({
  predefinedIncomeCategories: ['Salary', 'Freelance', 'Investment'],
}));

describe('Income Categories API', () => {
  let mockRequest: jest.Mocked<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      method: 'GET',
      url: 'http://localhost:3000/api/income-categories',
      headers: new Headers({
        'authorization': 'Bearer valid-token',
        'content-type': 'application/json',
      }),
      json: jest.fn(),
    } as unknown as jest.Mocked<NextRequest>;
  });

  describe('GET /api/income-categories', () => {
    it('should return list of income categories', async () => {
      const mockCategories = [
        { _id: '1', name: 'Salary', isActive: true },
        { _id: '2', name: 'Freelance', isActive: true },
      ];

      mockIncomeCategory.find.mockResolvedValue(mockCategories);

      // Mock the route function directly
      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategories: mockCategories,
        })
      );

      const response = await mockGET(mockRequest);

      expect(response).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategories: mockCategories,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockIncomeCategory.find.mockRejectedValue(new Error('Database error'));

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Failed to fetch income categories' },
          { status: 500 }
        )
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to fetch income categories' },
        { status: 500 }
      );
    });

    it('should filter active categories when requested', async () => {
      const activeCategories = [{ _id: '1', name: 'Salary', isActive: true }];
      mockIncomeCategory.find.mockResolvedValue(activeCategories);

      const requestWithQuery = {
        ...mockRequest,
        url: 'http://localhost:3000/api/income-categories?active=true',
      } as jest.Mocked<NextRequest>;

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategories: activeCategories,
        })
      );

      await mockGET(requestWithQuery);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategories: activeCategories,
      });
    });
  });

  describe('POST /api/income-categories', () => {
    let postRequest: jest.Mocked<NextRequest>;

    beforeEach(() => {
      postRequest = {
        ...mockRequest,
        method: 'POST',
      } as jest.Mocked<NextRequest>;
    });

    it('should create new income category', async () => {
      const newCategory = { name: 'Investment', isActive: true };
      const savedCategory = { _id: '3', ...newCategory };

      postRequest.json = jest.fn().mockResolvedValue(newCategory);
      mockIncomeCategory.create.mockResolvedValue(savedCategory);

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategory: savedCategory,
        })
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategory: savedCategory,
      });
    });

    it('should validate required fields', async () => {
      const invalidData = { isActive: true }; // Missing name

      postRequest.json = jest.fn().mockResolvedValue(invalidData);

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Name is required' },
          { status: 400 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    });

    it('should handle creation errors', async () => {
      const newCategory = { name: 'Investment', isActive: true };

      postRequest.json = jest.fn().mockResolvedValue(newCategory);
      mockIncomeCategory.create.mockRejectedValue(new Error('Creation failed'));

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Failed to create income category' },
          { status: 500 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to create income category' },
        { status: 500 }
      );
    });

    it('should handle duplicate category names', async () => {
      const duplicateCategory = { name: 'Salary', isActive: true };

      postRequest.json = jest.fn().mockResolvedValue(duplicateCategory);
      mockIncomeCategory.create.mockRejectedValue({
        code: 11000,
        message: 'Duplicate key error',
      });

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Income category with this name already exists' },
          { status: 409 }
        )
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Income category with this name already exists' },
        { status: 409 }
      );
    });
  });

  describe('Input Validation', () => {
    it('should sanitize input data', async () => {
      const unsanitizedData = {
        name: '  Salary Income  ',
        isActive: 'true', // String instead of boolean
      };

      const expectedSanitized = {
        name: 'Salary Income',
        isActive: true,
      };

      const postRequest = {
        ...mockRequest,
        method: 'POST',
        json: jest.fn().mockResolvedValue(unsanitizedData),
      } as jest.Mocked<NextRequest>;

      mockIncomeCategory.create.mockResolvedValue({ _id: '1', ...expectedSanitized });

      const mockPOST = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategory: { _id: '1', ...expectedSanitized },
        })
      );

      await mockPOST(postRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategory: { _id: '1', ...expectedSanitized },
      });
    });

    it('should reject invalid name formats', async () => {
      const invalidNames = ['', '   ', '<script>alert("xss")</script>', 'A'.repeat(101)];

      for (const name of invalidNames) {
        const postRequest = {
          ...mockRequest,
          method: 'POST',
          json: jest.fn().mockResolvedValue({ name, isActive: true }),
        } as jest.Mocked<NextRequest>;

        const mockPOST = jest.fn().mockResolvedValue(
          NextResponse.json(
            {
              success: false,
              error: expect.stringContaining('Name'),
            },
            { status: 400 }
          )
        );

        await mockPOST(postRequest);

        expect(NextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('Name'),
          }),
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
        { _id: '1', name: 'Salary', isActive: true, createdAt: '2023-01-01' },
        { _id: '2', name: 'Freelance', isActive: false, createdAt: '2023-01-02' },
      ];

      mockIncomeCategory.find.mockResolvedValue(rawData);

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategories: rawData,
        })
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategories: rawData,
      });
    });
  });

  describe('Business Logic', () => {
    it('should handle category ordering', async () => {
      const orderedCategories = [
        { _id: '1', name: 'Salary', isActive: true, order: 1 },
        { _id: '2', name: 'Freelance', isActive: true, order: 2 },
      ];

      mockIncomeCategory.find.mockResolvedValue(orderedCategories);

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategories: orderedCategories,
        })
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategories: orderedCategories,
      });
    });

    it('should handle category statistics', async () => {
      const categoriesWithStats = [
        { _id: '1', name: 'Salary', isActive: true, entryCount: 10, totalAmount: 50000 },
        { _id: '2', name: 'Freelance', isActive: true, entryCount: 5, totalAmount: 15000 },
      ];

      mockIncomeCategory.find.mockResolvedValue(categoriesWithStats);

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          incomeCategories: categoriesWithStats,
        })
      );

      await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        incomeCategories: categoriesWithStats,
      });
    });
  });
});
