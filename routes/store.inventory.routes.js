import express from "express";
import authMiddleware from "../middlewares/auth.js";
import {
  createOrUpdateInventory,
  updateInventory,
  getStoreInventory,
  getInventoryByProduct,
} from "../controllers/store.inventory.controller.js";

const router = express.Router();

// store owner endpoints (must be logged in user linked to store)
router.post('/:storeId/inventory', authMiddleware, createOrUpdateInventory);
router.patch('/:storeId/inventory/:inventoryId', authMiddleware, updateInventory);
router.get('/:storeId/inventory', authMiddleware, getStoreInventory);

// public: list inventory for a product across stores
router.get('/product/:productId', getInventoryByProduct);

export default router;
