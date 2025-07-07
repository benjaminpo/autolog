'use client';

import React from 'react';

// Enhanced input styling classes for better light mode experience
export const inputClasses = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 shadow-light hover:shadow-light-md";

export const labelClasses = "block text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2";

export const selectClasses = "w-full p-3 border border-light-border-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 shadow-light hover:shadow-light-md cursor-pointer";

export const textareaClasses = "w-full p-3 border border-light-border-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 resize-vertical shadow-light hover:shadow-light-md";

// Enhanced button classes
export const buttonPrimaryClasses = "btn-primary px-4 py-3 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-light hover:shadow-light-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

export const buttonSecondaryClasses = "btn-secondary px-4 py-3 rounded-lg font-semibold text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 shadow-light hover:shadow-light-md";

// Standard form input component
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export function FormInput({ label, error, required, helpText, className, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={props.id} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`${inputClasses} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : ''} ${className || ''}`}
        {...props}
      />
      {helpText && !error && (
        <p className="text-sm text-gray-800 dark:text-gray-400">{helpText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Standard form select component
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}

export function FormSelect({ label, error, required, helpText, className, children, ...props }: FormSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={props.id} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`${selectClasses} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : ''} ${className || ''}`}
        {...props}
      >
        {children}
      </select>
      {helpText && !error && (
        <p className="text-sm text-gray-800 dark:text-gray-400">{helpText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Standard form textarea component
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export function FormTextarea({ label, error, required, helpText, className, ...props }: FormTextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={props.id} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`${textareaClasses} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500' : ''} ${className || ''}`}
        {...props}
      />
      {helpText && !error && (
        <p className="text-sm text-gray-800 dark:text-gray-400">{helpText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Enhanced form button component
interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function FormButton({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className, 
  children, 
  disabled,
  ...props 
}: FormButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  };
  
  const variantClasses = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 shadow-light hover:shadow-light-md hover:-translate-y-0.5',
    secondary: 'text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-primary-500 shadow-light hover:shadow-light-md',
    success: 'text-white bg-success-600 hover:bg-success-700 focus:ring-success-500 shadow-light hover:shadow-light-md hover:-translate-y-0.5',
    warning: 'text-white bg-warning-600 hover:bg-warning-700 focus:ring-warning-500 shadow-light hover:shadow-light-md hover:-translate-y-0.5',
    error: 'text-white bg-error-600 hover:bg-error-700 focus:ring-error-500 shadow-light hover:shadow-light-md hover:-translate-y-0.5'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// Standard form group wrapper
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function FormGroup({ children, className, title, description }: FormGroupProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {title && (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {description && (
            <p className="text-sm text-gray-800 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Enhanced form grid for responsive layouts
interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className || ''}`}>
      {children}
    </div>
  );
}

// Enhanced card component for form sections
interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function FormCard({ children, className, title, description }: FormCardProps) {
  return (
    <div className={`card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-light hover:shadow-light-md transition-all duration-200 ${className || ''}`}>
      {(title || description) && (
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
} 