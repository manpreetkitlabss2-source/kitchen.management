import React from "react";

/**
 * Tailwind CSS Card Component
 * Props:
 * - title: string
 * - children: node
 * - footer: node
 * - className: string
 */

const Card = ({ title, children, footer, className = "" }) => {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
    >
      {title && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            {title}
          </h3>
        </div>
      )}

      <div className="p-5">{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;