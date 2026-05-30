const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({ recipient, sender, type, faqId, message, io }) => {
  if (!recipient) return;

  // FIX: recipient !== sender check — never notify yourself
  if (sender && recipient.equals(sender)) return;

  // Check user notification preferences
  const user = await User.findById(recipient);
  if (!user) return;

  if (type === 'answer' && !user.notifyOnAnswer) return;
  if (type === 'comment' && !user.notifyOnComment) return;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    faqId,
    message,
  });

  if (io) {
    io.to(`user:${recipient.toString()}`).emit('notification:new', { notification });
  }
};

module.exports = createNotification;