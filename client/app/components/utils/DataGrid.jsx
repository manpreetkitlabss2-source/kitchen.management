import React, { useState } from "react";
import { Plus } from "lucide-react";

/**
 * Unified DataGrid Component
 * Used across all pages for consistent table UI
 * Supports: pagination, sorting, filtering, custom rendering, actions
 * 
 * Supports two column formats:
 * 1. Simple (string array): ["Name", "Email"] - uses data keys automatically
 * 2. Advanced (object array): [{key: "name", label: "Name", render: (row) => ...}]
 */

const DataGrid = ({
  title,
  columns,
  data,
  keyField = "id",
  onAddClick,
  pagination = null,
  onPageChange,
  onLimitChange,
  onSort,
  sortable = true,
  loading = false,
  emptyMessage = "No data available",
  className = "",
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Normalize columns - support both string array and object array formats
  const normalizedColumns = columns.map((col, idx) => {
    if (typeof col === "string") {
      // Convert string to object format
      const key = col.toLowerCase().replace(/\s+/g, "_");
      return {
        key,
        label: col,
        sortable: true,
      };
    }
    return col;
  });

  const handleSort = (columnKey) => {
    if (!sortable || !normalizedColumns.find((col) => col.key === columnKey)?.sortable) {
      return;
    }

    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key: columnKey, direction });

    if (onSort) {
      onSort(columnKey, direction);
    }
  };

  const getSortedData = () => {
    if (!sortConfig.key || onSort) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedData = getSortedData();

  const getAlignClass = (align) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Title and Add Button */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Add New</span>
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {normalizedColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-semibold text-gray-700 select-none cursor-${
                    column.sortable ? "pointer" : "default"
                  } ${getAlignClass(column.align)} hover:${
                    column.sortable ? "bg-gray-100" : ""
                  } transition-colors`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.label}</span>
                    {column.sortable && sortConfig.key === column.key && (
                      <span className="text-xs text-gray-500">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={normalizedColumns.length} className="px-4 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={normalizedColumns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row[keyField]}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {normalizedColumns.map((column) => (
                    <td
                      key={`${row[keyField]}-${column.key}`}
                      className={`px-4 py-3 text-gray-700 ${getAlignClass(column.align)}`}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total items
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            {onLimitChange && (
              <select
                value={pagination.limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white hover:bg-gray-50 transition-colors"
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
