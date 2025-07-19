'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import { AuthButton } from '../components/AuthButton';
import { TranslatedNavigation } from '../components/TranslatedNavigation';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { SimpleThemeToggle } from '../components/ThemeToggle';
import { useTranslation } from '../hooks/useTranslation';
import { currencies, expenseCategories as predefinedExpenseCategories } from '../lib/vehicleData';
import { getObjectId } from '../lib/idUtils';
import ImageUpload from '../components/ImageUpload';

interface Car {
  id?: string;
  _id?: string;
  name: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  photo: string;
  dateAdded: string;
}

export default function AddExpensePage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [expenseForm, setExpenseForm] = useState({
    carId: '',
    category: '',
    amount: '',
    currency: 'HKD' as typeof currencies[number],
    date: new Date().toISOString().split('T')[0],
    notes: '',
    images: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  useEffect(() => {
    if (!user) return;

    // Fetch vehicles
    fetch('/api/vehicles')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.vehicles)) {
          const normalizedVehicles = data.vehicles.map((vehicle: Partial<Car>) => {
            const normalizedVehicle = {...vehicle};
            if (normalizedVehicle._id && !normalizedVehicle.id) {
              normalizedVehicle.id = normalizedVehicle._id.toString();
            } else if (normalizedVehicle.id && !normalizedVehicle._id) {
              normalizedVehicle._id = normalizedVehicle.id;
            }
            return normalizedVehicle;
          });
          setCars(normalizedVehicles);
        }
      })
      .catch(error => {
        console.error('Error fetching vehicles:', error);
      });

    // Fetch expense categories
    fetch('/api/expense-categories')
      .then(response => response.json())
      .then(data => {
        if (data.success && Array.isArray(data.expenseCategories)) {
          // Combine predefined categories with custom categories from API
          const customCategories = data.expenseCategories.map((cat: { name: string }) => cat.name);
          const allCategories = [...predefinedExpenseCategories, ...customCategories];
          setExpenseCategories([...new Set(allCategories)].sort((a, b) => a.localeCompare(b)));
        } else {
          // Fallback to predefined categories only
          setExpenseCategories(predefinedExpenseCategories.slice().sort((a, b) => a.localeCompare(b)));
        }
      })
      .catch(error => {
        console.error('Error fetching expense categories:', error);
        // Fallback to predefined categories only
        setExpenseCategories(predefinedExpenseCategories.slice().sort((a, b) => a.localeCompare(b)));
      });

    // Load user preferences
    loadFormPreferences();
  }, [user]);

  const loadFormPreferences = () => {
    try {
      const savedPrefs = localStorage.getItem('expenseFormPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setExpenseForm(prev => ({
          ...prev,
          carId: prefs.carId || '',
          category: prefs.category || '',
          currency: prefs.currency || 'HKD',
        }));
      }
    } catch (error) {
      console.error('Error loading form preferences:', error);
    }
  };

  const saveFormPreferences = (formData: typeof expenseForm) => {
    try {
      const prefsToSave = {
        carId: formData.carId,
        category: formData.category,
        currency: formData.currency,
      };
      localStorage.setItem('expenseFormPreferences', JSON.stringify(prefsToSave));
    } catch (error) {
      console.error('Error saving form preferences:', error);
    }
  };

  const clearPreferences = () => {
    try {
      localStorage.removeItem('expenseFormPreferences');
      setExpenseForm({
        carId: '',
        category: '',
        amount: '',
        currency: 'HKD' as typeof currencies[number],
        date: new Date().toISOString().split('T')[0],
        notes: '',
        images: [],
      });
      setSubmitMessage({ type: 'success', text: 'Preferences cleared successfully!' });
    } catch (error) {
      console.error('Error clearing preferences:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to clear preferences' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/expense-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseForm),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage({ type: 'success', text: (t as any)?.expense?.labels?.addExpense ? `${(t as any).expense.labels.addExpense} successful!` : 'Expense added successfully!' });
        
        // Save user preferences
        saveFormPreferences(expenseForm);

        // Reset only specific fields while preserving user preferences
        setExpenseForm(prev => ({
          ...prev,
          amount: '',
          notes: '',
        }));
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to add expense' });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while adding the expense' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getText = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: unknown = t;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return typeof value === 'string' ? value : fallback || key;
  };

  const getCategoryTranslation = (category: string): string => {
    const categoryKey = category.toLowerCase().replace(/\s+/g, '');
    
    // Check if there's a direct translation available
    if (t && categoryKey in t) {
      return (t as any)[categoryKey] as string;
    }
    
    // Map to specific translation keys for all categories
    const categoryMap: { [key: string]: string } = {
      // Maintenance & Service
      'regular service': getText('expense.labels.regularService', category),
      'oil change': getText('expense.labels.oilChange', category),
      'tire replacement': getText('expense.labels.tireReplacement', category),
      'tire repair': getText('expense.labels.tireRepair', category),
      'tire rotation': getText('expense.labels.tireRotation', category),
      'tire balancing': getText('expense.labels.tireBalancing', category),
      'wheel alignment': getText('expense.labels.wheelAlignment', category),
      'brake service': getText('expense.labels.brakeService', category),
      'brake pad replacement': getText('expense.labels.brakePadReplacement', category),
      'brake fluid change': getText('expense.labels.brakeFluidChange', category),
      'engine repair': getText('expense.labels.engineRepair', category),
      'engine tune-up': getText('expense.labels.engineTuneUp', category),
      'engine oil filter': getText('expense.labels.engineOilFilter', category),
      'transmission service': getText('expense.labels.transmissionService', category),
      'transmission repair': getText('expense.labels.transmissionRepair', category),
      'transmission fluid change': getText('expense.labels.transmissionFluidChange', category),
      'battery replacement': getText('expense.labels.batteryReplacement', category),
      'battery testing': getText('expense.labels.batteryTesting', category),
      'air filter': getText('expense.labels.airFilter', category),
      'cabin air filter': getText('expense.labels.cabinAirFilter', category),
      'fuel filter': getText('expense.labels.fuelFilter', category),
      'spark plugs': getText('expense.labels.sparkPlugs', category),
      'spark plug wires': getText('expense.labels.sparkPlugWires', category),
      'coolant service': getText('expense.labels.coolantService', category),
      'coolant flush': getText('expense.labels.coolantFlush', category),
      'radiator repair': getText('expense.labels.radiatorRepair', category),
      'thermostat replacement': getText('expense.labels.thermostatReplacement', category),
      'water pump replacement': getText('expense.labels.waterPumpReplacement', category),
      'exhaust repair': getText('expense.labels.exhaustRepair', category),
      'muffler replacement': getText('expense.labels.mufflerReplacement', category),
      'catalytic converter': getText('expense.labels.catalyticConverter', category),
      'suspension repair': getText('expense.labels.suspensionRepair', category),
      'shock absorber replacement': getText('expense.labels.shockAbsorberReplacement', category),
      'strut replacement': getText('expense.labels.strutReplacement', category),
      'spring replacement': getText('expense.labels.springReplacement', category),
      'electrical repair': getText('expense.labels.electricalRepair', category),
      'alternator replacement': getText('expense.labels.alternatorReplacement', category),
      'starter replacement': getText('expense.labels.starterReplacement', category),
      'fuse replacement': getText('expense.labels.fuseReplacement', category),
      'wiring repair': getText('expense.labels.wiringRepair', category),
      'air conditioning service': getText('expense.labels.airConditioningService', category),
      'ac compressor': getText('expense.labels.acCompressor', category),
      'ac refrigerant': getText('expense.labels.acRefrigerant', category),
      'heater repair': getText('expense.labels.heaterRepair', category),
      'windshield wiper blades': getText('expense.labels.windshieldWiperBlades', category),
      'windshield washer fluid': getText('expense.labels.windshieldWasherFluid', category),
      'power steering service': getText('expense.labels.powerSteeringService', category),
      'belt replacement': getText('expense.labels.beltReplacement', category),
      'hose replacement': getText('expense.labels.hoseReplacement', category),
      'timing belt': getText('expense.labels.timingBelt', category),
      'clutch repair': getText('expense.labels.clutchRepair', category),
      'clutch replacement': getText('expense.labels.clutchReplacement', category),
      'cv joint repair': getText('expense.labels.cvJointRepair', category),
      'differential service': getText('expense.labels.differentialService', category),
      'fuel pump replacement': getText('expense.labels.fuelPumpReplacement', category),
      'fuel injector cleaning': getText('expense.labels.fuelInjectorCleaning', category),
      'carburetor service': getText('expense.labels.carburetorService', category),
      
      // Legal & Registration
      'vehicle registration': getText('expense.labels.vehicleRegistration', category),
      'registration renewal': getText('expense.labels.registrationRenewal', category),
      'license renewal': getText('expense.labels.licenseRenewal', category),
      'inspection fee': getText('expense.labels.inspectionFee', category),
      'safety inspection': getText('expense.labels.safetyInspection', category),
      'emissions test': getText('expense.labels.emissionsTest', category),
      'smog check': getText('expense.labels.smogCheck', category),
      'road tax': getText('expense.labels.roadTax', category),
      'vehicle tax': getText('expense.labels.vehicleTax', category),
      'tag renewal': getText('expense.labels.tagRenewal', category),
      'title transfer': getText('expense.labels.titleTransfer', category),
      'notary fees': getText('expense.labels.notaryFees', category),
      'dmv fees': getText('expense.labels.dmvFees', category),
      
      // Insurance & Protection
      'insurance premium': getText('expense.labels.insurancePremium', category),
      'insurance deductible': getText('expense.labels.insuranceDeductible', category),
      'comprehensive coverage': getText('expense.labels.comprehensiveCoverage', category),
      'collision coverage': getText('expense.labels.collisionCoverage', category),
      'liability insurance': getText('expense.labels.liabilityInsurance', category),
      'gap insurance': getText('expense.labels.gapInsurance', category),
      'extended warranty': getText('expense.labels.extendedWarranty', category),
      'service contract': getText('expense.labels.serviceContract', category),
      'roadside assistance': getText('expense.labels.roadsideAssistance', category),
      'aaa membership': getText('expense.labels.aaaMembership', category),
      
      // Accidents & Damage
      'accident repair': getText('expense.labels.accidentRepair', category),
      'collision damage': getText('expense.labels.collisionDamage', category),
      'vandalism repair': getText('expense.labels.vandalismRepair', category),
      'theft recovery': getText('expense.labels.theftRecovery', category),
      'glass replacement': getText('expense.labels.glassReplacement', category),
      'windshield replacement': getText('expense.labels.windshieldReplacement', category),
      'window repair': getText('expense.labels.windowRepair', category),
      'paint repair': getText('expense.labels.paintRepair', category),
      'scratch repair': getText('expense.labels.scratchRepair', category),
      'dent repair': getText('expense.labels.dentRepair', category),
      'body work': getText('expense.labels.bodyWork', category),
      'frame repair': getText('expense.labels.frameRepair', category),
      'bumper repair': getText('expense.labels.bumperRepair', category),
      'mirror replacement': getText('expense.labels.mirrorReplacement', category),
      'headlight replacement': getText('expense.labels.headlightReplacement', category),
      'tail light replacement': getText('expense.labels.tailLightReplacement', category),
      
      // Cleaning & Appearance
      'car wash': getText('expense.labels.carWash', category),
      'detailing': getText('expense.labels.detailing', category),
      'interior detailing': getText('expense.labels.interiorDetailing', category),
      'exterior detailing': getText('expense.labels.exteriorDetailing', category),
      'waxing': getText('expense.labels.waxing', category),
      'paint protection': getText('expense.labels.paintProtection', category),
      'ceramic coating': getText('expense.labels.ceramicCoating', category),
      'interior cleaning': getText('expense.labels.interiorCleaning', category),
      'carpet cleaning': getText('expense.labels.carpetCleaning', category),
      'seat cleaning': getText('expense.labels.seatCleaning', category),
      'dashboard treatment': getText('expense.labels.dashboardTreatment', category),
      'leather conditioning': getText('expense.labels.leatherConditioning', category),
      
      // Accessories & Upgrades
      'car accessories': getText('expense.labels.carAccessories', category),
      'audio system': getText('expense.labels.audioSystem', category),
      'speaker installation': getText('expense.labels.speakerInstallation', category),
      'amplifier installation': getText('expense.labels.amplifierInstallation', category),
      'subwoofer installation': getText('expense.labels.subwooferInstallation', category),
      'navigation system': getText('expense.labels.navigationSystem', category),
      'dash cam': getText('expense.labels.dashCam', category),
      'backup camera': getText('expense.labels.backupCamera', category),
      'security system': getText('expense.labels.securitySystem', category),
      'car alarm': getText('expense.labels.carAlarm', category),
      'remote start': getText('expense.labels.remoteStart', category),
      'keyless entry': getText('expense.labels.keylessEntry', category),
      'performance upgrades': getText('expense.labels.performanceUpgrades', category),
      'turbo installation': getText('expense.labels.turboInstallation', category),
      'exhaust upgrade': getText('expense.labels.exhaustUpgrade', category),
      'suspension upgrade': getText('expense.labels.suspensionUpgrade', category),
      'cold air intake': getText('expense.labels.coldAirIntake', category),
      'performance chip': getText('expense.labels.performanceChip', category),
      'tinting': getText('expense.labels.tinting', category),
      'window tinting': getText('expense.labels.windowTinting', category),
      'sunroof installation': getText('expense.labels.sunroofInstallation', category),
      'roof rack': getText('expense.labels.roofRack', category),
      'trailer hitch': getText('expense.labels.trailerHitch', category),
      'running boards': getText('expense.labels.runningBoards', category),
      'bull bar': getText('expense.labels.bullBar', category),
      'mud flaps': getText('expense.labels.mudFlaps', category),
      'floor mats': getText('expense.labels.floorMats', category),
      'seat covers': getText('expense.labels.seatCovers', category),
      'steering wheel cover': getText('expense.labels.steeringWheelCover', category),
      'phone mount': getText('expense.labels.phoneMount', category),
      'usb charger': getText('expense.labels.usbCharger', category),
      'inverter': getText('expense.labels.inverter', category),
      'jump starter': getText('expense.labels.jumpStarter', category),
      'tool kit': getText('expense.labels.toolKit', category),
      'emergency kit': getText('expense.labels.emergencyKit', category),
      
      // Daily Operations
      'parking fees': getText('expense.labels.parkingFees', category),
      'parking meter': getText('expense.labels.parkingMeter', category),
      'parking garage': getText('expense.labels.parkingGarage', category),
      'monthly parking': getText('expense.labels.monthlyParking', category),
      'tolls': getText('expense.labels.tolls', category),
      'bridge toll': getText('expense.labels.bridgeToll', category),
      'highway toll': getText('expense.labels.highwayToll', category),
      'congestion charge': getText('expense.labels.congestionCharge', category),
      'valet service': getText('expense.labels.valetService', category),
      'car rental': getText('expense.labels.carRental', category),
      'rideshare': getText('expense.labels.rideshare', category),
      'taxi': getText('expense.labels.taxi', category),
      'public transport': getText('expense.labels.publicTransport', category),
      
      // Violations & Penalties
      'traffic fine': getText('expense.labels.trafficFine', category),
      'speeding ticket': getText('expense.labels.speedingTicket', category),
      'parking ticket': getText('expense.labels.parkingTicket', category),
      'red light ticket': getText('expense.labels.redLightTicket', category),
      'moving violation': getText('expense.labels.movingViolation', category),
      'equipment violation': getText('expense.labels.equipmentViolation', category),
      'late fees': getText('expense.labels.lateFees', category),
      'court costs': getText('expense.labels.courtCosts', category),
      'attorney fees': getText('expense.labels.attorneyFees', category),
      'traffic school': getText('expense.labels.trafficSchool', category),
      'defensive driving course': getText('expense.labels.defensiveDrivingCourse', category),
      
      // Major Expenses
      'vehicle purchase': getText('expense.labels.vehiclePurchase', category),
      'down payment': getText('expense.labels.downPayment', category),
      'trade-in difference': getText('expense.labels.tradeInDifference', category),
      'loan payment': getText('expense.labels.loanPayment', category),
      'lease payment': getText('expense.labels.leasePayment', category),
      'balloon payment': getText('expense.labels.balloonPayment', category),
      'sales tax': getText('expense.labels.salesTax', category),
      'documentation fee': getText('expense.labels.documentationFee', category),
      'dealer fee': getText('expense.labels.dealerFee', category),
      'finance charges': getText('expense.labels.financeCharges', category),
      'interest payment': getText('expense.labels.interestPayment', category),
      'gap protection': getText('expense.labels.gapProtection', category),
      'vehicle depreciation': getText('expense.labels.vehicleDepreciation', category),
      
      // Fuel & Energy
      'fuel additives': getText('expense.labels.fuelAdditives', category),
      'octane booster': getText('expense.labels.octaneBooster', category),
      'fuel system cleaner': getText('expense.labels.fuelSystemCleaner', category),
      'electric charging': getText('expense.labels.electricCharging', category),
      'home charging station': getText('expense.labels.homeChargingStation', category),
      'public charging': getText('expense.labels.publicCharging', category),
      'fast charging': getText('expense.labels.fastCharging', category),
      'charging membership': getText('expense.labels.chargingMembership', category),
      'solar panel installation': getText('expense.labels.solarPanelInstallation', category),
      'generator fuel': getText('expense.labels.generatorFuel', category),
      
      // Professional Services
      'mechanic labor': getText('expense.labels.mechanicLabor', category),
      'diagnostic fee': getText('expense.labels.diagnosticFee', category),
      'shop supplies': getText('expense.labels.shopSupplies', category),
      'environmental fee': getText('expense.labels.environmentalFee', category),
      'disposal fee': getText('expense.labels.disposalFee', category),
      'towing service': getText('expense.labels.towingService', category),
      'flatbed towing': getText('expense.labels.flatbedTowing', category),
      'roadside service': getText('expense.labels.roadsideService', category),
      'jump start service': getText('expense.labels.jumpStartService', category),
      'lockout service': getText('expense.labels.lockoutService', category),
      'tire change service': getText('expense.labels.tireChangeService', category),
      'mobile mechanic': getText('expense.labels.mobileMechanic', category),
      'delivery fee': getText('expense.labels.deliveryFee', category),
      'pickup fee': getText('expense.labels.pickupFee', category),
      
      // Storage & Facilities
      'storage fees': getText('expense.labels.storageFees', category),
      'garage rental': getText('expense.labels.garageRental', category),
      'covered parking': getText('expense.labels.coveredParking', category),
      'car port': getText('expense.labels.carPort', category),
      'vehicle storage': getText('expense.labels.vehicleStorage', category),
      'seasonal storage': getText('expense.labels.seasonalStorage', category),
      'climate controlled storage': getText('expense.labels.climateControlledStorage', category),
      
      // Emergency & Unexpected
      'emergency repair': getText('expense.labels.emergencyRepair', category),
      'roadside emergency': getText('expense.labels.roadsideEmergency', category),
      'after hours service': getText('expense.labels.afterHoursService', category),
      'holiday surcharge': getText('expense.labels.holidaySurcharge', category),
      'expedited service': getText('expense.labels.expeditedService', category),
      'rush delivery': getText('expense.labels.rushDelivery', category),
      'emergency towing': getText('expense.labels.emergencyTowing', category),
      'emergency parts': getText('expense.labels.emergencyParts', category),
      'temporary transportation': getText('expense.labels.temporaryTransportation', category),
      'rental car (emergency)': getText('expense.labels.rentalCarEmergency', category),
      'hotel stay (travel)': getText('expense.labels.hotelStayTravel', category),
      'meals (travel)': getText('expense.labels.mealsTravel', category),
      
      // Specialty & Custom
      'custom fabrication': getText('expense.labels.customFabrication', category),
      'restoration work': getText('expense.labels.restorationWork', category),
      'antique car parts': getText('expense.labels.antiqueCarParts', category),
      'classic car service': getText('expense.labels.classicCarService', category),
      'show car preparation': getText('expense.labels.showCarPreparation', category),
      'racing preparation': getText('expense.labels.racingPreparation', category),
      'track day fees': getText('expense.labels.trackDayFees', category),
      'driver training': getText('expense.labels.driverTraining', category),
      'performance testing': getText('expense.labels.performanceTesting', category),
      'dyno testing': getText('expense.labels.dynoTesting', category),
      'alignment specs': getText('expense.labels.alignmentSpecs', category),
      'custom paint': getText('expense.labels.customPaint', category),
      'vinyl wrap': getText('expense.labels.vinylWrap', category),
      'decals': getText('expense.labels.decals', category),
      'graphics': getText('expense.labels.graphics', category),
      'chrome work': getText('expense.labels.chromeWork', category),
      'powder coating': getText('expense.labels.powderCoating', category),
      'sandblasting': getText('expense.labels.sandblasting', category),
      'welding': getText('expense.labels.welding', category),
      'fabrication': getText('expense.labels.fabrication', category),
      
      // Miscellaneous
      'miscellaneous': getText('expense.labels.miscellaneous', category),
      'unknown': getText('expense.labels.unknown', category),
      'reimbursable expense': getText('expense.labels.reimbursableExpense', category),
      'business expense': getText('expense.labels.businessExpense', category),
      'personal use': getText('expense.labels.personalUse', category),
      'gift': getText('expense.labels.gift', category),
      'donation': getText('expense.labels.donation', category),
      'charity': getText('expense.labels.charity', category),
      'research': getText('expense.labels.research', category),
      'testing': getText('expense.labels.testing', category),
      'experimental': getText('expense.labels.experimental', category),
      'prototype': getText('expense.labels.prototype', category),
      'development': getText('expense.labels.development', category),
      
      // Legacy categories (for backward compatibility)
      'service': getText('expense.labels.service', category),
      'insurance': getText('expense.labels.insurance', category),
      'vehicle accident': getText('expense.labels.vehicleAccident', category),
      'vehicle service': getText('expense.labels.vehicleService', category),
      'fine': getText('expense.labels.fine', category),
      'mot': getText('expense.labels.mot', category),
      'parking': getText('expense.labels.parking', category),
      'other': getText('payment.type.other', category),
    };

    return categoryMap[category.toLowerCase()] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access this page</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{getText('expense.labels.addExpense', 'Add Expense')}</h1>
            <div className="flex items-center gap-2">
              <SimpleThemeToggle />
              <GlobalLanguageSelector darkMode={false} />
              <AuthButton />
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Navigation Component */}
      <TranslatedNavigation showTabs={false} />

      <main className="flex-grow overflow-auto transition-colors">
        <PageContainer className="p-3 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div>
              {submitMessage && (
                <div className={`mb-4 p-3 rounded ${
                  submitMessage.type === 'success' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vehicle Selection */}
                <div>
                  <label htmlFor="carId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('vehicle.labels.vehicle', 'Vehicle')} *
                  </label>
                  <select
                    id="carId"
                    name="carId"
                    value={expenseForm.carId}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    required
                  >
                    <option value="">{getText('vehicle.labels.vehicle', 'Select Vehicle')}</option>
                    {cars.map((car) => {
                      const carId = getObjectId(car as unknown as Record<string, unknown>);
                      return (
                        <option key={`car-${carId}`} value={carId}>
                          {car.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('expense.labels.category', 'Category')} *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={expenseForm.category}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    required
                  >
                    <option value="">{getText('expense.labels.category', 'Select Category')}</option>
                    {expenseCategories.map((category) => (
                      <option key={`category-${category}`} value={category}>
                        {getCategoryTranslation(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('expense.labels.amount', 'Amount')} *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={expenseForm.amount}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('payment.currency', 'Currency')}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={expenseForm.currency}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                  >
                    {currencies.map((currency) => (
                      <option key={`currency-${currency}`} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('form.fields.date', 'Date')} *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={expenseForm.date}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {getText('form.fields.notes', 'Notes')}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={expenseForm.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    placeholder={getText('form.fields.notes', 'Add any additional notes...')}
                  />
                </div>

                {/* Image Upload */}
                <ImageUpload
                  images={expenseForm.images}
                  onImagesChange={(images) => setExpenseForm(prev => ({ ...prev, images }))}
                  maxImages={5}
                  label={getText('form.fields.images', 'Images')}
                  disabled={isSubmitting}
                />

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                  >
                    {isSubmitting 
                      ? getText('actions.submit', 'Adding...') 
                      : getText('expense.labels.addExpense', 'Add Expense')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={clearPreferences}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium transition-colors"
                    title={getText('actions.clearPreferences', 'Clear saved preferences')}
                  >
                    {getText('actions.clearPreferences', 'Clear Prefs')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
} 