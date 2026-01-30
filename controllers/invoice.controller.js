import Invoice from "../models/invoice.model.js";
import InvoiceCounterModel from "../models/invoiceCounterSchema.js";
// import PDFDocument from "pdfkit";
import orderModel from "../models/order.model.js";
import fs from "fs"

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    if (!invoices) {
      return res.status(400).json({
        success: false,
        message: "No Invoice are Found"
      })
    } else {
      return res.status(200).status(200).json(invoices);
    }
  } catch (error) {
    res.status(500).json({
      message: "Couldn't get invoices",
    });
  }
};
export const getInvoiceThisMonth = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lt: endDate },
    }).sort({ invoiceDate: "asc" });

    res.status(200).json({
      message: `Invoices for ${startDate.toLocaleString("default", {
        month: "long",
      })} ${startDate.getFullYear()}`,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching invoice for this month.",
      error: error.message,
    });
  }
};

export const getInvoicesLastMonth = async (req, res) => {
  try {
    const now = new Date();
    const year =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lt: endDate },
    }).sort({ invoiceDate: "asc" });

    res.status(200).json({
      message: `Invoices for ${startDate.toLocaleString("default", {
        month: "long",
      })} ${year}`,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching invoices for last month.",
      error: error.message,
    });
  }
};

// export const getInvoicesThisYear = async (req, res) => {
//   try {
//     const now = new Date();
//     const startDate = new Date(now.getFullYear(), 0, 1);
//     const endDate = new Date(now.getFullYear() + 1, 0, 1);

//     const invoices = await Invoice.find({
//       invoiceDate: { $gte: startDate, $lt: endDate },
//     }).sort({ invoiceDate: "asc" });

//     res.status(200).json({
//       message: `Invoices for the year ${now.getFullYear()}`,
//       count: invoices.length,
//       data: invoices,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error while fetching invoices for this year.",
//       error: error.message,
//     });
//   }
// };

export const getInvoicesThisYear = async (req, res) => {
  try {
    const now = new Date();

    // Start of current year
    const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    // End of current year (Dec 31 23:59:59.999)
    const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Fetch invoices in this year
    const invoices = await Invoice.find({
      createdAt: { $gte: startDate, $lte: endDate }, // Ensure field matches your schema
    }).sort({ createdAt: 1 }); // ascending order

    res.status(200).json({
      success: true,
      message: `Invoices for the year ${now.getFullYear()}`,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching invoices for this year.",
      error: error.message,
    });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customer,
      items,
      tax,
      dueDate,
      notes,
      termsAndConditions,
    } = req.body;

    if (!invoiceNumber || !customer || !items || items.length === 0) {
      return res.status(400).json({
        message:
          "Invoice number, customer details and at least one item are required.",
      });
    }
    const newInvoice = await Invoice.create({
      invoiceNumber,
      customer,
      items,
      tax: tax || 0,
      dueDate,
      notes,
      termsAndConditions,
    });
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't create invoice",
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't get invoice",
    });
  }
};

// export const updateInvoiceById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { items, tax, dueDate, notes, termsAndConditions } = req.body;

//     const invoice = await Invoice.findByIdAndUpdate(
//       id,
//       {
//         items,
//         tax: tax || 0,
//         dueDate,
//         notes,
//         termsAndConditions,
//       },
//       { new: true }
//     );
//     if (!invoice) {
//       return res.status(404).json({ message: "Invoice not found" });
//     }
//     res.status(200).json(invoice);
//   } catch (error) {
//     res.status(500).json({
//       message: "error updating invoice",
//     });
//   }
// };

export const updateInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {};

    if (req.body.items) updateData.items = req.body.items;
    if (req.body.tax !== undefined) updateData.tax = req.body.tax;
    if (req.body.dueDate) updateData.dueDate = req.body.dueDate;
    if (req.body.notes) updateData.notes = req.body.notes;
    if (req.body.termsAndConditions)
      updateData.termsAndConditions = req.body.termsAndConditions;

    // ✅ STATUS (normalized)
    if (req.body.status !== undefined) {
      updateData.status = req.body.status.toLowerCase();
    }

    console.log("UPDATE DATA 👉", updateData);

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("UPDATE ERROR 👉", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const deleteInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't delete invoice",
    });
  }
};

