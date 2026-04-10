import React from 'react';

const Loader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    {message && <p className="text-sm text-gray-500">{message}</p>}
  </div>
);

export default Loader;
