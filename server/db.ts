import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  mongoose.connection.on('error', (e) => console.error('MongoDB error:', e.message));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected (db: ${mongoose.connection.name})`);
}
