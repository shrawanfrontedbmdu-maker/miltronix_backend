import express from "express";
import dotenv from "dotenv";
import connectDb from "./db/connectDB.js";
import productRoutes from "./routes/product.route.js";
import categoryRoutes from "./routes/category.route.js";
import cors from "cors";
import orderRoutes from "./routes/order.route.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import serviceRequestRoutes from "./routes/serviceRequest.routes.js";
import bannerRoutes from './routes/banner.routes.js'
import blogRoutes from './routes/blog.routes.js'
import roleRoutes from './routes/roles.routes.js'
import cartRoutes from './routes/cart.routes.js'
import healthRoutes from './routes/apihealth.route.js';
import brandRouter from './routes/brand.route.js';

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`)
  next()
})

dotenv.config();

const PORT = process.env.PORT || 3000;

// Only attempt DB connection if MONGO_URI is provided; this allows running the server in dev without DB.
if (process.env.MONGO_URI) {
  connectDb();
} else {
  console.warn('MONGO_URI not set; skipping database connection. Some endpoints may not work.')
}

app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use('/api/brand', brandRouter);
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


// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err)
  res.status(500).json({ message: 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`)
})
