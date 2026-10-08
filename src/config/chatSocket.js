const jwtUtil = require('../utils/jwt');
const { Server } = require('socket.io');
const { ChatParticipant, User } = require('../models');

const roomName = (conversationId) => `chat:${conversationId}`;

module.exports = (server) => {
  const io = new Server(server, { cors: { origin: true, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwtUtil.verifyAccessToken(token);
      const user = await User.findByPk(payload.id, { attributes: ['id', 'role', 'status'] });
      if (!user || user.status !== 'active') return next(new Error('Unauthorized'));
      socket.data.user = { id: user.id, role: user.role };
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.data.user.role === 'admin') socket.join('admins');

    socket.on('chat:join', async (conversationId, acknowledge = () => {}) => {
      try {
        const participant = await ChatParticipant.findOne({ where: { conversationId, userId: socket.data.user.id } });
        if (!participant && socket.data.user.role !== 'admin') {
          return acknowledge({ success: false, message: 'Forbidden' });
        }
        socket.join(roomName(conversationId));
        return acknowledge({ success: true });
      } catch {
        return acknowledge({ success: false, message: 'Unable to join conversation' });
      }
    });

    socket.on('chat:leave', (conversationId) => socket.leave(roomName(conversationId)));
  });

  return io;
};