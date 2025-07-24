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

// Helper validation functions - extracted to reduce nesting
const validateEmail = (value: string, setEmailError: (error: string) => void) => {
  setEmailError(validateEmailString(value));
};

const getPasswordStrength = (value: string, hasError: boolean): string => {
  if (hasError) {
    return value.length < 8 ? 'weak' : 'medium';
  }

  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  return (!hasLowercase || !hasUppercase || !hasDigit) ? 'medium' : 'strong';
};

const validatePasswordStrengthAndError = (value: string): { error: string; strength: string } => {
  const error = validatePasswordString(value);
  let finalError = error;

  if (!error) {
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasDigit = /\d/.test(value);
    if (!hasLowercase || !hasUppercase || !hasDigit) {
      finalError = 'Password must contain uppercase, lowercase, and number';
    }
  }

  const strength = getPasswordStrength(value, !!finalError);
  return { error: finalError, strength };
};

const validatePassword = (value: string, setPasswordError: (error: string) => void, setPasswordStrength: (strength: string) => void) => {
  const { error, strength } = validatePasswordStrengthAndError(value);
  setPasswordError(error);
  setPasswordStrength(strength);
};

// Form components - extracted to module level to reduce nesting

const useEmailValidation = () => {
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value, setEmailError);
  };

  return { email, emailError, handleEmailChange };
};

const ValidationFormComponent = () => {
  const { email, emailError, handleEmailChange } = useEmailValidation();

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

const usePasswordValidation = () => {
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordStrength, setPasswordStrength] = React.useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value, setPasswordError, setPasswordStrength);
  };

  return { password, passwordError, passwordStrength, handlePasswordChange };
};

// Extract password validation form
const PasswordValidationForm = () => {
  const { password, passwordError, passwordStrength, handlePasswordChange } = usePasswordValidation();

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

// Form submission handlers - extracted to reduce nesting
const validateSubmitForm = (formData: { email: string; password: string }, setErrors: (errors: Record<string, string>) => void) => {
  const newErrors: Record<string, string> = {};
  const emailError = validateEmailString(formData.email);
  if (emailError) newErrors.email = emailError;

  const passwordError = validatePasswordString(formData.password);
  if (passwordError) newErrors.password = passwordError;

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const createFormDataHandlers = (formData: { email: string; password: string }, setFormData: (data: { email: string; password: string }) => void) => ({
  handleEmailInputChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
  },
  handlePasswordInputChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, password: e.target.value });
  }
});

const useSubmitForm = (mockSubmit: (data: { email: string; password: string }) => void) => {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handlers = createFormDataHandlers(formData, setFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSubmitForm(formData, setErrors)) {
      mockSubmit(formData);
    }
  };

  return { formData, errors, handlers, handleSubmit };
};

const TestSubmitForm = ({ mockSubmit }: { mockSubmit: (data: { email: string; password: string }) => void }) => {
  const { formData, errors, handlers, handleSubmit } = useSubmitForm(mockSubmit);

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={handlers.handleEmailInputChange}
        data-testid="email-input"
        placeholder="Email"
      />
      {errors.email && <span data-testid="email-error">{errors.email}</span>}

      <input
        type="password"
        value={formData.password}
        onChange={handlers.handlePasswordInputChange}
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
