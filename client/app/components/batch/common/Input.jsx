import React from 'react';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  className = '',
  ...props
}) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
      error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'
    } ${className}`}
    {...props}
  />
);

export default Input;
