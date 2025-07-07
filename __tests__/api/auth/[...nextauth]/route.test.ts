import { GET, POST } from '../../../../app/api/auth/[...nextauth]/route';

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

describe('NextAuth Route Handler', () => {
  it('should export GET handler', () => {
    expect(GET).toBeDefined();
  });

  it('should export POST handler', () => {
    expect(POST).toBeDefined();
  });

  it('should have both handlers be the same function', () => {
    // NextAuth returns the same handler for both GET and POST
    expect(GET).toBe(POST);
  });
}); 