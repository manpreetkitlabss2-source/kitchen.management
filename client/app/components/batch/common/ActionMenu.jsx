import React, { useState, useRef, useEffect } from 'react';

const ActionMenu = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label="Options"
      >
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]">
          <div className="py-1" role="menu">
            {items.map((item, index) =>
              item.type === 'divider' ? (
                <div key={index} className="my-1 border-t border-gray-100" />
              ) : (
                <button
                  key={index}
                  onClick={() => { item.onClick?.(); setIsOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    item.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
