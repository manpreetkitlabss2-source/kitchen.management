import React from 'react';

const TextArea = ({
  name,
  value,
  onChange,
  placeholder = 'Enter text...',
  error,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}) => (
  <textarea
    id={name}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    rows={rows}
    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white resize-vertical transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
      error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300'
    } ${className}`}
    {...props}
  />
);

export default TextArea;
