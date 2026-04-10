import React from "react";

/**
 * Tailwind CSS Select Component
 * Props:
 * - label: string
 * - name: string
 * - value: string
 * - onChange: function
 * - options: array of { label, value }
 * - placeholder: string
 * - error: string
 * - disabled: boolean
 */

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        <option value="" disabled={value !== ''}>
          {placeholder || 'Select an option'}
        </option>
        {options.map((opt, index) => (
          <option key={index} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-red-500 mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;