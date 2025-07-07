import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormGroup,
  FormGrid,
  inputClasses,
  labelClasses,
  selectClasses,
  textareaClasses,
} from '../../app/components/FormComponents';

describe('FormComponents', () => {
  describe('CSS Classes', () => {
    it('should export consistent class strings', () => {
      expect(inputClasses).toContain('w-full');
      expect(inputClasses).toContain('p-3');
      expect(inputClasses).toContain('border');
      expect(inputClasses).toContain('rounded-lg');
      
      expect(labelClasses).toContain('block');
      expect(labelClasses).toContain('text-sm');
      expect(labelClasses).toContain('font-semibold');
      
      expect(selectClasses).toContain('w-full');
      expect(selectClasses).toContain('p-3');
      
      expect(textareaClasses).toContain('w-full');
      expect(textareaClasses).toContain('resize-vertical');
    });
  });

  describe('FormInput', () => {
    it('should render input without label', () => {
      render(<FormInput placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('w-full');
    });

    it('should render input with label', () => {
      render(<FormInput label="Test Label" id="test-input" />);
      
      const label = screen.getByLabelText('Test Label');
      expect(label).toBeInTheDocument();
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(<FormInput label="Required Field" required />);
      
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('should display error message and apply error styles', () => {
      render(<FormInput label="Test Field" error="This field is required" />);
      
      const errorMessage = screen.getByText('This field is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600', 'dark:text-red-400');
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-400');
    });

    it('should handle input changes', () => {
      const handleChange = jest.fn();
      render(<FormInput onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test value' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should pass through additional props', () => {
      render(<FormInput type="email" placeholder="email@example.com" data-testid="email-input" />);
      
      const input = screen.getByTestId('email-input');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'email@example.com');
    });

    it('should apply custom className', () => {
      render(<FormInput className="custom-class" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should link label to input with id', () => {
      render(<FormInput label="Email" id="email-field" />);
      
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'email-field');
      expect(input).toHaveAttribute('id', 'email-field');
    });
  });

  describe('FormSelect', () => {
    const selectOptions = (
      <>
        <option value="">Select an option</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </>
    );

    it('should render select without label', () => {
      render(<FormSelect>{selectOptions}</FormSelect>);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveClass('w-full');
    });

    it('should render select with label', () => {
      render(
        <FormSelect label="Test Select" id="test-select">
          {selectOptions}
        </FormSelect>
      );
      
      const label = screen.getByLabelText('Test Select');
      expect(label).toBeInTheDocument();
      expect(screen.getByText('Test Select')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(
        <FormSelect label="Required Select" required>
          {selectOptions}
        </FormSelect>
      );
      
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('should display error message and apply error styles', () => {
      render(
        <FormSelect label="Test Select" error="Please select an option">
          {selectOptions}
        </FormSelect>
      );
      
      const errorMessage = screen.getByText('Please select an option');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600', 'dark:text-red-400');
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-400');
    });

    it('should handle selection changes', () => {
      const handleChange = jest.fn();
      render(
        <FormSelect onChange={handleChange}>
          {selectOptions}
        </FormSelect>
      );
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'option1' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should render all options', () => {
      render(<FormSelect>{selectOptions}</FormSelect>);
      
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    });
  });

  describe('FormTextarea', () => {
    it('should render textarea without label', () => {
      render(<FormTextarea placeholder="Enter description" />);
      
      const textarea = screen.getByPlaceholderText('Enter description');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass('w-full', 'resize-vertical');
    });

    it('should render textarea with label', () => {
      render(<FormTextarea label="Description" id="description" />);
      
      const label = screen.getByLabelText('Description');
      expect(label).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(<FormTextarea label="Required Description" required />);
      
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('should display error message and apply error styles', () => {
      render(<FormTextarea label="Description" error="Description is required" />);
      
      const errorMessage = screen.getByText('Description is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600', 'dark:text-red-400');
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-400');
    });

    it('should handle text changes', () => {
      const handleChange = jest.fn();
      render(<FormTextarea onChange={handleChange} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'test description' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should pass through additional props', () => {
      render(<FormTextarea rows={5} cols={50} data-testid="description-textarea" />);
      
      const textarea = screen.getByTestId('description-textarea');
      expect(textarea).toHaveAttribute('rows', '5');
      expect(textarea).toHaveAttribute('cols', '50');
    });
  });

  describe('FormGroup', () => {
    it('should render children with default spacing', () => {
      render(
        <FormGroup>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </FormGroup>
      );
      
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <FormGroup className="custom-group-class">
          <div>Content</div>
        </FormGroup>
      );
      
      const group = screen.getByText('Content').parentElement?.parentElement;
      expect(group).toHaveClass('space-y-4', 'custom-group-class');
    });

    it('should wrap multiple form components', () => {
      render(
        <FormGroup>
          <FormInput label="Field 1" id="field1" />
          <FormInput label="Field 2" id="field2" />
        </FormGroup>
      );
      
      expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Field 2')).toBeInTheDocument();
    });
  });

  describe('FormGrid', () => {
    it('should render children in default 2-column grid', () => {
      render(
        <FormGrid>
          <div data-testid="grid-item-1">Item 1</div>
          <div data-testid="grid-item-2">Item 2</div>
        </FormGrid>
      );
      
      expect(screen.getByTestId('grid-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-2')).toBeInTheDocument();
      
      const grid = screen.getByTestId('grid-item-1').parentElement;
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6');
    });

    it('should render single column grid', () => {
      render(
        <FormGrid columns={1}>
          <div data-testid="grid-item">Item</div>
        </FormGrid>
      );
      
      const grid = screen.getByTestId('grid-item').parentElement;
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).not.toHaveClass('md:grid-cols-2');
    });

    it('should render 3-column grid', () => {
      render(
        <FormGrid columns={3}>
          <div data-testid="grid-item">Item</div>
        </FormGrid>
      );
      
      const grid = screen.getByTestId('grid-item').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should render 4-column grid', () => {
      render(
        <FormGrid columns={4}>
          <div data-testid="grid-item">Item</div>
        </FormGrid>
      );
      
      const grid = screen.getByTestId('grid-item').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('should apply custom className', () => {
      render(
        <FormGrid className="custom-grid-class">
          <div data-testid="grid-item">Item</div>
        </FormGrid>
      );
      
      const grid = screen.getByTestId('grid-item').parentElement;
      expect(grid).toHaveClass('custom-grid-class');
    });

    it('should handle multiple form components in grid', () => {
      render(
        <FormGrid columns={2}>
          <FormInput label="First Name" id="firstName" />
          <FormInput label="Last Name" id="lastName" />
          <FormSelect label="Country" id="country">
            <option value="us">USA</option>
            <option value="ca">Canada</option>
          </FormSelect>
          <FormTextarea label="Notes" id="notes" />
        </FormGrid>
      );
      
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });
  });

  describe('Dark mode styling', () => {
    it('should include dark mode classes in components', () => {
      render(
        <>
          <FormInput label="Dark Input" id="darkInput" />
          <FormSelect label="Dark Select" id="darkSelect">
            <option>Option</option>
          </FormSelect>
          <FormTextarea label="Dark Textarea" id="darkTextarea" />
        </>
      );
      
      const input = screen.getByLabelText('Dark Input');
      const select = screen.getByLabelText('Dark Select');
      const textarea = screen.getByLabelText('Dark Textarea');
      
      expect(input).toHaveClass('dark:bg-gray-700', 'dark:text-gray-100', 'dark:border-gray-600');
      expect(select).toHaveClass('dark:bg-gray-700', 'dark:text-gray-100', 'dark:border-gray-600');
      expect(textarea).toHaveClass('dark:bg-gray-700', 'dark:text-gray-100', 'dark:border-gray-600');
    });

    it('should include dark mode classes for labels', () => {
      render(<FormInput label="Dark Label" id="darkLabel" />);
      
      const label = screen.getByText('Dark Label');
      expect(label).toHaveClass('dark:text-gray-300');
    });
  });

  describe('Accessibility', () => {
    it('should properly associate labels with form controls', () => {
      render(
        <>
          <FormInput label="Email" id="email" />
          <FormSelect label="Country" id="country">
            <option>USA</option>
          </FormSelect>
          <FormTextarea label="Message" id="message" />
        </>
      );
      
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      const messageTextarea = screen.getByRole('textbox', { name: /message/i });
      
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(countrySelect).toHaveAttribute('id', 'country');
      expect(messageTextarea).toHaveAttribute('id', 'message');
    });

    it('should support keyboard navigation', () => {
      render(
        <FormGrid>
          <FormInput label="Field 1" id="field1" />
          <FormSelect label="Field 2" id="field2">
            <option>Option</option>
          </FormSelect>
        </FormGrid>
      );
      
      const input = screen.getByLabelText('Field 1');
      const select = screen.getByLabelText('Field 2');
      
      // Test tab navigation
      input.focus();
      expect(input).toHaveFocus();
      
      fireEvent.keyDown(input, { key: 'Tab' });
      select.focus();
      expect(select).toHaveFocus();
    });
  });
}); 