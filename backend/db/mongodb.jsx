import mongoose from 'mongoose';


let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null, unavailableUntil: 0 };
}

const isNetworkDbError = (err) => {
    const msg = String(err?.message || "");
    return (
        err?.code === "ECONNREFUSED" ||
        err?.code === "ENOTFOUND" ||
        err?.code === "ETIMEDOUT" ||
        msg.includes("querySrv ECONNREFUSED")
    );
};

export const isDbUnavailableError = (err) =>
    err?.code === "DB_UNAVAILABLE" || isNetworkDbError(err);

async function dbConnect() {
    const MONGODB_URI = process.env.MONGO_URI;

    if (!MONGODB_URI) {
        console.error("❌ MONGO_URI is missing from process.env!");
        throw new Error('Please define the MONGO_URI environment variable inside .env');
    }
    if (cached.conn) {
        console.log("✅ Using cached MongoDB connection");
        return cached.conn;
    }

    if (cached.unavailableUntil && Date.now() < cached.unavailableUntil) {
        const err = new Error("Database temporarily unavailable");
        err.code = "DB_UNAVAILABLE";
        throw err;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Fail fast when MongoDB DNS/network is unreachable
            serverSelectionTimeoutMS: 1500,
            connectTimeoutMS: 1500,
            socketTimeoutMS: 3000,
        };

        console.log("📡 Connecting to MongoDB:", MONGODB_URI);
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log("🟢 New MongoDB connection established");
            cached.unavailableUntil = 0;
            return mongoose;
        }).catch(err => {
            console.error("🔴 MongoDB connection error:", err);
            cached.promise = null;
            // Avoid retry storms on every request when DB is down.
            if (isNetworkDbError(err)) cached.unavailableUntil = Date.now() + 30000;
            throw err;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
