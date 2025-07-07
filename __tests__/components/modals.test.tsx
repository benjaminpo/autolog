import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modals } from '../../app/components/modals';

// Mock Language Context
const mockT = {
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  car: 'Car',
  fuelCompany: 'Fuel Company',
  fuelType: 'Fuel Type',
  date: 'Date',
  mileage: 'Mileage',
  volume: 'Volume',
  cost: 'Cost',
  basicInfo: 'Basic Info',
  fuelDetails: 'Fuel Details',
  notes: 'Notes',
  editCar: 'Edit Car',
  editFuelCompany: 'Edit Fuel Company',
  editFuelType: 'Edit Fuel Type',
  category: 'Category',
  amount: 'Amount',
  description: 'Description',
  currency: 'Currency',
  km: 'km',
  L: 'L',
  USD: 'USD'
};

// Mock data
const mockCars = [
  { 
    id: '1', 
    name: 'Test Car 1',
    vehicleType: 'Car/Truck' as const,
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    photo: '',
    dateAdded: '2024-01-01T00:00:00.000Z'
  },
  { 
    id: '2', 
    name: 'Test Car 2',
    vehicleType: 'Car/Truck' as const,
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    photo: '',
    dateAdded: '2024-01-02T00:00:00.000Z'
  }
];

const mockFuelCompanies = ['Shell', 'BP', 'Texaco'];
const mockFuelTypes = ['Gasoline', 'Diesel', 'Electric'];
const mockExpenseCategories = ['Maintenance', 'Insurance', 'Repairs'];

const mockEditEntry = {
  id: '1',
  carId: '1',
  fuelCompany: 'Shell',
  fuelType: 'Gasoline',
  mileage: 50000,
  distanceUnit: 'km' as const,
  volume: 40,
  volumeUnit: 'L' as const,
  cost: 60,
  currency: 'USD' as const,
  date: '2024-01-01',
  time: '10:00',
  location: 'Test Location',
  partialFuelUp: false,
  paymentType: 'Credit Card' as const,
  tyrePressure: 32,
  tyrePressureUnit: 'PSI' as const,
  tags: [],
  notes: 'Test notes'
};

const mockEditExpense = {
  id: '1',
  carId: '1',
  category: 'Maintenance',
  amount: 100,
  currency: 'USD' as const,
  date: '2024-01-01',
  description: 'Oil change',
  notes: 'Regular maintenance'
};

const mockEditCar = {
  id: '1',
  name: 'Test Car',
  vehicleType: 'Car/Truck' as const,
  brand: 'Toyota',
  model: 'Camry',
  year: 2020,
  photo: '',
  dateAdded: '2024-01-01T00:00:00.000Z',
  distanceUnit: 'km' as const,
  fuelUnit: 'L' as const,
  consumptionUnit: 'L/100km' as const,
  description: 'Test description'
};

const defaultProps = {
  t: mockT,
  cars: mockCars,
  fuelCompanies: mockFuelCompanies,
  fuelTypes: mockFuelTypes,
  expenseCategories: mockExpenseCategories,
  editEntry: null,
  editExpense: null,
  editCar: null,
  editFuelCompany: null,
  editFuelType: null,
  handleEditInputChange: jest.fn(),
  handleEditCarInputChange: jest.fn(),
  handleEditExpenseInputChange: jest.fn(),
  handleEditSubmit: jest.fn(),
  handleEditExpenseSubmit: jest.fn(),
  handleEditCarSubmit: jest.fn(),
  handleEditFuelCompanySubmit: jest.fn(),
  handleEditFuelTypeSubmit: jest.fn(),
  setEditEntry: jest.fn(),
  setEditExpense: jest.fn(),
  setEditCar: jest.fn(),
  setEditFuelCompany: jest.fn(),
  setEditFuelType: jest.fn(),
};

