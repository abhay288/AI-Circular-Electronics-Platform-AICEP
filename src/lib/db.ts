import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Connect to MongoDB Atlas with connection pooling and Next.js HMR caching.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    // Fallback for local development or testing if MONGODB_URI is not set
    const fallbackURI = "mongodb://127.0.0.1:27017/eco_intel";
    console.warn(
      "[EcoIntel DB] MONGODB_URI not set in environment. Falling back to local MongoDB connection."
    );
    return connectWithURI(fallbackURI);
  }

  return connectWithURI(MONGODB_URI);
}

async function connectWithURI(uri: string): Promise<typeof mongoose> {
  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log(`[EcoIntel DB] Successfully connected to MongoDB [readyState=${m.connection.readyState}]`);
        // Silently drop legacy non-sparse index if present
        m.connection.collection("components").dropIndex("serialNumber_1").catch(() => {});
        return m;
      })
      .catch((err) => {
        console.error("[EcoIntel DB] Failed to connect to MongoDB:", err.message);
        cached!.promise = null;
        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// Backward-compatibility alias
export const connectToDatabase = connectDB;

export default connectDB;
