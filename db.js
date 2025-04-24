
// db.js
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const MONGO_URI = 'mongodb://localhost:27017/chat';

let mongoClientInstance = null;

const connectDB = async () => {
  try {
    // Connect Mongoose only once
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Mongoose connected');
    }

    // Connect native MongoClient only once
    if (!mongoClientInstance) {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      mongoClientInstance = client;
      console.log('✅ MongoClient connected');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

const getMongoClient = () => mongoClientInstance;
const getMongoDb = () => mongoClientInstance?.db(); // default "chat" DB

module.exports = {
  connectDB,
  getMongoClient,
  getMongoDb,
};



/////////////////////////////////////////////////////////////////////////////////
// const mongoose = require('mongoose');
// const connectDB = async () => {
//   try {
//     let MONGO_URI = "mongodb://localhost:27017/chat";
//     await mongoose.connect(MONGO_URI);
//     console.log('MongoDB connected');
//   } catch (err) {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

//////////////////////////////////////////////////////////////////////////////////
