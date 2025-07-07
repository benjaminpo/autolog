describe('API Helper Functions', () => {
  describe('Request Validation', () => {
    it('should validate required fields in request body', () => {
      const validateRequiredFields = (data: any, requiredFields: string[]) => {
        const missing = requiredFields.filter(field => !data || !data[field]);
        return {
          isValid: missing.length === 0,
          missingFields: missing
        };
      };

      const requestData = { name: 'Test Vehicle', brand: 'Toyota' };
      const requiredFields = ['name', 'brand', 'year'];

      const result = validateRequiredFields(requestData, requiredFields);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('year');
    });

    it('should validate email format', () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should validate password strength', () => {
      const validatePassword = (password: string) => {
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
          isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers,
          requirements: {
            minLength: hasMinLength,
            upperCase: hasUpperCase,
            lowerCase: hasLowerCase,
            numbers: hasNumbers,
            specialChar: hasSpecialChar
          }
        };
      };

      const strongPassword = 'StrongPass123!';
      const weakPassword = 'weak';

      const strongResult = validatePassword(strongPassword);
      const weakResult = validatePassword(weakPassword);

      expect(strongResult.isValid).toBe(true);
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.requirements.minLength).toBe(false);
    });

    it('should sanitize input data', () => {
      const sanitizeInput = (input: any) => {
        if (typeof input === 'string') {
          return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof input === 'object' && input !== null) {
          const sanitized: any = {};
          for (const key in input) {
            sanitized[key] = sanitizeInput(input[key]);
          }
          return sanitized;
        }
        return input;
      };

      const maliciousInput = {
        name: '  John Doe  ',
        script: '<script>alert("xss")</script>Normal text'
      };

      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.script).toBe('Normal text');
    });
  });

  describe('Response Formatting', () => {
    it('should format success responses consistently', () => {
      const createSuccessResponse = (data: any, message?: string) => {
        return {
          success: true,
          message: message || 'Operation successful',
          data,
          timestamp: new Date().toISOString()
        };
      };

      const data = { id: '123', name: 'Test Vehicle' };
      const response = createSuccessResponse(data, 'Vehicle created');

      expect(response.success).toBe(true);
      expect(response.message).toBe('Vehicle created');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should format error responses consistently', () => {
      const createErrorResponse = (error: string, code?: string, details?: any) => {
        return {
          success: false,
          error,
          code: code || 'GENERIC_ERROR',
          details,
          timestamp: new Date().toISOString()
        };
      };

      const errorResponse = createErrorResponse('Validation failed', 'VALIDATION_ERROR', {
        field: 'email',
        message: 'Invalid email format'
      });

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Validation failed');
      expect(errorResponse.code).toBe('VALIDATION_ERROR');
      expect(errorResponse.details.field).toBe('email');
    });

    it('should format paginated responses', () => {
      const createPaginatedResponse = (data: any[], page: number, limit: number, total: number) => {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
          success: true,
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev
          }
        };
      };

      const data = [{ id: '1' }, { id: '2' }];
      const response = createPaginatedResponse(data, 2, 2, 10);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.pagination.page).toBe(2);
      expect(response.pagination.totalPages).toBe(5);
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(true);
    });
  });

  describe('URL and Query Parameter Handling', () => {
    it('should parse query parameters from URL', () => {
      const parseQueryParams = (url: string) => {
        const urlObj = new URL(url, 'http://localhost');
        const params: Record<string, string> = {};
        urlObj.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        return params;
      };

      const url = '/api/vehicles?page=2&limit=10&sort=name&filter=active';
      const params = parseQueryParams(url);

      expect(params.page).toBe('2');
      expect(params.limit).toBe('10');
      expect(params.sort).toBe('name');
      expect(params.filter).toBe('active');
    });

    it('should build query string from parameters', () => {
      const buildQueryString = (params: Record<string, any>) => {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlParams.append(key, String(value));
          }
        });
        return urlParams.toString();
      };

      const params = {
        page: 2,
        limit: 10,
        sort: 'name',
        filter: null,
        search: undefined
      };

      const queryString = buildQueryString(params);

      expect(queryString).toContain('page=2');
      expect(queryString).toContain('limit=10');
      expect(queryString).toContain('sort=name');
      expect(queryString).not.toContain('filter=');
      expect(queryString).not.toContain('search=');
    });
  });

  describe('Data Transformation', () => {
    it('should transform MongoDB documents for API response', () => {
      const transformDocument = (doc: any) => {
        if (!doc) return null;
        
        const transformed = doc.toObject ? doc.toObject() : { ...doc };
        
        if (transformed._id) {
          transformed.id = transformed._id.toString();
          delete transformed._id;
        }
        
        delete transformed.__v;
        
        if (transformed.password) {
          delete transformed.password;
        }
        
        return transformed;
      };

      const mockDocument = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Vehicle',
        password: 'secret',
        __v: 0,
        toObject: function() {
          return { ...this };
        }
      };

      const transformed = transformDocument(mockDocument);

      expect(transformed.id).toBe('507f1f77bcf86cd799439011');
      expect(transformed._id).toBeUndefined();
      expect(transformed.__v).toBeUndefined();
      expect(transformed.password).toBeUndefined();
      expect(transformed.name).toBe('Test Vehicle');
    });

    it('should transform array of documents', () => {
      const transformDocuments = (docs: any[]) => {
        return docs.map(doc => {
          const transformed = doc.toObject ? doc.toObject() : { ...doc };
          if (transformed._id) {
            transformed.id = transformed._id.toString();
            delete transformed._id;
          }
          delete transformed.__v;
          return transformed;
        });
      };

      const mockDocuments = [
        { _id: '1', name: 'Vehicle 1', __v: 0 },
        { _id: '2', name: 'Vehicle 2', __v: 0 }
      ];

      const transformed = transformDocuments(mockDocuments);

      expect(transformed).toHaveLength(2);
      expect(transformed[0].id).toBe('1');
      expect(transformed[0]._id).toBeUndefined();
      expect(transformed[1].id).toBe('2');
    });
  });

  describe('Rate Limiting Helpers', () => {
    it('should track request counts per IP', () => {
      const requestCounts = new Map<string, { count: number; resetTime: number }>();
      
      const trackRequest = (ip: string, windowMs: number = 60000, maxRequests: number = 100) => {
        const now = Date.now();
        const current = requestCounts.get(ip);
        
        if (!current || now > current.resetTime) {
          requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
          return { allowed: true, remaining: maxRequests - 1 };
        }
        
        current.count++;
        const remaining = Math.max(0, maxRequests - current.count);
        const allowed = current.count <= maxRequests;
        
        return { allowed, remaining, resetTime: current.resetTime };
      };

      const ip = '192.168.1.1';
      
      // First request should be allowed
      const result1 = trackRequest(ip, 60000, 2);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);
      
      // Second request should be allowed
      const result2 = trackRequest(ip, 60000, 2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
      
      // Third request should be denied
      const result3 = trackRequest(ip, 60000, 2);
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });
  });

  describe('Cache Helpers', () => {
    it('should implement simple in-memory cache', () => {
      const cache = new Map<string, { data: any; expires: number }>();
      
      const set = (key: string, data: any, ttlMs: number = 300000) => {
        cache.set(key, { data, expires: Date.now() + ttlMs });
      };
      
      const get = (key: string) => {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
          cache.delete(key);
          return null;
        }
        
        return item.data;
      };
      
      const clear = () => {
        cache.clear();
      };

      // Test setting and getting
      set('test-key', { id: '123', name: 'Test' }, 1000);
      const retrieved = get('test-key');
      
      expect(retrieved).toEqual({ id: '123', name: 'Test' });
      
      // Test expiration (mock time passing)
      const mockNow = Date.now() + 2000;
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      const expired = get('test-key');
      expect(expired).toBeNull();
      
      jest.restoreAllMocks();
    });
  });

  describe('File Processing Helpers', () => {
    it('should validate file types', () => {
      const validateFileType = (filename: string, allowedTypes: string[]) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        return allowedTypes.includes(extension || '');
      };

      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
      
      expect(validateFileType('image.jpg', allowedTypes)).toBe(true);
      expect(validateFileType('photo.PNG', allowedTypes)).toBe(true);
      expect(validateFileType('document.pdf', allowedTypes)).toBe(false);
    });

    it('should format file sizes', () => {
      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('Environment Helpers', () => {
    it('should check if running in development', () => {
      const isDevelopment = (env?: string) => (env || process.env.NODE_ENV) === 'development';
      
      expect(isDevelopment('development')).toBe(true);
      expect(isDevelopment('production')).toBe(false);
      expect(isDevelopment('test')).toBe(false);
    });

    it('should get environment variables with defaults', () => {
      const getEnvVar = (key: string, defaultValue?: string) => {
        return process.env[key] || defaultValue;
      };

      const dbUrl = getEnvVar('TEST_DB_URL', 'mongodb://localhost:27017/test');
      expect(dbUrl).toBe('mongodb://localhost:27017/test');
      
      // Set a test env var
      process.env.TEST_VAR = 'test-value';
      const testVar = getEnvVar('TEST_VAR', 'default');
      expect(testVar).toBe('test-value');
      
      delete process.env.TEST_VAR;
    });
  });
}); 