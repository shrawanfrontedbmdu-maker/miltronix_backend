import express from "express";
import authMiddleware from "../middlewares/auth.js";
import {
  createOrUpdateInventory,
  updateInventory,
  getStoreInventory,
  getInventoryByProduct,
  getStoreProductList,
} from "../controllers/store.inventory.controller.js";

import {
  getProducts,
} from "../controllers/product.controller.js";
import { verifyStore } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// add stock 
router.post('/inventory', verifyStore, createOrUpdateInventory);

router.patch('/inventory/:inventoryId', verifyStore, updateInventory);

router.get('/inventory', verifyStore, getStoreInventory);

// public: list inventory for a product across stores
router.get('/product/:productId', getInventoryByProduct);

// store-specific product listing (includes store inventory per variant)
router.get('/products/for-store', verifyStore, getStoreProductList);

export default router;
