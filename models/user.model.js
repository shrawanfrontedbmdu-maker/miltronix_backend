import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: Number,
    required: true,
    maxLength: 10,
    unique: true,
  },
  hashedPassword: {
    type: String,
  },
  email:{
    type:String,
    required:true,
    unique:true
  }
});

export default mongoose.model("User", userSchema);