describe('Modals Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fuel Entry Modal', () => {
    it('should render edit fuel entry modal when editEntry is provided', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Fuel Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Shell')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Gasoline')).toBeInTheDocument();
    });

    it('should call handleEditSubmit when form is submitted', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.handleEditSubmit).toHaveBeenCalled();
    });

    it('should call setEditEntry when cancel button is clicked', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.setEditEntry).toHaveBeenCalledWith(null);
    });

    it('should handle input changes', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      const fuelCompanySelect = screen.getByDisplayValue('Shell');
      fireEvent.change(fuelCompanySelect, { target: { value: 'BP' } });
      
      expect(defaultProps.handleEditInputChange).toHaveBeenCalled();
    });

    it('should expand and collapse sections', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      const basicInfoButton = screen.getByText('Basic Info');
      fireEvent.click(basicInfoButton);
      
      // Should have toggle functionality
      expect(basicInfoButton).toBeInTheDocument();
    });
  });

  describe('Expense Modal', () => {
    it('should render edit expense modal when editExpense is provided', () => {
      render(<Modals {...defaultProps} editExpense={mockEditExpense} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Maintenance')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });

    it('should call handleEditExpenseSubmit when form is submitted', () => {
      render(<Modals {...defaultProps} editExpense={mockEditExpense} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.handleEditExpenseSubmit).toHaveBeenCalled();
    });

    it('should call setEditExpense when cancel button is clicked', () => {
      render(<Modals {...defaultProps} editExpense={mockEditExpense} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.setEditExpense).toHaveBeenCalledWith(null);
    });
  });

  describe('Car Modal', () => {
    it('should render edit car modal when editCar is provided', () => {
      render(<Modals {...defaultProps} editCar={mockEditCar} />);
      
      expect(screen.getByText('Edit Car')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Car')).toBeInTheDocument();
    });

    it('should call handleEditCarSubmit when form is submitted', () => {
      render(<Modals {...defaultProps} editCar={mockEditCar} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.handleEditCarSubmit).toHaveBeenCalled();
    });

    it('should call setEditCar when cancel button is clicked', () => {
      render(<Modals {...defaultProps} editCar={mockEditCar} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.setEditCar).toHaveBeenCalledWith(null);
    });
  });

  describe('Fuel Company Modal', () => {
    const mockEditFuelCompany = { old: 'Shell', new: 'BP' };

    it('should render edit fuel company modal when editFuelCompany is provided', () => {
      render(<Modals {...defaultProps} editFuelCompany={mockEditFuelCompany} />);
      
      expect(screen.getByText('Edit Fuel Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BP')).toBeInTheDocument();
    });

    it('should call handleEditFuelCompanySubmit when form is submitted', () => {
      render(<Modals {...defaultProps} editFuelCompany={mockEditFuelCompany} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.handleEditFuelCompanySubmit).toHaveBeenCalled();
    });
  });

  describe('Fuel Type Modal', () => {
    const mockEditFuelType = { old: 'Gasoline', new: 'Premium' };

    it('should render edit fuel type modal when editFuelType is provided', () => {
      render(<Modals {...defaultProps} editFuelType={mockEditFuelType} />);
      
      expect(screen.getByText('Edit Fuel Type')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Premium')).toBeInTheDocument();
    });

    it('should call handleEditFuelTypeSubmit when form is submitted', () => {
      render(<Modals {...defaultProps} editFuelType={mockEditFuelType} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.handleEditFuelTypeSubmit).toHaveBeenCalled();
    });
  });

  describe('No Modal State', () => {
    it('should render nothing when no modal is active', () => {
      const { container } = render(<Modals {...defaultProps} />);
      
      // Should only render the container div with no modals
      expect(container.firstChild).toHaveClass('p-3');
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for fuel entry modal', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle keyboard navigation', () => {
      render(<Modals {...defaultProps} editEntry={mockEditEntry} />);
      
      const cancelButton = screen.getByText('Cancel');
      const saveButton = screen.getByText('Save');
      
      expect(cancelButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require car selection in fuel entry modal', () => {
      const entryWithoutCar = { ...mockEditEntry, carId: '' };
      render(<Modals {...defaultProps} editEntry={entryWithoutCar} />);
      
      const carSelects = screen.getAllByRole('combobox');
      const carSelect = carSelects[0]; // First select should be car
      expect(carSelect).toHaveAttribute('required');
    });

    it('should require fuel company selection', () => {
      const entryWithoutCompany = { ...mockEditEntry, fuelCompany: '' };
      render(<Modals {...defaultProps} editEntry={entryWithoutCompany} />);
      
      const selects = screen.getAllByRole('combobox');
      const companySelect = selects[1]; // Second select should be fuel company
      expect(companySelect).toHaveAttribute('required');
    });
  });
}); 