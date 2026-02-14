import User from "../models/user.model.js";
import Store from "../models/store.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getCoordinatesFromPincode } from "../services/locationService.js";

const generateToken = (payload, expires = "7d") =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expires });

// Admin creates a store and owner account
export const adminCreateStore = async (req, res) => {
  try {
    console.log("called");
    const { storeName, email, password, phone, address } = req.body;
    // create user for store owner
    if (!email || !password || !storeName)
      return res
        .status(400)
        .json({ message: "storeName, email and password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(409)
        .json({ message: "User with this email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const coordinates = await getCoordinatesFromPincode(address.pincode);
    const user = await User.create({
      fullName: storeName,
      email,
      mobile: phone,
      password: hashed,
      isVerified: true,
      role: "storeManager",
    });

    const store = await Store.create({
      storeName,
      userId: user._id,
      phone,
      address,
      location: {
        type: "Point",
        coordinates: [coordinates.lng, coordinates.lat],
      },
    });

    return res.status(201).json({ message: "Store created", store, user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Could not create store", error: err.message });
  }
};

export const storeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email , role:"storeManager"}).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // find associated store
    const store = await Store.findOne({ userId: user._id });
    console.log(store)
    const payload = {
      id: user._id,
      role: user.role,
      storeId: store?._id,
    };
    const token = generateToken(payload);

    res.json({ message: "Logged in", token, user, store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
