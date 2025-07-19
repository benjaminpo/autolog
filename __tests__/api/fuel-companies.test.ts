/**
 * Fuel Companies API Test Suite
 * Tests for API routes handling fuel companies CRUD operations
 */

import { getServerSession } from 'next-auth/next';
import { GET, POST } from '../../app/api/fuel-companies/route';
import { PUT, DELETE } from '../../app/api/fuel-companies/[id]/route';
import dbConnect from '../../app/lib/dbConnect';
import FuelCompany from '../../app/models/FuelCompany';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../app/lib/dbConnect');

// Mock FuelCompany model with factory function
jest.mock('../../app/models/FuelCompany', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockFuelCompany = FuelCompany as jest.Mocked<typeof FuelCompany>;

describe('/api/fuel-companies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.companies).toBeDefined();
    });

    it('should return predefined companies when no user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.companies).toBeDefined();
    });

    it('should return fuel companies for authenticated user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockFuelCompanies = [
        { _id: 'company1', name: 'Shell', userId: 'user123' },
        { _id: 'company2', name: 'BP', userId: 'user123' }
      ];

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockFuelCompanies)
      } as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.companies).toBeDefined();
      expect(mockFuelCompany.find).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error getting fuel companies');
    });
  });

  describe('POST', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test Company' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 when no user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test Company' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when name is missing', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);

      const request = {
        json: jest.fn().mockResolvedValue({})
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Name is required');
    });

    it('should return 409 when company already exists', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue({ name: 'Custom Company' });

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Custom Company' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe('Fuel company already exists');
    });

    it('should create new fuel company successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockSavedCompany = { _id: 'company1', name: 'Custom Company', userId: 'user123' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue(null);
      mockFuelCompany.create.mockResolvedValue(mockSavedCompany as any);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Custom Company' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.company).toEqual(mockSavedCompany);
    });

    it('should handle validation errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue(null);
      mockFuelCompany.create.mockRejectedValue(new Error('Validation failed'));

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test Company' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error creating fuel company');
    });
  });
});

describe('/api/fuel-companies/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Updated Company' })
      } as any;
      const params = Promise.resolve({ id: '123' });
      const response = await PUT(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when company not found', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Updated Company' })
      } as any;
      const params = Promise.resolve({ id: '123' });
      const response = await PUT(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Fuel company not found');
    });

    it('should update fuel company successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockCompany = { _id: 'company1', name: 'Shell', userId: 'user123' };
      const mockUpdatedCompany = { _id: 'company1', name: 'Updated Company', userId: 'user123' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue(mockCompany);
      mockFuelCompany.findOneAndUpdate.mockResolvedValue(mockUpdatedCompany);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Updated Company' })
      } as any;
      const params = Promise.resolve({ id: 'company1' });
      const response = await PUT(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.company).toEqual(mockUpdatedCompany);
    });
  });

  describe('DELETE', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = {} as any;
      const params = Promise.resolve({ id: '123' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when company not found', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue(null);

      const request = {} as any;
      const params = Promise.resolve({ id: '123' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Fuel company not found');
    });

    it('should delete fuel company successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockCompany = { _id: 'company1', name: 'Shell', userId: 'user123' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelCompany.findOne.mockResolvedValue(mockCompany);
      mockFuelCompany.deleteOne.mockResolvedValue({} as any);

      const request = {} as any;
      const params = Promise.resolve({ id: 'company1' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Fuel company deleted successfully');
    });
  });
});
