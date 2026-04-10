import { useState, useCallback } from 'react';
import {
  getBatches,
  getBatchById,
  createBatch as createBatchAPI,
  updateBatch as updateBatchAPI,
  deleteBatch as deleteBatchAPI,
} from '../services/batchService';

export const useBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchBatches = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBatches(params);
      setBatches(response.data || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch batches');
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatchById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBatchById(id);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch batch');
      console.error('Error fetching batch:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBatch = useCallback(async (batchData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createBatchAPI(batchData);
      setBatches((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to create batch');
      console.error('Error creating batch:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBatch = useCallback(async (id, batchData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateBatchAPI(id, batchData);
      setBatches((prev) =>
        prev.map((batch) => (batch.id === id ? response.data : batch))
      );
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to update batch');
      console.error('Error updating batch:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBatch = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteBatchAPI(id);
      setBatches((prev) => prev.filter((batch) => batch.id !== id));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err) {
      setError(err.message || 'Failed to delete batch');
      console.error('Error deleting batch:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    batches,
    loading,
    error,
    pagination,
    setPagination,
    fetchBatches,
    fetchBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
  };
};
