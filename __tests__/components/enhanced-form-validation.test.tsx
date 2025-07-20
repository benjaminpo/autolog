import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('Enhanced Form Validation Tests', () => {
  describe('Form Input Validation', () => {
    it('should validate form inputs in real-time', async () => {
      const TestForm = () => {
        const [email, setEmail] = React.useState('');
        const [emailError, setEmailError] = React.useState('');

        const validateEmail = (value: string) => {
          if (!value) {
            setEmailError('Email is required');
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setEmailError('Invalid email format');
          } else {
            setEmailError('');
          }
        };

        const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setEmail(value);
          validateEmail(value);
        };

        return (
          <form>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              data-testid="email-input"
            />
            {emailError && <span data-testid="email-error">{emailError}</span>}
          </form>
        );
      };

      render(<TestForm />);

      const emailInput = screen.getByTestId('email-input');

      // Test invalid email
      await userEvent.type(emailInput, 'invalid-email');
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
      });

      // Test valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      const TestPasswordForm = () => {
        const [password, setPassword] = React.useState('');
        const [strength, setStrength] = React.useState({ score: 0, feedback: '' });

        const checkPasswordStrength = (value: string) => {
          let score = 0;
          let feedback = 'Very weak';

          if (value.length >= 8) score++;
          if (/[A-Z]/.test(value)) score++;
          if (/[a-z]/.test(value)) score++;
          if (/\d/.test(value)) score++;
          if (/[^A-Za-z0-9]/.test(value)) score++;

          switch (score) {
            case 0:
            case 1:
              feedback = 'Very weak';
              break;
            case 2:
              feedback = 'Weak';
              break;
            case 3:
              feedback = 'Fair';
              break;
            case 4:
              feedback = 'Good';
              break;
            case 5:
              feedback = 'Strong';
              break;
          }

          setStrength({ score, feedback });
        };

        const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setPassword(value);
          checkPasswordStrength(value);
        };

        return (
          <form>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              data-testid="password-input"
            />
            <div data-testid="password-strength">{strength.feedback}</div>
          </form>
        );
      };

      render(<TestPasswordForm />);

      const passwordInput = screen.getByTestId('password-input');
      const strengthIndicator = screen.getByTestId('password-strength');

      // Test weak password
      await userEvent.type(passwordInput, 'weak');
      await waitFor(() => {
        expect(strengthIndicator).toHaveTextContent('Very weak');
      });

      // Test strong password
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'StrongPass123!');
      await waitFor(() => {
        expect(strengthIndicator).toHaveTextContent('Strong');
      });
    });

    it('should handle form submission with validation', async () => {
      const mockSubmit = jest.fn();

      const TestSubmitForm = () => {
        const [formData, setFormData] = React.useState({ email: '', password: '' });
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const validate = () => {
          const newErrors: Record<string, string> = {};

          if (!formData.email) {
            newErrors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
          }

          if (!formData.password) {
            newErrors.password = 'Password is required';
          } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (validate()) {
            mockSubmit(formData);
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="email-input"
            />
            {errors.email && <span data-testid="email-error">{errors.email}</span>}

            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              data-testid="password-input"
            />
            {errors.password && <span data-testid="password-error">{errors.password}</span>}

            <button type="submit" data-testid="submit-button">Submit</button>
          </form>
        );
      };

      render(<TestSubmitForm />);

      const submitButton = screen.getByTestId('submit-button');

      // Test submission with empty form
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      });
      expect(mockSubmit).not.toHaveBeenCalled();

      // Test submission with valid data
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });
  });

  describe('Form Field Interactions', () => {
    it('should handle focus and blur events', async () => {
      const TestFocusForm = () => {
        const [focused, setFocused] = React.useState('');
        const [visited, setVisited] = React.useState<string[]>([]);

        return (
          <form>
            <input
              data-testid="input1"
              onFocus={() => setFocused('input1')}
              onBlur={() => {
                setFocused('');
                setVisited(prev => [...prev, 'input1']);
              }}
            />
            <input
              data-testid="input2"
              onFocus={() => setFocused('input2')}
              onBlur={() => {
                setFocused('');
                setVisited(prev => [...prev, 'input2']);
              }}
            />
            <div data-testid="focused-field">{focused}</div>
            <div data-testid="visited-count">{visited.length}</div>
          </form>
        );
      };

      render(<TestFocusForm />);

      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      const focusedField = screen.getByTestId('focused-field');
      const visitedCount = screen.getByTestId('visited-count');

      // Test focus
      fireEvent.focus(input1);
      expect(focusedField).toHaveTextContent('input1');

      // Test blur and focus on another field
      fireEvent.blur(input1);
      fireEvent.focus(input2);
      expect(focusedField).toHaveTextContent('input2');
      expect(visitedCount).toHaveTextContent('1');

      fireEvent.blur(input2);
      expect(visitedCount).toHaveTextContent('2');
    });

    it('should handle keyboard navigation', async () => {
      const TestKeyboardForm = () => {
        const [activeIndex, setActiveIndex] = React.useState(0);
        const inputs = ['input1', 'input2', 'input3'];

        const handleArrowDown = () => {
          setActiveIndex(prev => Math.min(prev + 1, inputs.length - 1));
        };

        const handleArrowUp = () => {
          setActiveIndex(prev => Math.max(prev - 1, 0));
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleArrowDown();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleArrowUp();
          }
        };

        return (
          <div
            onKeyDown={handleKeyDown}
            tabIndex={0}
            data-testid="form-container"
            role="group"
            aria-label="Interactive form container"
          >
            {inputs.map((input, index) => (
              <input
                key={input}
                data-testid={input}
                className={index === activeIndex ? 'active' : ''}
              />
            ))}
            <div data-testid="active-index">{activeIndex}</div>
          </div>
        );
      };

      render(<TestKeyboardForm />);

      const container = screen.getByTestId('form-container');
      const activeIndex = screen.getByTestId('active-index');

      // Test arrow down navigation
      fireEvent.keyDown(container, { key: 'ArrowDown' });
      expect(activeIndex).toHaveTextContent('1');

      fireEvent.keyDown(container, { key: 'ArrowDown' });
      expect(activeIndex).toHaveTextContent('2');

      // Test arrow up navigation
      fireEvent.keyDown(container, { key: 'ArrowUp' });
      expect(activeIndex).toHaveTextContent('1');

      // Test boundaries
      fireEvent.keyDown(container, { key: 'ArrowDown' });
      fireEvent.keyDown(container, { key: 'ArrowDown' }); // Should stay at 2
      expect(activeIndex).toHaveTextContent('2');
    });
  });

  describe('Dynamic Form Generation', () => {
    it('should generate form fields dynamically', () => {
      const formConfig = [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'age', type: 'number', label: 'Age', required: false }
      ];

      const DynamicForm = ({ config }: { config: typeof formConfig }) => {
        const [formData, setFormData] = React.useState<Record<string, any>>({});

        const handleChange = (name: string, value: any) => {
          setFormData(prev => ({ ...prev, [name]: value }));
        };

        return (
          <form>
            {config.map(field => (
              <div key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  type={field.type}
                  required={field.required}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  data-testid={`${field.name}-input`}
                />
              </div>
            ))}
            <div data-testid="form-data">{JSON.stringify(formData)}</div>
          </form>
        );
      };

      render(<DynamicForm config={formConfig} />);

      // Check if all fields are rendered
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('age-input')).toBeInTheDocument();

      // Check required attributes
      expect(screen.getByTestId('name-input')).toBeRequired();
      expect(screen.getByTestId('email-input')).toBeRequired();
      expect(screen.getByTestId('age-input')).not.toBeRequired();

      // Check labels
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
    });

    it('should handle conditional field visibility', () => {
      const ConditionalForm = () => {
        const [formData, setFormData] = React.useState({ userType: '', companyName: '' });

        return (
          <form>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
              data-testid="user-type-select"
            >
              <option value="">Select user type</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>

            {formData.userType === 'business' && (
              <input
                type="text"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                data-testid="company-name-input"
              />
            )}
          </form>
        );
      };

      render(<ConditionalForm />);

      const userTypeSelect = screen.getByTestId('user-type-select');

      // Initially, company name field should not be visible
      expect(screen.queryByTestId('company-name-input')).not.toBeInTheDocument();

      // Select business user type
      fireEvent.change(userTypeSelect, { target: { value: 'business' } });

      // Now company name field should be visible
      expect(screen.getByTestId('company-name-input')).toBeInTheDocument();

      // Select individual user type
      fireEvent.change(userTypeSelect, { target: { value: 'individual' } });

      // Company name field should be hidden again
      expect(screen.queryByTestId('company-name-input')).not.toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('should handle form reset', () => {
      const ResetForm = () => {
        const [formData, setFormData] = React.useState({ name: '', email: '' });

        const handleReset = () => {
          setFormData({ name: '', email: '' });
        };

        return (
          <form>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="name-input"
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="email-input"
            />
            <button type="button" onClick={handleReset} data-testid="reset-button">
              Reset
            </button>
          </form>
        );
      };

      render(<ResetForm />);

      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const resetButton = screen.getByTestId('reset-button');

      // Fill form
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');

      // Reset form
      fireEvent.click(resetButton);

      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
    });

    it('should handle form auto-save', async () => {
      const mockSave = jest.fn();

      const AutoSaveForm = () => {
        const [formData, setFormData] = React.useState({ content: '' });

        React.useEffect(() => {
          const timer = setTimeout(() => {
            if (formData.content) {
              mockSave(formData);
            }
          }, 500);

          return () => clearTimeout(timer);
        }, [formData]);

        return (
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ content: e.target.value })}
            data-testid="content-textarea"
          />
        );
      };

      render(<AutoSaveForm />);

      const textarea = screen.getByTestId('content-textarea');

      // Type content
      fireEvent.change(textarea, { target: { value: 'Auto-saved content' } });

      // Wait for auto-save
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({ content: 'Auto-saved content' });
      }, { timeout: 1000 });
    });
  });
});

describe('Form validation edge cases', () => {
  const validateRequired = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };

  const validateMaxLength = (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
  };

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validateMinValue = (value: number, minValue: number): boolean => {
    return value >= minValue;
  };

  const validateMaxValue = (value: number, maxValue: number): boolean => {
    return value <= maxValue;
  };

  it('should handle very long input strings', () => {
    const longString = 'a'.repeat(10000);
    expect(validateRequired(longString)).toBe(true);
    expect(validateMaxLength(longString, 100)).toBe(false);
  });

  it('should handle special characters in input', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    expect(validateRequired(specialChars)).toBe(true);
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('test@example')).toBe(false);
  });

  it('should handle boundary values for numbers', () => {
    expect(validateMinValue(0, 0)).toBe(true);
    expect(validateMinValue(-1, 0)).toBe(false);
    expect(validateMaxValue(100, 100)).toBe(true);
    expect(validateMaxValue(101, 100)).toBe(false);
  });

  it('should handle empty arrays and objects', () => {
    expect(validateRequired([])).toBe(false);
    expect(validateRequired({})).toBe(false);
    expect(validateRequired(null)).toBe(false);
    expect(validateRequired(undefined)).toBe(false);
  });
});
