const Notification = require('../models/Notification');
const Ingredient = require('../models/Ingredient');

class NotificationService {

  // Scan all ingredients and create notifications for threshold breaches.
  // Dedup rule: one document per (ingredient_id + type).
  // - If stock is breached and no document exists → create.
  // - If stock is breached and a READ document exists → reopen it (is_read: false).
  // - If stock is breached and an UNREAD document exists → skip (already active).
  // - If stock is healthy and a document exists → delete it so the cycle resets.
  async scanAndNotify() {
    const ingredients = await Ingredient.find().lean();

    const checks = ingredients.map(async (ing) => {
      const type = ing.current_stock <= 0
        ? 'out_of_stock'
        : ing.current_stock < ing.threshold_value
          ? 'low_stock'
          : null;

      if (!type) {
        // Stock is healthy — remove any existing notification so it can fire fresh next time
        await Notification.deleteMany({ ingredient_id: ing._id });
        return;
      }

      const message = type === 'out_of_stock'
        ? `${ing.name} is out of stock`
        : `${ing.name} is running low (${ing.current_stock} ${ing.unit} remaining, threshold: ${ing.threshold_value})`;

      // Upsert: match on ingredient + type only (ignore is_read)
      // If unread already exists → no change. If read exists → reopen. If none → create.
      await Notification.findOneAndUpdate(
        { ingredient_id: ing._id, type },
        { $setOnInsert: { ingredient_id: ing._id, type, message, is_read: false, created_at: new Date() } },
        { upsert: true, new: false }
      );
    });

    await Promise.all(checks);
  }

  async getNotifications({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const filter = {};
    const [data, total] = await Promise.all([
      Notification.find(filter)
        .populate('ingredient_id', 'name unit current_stock threshold_value')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter)
    ]);
    return { data, page, limit, total };
  }

  async getUnreadCount() {
    const count = await Notification.countDocuments({ is_read: false });
    return { count };
  }

  async markAsRead(id) {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { is_read: true },
      { new: true }
    );
    if (!notification) throw new Error('Notification not found');
    return notification;
  }

  async markAllAsRead() {
    await Notification.updateMany({ is_read: false }, { is_read: true });
    return { success: true };
  }
}

module.exports = new NotificationService();
