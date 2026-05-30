const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (io) => {
  io.on('connection', async (socket) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      socket.disconnect();
      return;
    }

    // FIX: Check if user is suspended — disconnect if so
    let dbUser;
    try {
      dbUser = await User.findById(decoded.id).select('isSuspended');
    } catch {
      socket.disconnect();
      return;
    }

    if (dbUser?.isSuspended) {
      socket.emit('error', { message: 'Account suspended' });
      socket.disconnect();
      return;
    }

    // FIX: Join the "user:<id>" room so faqController notifications reach the right socket
    socket.join(`user:${decoded.id}`);
    console.log(`Socket connected: user ${decoded.id} (${decoded.name})`);

    socket.on('faq:join', (faqId) => {
      socket.join(`faq:${faqId}`);
    });

    socket.on('faq:leave', (faqId) => {
      socket.leave(`faq:${faqId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${decoded?.id}`);
    });
  });
};

module.exports = initSocket;