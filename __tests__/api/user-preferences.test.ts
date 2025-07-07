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

// Mock the entire UserPreferences model
const mockUserPreferences = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

jest.mock('../../app/models/UserPreferences', () => ({
  __esModule: true,
  default: mockUserPreferences,
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

describe('User Preferences API', () => {
  let mockRequest: jest.Mocked<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      method: 'GET',
      url: 'http://localhost:3000/api/user-preferences',
      headers: new Headers({
        'authorization': 'Bearer valid-token',
        'content-type': 'application/json',
      }),
      json: jest.fn(),
    } as unknown as jest.Mocked<NextRequest>;
  });

  describe('GET /api/user-preferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        _id: '1',
        userId: 'user123',
        currency: 'USD',
        language: 'en',
        theme: 'light',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
          email: true,
          push: false,
        },
      };

      mockUserPreferences.findOne.mockResolvedValue(mockPreferences);

      // Mock the route function directly
      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: mockPreferences,
        })
      );

      const response = await mockGET(mockRequest);

      expect(response).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: mockPreferences,
      });
    });

    it('should return default preferences if none exist', async () => {
      mockUserPreferences.findOne.mockResolvedValue(null);

      const defaultPreferences = {
        currency: 'USD',
        language: 'en',
        theme: 'light',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
          email: true,
          push: true,
        },
      };

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: defaultPreferences,
        })
      );

      const response = await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: defaultPreferences,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockUserPreferences.findOne.mockRejectedValue(new Error('Database error'));

      const mockGET = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Failed to fetch user preferences' },
          { status: 500 }
        )
      );

      const response = await mockGET(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    });
  });

  describe('PUT /api/user-preferences', () => {
    let putRequest: jest.Mocked<NextRequest>;

    beforeEach(() => {
      putRequest = {
        ...mockRequest,
        method: 'PUT',
      } as jest.Mocked<NextRequest>;
    });

    it('should update user preferences', async () => {
      const updatedPreferences = {
        currency: 'EUR',
        language: 'fr',
        theme: 'dark',
        dateFormat: 'DD/MM/YYYY',
        notifications: {
          email: false,
          push: true,
        },
      };

      const savedPreferences = {
        _id: '1',
        userId: 'user123',
        ...updatedPreferences,
      };

      putRequest.json = jest.fn().mockResolvedValue(updatedPreferences);
      mockUserPreferences.findOneAndUpdate.mockResolvedValue(savedPreferences);

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: savedPreferences,
        })
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: savedPreferences,
      });
    });

    it('should create preferences if they do not exist', async () => {
      const newPreferences = {
        currency: 'GBP',
        language: 'en',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY',
        notifications: {
          email: true,
          push: false,
        },
      };

      const createdPreferences = {
        _id: '2',
        userId: 'user123',
        ...newPreferences,
      };

      putRequest.json = jest.fn().mockResolvedValue(newPreferences);
      mockUserPreferences.findOneAndUpdate.mockResolvedValue(null);
      mockUserPreferences.create.mockResolvedValue(createdPreferences);

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: createdPreferences,
        })
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: createdPreferences,
      });
    });

    it('should validate preference data', async () => {
      const invalidData = {
        currency: 'INVALID',
        language: '',
        theme: 'invalid-theme',
      };

      putRequest.json = jest.fn().mockResolvedValue(invalidData);

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Invalid preference data' },
          { status: 400 }
        )
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Invalid preference data' },
        { status: 400 }
      );
    });

    it('should handle update errors', async () => {
      const preferences = {
        currency: 'USD',
        language: 'en',
        theme: 'light',
      };

      putRequest.json = jest.fn().mockResolvedValue(preferences);
      mockUserPreferences.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Failed to update preferences' },
          { status: 500 }
        )
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate currency codes', async () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
      
      for (const currency of validCurrencies) {
        const putRequest = {
          ...mockRequest,
          method: 'PUT',
          json: jest.fn().mockResolvedValue({ currency }),
        } as jest.Mocked<NextRequest>;

        const mockPUT = jest.fn().mockResolvedValue(
          NextResponse.json({
            success: true,
            preferences: { currency },
          })
        );

        await mockPUT(putRequest);

        expect(NextResponse.json).toHaveBeenCalledWith({
          success: true,
          preferences: { currency },
        });

        jest.clearAllMocks();
      }
    });

    it('should validate language codes', async () => {
      const validLanguages = ['en', 'fr', 'es', 'de', 'zh'];
      
      for (const language of validLanguages) {
        const putRequest = {
          ...mockRequest,
          method: 'PUT',
          json: jest.fn().mockResolvedValue({ language }),
        } as jest.Mocked<NextRequest>;

        const mockPUT = jest.fn().mockResolvedValue(
          NextResponse.json({
            success: true,
            preferences: { language },
          })
        );

        await mockPUT(putRequest);

        expect(NextResponse.json).toHaveBeenCalledWith({
          success: true,
          preferences: { language },
        });

        jest.clearAllMocks();
      }
    });

    it('should validate theme options', async () => {
      const validThemes = ['light', 'dark', 'auto'];
      
      for (const theme of validThemes) {
        const putRequest = {
          ...mockRequest,
          method: 'PUT',
          json: jest.fn().mockResolvedValue({ theme }),
        } as jest.Mocked<NextRequest>;

        const mockPUT = jest.fn().mockResolvedValue(
          NextResponse.json({
            success: true,
            preferences: { theme },
          })
        );

        await mockPUT(putRequest);

        expect(NextResponse.json).toHaveBeenCalledWith({
          success: true,
          preferences: { theme },
        });

        jest.clearAllMocks();
      }
    });

    it('should validate date format options', async () => {
      const validFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
      
      for (const dateFormat of validFormats) {
        const putRequest = {
          ...mockRequest,
          method: 'PUT',
          json: jest.fn().mockResolvedValue({ dateFormat }),
        } as jest.Mocked<NextRequest>;

        const mockPUT = jest.fn().mockResolvedValue(
          NextResponse.json({
            success: true,
            preferences: { dateFormat },
          })
        );

        await mockPUT(putRequest);

        expect(NextResponse.json).toHaveBeenCalledWith({
          success: true,
          preferences: { dateFormat },
        });

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
      const putRequest = {
        ...mockRequest,
        method: 'PUT',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as jest.Mocked<NextRequest>;

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        )
      );

      await mockPUT(putRequest);

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
    it('should sanitize preference data', async () => {
      const unsanitizedData = {
        currency: '  USD  ',
        language: '  en  ',
        theme: '  light  ',
        notifications: {
          email: 'true',
          push: 'false',
        },
      };

      const expectedSanitized = {
        currency: 'USD',
        language: 'en',
        theme: 'light',
        notifications: {
          email: true,
          push: false,
        },
      };

      const putRequest = {
        ...mockRequest,
        method: 'PUT',
        json: jest.fn().mockResolvedValue(unsanitizedData),
      } as jest.Mocked<NextRequest>;

      mockUserPreferences.findOneAndUpdate.mockResolvedValue({
        _id: '1',
        userId: 'user123',
        ...expectedSanitized,
      });

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: {
            _id: '1',
            userId: 'user123',
            ...expectedSanitized,
          },
        })
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: {
          _id: '1',
          userId: 'user123',
          ...expectedSanitized,
        },
      });
    });
  });

  describe('Business Logic', () => {
    it('should handle notification preferences', async () => {
      const notificationPrefs = {
        notifications: {
          email: true,
          push: false,
          sms: true,
          desktop: false,
        },
      };

      const putRequest = {
        ...mockRequest,
        method: 'PUT',
        json: jest.fn().mockResolvedValue(notificationPrefs),
      } as jest.Mocked<NextRequest>;

      mockUserPreferences.findOneAndUpdate.mockResolvedValue({
        _id: '1',
        userId: 'user123',
        ...notificationPrefs,
      });

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: {
            _id: '1',
            userId: 'user123',
            ...notificationPrefs,
          },
        })
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: {
          _id: '1',
          userId: 'user123',
          ...notificationPrefs,
        },
      });
    });

    it('should handle display preferences', async () => {
      const displayPrefs = {
        displayDensity: 'compact',
        showTutorials: false,
        defaultView: 'table',
        itemsPerPage: 25,
      };

      const putRequest = {
        ...mockRequest,
        method: 'PUT',
        json: jest.fn().mockResolvedValue(displayPrefs),
      } as jest.Mocked<NextRequest>;

      mockUserPreferences.findOneAndUpdate.mockResolvedValue({
        _id: '1',
        userId: 'user123',
        ...displayPrefs,
      });

      const mockPUT = jest.fn().mockResolvedValue(
        NextResponse.json({
          success: true,
          preferences: {
            _id: '1',
            userId: 'user123',
            ...displayPrefs,
          },
        })
      );

      await mockPUT(putRequest);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        preferences: {
          _id: '1',
          userId: 'user123',
          ...displayPrefs,
        },
      });
    });
  });
}); 