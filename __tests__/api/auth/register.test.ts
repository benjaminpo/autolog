import { NextRequest } from 'next/server';

// Define mocks first
const mockDbConnect = jest.fn();
const mockDebugMongoConnection = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserSave = jest.fn();

const mockUser = jest.fn(() => ({
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  save: mockUserSave
}));

// Set up static properties on the mock constructor
Object.assign(mockUser, {
  findOne: mockUserFindOne,
  modelName: 'User',
  collection: { name: 'users' }
});

// Mock modules
jest.mock('../../../app/lib/dbConnect', () => mockDbConnect);
jest.mock('../../../app/lib/debugMongo', () => mockDebugMongoConnection);
jest.mock('../../../app/models/User', () => mockUser);
jest.mock('../../../app/config', () => ({
  database: { uri: 'mongodb://localhost:27017/test-db' }
}));
jest.mock('mongoose', () => ({
  connection: { readyState: 1, db: { databaseName: 'test-db' } }
}));

// Import after mocking
const { POST } = require('../../../app/api/auth/register/route');

// Mock console methods
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockDebugMongoConnection.mockResolvedValue(undefined);
    mockUserFindOne.mockResolvedValue(null);
    mockUserSave.mockResolvedValue({ _id: 'user123', name: 'Test User', email: 'test@example.com' });
    
    (process.env as any).MONGODB_URI = 'mongodb://localhost:27017/test-db';
    (process.env as any).NODE_ENV = 'test';
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const createMockRequest = (body: any) => ({
    json: jest.fn().mockResolvedValue(body)
  } as unknown as NextRequest);

  describe('Success cases', () => {
    it('should register a new user successfully', async () => {
      const requestBody = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.message).toBe('User registered successfully');
      expect(responseData.user).toEqual({
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      });
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when name is missing', async () => {
      const requestBody = { email: 'test@example.com', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe('Please provide all required fields');
    });

    it('should return 400 when email is missing', async () => {
      const requestBody = { name: 'Test User', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe('Please provide all required fields');
    });

    it('should return 400 when password is missing', async () => {
      const requestBody = { name: 'Test User', email: 'test@example.com' };
      const mockRequest = createMockRequest(requestBody);
      
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe('Please provide all required fields');
    });
  });

  describe('User exists', () => {
    it('should return 409 when user already exists', async () => {
      const requestBody = { name: 'Test User', email: 'existing@example.com', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      mockUserFindOne.mockResolvedValue({ _id: 'existing123', email: 'existing@example.com' });

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.message).toBe('User with this email already exists');
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database connection error', async () => {
      const requestBody = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error));
    });

    it('should return 500 on user save error', async () => {
      const requestBody = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      mockUserSave.mockRejectedValue(new Error('Save failed'));

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe('Internal server error');
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';

      const requestBody = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const mockRequest = createMockRequest(requestBody);
      
      mockDbConnect.mockRejectedValue(new Error('Specific test error'));

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Specific test error');

      (process.env as any).NODE_ENV = originalEnv;
    });
  });
}); 