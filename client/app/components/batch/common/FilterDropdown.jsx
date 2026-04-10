import React from 'react';

const FilterDropdown = ({ options = [], value, onChange, label, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {label && <span className="text-sm text-gray-500 whitespace-nowrap">{label}:</span>}
    <select
      className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default FilterDropdown;
