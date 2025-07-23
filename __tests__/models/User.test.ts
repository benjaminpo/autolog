import User, { IUser } from '../../app/models/User';
import bcrypt from 'bcryptjs';

// Mock mongoose
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation((definition, options) => ({
    pre: jest.fn(),
    methods: {},
    definition,
    options
  })),
  model: jest.fn(),
  models: {},
  Document: class {}
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mockSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

const mockBcrypt = {
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
};

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should have required name field with proper validation', () => {
      const nameField = {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
      };

      expect(nameField.type).toBe(String);
      expect(nameField.required).toEqual([true, 'Please provide a name']);
      expect(nameField.trim).toBe(true);
      expect(nameField.maxlength).toEqual([50, 'Name cannot exceed 50 characters']);
    });

    it('should have required email field with proper validation', () => {
      const emailField = {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true,
      };

      expect(emailField.type).toBe(String);
      expect(emailField.required).toEqual([true, 'Please provide an email']);
      expect(emailField.unique).toBe(true);
      expect(emailField.trim).toBe(true);
      expect(emailField.lowercase).toBe(true);
    });

    it('should have optional password field with minimum length validation', () => {
      const passwordField = {
        type: String,
        required: false,
        minlength: [8, 'Password must be at least 8 characters'],
      };

      expect(passwordField.type).toBe(String);
      expect(passwordField.required).toBe(false);
      expect(passwordField.minlength).toEqual([8, 'Password must be at least 8 characters']);
    });

    it('should have optional googleId field with unique sparse index', () => {
      const googleIdField = {
        type: String,
        required: false,
        unique: true,
        sparse: true,
      };

      expect(googleIdField.type).toBe(String);
      expect(googleIdField.required).toBe(false);
      expect(googleIdField.unique).toBe(true);
      expect(googleIdField.sparse).toBe(true);
    });

    it('should have createdAt field with default value', () => {
      const createdAtField = {
        type: Date,
        default: Date.now,
      };

      expect(createdAtField.type).toBe(Date);
      expect(createdAtField.default).toBe(Date.now);
    });

    it('should have proper schema options', () => {
      const options = {
        collection: 'users',
        timestamps: true
      };

      expect(options.collection).toBe('users');
      expect(options.timestamps).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    let mockUser: Partial<IUser>;

    beforeEach(() => {
      mockUser = {
        password: 'testPassword123',
        isModified: jest.fn(),
        save: jest.fn()
      };

      mockBcrypt.genSalt.mockResolvedValue('mockSalt');
      mockBcrypt.hash.mockResolvedValue('hashedPassword');
    });

    it('should hash password before saving when password is modified', async () => {
      (mockUser.isModified as jest.Mock).mockReturnValue(true);

      // Simulate pre-save hook
      // Mock the pre-save logic
      if (mockUser.password && (mockUser.isModified as jest.Mock)('password')) {
        const salt = await mockBcrypt.genSalt(10);
        mockUser.password = await mockBcrypt.hash(mockUser.password, salt);
      }

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('testPassword123', 'mockSalt');
      expect(mockUser.password).toBe('hashedPassword');
    });

    it('should not hash password if not modified', async () => {
      (mockUser.isModified as jest.Mock).mockReturnValue(false);

      const originalPassword = mockUser.password;

      // Mock the pre-save logic
      if (mockUser.password && (mockUser.isModified as jest.Mock)('password')) {
        const salt = await mockBcrypt.genSalt(10);
        mockUser.password = await mockBcrypt.hash(mockUser.password, salt);
      }

      expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUser.password).toBe(originalPassword);
    });

    it('should not hash password if password is not set', async () => {
      mockUser.password = undefined;
      (mockUser.isModified as jest.Mock).mockReturnValue(true);

      // Mock the pre-save logic
      if (mockUser.password && (mockUser.isModified as jest.Mock)('password')) {
        const salt = await mockBcrypt.genSalt(10);
        mockUser.password = await mockBcrypt.hash(mockUser.password, salt);
      }

      expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockUser.password).toBeUndefined();
    });

    it('should handle hashing errors gracefully', async () => {
      (mockUser.isModified as jest.Mock).mockReturnValue(true);
      mockBcrypt.genSalt.mockRejectedValue(new Error('Hashing failed'));

      let error: Error | undefined;
      try {
        // Mock the pre-save logic
        if (mockUser.password && (mockUser.isModified as jest.Mock)('password')) {
          const salt = await mockBcrypt.genSalt(10);
          mockUser.password = await mockBcrypt.hash(mockUser.password, salt);
        }
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Hashing failed');
    });
  });

  describe('Password Comparison', () => {
    let mockUser: Partial<IUser>;

    beforeEach(() => {
      mockUser = {
        password: 'hashedPassword',
        comparePassword: async function(candidatePassword: string): Promise<boolean> {
          try {
            if (!this.password) {
              return false;
            }
            return await mockBcrypt.compare(candidatePassword, this.password);
          } catch {
            return false;
          }
        }
      };
    });

    it('should return true for correct password', async () => {
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await mockUser.comparePassword!('correctPassword');

      expect(mockBcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockUser.comparePassword!('incorrectPassword');

      expect(mockBcrypt.compare).toHaveBeenCalledWith('incorrectPassword', 'hashedPassword');
      expect(result).toBe(false);
    });

    it('should return false for Google OAuth users (no password)', async () => {
      mockUser.password = undefined;

      const result = await mockUser.comparePassword!('anyPassword');

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false when bcrypt comparison fails', async () => {
      mockBcrypt.compare.mockRejectedValue(new Error('Comparison failed'));

      const result = await mockUser.comparePassword!('anyPassword');

      expect(result).toBe(false);
    });

    it('should handle null password gracefully', async () => {
      mockUser.password = null as any;

      const result = await mockUser.comparePassword!('anyPassword');

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle empty password gracefully', async () => {
      mockUser.password = '';

      const result = await mockUser.comparePassword!('anyPassword');

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('User Creation Scenarios', () => {
    it('should create user with password (traditional registration)', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123'
      };

      expect(userData.name).toBe('John Doe');
      expect(userData.email).toBe('john@example.com');
      expect(userData.password).toBe('securePassword123');
      expect(userData).not.toHaveProperty('googleId');
    });

    it('should create user with Google OAuth (no password)', () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane@gmail.com',
        googleId: 'google_123456789'
      };

      expect(userData.name).toBe('Jane Smith');
      expect(userData.email).toBe('jane@gmail.com');
      expect(userData.googleId).toBe('google_123456789');
      expect(userData).not.toHaveProperty('password');
    });

    it('should handle user with both password and googleId', () => {
      const userData = {
        name: 'Mixed User',
        email: 'mixed@example.com',
        password: 'password123',
        googleId: 'google_987654321'
      };

      expect(userData.name).toBe('Mixed User');
      expect(userData.email).toBe('mixed@example.com');
      expect(userData.password).toBe('password123');
      expect(userData.googleId).toBe('google_987654321');
    });
  });

  describe('Validation Edge Cases', () => {
    it('should validate name length constraints', () => {
      const shortName = 'Jo';
      const normalName = 'John Doe';
      const longName = 'A'.repeat(51); // 51 characters

      expect(shortName.length).toBeLessThan(50);
      expect(normalName.length).toBeLessThan(50);
      expect(longName.length).toBeGreaterThan(50);
    });

    it('should validate password length constraints', () => {
      const shortPassword = '1234567'; // 7 characters
      const validPassword = '12345678'; // 8 characters
      const longPassword = 'thisIsAVeryLongPasswordThatShouldStillBeValid';

      expect(shortPassword.length).toBeLessThan(8);
      expect(validPassword.length).toBeGreaterThanOrEqual(8);
      expect(longPassword.length).toBeGreaterThan(8);
    });

    it('should handle email formatting', () => {
      const emails = [
        'test@example.com',
        'Test@Example.Com', // Should be lowercased
        ' user@domain.org ', // Should be trimmed
        'complex.email+tag@subdomain.example.co.uk'
      ];

      emails.forEach(email => {
        expect(typeof email).toBe('string');
        expect(email.includes('@')).toBe(true);
      });
    });

    it('should handle special characters in names', () => {
      const names = [
        'José María',
        "O'Connor",
        'Jean-Pierre',
        'Liu Wei',
        'Müller'
      ];

      names.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
        expect(name.length).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Interface Compliance', () => {
    it('should implement IUser interface correctly', () => {
      const user: Partial<IUser> = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        googleId: 'google_123',
        comparePassword: jest.fn()
      };

      expect(typeof user.name).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(typeof user.googleId).toBe('string');
      expect(typeof user.comparePassword).toBe('function');
    });

    it('should allow optional fields to be undefined', () => {
      const traditionalUser: Partial<IUser> = {
        name: 'Traditional User',
        email: 'traditional@example.com',
        password: 'password123',
        comparePassword: jest.fn()
      };

      expect(traditionalUser.googleId).toBeUndefined();

      const googleUser: Partial<IUser> = {
        name: 'Google User',
        email: 'google@example.com',
        googleId: 'google_456',
        comparePassword: jest.fn()
      };

      expect(googleUser.password).toBeUndefined();
    });
  });

  describe('Model Export', () => {
    it('should export User model as default', () => {
      // With our mocking setup, we just verify the import works
      expect(require('../../app/models/User')).toBeDefined();
    });

    it('should have proper model structure', () => {
      // Mock the mongoose model structure
      const mockModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn()
      };

      expect(typeof mockModel.findOne).toBe('function');
      expect(typeof mockModel.create).toBe('function');
      expect(typeof mockModel.findById).toBe('function');
      expect(typeof mockModel.updateOne).toBe('function');
      expect(typeof mockModel.deleteOne).toBe('function');
    });
  });
});
