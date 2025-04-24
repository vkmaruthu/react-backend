const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { connectDB } = require('./db');
const messageRoutes = require('./routes/messageRoutes');
const socketHandler = require('./socket/socketHandler');

// Setup express and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', messageRoutes);

// Sockets
socketHandler(io);

// Connect to Mongo and start server
(async () => {
  try {
    await connectDB(); // ✅ connects both Mongoose and MongoClient
    const PORT = 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error while starting app:', err);
  }
})();
