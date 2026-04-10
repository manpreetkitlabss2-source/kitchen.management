import api from './axiosAuth';

const BATCH_ENDPOINTS = {
  BASE: '/batches',
  BY_ID: (id) => `/batches/${id}`,
};

/**
 * Get all ingredient batches with optional filters and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.status - Filter by status
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with batches data
 */
export const getBatches = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`${BATCH_ENDPOINTS.BASE}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching batches:', error);
    throw error;
  }
};

/**
 * Get a single batch by ID
 * @param {string|number} id - Batch ID
 * @returns {Promise<Object>} Batch data
 */
export const getBatchById = async (id) => {
  try {
    const response = await api.get(BATCH_ENDPOINTS.BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching batch ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new ingredient batch
 * @param {Object} batchData - Batch data
 * @param {number} batchData.ingredient_id - Ingredient ID
 * @param {number} batchData.quantity - Batch quantity
 * @param {string} batchData.expiry_date - Expiry date (YYYY-MM-DD)
 * @returns {Promise<Object>} Created batch data
 */
export const createBatch = async (batchData) => {
  try {
    const response = await api.post(BATCH_ENDPOINTS.BASE, batchData);
    return response.data;
  } catch (error) {
    console.error('Error creating batch:', error);
    throw error;
  }
};

/**
 * Update an existing ingredient batch
 * @param {string|number} id - Batch ID
 * @param {Object} batchData - Updated batch data
 * @param {number} [batchData.quantity] - Batch quantity
 * @param {string} [batchData.expiry_date] - Expiry date (YYYY-MM-DD)
 * @returns {Promise<Object>} Updated batch data
 */
export const updateBatch = async (id, batchData) => {
  try {
    const response = await api.put(BATCH_ENDPOINTS.BY_ID(id), batchData);
    return response.data;
  } catch (error) {
    console.error(`Error updating batch ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a batch
 * @param {string|number} id - Batch ID
 * @returns {Promise<void>}
 */
export const deleteBatch = async (id) => {
  try {
    const response = await api.delete(BATCH_ENDPOINTS.BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting batch ${id}:`, error);
    throw error;
  }
};

/**
 * Bulk delete batches
 * @param {Array<string|number>} ids - Array of batch IDs
 * @returns {Promise<Object>} Deletion result
 */
export const bulkDeleteBatches = async (ids) => {
  try {
    const response = await api.post(`${BATCH_ENDPOINTS.BASE}/bulk-delete`, {
      ids,
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk deleting batches:', error);
    throw error;
  }
};

/**
 * Export batches data
 * @param {Object} params - Export parameters
 * @param {string} params.format - Export format (csv, excel, pdf)
 * @param {Array} params.fields - Fields to export
 * @returns {Promise<Blob>} Exported file
 */
export const exportBatches = async (params = {}) => {
  try {
    const response = await api.get(`${BATCH_ENDPOINTS.BASE}/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting batches:', error);
    throw error;
  }
};
