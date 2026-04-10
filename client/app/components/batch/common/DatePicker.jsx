
import React from 'react';

export const DatePicker = React.forwardRef(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <input
        type="date"
        ref={ref}
        className={`
          block w-full rounded-md shadow-sm sm:text-sm px-3 py-2
          border transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${hasError 
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';