const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    return;
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    const collection = mongoose.connection.collection('customers');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    if (indexes.find(i => i.name === 'phone_1')) {
      await collection.dropIndex('phone_1');
      console.log('Dropped index phone_1');
    } else {
      console.log('Index phone_1 not found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
