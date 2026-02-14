import path from "path";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDb from "./db/connectDB.js";
import cors from "cors";

// Routes
import productRoutes from "./routes/product.route.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.route.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import serviceRequestRoutes from "./routes/serviceRequest.routes.js";
import bannerRoutes from './routes/banner.routes.js';
import blogRoutes from './routes/blog.routes.js';
import roleRoutes from './routes/roles.routes.js';
import cartRoutes from './routes/cart.routes.js';
import healthRoutes from './routes/apihealth.route.js';
import wishlistRoutes from "./routes/wishlist.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import storeRoutes from "./routes/store.auth.routes.js";
import storeInventoryRoutes from "./routes/store.inventory.routes.js";
// import brandRouter from "./routes/brand.routes.js";
import infosectionRoutes from "./routes/infosection.routes.js";
// import recommendationsRoutes from "./routes/recommendations.route.js";

const app = express();

// ------------------- MIDDLEWARES -------------------
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
  next();
});

// Static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ------------------- WELCOME ROUTE -------------------
app.get("/", (req, res) => {
  res.send("🚀 API server running locally");
});

// ------------------- CONNECT TO DB -------------------
connectDb();

// ------------------- ROUTES -------------------
app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
// app.use("/api/brand", brandRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api", healthRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/infosections", infosectionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/store-inventory", storeInventoryRoutes);
// app.use("/api/recommendations", recommendationsRoutes);

// ------------------- GLOBAL ERROR HANDLER -------------------
app.use((err, req, res, next) => {
  console.error('❌ Unhandled server error:', err.stack || err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
