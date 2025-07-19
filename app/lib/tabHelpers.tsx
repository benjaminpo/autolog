import React from 'react';
import Image from 'next/image';
import { Car } from '../types/common';

// Shared interface for image modal state
export interface ImageModalState {
  isOpen: boolean;
  imageSrc: string;
  altText: string;
}

// Shared initial state for image modal
export const initialImageModalState: ImageModalState = {
  isOpen: false,
  imageSrc: '',
  altText: '',
};

// Shared reset function for image modal
export const resetImageModal = (): ImageModalState => initialImageModalState;

// Shared function to render image grid for entries (expenses, income, fuel)
export const renderImageGrid = (
  fieldValue: string[],
  imageType: string,
  setImageModal: (modal: ImageModalState) => void
) => {
  if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
    return 'No images';
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
      {fieldValue.map((image, index) => (
        <div key={index} className="relative">
          <Image
            src={image}
            alt={`${imageType} image ${index + 1}`}
            width={80}
            height={80}
            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
            unoptimized={true}
            onClick={() => setImageModal({
              isOpen: true,
              imageSrc: image,
              altText: `${imageType} image ${index + 1}`,
            })}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Click to enlarge
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Shared function to get field labels for entries
export const getFieldLabel = (fieldKey: string, entryType: 'expense' | 'income' | 'fuel', t: any): string => {
  const commonLabels: Record<string, string> = {
    carId: t?.car || 'Vehicle',
    category: t?.category || 'Category',
    amount: t?.payment?.cost || 'Amount',
    currency: t?.payment?.currency || 'Currency',
    date: t?.form?.fields?.date || 'Date',
    notes: t?.form?.fields?.notes || 'Notes',
    images: 'Images',
  };

  // Return common label if it exists
  if (commonLabels[fieldKey]) {
    return commonLabels[fieldKey];
  }

  // Entry-specific labels
  switch (entryType) {
    case 'expense':
      return t?.expense?.labels?.[fieldKey] || fieldKey;
    case 'income':
      switch (fieldKey) {
        case 'createdAt': return t?.income?.labels?.createdAt || 'Created At';
        case 'updatedAt': return t?.income?.labels?.updatedAt || 'Updated At';
        default: return t?.income?.labels?.[fieldKey] || fieldKey;
      }
    case 'fuel':
      return t?.fuel?.labels?.[fieldKey] || fieldKey;
    default:
      return fieldKey;
  }
};

// Shared function to format field values for entries
export const formatFieldValue = (
  fieldKey: string,
  fieldValue: any,
  cars: Car[],
  getCategoryTranslation: (category: string) => string,
  setImageModal: (modal: ImageModalState) => void,
  imageType: string = 'Entry'
) => {
  if (fieldValue == null) return '';

  if (fieldKey === 'images') {
    return renderImageGrid(fieldValue, imageType, setImageModal);
  }

  if (fieldKey === 'carId') {
    const car = cars.find(c => (c.id || c._id) === String(fieldValue));
    return car ? car.name : 'Unknown Vehicle';
  }

  if (fieldKey === 'category') {
    return getCategoryTranslation(String(fieldValue));
  }

  if ((fieldKey === 'createdAt' || fieldKey === 'updatedAt') && fieldValue) {
    try {
      return new Date(fieldValue).toLocaleString();
    } catch (error) {
      return fieldValue;
    }
  }

  return String(fieldValue);
};

// Shared function to create category translation function
export const createCategoryTranslator = (t: any, entryType: 'expense' | 'income') => {
  return (category: string): string => {
    // Convert category name to camelCase format that matches translation keys
    const camelCaseKey = category
      .toLowerCase()
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    // Try to get translation from appropriate namespace
    const translation = (t as any)?.[entryType]?.labels?.[camelCaseKey];
    if (typeof translation === 'string') {
      return translation;
    }

    // Fallback to original category name
    return category;
  };
};
