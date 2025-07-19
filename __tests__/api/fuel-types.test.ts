import { getServerSession } from 'next-auth/next';
import { GET, POST } from '../../app/api/fuel-types/route';
import { PUT, DELETE } from '../../app/api/fuel-types/[id]/route';
import dbConnect from '../../app/lib/dbConnect';
import FuelType from '../../app/models/FuelType';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../app/lib/dbConnect');

// Mock FuelType model with factory function
jest.mock('../../app/models/FuelType', () => ({
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
const mockFuelType = FuelType as jest.Mocked<typeof FuelType>;

describe('/api/fuel-types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return predefined fuel types when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.types).toBeDefined();
    });

    it('should return predefined fuel types when no user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.types).toBeDefined();
    });

    it('should return fuel types for authenticated user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockFuelTypes = [
        { _id: 'type1', name: 'Premium', userId: 'user123' },
        { _id: 'type2', name: 'Regular', userId: 'user123' }
      ];

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockFuelTypes)
      } as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.types).toBeDefined();
      expect(mockFuelType.find).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error getting fuel types');
    });
  });

  describe('POST', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test Type' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 when no user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test Type' })
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

    it('should return 409 when fuel type already exists', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue({ name: 'Premium' });

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Premium' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe('Fuel type already exists');
    });

    it('should create new fuel type successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockSavedType = { _id: 'type1', name: 'Premium', userId: 'user123' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue(null);
      mockFuelType.create.mockResolvedValue(mockSavedType as any);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Premium' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.type).toEqual(mockSavedType);
    });

    it('should handle validation errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue(null);
      mockFuelType.create.mockRejectedValue(new Error('Validation failed'));

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Test Type' })
      } as any;
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe('Error creating fuel type');
    });
  });
});

describe('/api/fuel-types/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Updated Type' })
      } as any;
      const params = Promise.resolve({ id: '123' });
      const response = await PUT(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when fuel type not found', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue(null);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Updated Type' })
      } as any;
      const params = Promise.resolve({ id: '123' });
      const response = await PUT(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Fuel type not found');
    });

    it('should update fuel type successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockFuelTypeInstance = { _id: 'type1', name: 'Premium', userId: 'user123' };
      const mockUpdatedType = { _id: 'type1', name: 'Updated Type', userId: 'user123' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue(mockFuelTypeInstance);
      mockFuelType.findOneAndUpdate.mockResolvedValue(mockUpdatedType);

      const request = {
        json: jest.fn().mockResolvedValue({ name: 'Updated Type' })
      } as any;
      const params = Promise.resolve({ id: 'type1' });
      const response = await PUT(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.type).toEqual(mockUpdatedType);
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

    it('should return 404 when fuel type not found', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue(null);

      const request = {} as any;
      const params = Promise.resolve({ id: '123' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe('Fuel type not found');
    });

    it('should delete fuel type successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockFuelTypeInstance = { _id: 'type1', name: 'Premium', userId: 'user123' };

      mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelType.findOne.mockResolvedValue(mockFuelTypeInstance);
      mockFuelType.deleteOne.mockResolvedValue({} as any);

      const request = {} as any;
      const params = Promise.resolve({ id: 'type1' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Fuel type deleted successfully');
    });
  });
});
