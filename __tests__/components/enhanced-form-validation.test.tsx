import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  validateEmailString,
  validatePasswordString,
  validateRequired,
  validateMaxLength,
  validateMinValue,
  validateMaxValue
} from '../../app/utils/validationHelpers';

// Helper validation functions
const validateEmail = (value: string, setEmailError: (error: string) => void) => {
  setEmailError(validateEmailString(value));
};

const validatePassword = (value: string, setPasswordError: (error: string) => void, setPasswordStrength: (strength: string) => void) => {
  const error = validatePasswordString(value);
  setPasswordError(error);
  if (error) {
    setPasswordStrength(value.length < 8 ? 'weak' : 'medium');
  } else {
    // Safe password validation without vulnerable regex
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasDigit = /\d/.test(value);
    if (!hasLowercase || !hasUppercase || !hasDigit) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      setPasswordStrength('medium');
    } else {
      setPasswordError('');
      setPasswordStrength('strong');
    }
  }
};

// Extract validation form to reduce nesting
const ValidationFormComponent = () => {
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value, setEmailError);
  };

  return (
    <form>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          aria-describedby="email-error"
        />
        <div id="email-error" role="alert">
          {emailError}
        </div>
      </div>
    </form>
  );
};

// Extract password validation form
const PasswordValidationForm = () => {
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordStrength, setPasswordStrength] = React.useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value, setPasswordError, setPasswordStrength);
  };

  return (
    <form>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          aria-describedby="password-error"
        />
        <div id="password-error" role="alert">
          {passwordError}
        </div>
        <div data-testid="password-strength">
          Strength: {passwordStrength}
        </div>
      </div>
    </form>
  );
};

describe('Enhanced Form Validation Tests', () => {
  describe('Form Input Validation', () => {
    it('should validate form inputs in real-time', async () => {
      render(<ValidationFormComponent />);

      const emailInput = screen.getByLabelText('Email');

      // Test invalid email
      await userEvent.type(emailInput, 'invalid-email');
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email format');
      });

      // Test valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeEmptyDOMElement();
      });
    });

    it('should validate password strength', async () => {
      render(<PasswordValidationForm />);

      const passwordInput = screen.getByLabelText('Password');
      const strengthIndicator = screen.getByTestId('password-strength');

      // Test weak password
      await userEvent.type(passwordInput, 'weak');
      await waitFor(() => {
        expect(strengthIndicator).toHaveTextContent('Strength: weak');
      });

      // Test strong password
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'StrongPass123!');
      await waitFor(() => {
        expect(strengthIndicator).toHaveTextContent('Strength: strong');
      });
    });

    // Helper functions for TestSubmitForm
    const validateSubmitForm = (formData: { email: string; password: string }, setErrors: (errors: Record<string, string>) => void) => {
      const newErrors: Record<string, string> = {};
      const emailError = validateEmailString(formData.email);
      if (emailError) newErrors.email = emailError;
      const passwordError = validatePasswordString(formData.password);
      if (passwordError) newErrors.password = passwordError;
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>, formData: { email: string; password: string }, setFormData: (data: { email: string; password: string }) => void) => {
      setFormData({ ...formData, email: e.target.value });
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>, formData: { email: string; password: string }, setFormData: (data: { email: string; password: string }) => void) => {
      setFormData({ ...formData, password: e.target.value });
    };

    const TestSubmitForm = ({ mockSubmit }: { mockSubmit: (data: { email: string; password: string }) => void }) => {
      const [formData, setFormData] = React.useState({ email: '', password: '' });
      const [errors, setErrors] = React.useState<Record<string, string>>({});

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateSubmitForm(formData, setErrors)) {
          mockSubmit(formData);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={formData.email}
            onChange={e => handleEmailInputChange(e, formData, setFormData)}
            data-testid="email-input"
            placeholder="Email"
          />
          {errors.email && <span data-testid="email-error">{errors.email}</span>}

          <input
            type="password"
            value={formData.password}
            onChange={e => handlePasswordInputChange(e, formData, setFormData)}
            data-testid="password-input"
            placeholder="Password"
          />
          {errors.password && <span data-testid="password-error">{errors.password}</span>}

          <button type="submit" data-testid="submit-button">Submit</button>
        </form>
      );
    };

    it('should handle form submission with validation', async () => {
      const mockSubmit = jest.fn();
      render(<TestSubmitForm mockSubmit={mockSubmit} />);

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
              placeholder="Input 1"
              onFocus={() => setFocused('input1')}
              onBlur={() => {
                setFocused('');
                setVisited(prev => [...prev, 'input1']);
              }}
            />
            <input
              data-testid="input2"
              placeholder="Input 2"
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

        // Use a div with role="group" and tabIndex only if it is truly interactive
        // Otherwise, use a semantic interactive element like <fieldset> without tabIndex
        return (
          <fieldset
            data-testid="form-container"
            aria-label="Interactive form container"
            role="group"
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleArrowDown();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleArrowUp();
              }
            }}
            tabIndex={0}
          >
            {inputs.map((input, index) => (
              <input
                key={input}
                data-testid={input}
                className={index === activeIndex ? 'active' : ''}
                placeholder={input}
              />
            ))}
            <div data-testid="active-index">{activeIndex}</div>
          </fieldset>
        );
      };

      render(<TestKeyboardForm />);

      const container = screen.getByTestId('form-container');
      const activeIndex = screen.getByTestId('active-index');

      // Focus the container first to make it receive keyboard events
      container.focus();

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
                  placeholder={field.label}
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

        const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          setFormData({ ...formData, userType: e.target.value });
        };

        const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData({ ...formData, companyName: e.target.value });
        };

        return (
          <form>
            <select
              value={formData.userType}
              onChange={handleUserTypeChange}
              data-testid="user-type-select"
              title="User Type"
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
                onChange={handleCompanyNameChange}
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

        const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData({ ...formData, name: e.target.value });
        };

        const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData({ ...formData, email: e.target.value });
        };

        return (
          <form>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              data-testid="name-input"
              placeholder="Name"
            />
            <input
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              data-testid="email-input"
              placeholder="Email"
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

        const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setFormData({ content: e.target.value });
        };

        return (
          <textarea
            value={formData.content}
            onChange={handleContentChange}
            data-testid="content-textarea"
            placeholder="Content"
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
  // ...existing code...

  it('should handle very long input strings', () => {
    const longString = 'a'.repeat(10000);
    expect(validateRequired(longString)).toBe(true);
    expect(validateMaxLength(longString, 100)).toBe(false);
  });

  it('should handle special characters in input', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    expect(validateRequired(specialChars)).toBe(true);
    expect(validateEmailString('test@example.com')).toBe('');
    expect(validateEmailString('test@example')).toBe('Invalid email format');
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
