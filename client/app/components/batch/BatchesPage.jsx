import React, { useState, useEffect } from 'react';
import DataGrid from '../utils/DataGrid';
import BatchForm from './BatchForm';
import PageHeader from './common/PageHeader';
import Button from './common/Button';
import Modal from './common/Modal';
import SearchBar from './common/SearchBar';
import FilterDropdown from './common/FilterDropdown';
import Loader from './common/Loader';
import EmptyState from './common/EmptyState';
import Badge from './common/Badge';
import { useBatches } from '../../../hooks/useBatches';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const BatchesPage = () => {
  const {
    batches,
    loading,
    error,
    fetchBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    pagination,
    setPagination,
  } = useBatches();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBatches({
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  const handleCreateBatch = () => {
    setSelectedBatch(null);
    setIsModalOpen(true);
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      await deleteBatch(batchId);
    }
  };

  const handleSubmit = async (formData) => {
    if (selectedBatch) {
      await updateBatch(selectedBatch.id, formData);
    } else {
      await createBatch(formData);
    }
    setIsModalOpen(false);
    setSelectedBatch(null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, page: 1, limit: newLimit }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBatch(null);
  };

  // Calculate statistics for data points
  const totalBatches = batches.length;
  const expiringBatches = batches.filter(
    (batch) => batch.days_until_expiry !== undefined && batch.days_until_expiry <= 7 && batch.days_until_expiry >= 0
  ).length;
  const expiredBatches = batches.filter(
    (batch) => batch.status === 'expired'
  ).length;
  const outOfStockBatches = batches.filter(
    (batch) => batch.status === 'out_of_stock'
  ).length;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusVariant = {
    active: 'success',
    expired: 'danger',
    out_of_stock: 'warning',
  };

  const columns = [
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
      sortable: false,
      render: (batch) => (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => handleEditBatch(batch)}
            className="px-3 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteBatch(batch.id)}
            className="px-3 py-1 text-xs font-semibold rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];


  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredient Batch Tracking"
        subtitle="Track expiry dates and batch stock to reduce waste and improve food safety"
      />

      {/* Data Points / Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Batches</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalBatches}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
          <p className="text-slate-500 text-sm font-medium">Expiring Soon / Expired</p>
          <h2 className="text-3xl font-bold text-orange-600 mt-1">
            {expiringBatches + expiredBatches < 10 ? `0${expiringBatches + expiredBatches}` : expiringBatches + expiredBatches}
          </h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-slate-500 text-sm font-medium">Out of Stock Batches</p>
          <h2 className="text-3xl font-bold text-red-600 mt-1">
            {outOfStockBatches < 10 ? `0${outOfStockBatches}` : outOfStockBatches}
          </h2>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <SearchBar
            placeholder="Search by ingredient or batch ID..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full sm:w-72"
          />
          <FilterDropdown
            options={statusOptions}
            value={statusFilter}
            onChange={handleFilterChange}
            label="Status"
          />
        </div>

        <Button variant="success" onClick={handleCreateBatch}>
          + Add Batch
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loader message="Loading batches..." />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No ingredient batches found"
          description="Create your first batch to begin tracking expiry and stock"
          action={{ label: 'Add Batch', onClick: handleCreateBatch }}
        />
      ) : (
        <DataGrid
          title="Ingredient Batches"
          columns={columns}
          data={batches}
          keyField="id"
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total || batches.length,
            limit: pagination.limit,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          loading={loading}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedBatch ? 'Edit Batch' : 'Create New Batch'}
        size="large"
      >
        <BatchForm
          initialData={selectedBatch}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default BatchesPage;