export const getInvoicesByMonth = async (req, res) => {
  try {
    const now = new Date();

    // Start of month
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // End of month
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const invoices = await Invoice.find({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).lean(); // optional but recommended

    if (invoices.length > 0) {
      return res.status(200).json({
        success: true,
        data: invoices,
        message: "This Month Data Found Successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No invoices found for this month",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Couldn't get invoices",
      error: error.message,
    });
  }
};


export const generateInvoicePDF = async (req, res) => {
  try {
    const { id:orderId } = req.params;
    console.log(req.params);
    let invoice = await Invoice.findOne({ orderId });

    if (!invoice) {
      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (!order.products || order.products.length === 0) {
        return res.status(400).json({ message: "Order has no products, cannot generate invoice" });
      }

      // Generate invoice number
      const year = new Date().getFullYear();
      const counter = await InvoiceCounterModel.findOneAndUpdate(
        { year },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const invoiceNumber = `INV-${year}-${String(counter.seq).padStart(3, "0")}`;

      invoice = await Invoice.create({
        orderId,
        invoiceNumber,
        customer: {
          name: order.customerName || "Unknown",
          email: order.shippingAddress?.email || "-",
          phone: order.shippingAddress?.phone || "-",
          address: order.shippingAddress?.address || "-",
          city: order.shippingAddress?.city || "-",
          company: order.shippingAddress?.company || "-",
        },
        items: order.products.map((p) => ({
          description: p.name || "Unknown Product",
          quantity: p.quantity || 1,
          unitPrice: p.price || 0,
          total: (p.price || 0) * (p.quantity || 1),
        })),
        subtotal: order.totalAmount || 0,
        tax: order.taxRate || 0,
        total: (order.totalAmount || 0) + (order.taxRate || 0),
        dueDate: order.deliveryDate,
        status: "sent",
        notes: order.notes || "",
        termsAndConditions: "",
      });
    }
  const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=invoice.pdf"
    );

    doc.pipe(res);

    /* ================= HEADER ================= */

    const invoiceId = invoice.invoiceNumber
      ? invoice.invoiceNumber
      : invoice._id
        ? invoice._id.toString().slice(0, 8)
        : "N/A";

    doc.font("Helvetica-Bold").fontSize(18);
    doc.text(invoice.customer?.company || "Company Name", 40, 40);

    doc.font("Helvetica").fontSize(10);
    doc.text(invoice.customer?.address || "Address not provided", 40, 65);
    doc.text(invoice.customer?.city || "", 40, 80);
    doc.text(`Phone: ${invoice.customer?.phone || ""}`, 40, 95);
    doc.text(`Email: ${invoice.customer?.email || ""}`, 40, 110);

    doc.font("Helvetica-Bold").fontSize(22);
    doc.text("INVOICE", 400, 40, { align: "right" });

    doc.font("Helvetica").fontSize(10);
    doc.text(`#${invoiceId}`, 400, 70, { align: "right" });
    doc.text("SENT", 400, 88, { align: "right" });

    doc.moveTo(40, 130).lineTo(550, 130).stroke("#e5e7eb");

    /* ================= BILL TO ================= */

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Bill To:", 40, 150);

    doc.font("Helvetica").fontSize(10);
    doc.text(invoice.customer?.name || "", 40, 168);
    doc.text(invoice.customer?.company || "", 40, 183);
    doc.text(invoice.customer?.address || "", 40, 198);
    doc.text(invoice.customer?.city || "", 40, 213);
    doc.text(`Email: ${invoice.customer?.email || ""}`, 40, 228);
    doc.text(`Phone: ${invoice.customer?.phone || ""}`, 40, 243);

    doc.text(`Invoice Date: ${invoice.invoiceDate || "N/A"}`, 360, 168);
    doc.text(`Due Date: ${invoice.dueDate || "N/A"}`, 360, 188);

    /* ================= TABLE HEADER ================= */

    let y = 290;

    doc.rect(40, y - 8, 510, 25).fill("#f3f4f6");
    doc.fillColor("#000").font("Helvetica-Bold");

    doc.text("Description", 45, y);
    doc.text("Qty", 285, y);
    doc.text("Rate", 345, y);
    doc.text("Amount", 430, y);

    y += 30;
    doc.font("Helvetica");

    /* ================= TABLE ROWS ================= */

    invoice.items?.forEach(item => {
      doc.text(item.description || "", 45, y);
      doc.text(item.quantity || "", 285, y);
      doc.text(`₹${item.unitPrice || 0}`, 345, y);
      doc.text(`₹${item.total || 0}`, 430, y);

      doc.moveTo(40, y + 18).lineTo(550, y + 18).stroke("#e5e7eb");
      y += 35;
    });

    /* ================= TOTALS ================= */

    const rightX = 350;

    const drawRow = (label, value) => {
      doc.text(label, rightX, y);
      doc.text(`₹${value}`, 430, y);
      doc.moveTo(rightX, y + 15).lineTo(550, y + 15).stroke("#e5e7eb");
      y += 22;
    };

    doc.fontSize(10);
    drawRow("Subtotal:", invoice.subtotal || 0);
    drawRow("Discount:", invoice.discount || 0);
    drawRow("Tax (12%):", invoice.tax || 0);

    doc.moveTo(rightX, y).lineTo(550, y).stroke("#000");
    y += 10;

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Total:", rightX, y);
    doc.text(`₹${invoice.total || 0}`, 430, y);
    doc.moveTo(rightX, y + 18).lineTo(550, y + 18).stroke("#000");

    /* ================= PAYMENT ================= */

    y += 40;
    doc.font("Helvetica").fontSize(10);
    doc.text("Amount Paid:", 40, y);
    doc.text(`₹${invoice.amountPaid || 0}`, 430, y);

    doc.moveTo(40, y + 18).lineTo(550, y + 18).stroke("#000");

    y += 30;
    doc.font("Helvetica-Bold");
    doc.text("Balance Due:", 40, y);

    const balance =
      invoice.balance === undefined || invoice.balance === null
        ? "0.00"
        : invoice.balance;

    doc.text(`₹${balance}`, 430, y);

    /* ================= FOOTER ================= */

    y += 40;
    doc.font("Helvetica-Bold").text("Notes:", 40, y);
    doc.font("Helvetica").text(
      "Thank you for your business! Payment is due within 30 days.",
      40,
      y + 15
    );

    doc.font("Helvetica-Bold").text("Terms & Conditions:", 300, y);
    doc.font("Helvetica").text(
      "Please pay within the due date to avoid inconvenience.",
      300,
      y + 15
    );

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Invoice PDF generation failed", error: error.message });
  }
};

// export const generateInvoicePDF = async (req, res) => {
//   try {
//     const { id: orderId } = req.params;

//     // 1. Database se data lana
//     let invoice = await Invoice.findOne({ orderId });

//     if (!invoice) {
//       const order = await orderModel.findById(orderId);
//       if (!order) return res.status(404).json({ message: "Order not found" });

//       // Counter logic... (ensure InvoiceCounterModel is correct)
//       const year = new Date().getFullYear();
//       const counter = await InvoiceCounterModel.findOneAndUpdate(
//         { year },
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//       );

//       const invoiceNumber = `INV-${year}-${String(counter.seq).padStart(3, "0")}`;

//       invoice = await Invoice.create({
//         orderId,
//         invoiceNumber,
//         customer: {
//           name: order.customerName,
//           email: order.shippingAddress?.email,
//           phone: order.shippingAddress?.phone,
//           address: order.shippingAddress?.address,
//           city: order.shippingAddress?.city,
//         },
//         items: (order.products || []).map(p => ({
//           description: p.name,
//           quantity: p.quantity,
//           unitPrice: p.price,
//           total: (p.price || 0) * (p.quantity || 0),
//         })),
//         subtotal: order.totalAmount,
//         tax: order.taxRate || 0,
//         total: (order.totalAmount || 0) + (order.taxRate || 0),
//         status: "FINAL",
//       });
//     }

//     // 2. PDF Generation - Yahan crash hone ke chances zyada hote hain
//     const doc = new PDFDocument({ size: "A4", margin: 50 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceNumber}.pdf`);

//     doc.pipe(res);

//     // Styling basics
//     doc.fontSize(20).text('INVOICE', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Invoice No: ${invoice.invoiceNumber}`);
//     doc.text(`Customer: ${invoice.customer.name}`);
    
//     // PDF finish karna zaroori hai
//     doc.end();

//   } catch (error) {
//     console.error("CRASH ERROR:", error); // Check your VS Code terminal
//     if (!res.headersSent) {
//         res.status(500).json({ message: "Internal Server Error", error: error.message });
//     }
//   }
// };
