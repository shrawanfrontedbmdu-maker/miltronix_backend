import Store from "../models/store.model.js";
import StoreInventory from "../models/storeInventory.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

// Helper to ensure the authenticated user owns the store
const ensureStoreOwner = async (req, storeId) => {
  // prefer verified store (set by verifyStore middleware)
  if (req.store) {
    if (String(req.store._id) !== String(storeId)) throw new Error("Forbidden");
    return req.store;
  }

  if (!req.user) throw new Error("Unauthorized");
  const store = await Store.findById(storeId);
  if (!store) throw new Error("Store not found");
  if (store.userId?.toString() !== req.user._id.toString())
    throw new Error("Forbidden");
  return store;
};

const recalcProductVariantStock = async (productId, variantSku) => {
  const result = await StoreInventory.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        variantSku: variantSku,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $max: [{ $subtract: ["$stockQty", "$reservedQty"] }, 0],
          },
        },
      },
    },
  ]);

  const totalStock = result[0]?.total || 0;

  
  let stockStatus = "out-of-stock";

  if (totalStock > 5) {
    stockStatus = "in-stock";
  } else if (totalStock > 0) {
    stockStatus = "low-stock";
  }

  await Product.updateOne(
    {
      _id: productId,
      "variants.sku": variantSku,
    },
    {
      $set: {
        "variants.$.stockQuantity": totalStock,
        "variants.$.hasStock": totalStock > 0,
        "variants.$.stockStatus": stockStatus,
      },
    },
  );


  return { totalStock };
};

export const createOrUpdateInventory = async (req, res) => {
  try {
    const storeId = req.store?._id || req.params.storeId;

    const {
      productId,
      variantSku,
      stockQty,
      reservedQty,
      isActive = true,
      leadTimeDays,
      fulfillmentOptions,
    } = req.body;

    // Ensure ownership
    await ensureStoreOwner(req, storeId);

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!variantSku) {
      return res.status(400).json({ message: "variantSku is required" });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variantExists = product.variants.some((v) => v.sku === variantSku);

    if (!variantExists) {
      return res.status(404).json({
        message: "Variant not found on product",
      });
    }

    
  let stockStatus = "out-of-stock";

  if (stockQty > 5) {
    stockStatus = "in-stock";
  } else if (stockQty > 0) {
    stockStatus = "low-stock";
  }

    // Upsert inventory atomically
    const inventory = await StoreInventory.findOneAndUpdate(
      {
        store: storeId,
        product: productId,
        variantSku: variantSku,
      },
      {
        $set: {
          stockQty: Math.max(0, Number(stockQty) || 0),
          reservedQty: Math.max(0, Number(reservedQty) || 0),
          stockStatus,
          isActive,
          leadTimeDays,
          fulfillmentOptions,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    if (variantSku) {
      await recalcProductVariantStock(productId, variantSku);
    }
    return res.json({
      message: "Inventory saved successfully",
      inventory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const storeId = req.store?._id || req.params.storeId;
    const { inventoryId } = req.params;
    const updates = req.body;

    try {
      await ensureStoreOwner(req, storeId);
    } catch (e) {
      return res
        .status(e.message === "Store not found" ? 404 : 403)
        .json({ message: e.message });
    }

    const inventory = await StoreInventory.findOne({
      _id: inventoryId,
      store: storeId,
    });
    if (!inventory)
      return res.status(404).json({ message: "Inventory not found" });

    const allowed = [
      "price",
      "stockQty",
      "reservedQty",
      "leadTimeDays",
      "isActive",
      "storeSku",
    ];
    allowed.forEach((k) => {
      if (typeof updates[k] !== "undefined") inventory[k] = updates[k];
    });
    if (typeof updates.stockQty !== "undefined")
      inventory.stockQty = Math.max(0, Number(updates.stockQty));
    if (typeof updates.reservedQty !== "undefined")
      inventory.reservedQty = Math.max(0, Number(updates.reservedQty));

    await inventory.save();

    // if inventory is variant-specific, update product aggregate
    if (inventory.variantSku) {
      await recalcProductVariantStock(inventory.product, inventory.variantSku);
    }

    res.json({ message: "Inventory updated", inventory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStoreInventory = async (req, res) => {
  try {
    const storeId = req.store?._id || req.params.storeId;

    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // optional stock filter
    const filter = { store: storeId };
    console.log(filter)
    if (req.query.stockStatus) {
      filter.stockStatus = req.query.stockStatus; // in-stock | low-stock | out-of-stock
    }

    const total = await StoreInventory.countDocuments(filter);

    const inventory = await StoreInventory.find(filter)
      .populate({
        path: "product",
        select: "name slug brand images",
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

      console.log(inventory)

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      inventory,
    });

  } catch (err) {
    console.error("Get Store Inventory Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};


export const getStoreProductList = async (req, res) => {
  try {
    const storeId = req.store?._id;
    const products = await Product.find({ status: "active" }).lean();
    const productIds = products.map((p) => p._id);
    const inventories = await StoreInventory.find({
      store: storeId,
      product: { $in: productIds },
    }).lean();

    const invMap = {};
    inventories.forEach((i) => {
      const pid = String(i.product);
      invMap[pid] = invMap[pid] || [];
      invMap[pid].push(i);
    });

    const result = products.map((p) => {
      const pv = p.variants || [];
      const storeInv = invMap[String(p._id)] || [];

      if (pv.length > 0) {
        // attach per-variant inventory (if exists)
        const variants = pv.map((v) => {
          const si = storeInv.find((x) => x.variantSku === v.sku) || null;
          return { ...v, storeInventory: si };
        });
        return { ...p, variants };
      }

      // single-SKU product: attach single store inventory record (variantSku null)
      const si = storeInv.find((x) => !x.variantSku) || null;
      return { ...p, storeInventory: si };
    });

    res.json({ products: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const list = await StoreInventory.find({ product: productId }).populate(
      "store",
    );
    res.json({ inventory: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
