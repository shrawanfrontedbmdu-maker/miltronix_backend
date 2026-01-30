import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  permissions: [
    {
      module: {
        type: String,
        required: true,
      },
      actions: [
        {
          type: String,
          required: true,
        },
      ],
    },
  ],
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  users: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Role", roleSchema);
