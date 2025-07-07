import {
  exportFuelEntriesToCSV,
  exportExpenseEntriesToCSV,
  exportIncomeEntriesToCSV,
  exportFilteredFuelEntries,
  exportFilteredExpenseEntries,
  exportFilteredIncomeEntries
} from '../../app/lib/csvExport'

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn()
  }
})

const mockBlob = jest.fn()
Object.defineProperty(global, 'Blob', {
  value: mockBlob
})

// Mock document methods
const mockLink = {
  setAttribute: jest.fn(),
  click: jest.fn(),
  style: {},
  download: true
}

Object.defineProperty(global.document, 'createElement', {
  value: jest.fn(() => mockLink)
})

Object.defineProperty(global.document.body, 'appendChild', {
  value: jest.fn()
})

Object.defineProperty(global.document.body, 'removeChild', {
  value: jest.fn()
})

// Mock alert
global.alert = jest.fn()

describe('csvExport', () => {
  const mockCars = [
    {
      id: 'car1',
      name: 'Toyota Camry',
      vehicleType: 'Car/Truck',
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      photo: '',
      dateAdded: '2024-01-01'
    },
    {
      id: 'car2',
      name: 'Honda Civic',
      vehicleType: 'Car/Truck',
      brand: 'Honda',
      model: 'Civic',
      year: 2019,
      photo: '',
      dateAdded: '2024-01-02'
    }
  ]

  const mockFuelEntries = [
    {
      id: 'fuel1',
      carId: 'car1',
      fuelCompany: 'Shell',
      fuelType: 'Regular Gasoline',
      mileage: 50000,
      distanceUnit: 'km',
      volume: 40.5,
      volumeUnit: 'liters',
      cost: 75.25,
      currency: 'USD',
      date: '2024-01-15',
      time: '10:30',
      location: 'Downtown Shell',
      partialFuelUp: false,
      paymentType: 'Credit Card',
      tyrePressure: 32,
      tyrePressureUnit: 'psi',
      tags: ['business', 'highway'],
      notes: 'Long trip to work'
    },
    {
      id: 'fuel2',
      carId: 'car2',
      fuelCompany: 'BP',
      fuelType: 'Premium Gasoline',
      mileage: 25000,
      distanceUnit: 'km',
      volume: 35.0,
      volumeUnit: 'liters',
      cost: 82.50,
      currency: 'USD',
      date: '2024-01-20',
      time: '14:15',
      location: 'Local BP Station',
      partialFuelUp: true,
      paymentType: 'Cash',
      tyrePressure: 30,
      tyrePressureUnit: 'psi',
      tags: ['personal'],
      notes: 'Weekend fill-up'
    }
  ]

  const mockExpenseEntries = [
    {
      id: 'expense1',
      carId: 'car1',
      category: 'Oil Change',
      amount: 45.99,
      currency: 'USD',
      date: '2024-01-10',
      notes: 'Regular maintenance'
    },
    {
      id: 'expense2',
      carId: 'car2',
      category: 'Tire Replacement',
      amount: 320.00,
      currency: 'USD',
      date: '2024-01-25',
      notes: 'All four tires replaced'
    }
  ]

  const mockIncomeEntries = [
    {
      id: 'income1',
      carId: 'car1',
      category: 'Ride Sharing',
      amount: 150.75,
      currency: 'USD',
      date: '2024-01-15',
      notes: 'Weekend driving'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportFuelEntriesToCSV', () => {
    it('should export fuel entries with correct headers and data', () => {
      exportFuelEntriesToCSV(mockFuelEntries, mockCars)

      expect(mockBlob).toHaveBeenCalledWith(
        [expect.stringContaining('Car Name,Date,Time,Fuel Company')],
        { type: 'text/csv;charset=utf-8;' }
      )

      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/fuel_entries_\d{4}-\d{2}-\d{2}\.csv/))
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should use custom filename when provided', () => {
      const customFilename = 'my_fuel_data.csv'
      exportFuelEntriesToCSV(mockFuelEntries, mockCars, customFilename)

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', customFilename)
    })

    it('should handle empty entries array', () => {
      exportFuelEntriesToCSV([], mockCars)

      expect(global.alert).toHaveBeenCalledWith('No fuel entries to export')
      expect(global.Blob).not.toHaveBeenCalled()
    })

    it('should escape CSV special characters', () => {
      const entriesWithSpecialChars = [{
        ...mockFuelEntries[0],
        location: 'Station "Main", Downtown',
        notes: 'Includes comma, and "quotes"'
      }]

      exportFuelEntriesToCSV(entriesWithSpecialChars, mockCars)

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('"Station ""Main"", Downtown"')
      expect(blobContent).toContain('"Includes comma, and ""quotes"""')
    })

    it('should handle unknown car ID', () => {
      const entriesWithUnknownCar = [{
        ...mockFuelEntries[0],
        carId: 'unknown-car'
      }]

      exportFuelEntriesToCSV(entriesWithUnknownCar, mockCars)

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Unknown Vehicle')
    })

    it('should format boolean values correctly', () => {
      exportFuelEntriesToCSV(mockFuelEntries, mockCars)

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('No') // partialFuelUp: false
      expect(blobContent).toContain('Yes') // partialFuelUp: true
    })

    it('should format array values correctly', () => {
      exportFuelEntriesToCSV(mockFuelEntries, mockCars)

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('business; highway')
      expect(blobContent).toContain('personal')
    })
  })

  describe('exportExpenseEntriesToCSV', () => {
    it('should export expense entries with correct headers and data', () => {
      exportExpenseEntriesToCSV(mockExpenseEntries, mockCars)

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Car Name,Date,Category,Amount,Currency,Notes')],
        { type: 'text/csv;charset=utf-8;' }
      )

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/expense_entries_\d{4}-\d{2}-\d{2}\.csv/))
    })

    it('should handle empty entries array', () => {
      exportExpenseEntriesToCSV([], mockCars)

      expect(global.alert).toHaveBeenCalledWith('No expense entries to export')
      expect(global.Blob).not.toHaveBeenCalled()
    })

    it('should use custom filename when provided', () => {
      const customFilename = 'my_expenses.csv'
      exportExpenseEntriesToCSV(mockExpenseEntries, mockCars, customFilename)

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', customFilename)
    })
  })

  describe('exportIncomeEntriesToCSV', () => {
    it('should export income entries with correct headers and data', () => {
      exportIncomeEntriesToCSV(mockIncomeEntries, mockCars)

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Car Name,Date,Category,Amount,Currency,Notes')],
        { type: 'text/csv;charset=utf-8;' }
      )

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/income_entries_\d{4}-\d{2}-\d{2}\.csv/))
    })

    it('should handle empty entries array', () => {
      exportIncomeEntriesToCSV([], mockCars)

      expect(global.alert).toHaveBeenCalledWith('No income entries to export')
      expect(global.Blob).not.toHaveBeenCalled()
    })
  })

  describe('exportFilteredFuelEntries', () => {
    it('should filter by car ID', () => {
      exportFilteredFuelEntries(mockFuelEntries, mockCars, { carId: 'car1' })

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Toyota Camry')
      expect(blobContent).not.toContain('Honda Civic')
    })

    it('should filter by date range', () => {
      exportFilteredFuelEntries(mockFuelEntries, mockCars, {
        startDate: '2024-01-16',
        endDate: '2024-01-25'
      })

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('2024-01-20') // Should include this date
      expect(blobContent).not.toContain('2024-01-15') // Should exclude this date
    })

         it('should export all entries when no fuel company filter is available', () => {
       // Note: fuelCompany filter is not implemented in exportFilteredFuelEntries
       exportFilteredFuelEntries(mockFuelEntries, mockCars, {})

       const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
       expect(blobContent).toContain('Shell')
       expect(blobContent).toContain('BP') // Both should be present since no filtering by fuel company
     })

    it('should apply multiple filters simultaneously', () => {
      exportFilteredFuelEntries(mockFuelEntries, mockCars, {
        carId: 'car1',
        startDate: '2024-01-01',
        endDate: '2024-01-20'
      })

      // Should only include entries for car1 within date range
      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Toyota Camry')
      expect(blobContent).toContain('2024-01-15')
      expect(blobContent).not.toContain('Honda Civic')
    })

    it('should handle empty filter results', () => {
      exportFilteredFuelEntries(mockFuelEntries, mockCars, { carId: 'nonexistent' })

      expect(global.alert).toHaveBeenCalledWith('No fuel entries to export')
      expect(global.Blob).not.toHaveBeenCalled()
    })
  })

  describe('exportFilteredExpenseEntries', () => {
    it('should filter by category', () => {
      exportFilteredExpenseEntries(mockExpenseEntries, mockCars, { category: 'Oil Change' })

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Oil Change')
      expect(blobContent).not.toContain('Tire Replacement')
    })

    it('should filter by car ID and date range', () => {
      exportFilteredExpenseEntries(mockExpenseEntries, mockCars, {
        carId: 'car2',
        startDate: '2024-01-20',
        endDate: '2024-01-30'
      })

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Honda Civic')
      expect(blobContent).toContain('Tire Replacement')
      expect(blobContent).not.toContain('Toyota Camry')
    })
  })

  describe('exportFilteredIncomeEntries', () => {
    it('should filter by category', () => {
      exportFilteredIncomeEntries(mockIncomeEntries, mockCars, { category: 'Ride Sharing' })

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Ride Sharing')
    })

    it('should handle non-matching filters', () => {
      exportFilteredIncomeEntries(mockIncomeEntries, mockCars, { category: 'Delivery Services' })

      expect(global.alert).toHaveBeenCalledWith('No income entries to export')
      expect(global.Blob).not.toHaveBeenCalled()
    })
  })

  describe('edge cases and error handling', () => {
         it('should handle null and undefined values', () => {
       const entriesWithNulls = [{
         ...mockFuelEntries[0],
         location: null as any,
         notes: undefined as any,
         tyrePressure: null as any
       }]

       exportFuelEntriesToCSV(entriesWithNulls, mockCars)

       const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
       // Should handle nulls gracefully without breaking
       expect(blobContent).toContain('Toyota Camry')
     })

    it('should handle cars with _id property (MongoDB style)', () => {
      const carsWithMongoId = [
        { ...mockCars[0], _id: 'car1' }
      ]

      const entriesForMongoCar = [
        { ...mockFuelEntries[0], carId: 'car1' }
      ]

      exportFuelEntriesToCSV(entriesForMongoCar, carsWithMongoId as any)

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('Toyota Camry')
    })

    it('should handle browser without download support', () => {
      const mockLinkWithoutDownload = { ...mockLink, download: undefined }
      ;(global.document.createElement as jest.Mock).mockReturnValueOnce(mockLinkWithoutDownload)

      exportFuelEntriesToCSV(mockFuelEntries, mockCars)

      // Should not attempt to download if download is not supported
      expect(mockLinkWithoutDownload.click).not.toHaveBeenCalled()
    })

    it('should handle entries with string numbers', () => {
      const entriesWithStringNumbers = [{
        ...mockFuelEntries[0],
        mileage: '50000',
        volume: '40.5',
        cost: '75.25'
      }]

      exportFuelEntriesToCSV(entriesWithStringNumbers, mockCars)

      const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0]
      expect(blobContent).toContain('50000')
      expect(blobContent).toContain('40.5')
      expect(blobContent).toContain('75.25')
    })
  })
}) 