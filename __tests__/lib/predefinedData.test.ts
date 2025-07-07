import {
  predefinedFuelCompanies,
  predefinedFuelTypes,
  predefinedExpenseCategories,
  predefinedIncomeCategories
} from '../../app/lib/predefinedData'

describe('predefinedData', () => {
  describe('predefinedFuelCompanies', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(predefinedFuelCompanies)).toBe(true)
      expect(predefinedFuelCompanies.length).toBeGreaterThan(0)
      
      predefinedFuelCompanies.forEach(company => {
        expect(typeof company).toBe('string')
        expect(company.length).toBeGreaterThan(0)
      })
    })

    it('should contain major fuel companies', () => {
      const majorCompanies = ['Shell', 'BP', 'Exxon', 'Chevron', 'Total']
      
      majorCompanies.forEach(company => {
        expect(predefinedFuelCompanies).toContain(company)
      })
    })

    it('should not contain duplicate entries', () => {
      const uniqueCompanies = [...new Set(predefinedFuelCompanies)]
      expect(uniqueCompanies.length).toBe(predefinedFuelCompanies.length)
    })

    it('should have reasonable number of companies', () => {
      expect(predefinedFuelCompanies.length).toBeGreaterThanOrEqual(10)
      expect(predefinedFuelCompanies.length).toBeLessThan(100)
    })
  })

  describe('predefinedFuelTypes', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(predefinedFuelTypes)).toBe(true)
      expect(predefinedFuelTypes.length).toBeGreaterThan(0)
      
      predefinedFuelTypes.forEach(type => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
    })

    it('should contain common fuel types', () => {
      const commonTypes = [
        'Regular Gasoline',
        'Premium Gasoline',
        'Diesel',
        'Electric'
      ]
      
      commonTypes.forEach(type => {
        expect(predefinedFuelTypes).toContain(type)
      })
    })

    it('should include alternative fuel types', () => {
      const alternativeTypes = [
        'E85 Ethanol',
        'CNG (Compressed Natural Gas)',
        'LPG (Liquefied Petroleum Gas)',
        'Hydrogen'
      ]
      
      alternativeTypes.forEach(type => {
        expect(predefinedFuelTypes).toContain(type)
      })
    })

    it('should not contain duplicate entries', () => {
      const uniqueTypes = [...new Set(predefinedFuelTypes)]
      expect(uniqueTypes.length).toBe(predefinedFuelTypes.length)
    })

    it('should have Other category', () => {
      expect(predefinedFuelTypes).toContain('Other')
    })
  })

  describe('predefinedExpenseCategories', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(predefinedExpenseCategories)).toBe(true)
      expect(predefinedExpenseCategories.length).toBeGreaterThan(0)
      
      predefinedExpenseCategories.forEach(category => {
        expect(typeof category).toBe('string')
        expect(category.length).toBeGreaterThan(0)
      })
    })

    it('should contain maintenance categories', () => {
      const maintenanceCategories = [
        'Oil Change',
        'Tire Replacement',
        'Brake Service',
        'Engine Repair',
        'Regular Service'
      ]
      
      maintenanceCategories.forEach(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })

    it('should contain insurance categories', () => {
      const insuranceCategories = [
        'Insurance Premium',
        'Insurance Deductible'
      ]
      
      insuranceCategories.forEach(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })

    it('should contain legal/registration categories', () => {
      const legalCategories = [
        'Vehicle Registration',
        'License Renewal',
        'Inspection Fee'
      ]
      
      legalCategories.forEach(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })

    it('should contain cleaning categories', () => {
      const cleaningCategories = [
        'Car Wash',
        'Detailing'
      ]
      
      cleaningCategories.forEach(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })

    it('should contain parking and toll categories', () => {
      const operationalCategories = [
        'Parking Fees',
        'Tolls'
      ]
      
      operationalCategories.forEach(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })

    it('should not contain duplicate entries', () => {
      const uniqueCategories = [...new Set(predefinedExpenseCategories)]
      expect(uniqueCategories.length).toBe(predefinedExpenseCategories.length)
    })

    it('should have comprehensive coverage', () => {
      // Should have a substantial number of categories
      expect(predefinedExpenseCategories.length).toBeGreaterThan(50)
    })

    it('should have fallback categories', () => {
      const fallbackCategories = ['Miscellaneous', 'Other']
      
      fallbackCategories.some(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })
  })

  describe('predefinedIncomeCategories', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(predefinedIncomeCategories)).toBe(true)
      expect(predefinedIncomeCategories.length).toBeGreaterThan(0)
      
      predefinedIncomeCategories.forEach(category => {
        expect(typeof category).toBe('string')
        expect(category.length).toBeGreaterThan(0)
      })
    })

    it('should contain vehicle-related income categories', () => {
      const vehicleIncomeCategories = [
        'Ride Sharing',
        'Delivery Services',
        'Car Rental',
        'Vehicle Sale'
      ]
      
      vehicleIncomeCategories.forEach(category => {
        expect(predefinedIncomeCategories).toContain(category)
      })
    })

    it('should contain reimbursement categories', () => {
      const reimbursementCategories = [
        'Fuel Reimbursement',
        'Mileage Reimbursement'
      ]
      
      reimbursementCategories.forEach(category => {
        expect(predefinedIncomeCategories).toContain(category)
      })
    })

    it('should not contain duplicate entries', () => {
      const uniqueCategories = [...new Set(predefinedIncomeCategories)]
      expect(uniqueCategories.length).toBe(predefinedIncomeCategories.length)
    })

    it('should have Other category', () => {
      expect(predefinedIncomeCategories).toContain('Other')
    })

    it('should be focused and concise', () => {
      // Income categories should be fewer than expense categories
      expect(predefinedIncomeCategories.length).toBeLessThan(predefinedExpenseCategories.length)
      expect(predefinedIncomeCategories.length).toBeGreaterThan(5)
    })
  })

  describe('data integrity', () => {
    it('should have all arrays properly exported', () => {
      expect(predefinedFuelCompanies).toBeDefined()
      expect(predefinedFuelTypes).toBeDefined()
      expect(predefinedExpenseCategories).toBeDefined()
      expect(predefinedIncomeCategories).toBeDefined()
    })

    it('should not have empty string entries', () => {
      const allArrays = [
        predefinedFuelCompanies,
        predefinedFuelTypes,
        predefinedExpenseCategories,
        predefinedIncomeCategories
      ]

      allArrays.forEach(array => {
        array.forEach(item => {
          expect(item.trim()).not.toBe('')
        })
      })
    })

    it('should not have undefined or null entries', () => {
      const allArrays = [
        predefinedFuelCompanies,
        predefinedFuelTypes,
        predefinedExpenseCategories,
        predefinedIncomeCategories
      ]

      allArrays.forEach(array => {
        array.forEach(item => {
          expect(item).not.toBeUndefined()
          expect(item).not.toBeNull()
        })
      })
    })

    it('should have reasonable string lengths', () => {
      const allArrays = [
        predefinedFuelCompanies,
        predefinedFuelTypes,
        predefinedExpenseCategories,
        predefinedIncomeCategories
      ]

      allArrays.forEach(array => {
        array.forEach(item => {
          expect(item.length).toBeGreaterThan(1)
          expect(item.length).toBeLessThan(100) // Reasonable upper limit
        })
      })
    })
  })

  describe('business logic validation', () => {
    it('should support vehicle expense tracking workflow', () => {
      // Check that we have categories for common vehicle expenses
      const essentialExpenseCategories = [
        'Oil Change',
        'Tire Replacement',
        'Insurance Premium',
        'Vehicle Registration',
        'Parking Fees'
      ]

      essentialExpenseCategories.forEach(category => {
        expect(predefinedExpenseCategories).toContain(category)
      })
    })

    it('should support commercial vehicle operation', () => {
      // Check that we have income categories for commercial use
      const commercialIncomeCategories = [
        'Ride Sharing',
        'Delivery Services',
        'Business Use'
      ]

      commercialIncomeCategories.forEach(category => {
        expect(predefinedIncomeCategories).toContain(category)
      })
    })

    it('should provide comprehensive fuel company coverage', () => {
      // Check that we have major international and regional companies
      const internationalCompanies = ['Shell', 'BP', 'Total']
      const usCompanies = ['Exxon', 'Chevron', 'ARCO']
      const retailCompanies = ['7-Eleven', 'Costco']

      const allMajorCompanies = [...internationalCompanies, ...usCompanies, ...retailCompanies]
      
      allMajorCompanies.forEach(company => {
        expect(predefinedFuelCompanies).toContain(company)
      })
    })
  })
}) 