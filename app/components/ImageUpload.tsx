'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useFileInput } from '../hooks/useFileInput';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  className = '',
  label = 'Images',
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback((file: File, reader: FileReader) => {
    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    reader.onload = (e) => {
      if (e.target?.result) {
        const newImage = e.target.result as string;
        onImagesChange([...images, newImage]);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }, [images, maxImages, onImagesChange]);

  const fileInput = useFileInput(handleFileUpload);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Image Upload Input */}
      {images.length < maxImages && (
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={fileInput.handleFileChange}
            disabled={disabled || isUploading}
            className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-800/30 file:transition-colors disabled:opacity-50"
          />
          {isUploading && (
            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
          )}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <Image
                src={image}
                alt={`Uploaded image ${index + 1}`}
                width={120}
                height={120}
                className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                unoptimized={true}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      <p className="text-sm text-gray-500 mt-2">
        {images.length} of {maxImages} images uploaded
      </p>
    </div>
  );
} 