import React from "react";

/**
 * Tailwind CSS PageHeader Component
 * Props:
 * - title: string
 * - subtitle: string
 * - actions: node
 * - breadcrumbs: array of { label, link }
 */

const PageHeader = ({ title, subtitle, actions, breadcrumbs }) => {
  return (
    <div className="w-full mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center flex-wrap text-sm text-gray-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center">
              {crumb.link ? (
                <a
                  href={crumb.link}
                  className="hover:text-blue-600 transition"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-700 font-medium">
                  {crumb.label}
                </span>
              )}

              {index < breadcrumbs.length - 1 && (
                <span className="mx-2 text-gray-400">/</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;