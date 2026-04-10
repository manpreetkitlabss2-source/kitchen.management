import React from 'react';
import Table from './common/Table';
import Badge from './common/Badge';
import ActionMenu from './common/ActionMenu';

const statusVariant = {
  active: 'success',
  expired: 'danger',
  out_of_stock: 'warning',
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const tableColumns = (onEdit, onDelete) => [
  {
    key: 'id',
    label: 'Batch ID',
    sortable: true,
    render: (batch) => <span className="font-medium text-gray-800">#{batch.id}</span>,
  },
  {
    key: 'ingredient_name',
    label: 'Ingredient',
    sortable: true,
    render: (batch) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-gray-800">{batch.ingredient_name}</span>
        {batch.unit && <span className="text-xs text-gray-500">{batch.unit}</span>}
      </div>
    ),
  },
  {
    key: 'quantity',
    label: 'Quantity',
    sortable: true,
    render: (batch) => (
      <span className="font-medium text-gray-700">{batch.quantity}</span>
    ),
  },
  {
    key: 'expiry_date',
    label: 'Expiry',
    sortable: true,
    render: (batch) => (
      <div className="flex flex-col gap-0.5 text-sm">
        <span>{formatDate(batch.expiry_date)}</span>
        {batch.days_until_expiry != null && (
          <span className="text-xs text-gray-500">
            {batch.days_until_expiry < 0
              ? `${Math.abs(batch.days_until_expiry)} days expired`
              : `${batch.days_until_expiry} days left`}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (batch) => (
      <Badge variant={statusVariant[batch.status] || 'secondary'}>
        {batch?.status?.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (batch) => formatDate(batch.created_at),
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (batch) => (
      <ActionMenu
        items={[
          { label: 'Edit', onClick: () => onEdit(batch) },
          { type: 'divider' },
          { label: 'Delete', variant: 'danger', onClick: () => onDelete(batch.id) },
        ]}
      />
    ),
  },
];

const BatchTable = ({ batches, onEdit, onDelete, pagination, onPageChange, onLimitChange }) => {
  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
        <Table columns={tableColumns(onEdit, onDelete)} data={batches} keyField="id" />
      </div>
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg">
        <div className="text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages} • {pagination.total} total items
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white hover:bg-gray-50 transition-colors"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BatchTable;
