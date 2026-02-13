import Store from "../models/store.model.js";
import StoreInventory from "../models/storeInventory.model.js";
import Product from "../models/product.model.js";

// Helper to ensure the authenticated user owns the store
const ensureStoreOwner = async (req, storeId) => {
  if (!req.user) throw new Error("Unauthorized");
  const store = await Store.findById(storeId);
  if (!store) throw new Error("Store not found");
  if (store.userId?.toString() !== req.user._id.toString()) throw new Error("Forbidden");
  return store;
};

export const createOrUpdateInventory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { productId, price, stockQty, storeSku, leadTimeDays, isActive } = req.body;

    // verify ownership
    try { await ensureStoreOwner(req, storeId); } catch (e) { return res.status(e.message === 'Store not found' ? 404 : 403).json({ message: e.message }); }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let inventory = await StoreInventory.findOne({ store: storeId, product: productId });
    if (inventory) {
      if (typeof stockQty !== 'undefined') inventory.stockQty = Math.max(0, Number(stockQty));
      if (typeof price !== 'undefined') inventory.price = price;
      if (typeof storeSku !== 'undefined') inventory.storeSku = storeSku;
      if (typeof leadTimeDays !== 'undefined') inventory.leadTimeDays = leadTimeDays;
      if (typeof isActive !== 'undefined') inventory.isActive = isActive;
      await inventory.save();
    } else {
      inventory = new StoreInventory({ store: storeId, product: productId, price: price ?? product.sellingPrice ?? 0, stockQty: stockQty ?? 0, storeSku, leadTimeDays, isActive });
      await inventory.save();
    }

    return res.json({ message: "Inventory saved", inventory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { storeId, inventoryId } = req.params;
    const updates = req.body;
    try { await ensureStoreOwner(req, storeId); } catch (e) { return res.status(e.message === 'Store not found' ? 404 : 403).json({ message: e.message }); }

    const inventory = await StoreInventory.findOne({ _id: inventoryId, store: storeId });
    if (!inventory) return res.status(404).json({ message: "Inventory not found" });

    const allowed = ["price", "stockQty", "reservedQty", "leadTimeDays", "isActive", "storeSku"];
    allowed.forEach(k => { if (typeof updates[k] !== 'undefined') inventory[k] = updates[k]; });
    if (typeof updates.stockQty !== 'undefined') inventory.stockQty = Math.max(0, Number(updates.stockQty));
    if (typeof updates.reservedQty !== 'undefined') inventory.reservedQty = Math.max(0, Number(updates.reservedQty));

    await inventory.save();
    res.json({ message: "Inventory updated", inventory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStoreInventory = async (req, res) => {
  try {
    const { storeId } = req.params;
    // allow store owners and admins; for stores ensure ownership
    if (req.user) {
      const store = await Store.findById(storeId);
      if (!store) return res.status(404).json({ message: "Store not found" });
      if (store.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    }
    const list = await StoreInventory.find({ store: storeId }).populate('product');
    res.json({ inventory: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const list = await StoreInventory.find({ product: productId }).populate('store');
    res.json({ inventory: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
