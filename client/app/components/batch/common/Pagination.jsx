import React from 'react';

export const Pagination= ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-4">
      <div className="-mt-px flex w-0 flex-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
      </div>
      
      <div className="hidden md:-mt-px md:flex">
        {getPageNumbers().map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`
              inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium transition-colors
              ${currentPage === number 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
            `}
          >
            {number}
          </button>
        ))}
      </div>

      <div className="-mt-px flex w-0 flex-1 justify-end">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </nav>
  );
};