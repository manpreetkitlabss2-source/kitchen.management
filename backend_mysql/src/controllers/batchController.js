const BatchService = require('../services/batchService.js');

exports.addBatch = async (req, res) => {
  try {
    const { ingredient_id, quantity, expiry_date } = req.body;
    const { userId: user_id, restaurantId: restaurant_id } = req.user;

    if (!ingredient_id || quantity === undefined || !expiry_date) {
      return res.status(400).json({ success: false, error: 'ingredient_id, quantity, and expiry_date are required.' });
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity must be a positive number.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
      return res.status(400).json({ success: false, error: 'Expiry date must be in YYYY-MM-DD format.' });
    }

    const data = await BatchService.createBatch({ ingredient_id, quantity, expiry_date, user_id, restaurant_id });
    const completeData = await BatchService.getBatchDetails(data.id, restaurant_id);

    res.status(201).json({ success: true, message: 'Batch added successfully.', data: completeData });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, error: error.message });
  }
};

exports.getBatches = async (req, res) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const restaurant_id = req.user.restaurantId;

    const data = await BatchService.getBatches({ page, limit, search, status, sortBy, sortOrder, restaurant_id });

    res.json({ success: true, data: data.data, page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getBatchesByIngredient = async (req, res) => {
  try {
    const data = await BatchService.getBatchesByIngredient(req.params.ingredient_id, req.user.restaurantId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, error: error.message });
  }
};

exports.getExpiringBatches = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 3;
    if (isNaN(days) || days < 0) {
      return res.status(400).json({ success: false, error: 'days must be a non-negative integer.' });
    }
    const data = await BatchService.getExpiringBatches(days, req.user.restaurantId);
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBatchDetails = async (req, res) => {
  try {
    const data = await BatchService.getBatchDetails(req.params.batch_id, req.user.restaurantId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, error: error.message });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const { quantity, expiry_date } = req.body;
    const { batch_id } = req.params;
    const restaurant_id = req.user.restaurantId;

    if (quantity === undefined && expiry_date === undefined) {
      return res.status(400).json({ success: false, error: 'quantity or expiry_date is required.' });
    }
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return res.status(400).json({ success: false, error: 'Quantity must be a non-negative number.' });
    }

    const data = await BatchService.updateBatch(batch_id, { quantity, expiry_date }, restaurant_id);
    res.json({ success: true, message: 'Batch updated successfully.', data });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, error: error.message });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    await BatchService.deleteBatch(req.params.batch_id, req.user.restaurantId);
    res.json({ success: true, message: 'Batch deleted successfully.' });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ success: false, error: error.message });
  }
};
