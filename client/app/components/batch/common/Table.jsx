import React, { useState } from "react";

/**
 * Tailwind CSS Table Component
 */

const Table = ({
  columns,
  data,
  keyField = "id",
  onSort,
  sortable = true,
  className = "",
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (columnKey) => {
    if (!sortable || !columns.find((col) => col.key === columnKey)?.sortable) {
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
    <div
      className={`w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white ${className}`}
    >
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 font-semibold select-none cursor-${
                  column.sortable ? "pointer" : "default"
                } ${getAlignClass(column.align)}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{column.label}</span>

                  {column.sortable && sortConfig.key === column.key && (
                    <span className="text-xs">
                      {sortConfig.direction === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={row[keyField]}
                className="border-b last:border-0 hover:bg-gray-50 transition"
              >
                {columns.map((column) => (
                  <td
                    key={`${row[keyField]}-${column.key}`}
                    className={`px-4 py-3 ${getAlignClass(column.align)}`}
                  >
                    {column.render
                      ? column.render(row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;