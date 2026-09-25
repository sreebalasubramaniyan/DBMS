const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const customUri = process.env.MONGO_URI;

  if (customUri) {
    try {
      console.log(`[Database] Connecting to configured URI: ${customUri.replace(/\/\/.*@/, '//<credentials>@')}`);
      await mongoose.connect(customUri, { dbName: 'restaurant_db' });
      console.log('[Database] Connected to configured MongoDB Atlas successfully.');
      return;
    } catch (err) {
      console.error('[Database] Failed to connect to configured URI:', err.message);
      console.log('[Database] Falling back to automated in-memory MongoDB...');
    }
  }

  // Try local default MongoDB first
  try {
    const localUri = 'mongodb://127.0.0.1:27017/restaurant_db';
    console.log('[Database] Attempting connection to local MongoDB (mongodb://127.0.0.1:27017/restaurant_db)...');
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2500 });
    console.log('[Database] Connected to local MongoDB successfully.');
    return;
  } catch (err) {
    console.log('[Database] Local MongoDB not running on port 27017.');
  }

  // Fallback: Automated in-memory MongoDB (Zero setup required!)
  try {
    console.log('[Database] Starting built-in MongoDB instance (zero setup required)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const inMemoryUri = mongodInstance.getUri();
    await mongoose.connect(inMemoryUri);
    console.log(`[Database] Connected to in-memory MongoDB successfully: ${inMemoryUri}`);
  } catch (err) {
    console.error('[Database] Critical error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
