import express from "express";
import dotenv from "dotenv";
import connectDb from "./db/connectDB.js";
import cors from "cors";

// Routes
import productRoutes from "./routes/product.route.js";
import categoryRoutes from "./routes/category.route.js";
import brandRouter from './routes/brand.route.js';
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

dotenv.config();
const app = express();

// ================= CORS =================
app.use(cors());

// ================= BODY PARSERS =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= REQUEST LOGGER =================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
  next();
});

// ================= DATABASE =================
if (process.env.MONGO_URI) {
  connectDb();
} else {
  console.warn("MONGO_URI not set; skipping database connection. Some endpoints may not work.");
}

// ================= ROUTES =================
app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRouter);
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

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.stack || err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
