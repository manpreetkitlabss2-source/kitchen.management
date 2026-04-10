
import React from 'react';


export const FormGroup = ({ 
  label, 
  htmlFor, 
  error, 
  children, 
  required 
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={htmlFor} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
};