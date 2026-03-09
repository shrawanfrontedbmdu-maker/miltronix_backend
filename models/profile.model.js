import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    // ── Linked to Auth User ──────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Display Info ─────────────────────────────────────
    avatar:         { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    bio:            { type: String, default: "", maxlength: 500 },
    phone:          { type: String, default: "", trim: true },

    // ── Activity ─────────────────────────────────────────
    lastLogin: { type: Date },
    lastSeen:  { type: Date },

    // ── Status ───────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

profileSchema.index({ userId: 1 });

export default mongoose.model("Profile", profileSchema);