import mongoose from "mongoose";

const connectDb = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI not provided; skipping database connection.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

export default connectDb;
