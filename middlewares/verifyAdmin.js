import jwt from "jsonwebtoken";
import adminModel from "../models/admin.model.js";

export const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  console.log(token)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    const admin  = await adminModel.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Admin not found" });
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
