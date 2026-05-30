const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar')
      .populate('faqId', 'question');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    return next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
    } else {
      const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
      if (!notification) return next(new AppError('Notification not found', 404));
      notification.isRead = true;
      await notification.save();
    }

    return res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    return next(err);
  }
};

const deleteOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) return next(new AppError('Notification not found', 404));

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, markRead, deleteOne };