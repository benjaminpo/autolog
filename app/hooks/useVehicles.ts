'use client';

import { useState, useEffect } from 'react';
import { Car } from '../types/common';

export interface UseVehiclesReturn {
  cars: Car[];
  setCars: (cars: Car[]) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVehicles(): UseVehiclesReturn {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/vehicles');

      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
      }

      const data = await response.json();

      if (data.vehicles && Array.isArray(data.vehicles)) {
        setCars(data.vehicles);
      } else {
        setCars([]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch vehicles');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    cars,
    setCars,
    loading,
    error,
    refetch: fetchVehicles
  };
}
