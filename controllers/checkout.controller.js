import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupons.model.js";

const roundOffAmount = (value) => Math.round(Number(value || 0));

export const getCheckoutDetails = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { couponCode } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User required",
      });
    }

    // Fetch cart with populated product
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name slug brand images variants",
      });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const processedItems = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) continue;

      const quantity = cartItem.quantity || 1;
      const pricePerUnit = Number(cartItem.priceSnapshot || 0);

      // 🔹 STRICT variant check (no fallback)
      const sku = cartItem.variant?.sku;
      if (!sku) {
        return res.status(400).json({
          success: false,
          message: "Product variant missing in cart",
        });
      }

      const variant = product.variants?.find(v => v.sku === sku);

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `${product.name} variant is no longer available`,
        });
      }

      // 🔹 Stock validation
      if (variant.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      const cutPricePerUnit = variant.mrp || variant.price || pricePerUnit;
      const discountPerUnit = Math.max(0, cutPricePerUnit - pricePerUnit);
      const itemTotal = pricePerUnit * quantity;

      const image =
        cartItem.images?.[0]?.url ||
        product.images?.[0]?.url ||
        "";

      processedItems.push({
        cartId: cartItem._id,
        productId: product._id,
        productName: product.name,
        productUrl: product.slug || product.productKey || "",
        brand: product.brand || "",
        image,
        variant: {
          sku,
          color: cartItem.variant?.attributes?.color,
          size: cartItem.variant?.attributes?.size,
          model: cartItem.variant?.attributes?.model,
        },
        quantity,
        pricePerUnit,
        cutPricePerUnit,
        discountPerUnit,
        totalPrice: itemTotal,
        stock: variant.stockQuantity,
      });

      subtotal += itemTotal;
      totalDiscount += discountPerUnit * quantity;
    }

    // 🔹 Coupon validation
    let couponDiscount = 0;
    let couponDetails = null;
    let couponError = null;

    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
        });

        if (!coupon) {
          couponError = "Coupon not found";
        } else if (
          coupon.status !== "active" &&
          coupon.status !== "ACTIVE"
        ) {
          couponError = "Coupon is not active";
        } else if (
          coupon.expiryDate &&
          new Date() > new Date(coupon.expiryDate)
        ) {
          couponError = "Coupon has expired";
        } else if (
          coupon.startDate &&
          new Date() < new Date(coupon.startDate)
        ) {
          couponError = "Coupon is not yet valid";
        } else if (subtotal < (coupon.minOrderValue || 0)) {
          couponError = `Minimum order value of ₹${coupon.minOrderValue} required`;
        } else {
          if (
            coupon.discountType === "percentage" ||
            coupon.discountType === "PERCENTAGE"
          ) {
            couponDiscount =
              (subtotal * (coupon.discountValue || 0)) / 100;

            if (
              coupon.maxDiscount &&
              couponDiscount > coupon.maxDiscount
            ) {
              couponDiscount = coupon.maxDiscount;
            }
          } else {
            couponDiscount = coupon.discountValue || 0;
          }

          couponDetails = {
            couponId: coupon._id,
            code: coupon.code,
            appliedDiscount: roundOffAmount(couponDiscount),
          };
        }
      } catch (err) {
        couponError = "Error validating coupon";
      }
    }

    const finalAmount = subtotal - couponDiscount;

    return res.status(200).json({
      success: true,
      items: processedItems,
      itemCount: processedItems.length,
      totalQuantity: processedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      pricing: {
        subtotal: roundOffAmount(subtotal),
        totalCutPrice: roundOffAmount(subtotal + totalDiscount),
        totalDiscount: roundOffAmount(totalDiscount),
        couponDiscount: roundOffAmount(couponDiscount),
        finalAmount: roundOffAmount(finalAmount),
      },
      coupon: couponDetails,
      couponError,
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing checkout",
      error: error.message,
    });
  }
};
