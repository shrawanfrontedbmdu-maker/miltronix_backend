import ServiceRequest from "../models/serviceRequest.model.js";

// export const createServiceRequest = async (req, res) => {
//   try {
//     const { title, description, priority, type, orderId } = req.body;

//     const newServiceRequest = new ServiceRequest({
//       title,
//       description,
//       priority,
//       type,
//       orderId,
//       user: "6891f10b2e34ae607bbba890",
//     });

//     await newServiceRequest.save();

//     res.status(201).json({
//       message: "Service request created successfully.",
//       data: newServiceRequest,
//     });
//   } catch (error) {
//     console.error("Error creating service request:", error);
//     res.status(500).json({
//       message: "Couldn't create service request",
//       error: error.message,
//     });
//   }
// };
export const createServiceRequest = async (req, res) => {
  try {
    const {
      productname,
      description,
      priority,
      type,
      orderId,
      paymentdetails,
      status,
      assignedTo,
    } = req.body;

    const newServiceRequest = new ServiceRequest({
      productname,
      description,
      priority,
      type,
      orderId,
      paymentdetails,
      status: status || "open",
      assignedTo: assignedTo || "",
      user: "6891f10b2e34ae607bbba890", // temp static user
      updatedAt: Date.now(),
    });

    await newServiceRequest.save();

    res.status(201).json({
      message: "Service request created successfully.",
      data: newServiceRequest,
    });
  } catch (error) {
    console.error("Error creating service request:", error);
    res.status(500).json({
      message: "Couldn't create service request",
      error: error.message,
    });
  }
};

export const getServiceRequestById = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderId", "orderNumber");

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

export const getServiceRequests = async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find()
      .populate("user", "name email")
      .populate("orderId", "orderNumber");

    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({
      message: "Couldn't fetch service requests",
      error: error.message,
    });
  }
};

// export const updateServiceRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, description, priority, type, status } = req.body;

//     const updatedServiceRequest = await ServiceRequest.findByIdAndUpdate(
//       id,
//       {
//         title,
//         description,
//         priority,
//         type,
//         status,
//       },
//       { new: true }
//     );

//     if (!updatedServiceRequest) {
//       return res.status(404).json({ message: "Service request not found" });
//     }

//     res.status(200).json({
//       message: "Service request updated successfully",
//       data: updatedServiceRequest,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Couldn't update service request",
//       error: error.message,
//     });
//   }
// };

export const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRequest = await ServiceRequest.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Allowed values for validation
    const allowedStatus = ["open", "in progress", "resolved", "closed"];
    const allowedPriority = ["low", "medium", "high", "critical"];
    const allowedType = ["demo", "repair", "relocation", "installation", "delivery"];

    // Convert incoming values to lowercase for validation
    const status = req.body.status ? String(req.body.status).toLowerCase() : undefined;
    const priority = req.body.priority ? String(req.body.priority).toLowerCase() : undefined;
    const type = req.body.type ? String(req.body.type).toLowerCase() : undefined;

    // Validate enum fields
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ message: `Invalid status value. Allowed: ${allowedStatus.join(", ")}` });
    }

    if (priority && !allowedPriority.includes(priority)) {
      return res.status(400).json({ message: `Invalid priority value. Allowed: ${allowedPriority.join(", ")}` });
    }

    if (type && !allowedType.includes(type)) {
      return res.status(400).json({ message: `Invalid type value. Allowed: ${allowedType.join(", ")}` });
    }

    // Update only provided fields, else keep existing
    existingRequest.productname = req.body.productname ?? existingRequest.productname;
    existingRequest.description = req.body.description ?? existingRequest.description;
    existingRequest.priority = priority ?? existingRequest.priority;
    existingRequest.type = type ?? existingRequest.type;
    existingRequest.status = status ?? existingRequest.status;
    existingRequest.paymentdetails = req.body.paymentdetails ?? existingRequest.paymentdetails;
    existingRequest.assignedTo = req.body.assignedTo ?? existingRequest.assignedTo;
    existingRequest.orderId = req.body.orderId ?? existingRequest.orderId;
    existingRequest.resolution = req.body.resolution ?? existingRequest.resolution;

    existingRequest.updatedAt = Date.now();

    await existingRequest.save();

    res.status(200).json({
      message: "Service request updated successfully",
      data: existingRequest,
    });

  } catch (error) {
    console.error("Update Service Request Error:", error);
    res.status(500).json({
      message: "Couldn't update service request",
      error: error.message,
    });
  }
};
export const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedServiceRequest = await ServiceRequest.findByIdAndDelete(id);

    if (!deletedServiceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.status(200).json({
      message: "Service request deleted successfully",
      data: deletedServiceRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't delete service request",
      error: error.message,
    });
  }
};

export const filterServiceRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate("user", "name email")
      .populate("orderId", "orderNumber");

    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error filtering service requests:", error);
    res.status(500).json({
      message: "Couldn't filter service requests",
      error: error.message,
    });
  }
};

export const filterServiceRequestsByType = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {};
    if (type) {
      filter.type = type;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate("user", "name email")
      .populate("orderId", "orderNumber");
    res.status(200).json(serviceRequests);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't filter service requests by type",
      error: error.message,
    });
  }
};

export const getServiceRequestByPriority = async (req, res) => {
  try {
    const { priority } = req.query;

    const filter = {};
    if (priority) {
      filter.priority = priority;
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .populate("user", "name email")
      .populate("orderId", "orderNumber");

    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests by priority:", error);
    res.status(500).json({
      message: "Couldn't fetch service requests by priority",
      error: error.message,
    });
  }
};

export const getServiceRequestsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const serviceRequests = await ServiceRequest.find({ user: userId })
      .populate("user", "name email")
      .populate("orderId", "orderNumber");

    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests by user:", error);
    res.status(500).json({
      message: "Couldn't fetch service requests by user",
      error: error.message,
    });
  }
};