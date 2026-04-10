const BatchService = require('../services/batchService.js');

/**
 * Add new batch for an ingredient
 * POST /api/batches
 */
exports.addBatch = async (req, res) => {
  try {
    const { ingredient_id, quantity, expiry_date } = req.body;
    const user_id = req.user.userId;

    // Validation
    if (!ingredient_id || quantity === undefined || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: 'ingredient_id, quantity, and expiry_date are required'
      });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a positive number'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expiry_date)) {
      return res.status(400).json({
        success: false,
        message: 'expiry_date must be in YYYY-MM-DD format'
      });
    }

    const data = await BatchService.createBatch({
      ingredient_id,
      quantity,
      expiry_date,
      user_id
    });

    // Get complete batch data with ingredient info for frontend
    const completeData = await BatchService.getBatchDetails(data.id, user_id);

    res.status(201).json({
      success: true,
      message: 'Batch added successfully',
      data: completeData
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get batches in paginated form with optional search/status filters
 * GET /api/batches
 */
exports.getBatches = async (req, res) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const user_id = req.user.userId;

    const data = await BatchService.getBatches({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
      user_id,
    });

    res.json({
      success: true,
      data: data.data,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all batches for a specific ingredient
 * GET /api/batches/ingredient/:ingredient_id
 */
exports.getBatchesByIngredient = async (req, res) => {
  try {
    const { ingredient_id } = req.params;
    const user_id = req.user.userId;

    if (!ingredient_id) {
      return res.status(400).json({
        success: false,
        message: 'ingredient_id is required'
      });
    }

    const data = await BatchService.getBatchesByIngredient(ingredient_id, user_id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get batches expiring within N days
 * GET /api/batches/expiring?days=3
 */
exports.getExpiringBatches = async (req, res) => {
  try {
    const { days = 3 } = req.query;
    const user_id = req.user.userId;

    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'days must be a non-negative integer'
      });
    }

    const data = await BatchService.getExpiringBatches(daysNum, user_id);

    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get details of a specific batch
 * GET /api/batches/:batch_id
 */
exports.getBatchDetails = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const user_id = req.user.userId;

    if (!batch_id) {
      return res.status(400).json({
        success: false,
        message: 'batch_id is required'
      });
    }

    const data = await BatchService.getBatchDetails(batch_id, user_id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update batch quantity and expiry date
 * PUT /api/batches/:batch_id
 */
exports.updateBatch = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const { quantity, expiry_date } = req.body;
    const user_id = req.user.userId;

    // Validation
    if (!batch_id) {
      return res.status(400).json({
        success: false,
        message: 'batch_id is required'
      });
    }

    if (quantity === undefined && expiry_date === undefined) {
      return res.status(400).json({
        success: false,
        message: 'quantity or expiry_date is required'
      });
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return res.status(400).json({
        success: false,
        message: 'quantity must be a non-negative number'
      });
    }

    if (expiry_date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expiry_date)) {
        return res.status(400).json({
          success: false,
          message: 'expiry_date must be in YYYY-MM-DD format'
        });
      }
    }

    const data = await BatchService.updateBatch(batch_id, { quantity, expiry_date }, user_id);

    // Get complete updated batch data with ingredient info for frontend
    const completeData = await BatchService.getBatchDetails(batch_id, user_id);

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: completeData
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a batch
 * DELETE /api/batches/:batch_id
 */
exports.deleteBatch = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const user_id = req.user.userId;

    if (!batch_id) {
      return res.status(400).json({
        success: false,
        message: 'batch_id is required'
      });
    }

    const data = await BatchService.deleteBatch(batch_id, user_id);

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};
