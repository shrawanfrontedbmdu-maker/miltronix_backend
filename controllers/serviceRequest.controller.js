import ServiceRequest from "../models/serviceRequest.model.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_STATUS   = ["open", "in progress", "completed", "cancelled"];
const ALLOWED_PRIORITY = ["low", "medium", "high"];
const ALLOWED_TYPE     = ["demo", "repair", "relocation", "installation", "warranty"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateEnum = (value, allowed, fieldName) => {
  if (value && !allowed.includes(value.toLowerCase())) {
    return `Invalid ${fieldName} value. Must be one of: ${allowed.join(", ")}`;
  }
  return null;
};

// ─── CREATE SERVICE REQUEST ───────────────────────────────────────────────────

export const createServiceRequest = async (req, res) => {
  try {
    const {
      productname,
      productId,
      description,
      priority,
      type,
      orderId,
      paymentdetails,
      phone,
      address,
      preferredDate,
      issueImages,
    } = req.body;

    // Required field checks
    const missingFields = [];
    if (!productname)    missingFields.push("productname");
    if (!description)    missingFields.push("description");
    if (!type)           missingFields.push("type");
    if (!paymentdetails) missingFields.push("paymentdetails");
    if (!phone)          missingFields.push("phone");
    if (!address)        missingFields.push("address");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Enum validation
    const typeError = validateEnum(type, ALLOWED_TYPE, "type");
    if (typeError) return res.status(400).json({ message: typeError });

    const priorityError = validateEnum(priority, ALLOWED_PRIORITY, "priority");
    if (priorityError) return res.status(400).json({ message: priorityError });

    // Auth guard — no fallback user
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const newServiceRequest = new ServiceRequest({
      productname,
      productId,
      description,
      priority: priority?.toLowerCase(),
      type: type.toLowerCase(),
      orderId,
      paymentdetails,
      phone,
      address,
      preferredDate,
      issueImages,
      user: req.user._id,
    });

    await newServiceRequest.save();

    res.status(201).json({
      message: "Service request created successfully",
      data: newServiceRequest,
    });
  } catch (error) {
    console.error("Create Service Request Error:", error);

    // Mongoose validation error — return clean message
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: "Couldn't create service request",
      error: error.message,
    });
  }
};

// ─── GET ALL SERVICE REQUESTS ─────────────────────────────────────────────────

export const getServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [serviceRequests, total] = await Promise.all([
      ServiceRequest.find()
        .populate("user", "name email")
        .populate("orderId", "orderNumber")
        .populate("productId", "name")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceRequest.countDocuments(),
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: serviceRequests,
    });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({
      message: "Couldn't fetch service requests",
      error: error.message,
    });
  }
};

// ─── GET SINGLE SERVICE REQUEST ───────────────────────────────────────────────

export const getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderId", "orderNumber")
      .populate("productId", "name")
      .populate("assignedTo", "name email");

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.status(200).json(serviceRequest);
  } catch (error) {
    console.error("Error fetching service request:", error);
    res.status(500).json({
      message: "Couldn't fetch service request",
      error: error.message,
    });
  }
};

// ─── UPDATE SERVICE REQUEST ───────────────────────────────────────────────────

export const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRequest = await ServiceRequest.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Normalize and validate enum fields
    const status   = req.body.status?.toLowerCase();
    const priority = req.body.priority?.toLowerCase();
    const type     = req.body.type?.toLowerCase();

    const statusError   = validateEnum(status, ALLOWED_STATUS, "status");
    const priorityError = validateEnum(priority, ALLOWED_PRIORITY, "priority");
    const typeError     = validateEnum(type, ALLOWED_TYPE, "type");

    if (statusError)   return res.status(400).json({ message: statusError });
    if (priorityError) return res.status(400).json({ message: priorityError });
    if (typeError)     return res.status(400).json({ message: typeError });

    // Apply updates
    Object.assign(existingRequest, {
      productname:    req.body.productname    ?? existingRequest.productname,
      productId:      req.body.productId      ?? existingRequest.productId,
      description:    req.body.description    ?? existingRequest.description,
      priority:       priority                ?? existingRequest.priority,
      type:           type                    ?? existingRequest.type,
      status:         status                  ?? existingRequest.status,
      paymentdetails: req.body.paymentdetails ?? existingRequest.paymentdetails,
      assignedTo:     req.body.assignedTo     ?? existingRequest.assignedTo,
      orderId:        req.body.orderId        ?? existingRequest.orderId,
      phone:          req.body.phone          ?? existingRequest.phone,
      address:        req.body.address        ?? existingRequest.address,
      preferredDate:  req.body.preferredDate  ?? existingRequest.preferredDate,
      issueImages:    req.body.issueImages    ?? existingRequest.issueImages,
      adminRemarks:   req.body.adminRemarks   ?? existingRequest.adminRemarks,
      // resolvedAt is auto-managed by pre-save middleware in model
    });

    await existingRequest.save();

    res.status(200).json({
      message: "Service request updated successfully",
      data: existingRequest,
    });
  } catch (error) {
    console.error("Update Service Request Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: "Couldn't update service request",
      error: error.message,
    });
  }
};

// ─── DELETE SERVICE REQUEST ───────────────────────────────────────────────────

export const deleteServiceRequest = async (req, res) => {
  try {
    const deletedServiceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);

    if (!deletedServiceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.status(200).json({
      message: "Service request deleted successfully",
      data: deletedServiceRequest,
    });
  } catch (error) {
    console.error("Delete Service Request Error:", error);
    res.status(500).json({
      message: "Couldn't delete service request",
      error: error.message,
    });
  }
};

// ─── UNIFIED FILTER (replaces 3 separate filter functions) ────────────────────

export const filterServiceRequests = async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 20 } = req.query;

    // Validate any provided filter values
    if (status && !ALLOWED_STATUS.includes(status.toLowerCase())) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${ALLOWED_STATUS.join(", ")}` });
    }
    if (type && !ALLOWED_TYPE.includes(type.toLowerCase())) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${ALLOWED_TYPE.join(", ")}` });
    }
    if (priority && !ALLOWED_PRIORITY.includes(priority.toLowerCase())) {
      return res.status(400).json({ message: `Invalid priority. Must be one of: ${ALLOWED_PRIORITY.join(", ")}` });
    }

    // Build filter dynamically
    const filter = {};
    if (status)   filter.status   = status.toLowerCase();
    if (type)     filter.type     = type.toLowerCase();
    if (priority) filter.priority = priority.toLowerCase();

    const skip = (Number(page) - 1) * Number(limit);

    const [serviceRequests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate("user", "name email")
        .populate("orderId", "orderNumber")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: serviceRequests,
    });
  } catch (error) {
    console.error("Filter Service Requests Error:", error);
    res.status(500).json({
      message: "Couldn't filter service requests",
      error: error.message,
    });
  }
};

// ─── GET USER SERVICE REQUESTS ────────────────────────────────────────────────

export const getServiceRequestsByUser = async (req, res) => {
  try {
    // Auth guard
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [serviceRequests, total] = await Promise.all([
      ServiceRequest.find({ user: req.user._id })
        .populate("orderId", "orderNumber")
        .populate("productId", "name")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ServiceRequest.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: serviceRequests,
    });
  } catch (error) {
    console.error("Error fetching user service requests:", error);
    res.status(500).json({
      message: "Couldn't fetch user service requests",
      error: error.message,
    });
  }
};