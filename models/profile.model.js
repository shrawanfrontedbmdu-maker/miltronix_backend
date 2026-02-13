import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    title: { type: String, trim: true },
    avatar: { type: String },
    coverImage: { type: String },
    isVerified: { type: Boolean, default: false },

    experienceYears: { type: String }, // "3+"
    certificates: { type: Number },
    internships: { type: Number },

    jobTitle: { type: String },
    education: { type: String },
    location: { type: String },
    followers: { type: String },

    email: { type: String },
    website: { type: String },
    languages: { type: String },
    status: { type: String, default: "Active" },

    about: { type: String }
  },
  { timestamps: true }
);
export default mongoose.model("AdminProfile", adminProfileSchema);
