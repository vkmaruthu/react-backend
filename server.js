const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

// MongoDB connect
mongoose.connect('mongodb://localhost:27017/chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Message Schema
const MessageSchema = new mongoose.Schema({
  prNumber: String,
  senderId: String,
  receiverId: String,
  senderType: String, // 'buyer' or 'supplier'
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

// Users Schema
const UsersSchema = new mongoose.Schema({
  userId: String,
  name: String,
  role: String, // 'buyer' or 'supplier'
  buyerId: String,
  profilePicture: String, // New field for user profile picture
  timestamp: { type: Date, default: Date.now },
}, { collection: 'users' });

const Users = mongoose.model('Users', UsersSchema);

// Setup server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Get messages by PR
app.get('/api/messages/:groupId', async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId }).sort({ timestamp: 1 });

    // Populate sender name and profile
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const user = await Users.findOne({ userId: msg.senderId });
        return {
          ...msg.toObject(),
          senderName: user?.name || 'Unknown',
          senderProfilePicture: user?.profilePicture || null,
        };
      })
    );

    res.json(enrichedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Server error');
  }
});

// Socket.io real-time logic
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`User left room ${room}`);
  });

  socket.on("typing", (room) => {
    socket.to(room).emit("typing");
  });

  socket.on("stopTyping", (room) => {
    socket.to(room).emit("stopTyping");
  });

  // Sending message
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, prNumber, message } = data;
      const sender = await Users.findOne({ userId: senderId });

      if (!sender) {
        return socket.emit('error', { message: 'Sender not found' });
      }

      let receiverIds = [];

      if (sender.role === "supplier") {
        receiverIds = [sender.buyerId];
      } else if (sender.role === "buyer") {
        const suppliers = await Users.find({ buyerId: senderId });

        if (message.includes("@all")) {
          receiverIds = suppliers.map((s) => s.userId);
        } else {
          // const mentions = message.match(/@(\w+)/g);
          // if (mentions) {
          //   receiverIds = mentions.map(m => m.replace('@', ''));
          // }
          receiverIds = suppliers.map((s) => s.userId);
        }
      }

      // Save message
      // 3. Save message
      const newMessage = new Message({
        ...data,
        receiverId: receiverIds.length === 1 ? receiverIds[0] : null,
        timestamp: new Date(),
      });
      await newMessage.save();

      // Build message payload with user info
      const fullMessage = {
        ...newMessage.toObject(),
        senderName: sender.name,
        senderProfilePicture: sender.profilePicture || null,
      };

      // Emit to specific PR room
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

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});
