import jwt from "jsonwebtoken";
import adminModel from "../models/admin.model.js";
import storeModel from "../models/store.model.js";

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

export const verifyStore = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // storeId from route params or token
    const storeId = decoded.storeId || req.params.storeId;
    if (!storeId) return res.status(400).json({ message: "Store ID required" });
    
    const store = await storeModel.findById(storeId);
    if (!store) return res.status(401).json({ message: "Store not found" });
    
    // verify user owns this store
    if (store.userId?.toString() !== decoded.id) {
      return res.status(403).json({ message: "Unauthorized: not store owner" });
    }
    
    req.store = store;
    req.storeId = storeId;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};