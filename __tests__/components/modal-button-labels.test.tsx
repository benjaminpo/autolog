import React from 'react';
import { render, screen } from '@testing-library/react';
import { Modals } from '../../app/components/modals';
import { expenseCategories } from '../../app/lib/vehicleData';

describe('Modal Button Labels Fallback System', () => {
  const defaultProps = {
    cars: [],
    fuelCompanies: [],
    fuelTypes: [],
    expenseCategories,
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

  describe('Translation Fallback Chain', () => {
    it('should use direct translation when available', () => {
      const mockT = {
        save: 'Direct Save',
        cancel: 'Direct Cancel',
        'actions.save': 'Nested Save',
        'actions.cancel': 'Nested Cancel',
        edit: 'Edit',
        car: 'Car',
        category: 'Category',
        amount: 'Amount',
        currency: 'Currency',
        date: 'Date',
        notes: 'Notes',
      };

      const expenseEntry = {
        id: '1',
        carId: '1',
        category: 'Service',
        amount: 100,
        currency: 'USD',
        date: '2023-01-01',
        notes: 'Test',
        images: [],
      };

      render(<Modals {...defaultProps} t={mockT} editExpense={expenseEntry} />);
      
      // Should use direct translation, not nested
      expect(screen.getByText('Direct Save')).toBeInTheDocument();
      expect(screen.getByText('Direct Cancel')).toBeInTheDocument();
    });

    it('should use nested translation when direct is not available', () => {
      const mockT = {
        'actions.save': 'Nested Save Only',
        'actions.cancel': 'Nested Cancel Only',
        edit: 'Edit',
        car: 'Car',
        category: 'Category',
        amount: 'Amount',
        currency: 'Currency',
        date: 'Date',
        notes: 'Notes',
      };

      const expenseEntry = {
        id: '1',
        carId: '1',
        category: 'Service',
        amount: 100,
        currency: 'USD',
        date: '2023-01-01',
        notes: 'Test',
        images: [],
      };

      render(<Modals {...defaultProps} t={mockT} editExpense={expenseEntry} />);
      
      // Should use nested translation
      expect(screen.getByText('Nested Save Only')).toBeInTheDocument();
      expect(screen.getByText('Nested Cancel Only')).toBeInTheDocument();
    });

    it('should use English fallback when no translations exist', () => {
      const mockT = {
        edit: 'Edit',
        car: 'Car',
        category: 'Category',
        amount: 'Amount',
        currency: 'Currency',
        date: 'Date',
        notes: 'Notes',
      };

      const expenseEntry = {
        id: '1',
        carId: '1',
        category: 'Service',
        amount: 100,
        currency: 'USD',
        date: '2023-01-01',
        notes: 'Test',
        images: [],
      };

      render(<Modals {...defaultProps} t={mockT} editExpense={expenseEntry} />);
      
      // Should use English fallback
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Multiple Modal Types', () => {
    it('should work with fuel entry modal', () => {
      const mockT = {
        save: 'Save Fuel',
        cancel: 'Cancel Fuel',
        edit: 'Edit',
        car: 'Car',
        fuelCompany: 'Fuel Company',
        fuelType: 'Fuel Type',
        basicInfo: 'Basic Info',
        fuelDetails: 'Fuel Details',
        additionalInfo: 'Additional Info',
      };

      const fuelEntry = {
        id: '1',
        carId: '1',
        fuelCompany: 'Shell',
        fuelType: 'Gasoline',
        mileage: 50000,
        distanceUnit: 'km',
        volume: 50,
        volumeUnit: 'L',
        cost: 75,
        currency: 'USD',
        date: '2023-01-01',
        time: '12:00',
        location: 'Test',
        partialFuelUp: false,
        paymentType: 'Credit Card',
        tyrePressure: 32,
        tyrePressureUnit: 'psi',
        tags: [],
        notes: 'Test',
        images: [],
      };

      render(<Modals {...defaultProps} t={mockT} editEntry={fuelEntry} />);
      
      expect(screen.getByText('Save Fuel')).toBeInTheDocument();
      expect(screen.getByText('Cancel Fuel')).toBeInTheDocument();
    });

    it('should work with fuel company modal', () => {
      const mockT = {
        save: 'Save Company',
        cancel: 'Cancel Company',
        editFuelCompany: 'Edit Fuel Company',
        fuelCompany: 'Fuel Company',
      };

      const editFuelCompany = { old: 'Shell', new: 'Shell Updated' };

      render(<Modals {...defaultProps} t={mockT} editFuelCompany={editFuelCompany} />);
      
      expect(screen.getByText('Save Company')).toBeInTheDocument();
      expect(screen.getByText('Cancel Company')).toBeInTheDocument();
    });
  });

  describe('UI Consistency', () => {
    it('should ensure all edit modals have consistent button structure', () => {
      const mockT = { save: 'Save', cancel: 'Cancel', edit: 'Edit', car: 'Car', category: 'Category', amount: 'Amount', currency: 'Currency', date: 'Date', notes: 'Notes' };
      
      const expenseEntry = {
        id: '1',
        carId: '1',
        category: 'Service',
        amount: 100,
        currency: 'USD',
        date: '2023-01-01',
        notes: 'Test',
        images: [],
      };

      render(<Modals {...defaultProps} t={mockT} editExpense={expenseEntry} />);
      
      // Check that buttons have appropriate styling classes
      const saveButton = screen.getByText('Save');
      const cancelButton = screen.getByText('Cancel');
      
      expect(saveButton).toHaveClass('bg-blue-500');
      expect(cancelButton).toHaveClass('bg-gray-500');
    });
  });
}); 