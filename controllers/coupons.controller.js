import Coupon from "../models/coupons.model.js";
import Orders from "../models/order.model.js"

export const createCoupon = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      startDate,
      expiryDate,
      totalUsage,
      perCustomerLimit,
      visibility,
      platform,
      firstPurchaseOnly
    } = req.body;

    // 🔹 Convert to Date objects once
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);

    if (!title || !code || !discountValue || !minOrderValue || !startDate || !expiryDate || !totalUsage) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    // 🔹 Validate valid dates
    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    // 🔹 Expiry must be after start
    if (start >= expiry) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after start date"
      });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists"
      });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be more than 100%"
      });
    }

    const newCoupon = new Coupon({
      title: title.trim(),
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount: discountType === "percentage" ? maxDiscount : null,
      startDate: start,     // ✅ store as Date (UTC internally)
      expiryDate: expiry,   // ✅ store as Date (UTC internally)
      totalUsage,
      perCustomerLimit,
      visibility,
      platform,
      firstPurchaseOnly,
      status: "active"
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: newCoupon
    });

  } catch (error) {
    console.error("Create Coupon Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating coupon"
    });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const updateCoupon = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = { ...req.body };

//     const existingCoupon = await Coupon.findById(id);
//     if (!existingCoupon) {
//       return res.status(404).json({
//         success: false,
//         message: "Coupon not found"
//       });
//     }

//     if (updates.code) {
//       updates.code = updates.code.toUpperCase().trim();

//       const duplicate = await Coupon.findOne({
//         code: updates.code,
//         _id: { $ne: id }
//       });

//       if (duplicate) {
//         return res.status(400).json({
//           success: false,
//           message: "Coupon code already exists"
//         });
//       }
//     }

//     const startDate = updates.startDate ? new Date(updates.startDate) : existingCoupon.startDate;
//     const expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : existingCoupon.expiryDate;

//     if (startDate >= expiryDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Expiry date must be after start date"
//       });
//     }

//     const discountType = updates.discountType || existingCoupon.discountType;
//     const discountValue = updates.discountValue ?? existingCoupon.discountValue;

//     if (discountType === "percentage" && discountValue > 100) {
//       return res.status(400).json({
//         success: false,
//         message: "Percentage discount cannot be more than 100%"
//       });
//     }

//     if (discountType !== "percentage") {
//       updates.maxDiscount = null;
//     }

//     if (updates.title) updates.title = updates.title.trim();

//     const updatedCoupon = await Coupon.findByIdAndUpdate(
//       id,
//       updates,
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Coupon updated successfully",
//       data: updatedCoupon
//     });

//   } catch (error) {
//     console.error("Update Coupon Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating coupon"
//     });
//   }
// };

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    if (updates.code) {
      updates.code = updates.code.toUpperCase().trim();

      const duplicate = await Coupon.findOne({
        code: updates.code,
        _id: { $ne: id }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists"
        });
      }
    }

    const startDate = updates.startDate
      ? new Date(updates.startDate)
      : existingCoupon.startDate;

    const expiryDate = updates.expiryDate
      ? new Date(updates.expiryDate)
      : existingCoupon.expiryDate;

    if (isNaN(startDate.getTime()) || isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    if (startDate >= expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after start date"
      });
    }

    updates.startDate = startDate;
    updates.expiryDate = expiryDate;

    const discountType = updates.discountType || existingCoupon.discountType;
    const discountValue =
      updates.discountValue !== undefined
        ? updates.discountValue
        : existingCoupon.discountValue;

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be more than 100%"
      });
    }

    if (discountType !== "percentage") {
      updates.maxDiscount = null;
    }

    if (updates.title) updates.title = updates.title.trim();

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon
    });

  } catch (error) {
    console.error("Update Coupon Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating coupon"
    });
  }
};


export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.status = coupon.status === "active" ? "inactive" : "active";
    await coupon.save();

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByCoupons = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const orders = await Orders.find({ couponCode: code })
      .populate("userId", "name phone email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

