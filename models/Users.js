const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  role: String,
  buyerId: {type: Array},
  profilePicture: String,
  associated: {type: Array},
  password: { type: String, required: true },
  // role: { type: String, enum: ["buyer", "supplier"], required: true },
  timestamp: { type: Date, default: Date.now },
}, { collection: 'users' });

module.exports = mongoose.model('Users', UsersSchema);
