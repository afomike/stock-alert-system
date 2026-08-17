const { Notification, Product } = require('../models');

async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.findAll({
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json({ count: notifications.length, notifications });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    notification.is_read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead };
