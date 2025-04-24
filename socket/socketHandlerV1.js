const Message = require('../models/Message');
const Users = require('../models/Users');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinRoom', ({ prNumber }) => {
      socket.join(prNumber);
      console.log(`User joined room ${prNumber}`);
    });

    socket.on('typing', ({ userName, prNumber }) => {
      socket.to(prNumber).emit('typing', { userName });
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { senderId, prNumber, message } = data;
        const sender = await Users.findOne({ userId: senderId });
        console.log("sender-------------->",sender);

        if (!sender) {
          return socket.emit('error', { message: 'Sender not found' });
        }

        let receiverIds = [];

        if (sender.role === 'supplier') {
          receiverIds = [sender.buyerId];
        } else if (sender.role === 'buyer') {
          const suppliers = await Users.find({ buyerId: senderId });
          if (message.includes('@all')) {
            receiverIds = suppliers.map(s => s.userId);
          } else {
            const mentions = message.match(/@(\w+)/g);
            if (mentions) {
              receiverIds = mentions.map(m => m.replace('@', ''));
            }
          }
        }

        const newMessage = new Message(data);
        await newMessage.save();

        const fullMessage = {
          ...newMessage.toObject(),
          senderName: sender.name,
          senderProfilePicture: sender.profilePicture || null,
        };
           console.log("fullMessage",fullMessage);
        io.to(prNumber).emit('newMessage', fullMessage);
      } catch (error) {
        console.error('Error in sendMessage:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
