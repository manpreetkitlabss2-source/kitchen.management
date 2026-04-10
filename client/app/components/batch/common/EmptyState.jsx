import React from 'react';

const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
