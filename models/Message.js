const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: String
  },
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: [String], // userIds who have read the message
    default: [],
  },
  prNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isReadBy: {
    type: [String], // userIds who have read the message
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
