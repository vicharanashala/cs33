const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (io) => {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = decoded;
    } catch {
      socket.disconnect();
      return;
    }

    socket.join(user.id);
    console.log(`Socket connected: user ${user.id} (${user.name})`);

    socket.on('faq:join', (faqId) => {
      socket.join(`faq:${faqId}`);
    });

    socket.on('faq:leave', (faqId) => {
      socket.leave(`faq:${faqId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${user?.id}`);
    });
  });
};

module.exports = initSocket;