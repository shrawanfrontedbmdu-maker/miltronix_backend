import mongoose from "mongoose";

const blacklistTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    blacklistedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

export default mongoose.model("BlacklistToken", blacklistTokenSchema);
