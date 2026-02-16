import Address from "../models/address.model.js";

/* ================= ADD ADDRESS ================= */
export const addAddress = async (req, res) => {
  try {
    // default address logic
    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      ...req.body,
      userId: req.user.id,
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET USER ADDRESSES ================= */
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE ADDRESS ================= */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true }
    );

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE ADDRESS ================= */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    await Address.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
