const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  ingredient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  type: { type: String, enum: ['low_stock', 'out_of_stock'], required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Unique constraint: one notification per ingredient per type
notificationSchema.index({ ingredient_id: 1, type: 1 }, { unique: true });
notificationSchema.index({ is_read: 1 });
notificationSchema.index({ created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
