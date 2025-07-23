import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock the page component
const MockAddFuelPage = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = React.useState({
    vehicleId: '',
    date: '',
    odometer: '',
    fuelAmount: '',
    pricePerUnit: '',
    totalCost: '',
    fuelType: '',
    fuelCompany: '',
    location: '',
    notes: '',
  });

  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [fuelTypes, setFuelTypes] = React.useState<any[]>([]);
  const [fuelCompanies, setFuelCompanies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock API call
      const response = await fetch('/api/fuel-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/fuel-history');
      } else {
        setErrors({ submit: 'Failed to save fuel entry' });
      }
    } catch (error) {
      console.error('Network error:', error);
      setErrors({ submit: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-calculate total cost
    if (field === 'fuelAmount' || field === 'pricePerUnit') {
      const amount = field === 'fuelAmount' ? parseFloat(value) : parseFloat(formData.fuelAmount);
      const price = field === 'pricePerUnit' ? parseFloat(value) : parseFloat(formData.pricePerUnit);

      if (!isNaN(amount) && !isNaN(price)) {
        setFormData(prev => ({ ...prev, totalCost: (amount * price).toFixed(2) }));
      }
    }
  };

  React.useEffect(() => {
    // Mock data loading
    setVehicles([
      { _id: '1', make: 'Toyota', model: 'Camry', year: 2020 },
      { _id: '2', make: 'Honda', model: 'Civic', year: 2019 },
    ]);
    setFuelTypes([
      { _id: '1', name: 'Regular' },
      { _id: '2', name: 'Premium' },
    ]);
    setFuelCompanies([
      { _id: '1', name: 'Shell' },
      { _id: '2', name: 'Exxon' },
    ]);
  }, []);

  if (!session) {
    return <div>Please log in to add fuel entries</div>;
  }

  return (
    <div data-testid="add-fuel-page">
      <h1>Add Fuel Entry</h1>

      <form onSubmit={handleSubmit} data-testid="fuel-form">
        <div>
          <label htmlFor="vehicleId">Vehicle</label>
          <select
            id="vehicleId"
            value={formData.vehicleId}
            onChange={(e) => handleInputChange('vehicleId', e.target.value)}
            required
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle: any) => (
              <option key={vehicle._id} value={vehicle._id}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="odometer">Odometer Reading</label>
          <input
            type="number"
            id="odometer"
            value={formData.odometer}
            onChange={(e) => handleInputChange('odometer', e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="fuelAmount">Fuel Amount (L)</label>
          <input
            type="number"
            step="0.01"
            id="fuelAmount"
            value={formData.fuelAmount}
            onChange={(e) => handleInputChange('fuelAmount', e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="pricePerUnit">Price per Liter</label>
          <input
            type="number"
            step="0.001"
            id="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="totalCost">Total Cost</label>
          <input
            type="number"
            step="0.01"
            id="totalCost"
            value={formData.totalCost}
            onChange={(e) => handleInputChange('totalCost', e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="fuelType">Fuel Type</label>
          <select
            id="fuelType"
            value={formData.fuelType}
            onChange={(e) => handleInputChange('fuelType', e.target.value)}
            required
          >
            <option value="">Select Fuel Type</option>
            {fuelTypes.map((type: any) => (
              <option key={type._id} value={type._id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fuelCompany">Fuel Company</label>
          <select
            id="fuelCompany"
            value={formData.fuelCompany}
            onChange={(e) => handleInputChange('fuelCompany', e.target.value)}
          >
            <option value="">Select Company</option>
            {fuelCompanies.map((company: any) => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Gas station location"
          />
        </div>

        <div>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes"
          />
        </div>

        {errors.submit && (
          <div data-testid="error-message" style={{ color: 'red' }}>
            {errors.submit}
          </div>
        )}

        <button type="submit" disabled={loading} data-testid="submit-button">
          {loading ? 'Saving...' : 'Save Fuel Entry'}
        </button>
      </form>
    </div>
  );
};

// Mock fetch
global.fetch = jest.fn();

describe('Add Fuel Page', () => {
  const mockPush = jest.fn();
  const mockSession = {
    user: { id: 'user123', email: 'test@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('should render the add fuel form', () => {
    render(<MockAddFuelPage />);

    expect(screen.getByTestId('add-fuel-page')).toBeInTheDocument();
    expect(screen.getByText('Add Fuel Entry')).toBeInTheDocument();
    expect(screen.getByTestId('fuel-form')).toBeInTheDocument();
  });

  it('should show login message when not authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<MockAddFuelPage />);

    expect(screen.getByText('Please log in to add fuel entries')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<MockAddFuelPage />);

    expect(screen.getByLabelText('Vehicle')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Odometer Reading')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuel Amount (L)')).toBeInTheDocument();
    expect(screen.getByLabelText('Price per Liter')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Cost')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuel Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuel Company')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('should populate vehicle options', async () => {
    render(<MockAddFuelPage />);

    await waitFor(() => {
      expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
      expect(screen.getByText('2019 Honda Civic')).toBeInTheDocument();
    });
  });

  it('should populate fuel type options', async () => {
    render(<MockAddFuelPage />);

    await waitFor(() => {
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });

  it('should populate fuel company options', async () => {
    render(<MockAddFuelPage />);

    await waitFor(() => {
      expect(screen.getByText('Shell')).toBeInTheDocument();
      expect(screen.getByText('Exxon')).toBeInTheDocument();
    });
  });

  it('should handle form input changes', () => {
    render(<MockAddFuelPage />);

    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2023-12-01' } });
    expect(dateInput).toHaveValue('2023-12-01');

    const odometerInput = screen.getByLabelText('Odometer Reading');
    fireEvent.change(odometerInput, { target: { value: '50000' } });
    expect(odometerInput).toHaveValue(50000);
  });

  it('should auto-calculate total cost', () => {
    render(<MockAddFuelPage />);

    const fuelAmountInput = screen.getByLabelText('Fuel Amount (L)');
    const pricePerUnitInput = screen.getByLabelText('Price per Liter');
    const totalCostInput = screen.getByLabelText('Total Cost');

    fireEvent.change(fuelAmountInput, { target: { value: '40' } });
    fireEvent.change(pricePerUnitInput, { target: { value: '1.50' } });

    expect(totalCostInput).toHaveValue(60);
  });

  it('should handle form submission successfully', async () => {
    render(<MockAddFuelPage />);

    const form = screen.getByTestId('fuel-form');
    const submitButton = screen.getByTestId('submit-button');

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-12-01' } });
    fireEvent.change(screen.getByLabelText('Odometer Reading'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Fuel Amount (L)'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Price per Liter'), { target: { value: '1.50' } });

    fireEvent.submit(form);

    expect(submitButton).toHaveTextContent('Saving...');
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/fuel-history');
    });
  });

  it('should handle form submission error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
    });

    render(<MockAddFuelPage />);

    const form = screen.getByTestId('fuel-form');

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-12-01' } });
    fireEvent.change(screen.getByLabelText('Odometer Reading'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Fuel Amount (L)'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Price per Liter'), { target: { value: '1.50' } });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to save fuel entry');
    });
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<MockAddFuelPage />);

    const form = screen.getByTestId('fuel-form');

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-12-01' } });
    fireEvent.change(screen.getByLabelText('Odometer Reading'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Fuel Amount (L)'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Price per Liter'), { target: { value: '1.50' } });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
    });
  });

  it('should validate required fields', () => {
    render(<MockAddFuelPage />);

    const vehicleSelect = screen.getByLabelText('Vehicle');
    const dateInput = screen.getByLabelText('Date');
    const odometerInput = screen.getByLabelText('Odometer Reading');
    const fuelAmountInput = screen.getByLabelText('Fuel Amount (L)');
    const pricePerUnitInput = screen.getByLabelText('Price per Liter');
    const totalCostInput = screen.getByLabelText('Total Cost');
    const fuelTypeSelect = screen.getByLabelText('Fuel Type');

    expect(vehicleSelect).toBeRequired();
    expect(dateInput).toBeRequired();
    expect(odometerInput).toBeRequired();
    expect(fuelAmountInput).toBeRequired();
    expect(pricePerUnitInput).toBeRequired();
    expect(totalCostInput).toBeRequired();
    expect(fuelTypeSelect).toBeRequired();
  });

  it('should handle optional fields', () => {
    render(<MockAddFuelPage />);

    const locationInput = screen.getByLabelText('Location');
    const notesInput = screen.getByLabelText('Notes');

    fireEvent.change(locationInput, { target: { value: 'Downtown Shell' } });
    fireEvent.change(notesInput, { target: { value: 'Full tank' } });

    expect(locationInput).toHaveValue('Downtown Shell');
    expect(notesInput).toHaveValue('Full tank');
  });

  it('should handle vehicle selection', async () => {
    render(<MockAddFuelPage />);

    await waitFor(() => {
      const vehicleSelect = screen.getByLabelText('Vehicle');
      fireEvent.change(vehicleSelect, { target: { value: '1' } });
      expect(vehicleSelect).toHaveValue('1');
    });
  });

  it('should handle fuel type selection', async () => {
    render(<MockAddFuelPage />);

    await waitFor(() => {
      const fuelTypeSelect = screen.getByLabelText('Fuel Type');
      fireEvent.change(fuelTypeSelect, { target: { value: '1' } });
      expect(fuelTypeSelect).toHaveValue('1');
    });
  });

  it('should handle fuel company selection', async () => {
    render(<MockAddFuelPage />);

    await waitFor(() => {
      const fuelCompanySelect = screen.getByLabelText('Fuel Company');
      fireEvent.change(fuelCompanySelect, { target: { value: '1' } });
      expect(fuelCompanySelect).toHaveValue('1');
    });
  });

  it('should handle decimal values correctly', () => {
    render(<MockAddFuelPage />);

    const fuelAmountInput = screen.getByLabelText('Fuel Amount (L)');
    const pricePerUnitInput = screen.getByLabelText('Price per Liter');

    fireEvent.change(fuelAmountInput, { target: { value: '40.5' } });
    fireEvent.change(pricePerUnitInput, { target: { value: '1.459' } });

    expect(fuelAmountInput).toHaveValue(40.5);
    expect(pricePerUnitInput).toHaveValue(1.459);
  });

  it('should reset loading state after submission', async () => {
    render(<MockAddFuelPage />);

    const form = screen.getByTestId('fuel-form');
    const submitButton = screen.getByTestId('submit-button');

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-12-01' } });
    fireEvent.change(screen.getByLabelText('Odometer Reading'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Fuel Amount (L)'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Price per Liter'), { target: { value: '1.50' } });

    fireEvent.submit(form);

    expect(submitButton).toHaveTextContent('Saving...');

    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Save Fuel Entry');
      expect(submitButton).not.toBeDisabled();
    });
  });
});
