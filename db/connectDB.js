import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.warn('MONGO_URI not provided; skipping database connection.')
    return
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection failed:", error);
    // Do not exit the process; allow server to run without DB for dev
  }
};

export default connectDb;
