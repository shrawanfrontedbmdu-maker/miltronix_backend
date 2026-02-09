import Invoice from "../models/invoice.model.js";
import InvoiceCounterModel from "../models/invoiceCounterSchema.js";
import PDFDocument from "pdfkit";
import orderModel from "../models/order.model.js";
import puppeteer from "puppeteer"
import { invoiceHTML } from "../invoicetemlpate/invoiceTemplate.js";
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
    const { id: orderId } = req.params;

    let invoice = await Invoice.findOne({ orderId });

    // 🔹 If invoice not exists, create one from order
    if (!invoice) {
      const order = await orderModel.findById(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

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
          description: p.name,
          quantity: p.quantity,
          unitPrice: p.price,
          total: p.price * p.quantity,
        })),
        subtotal: order.totalAmount,
        tax: order.taxAmount || 0,
        total: order.finalAmount,
        dueDate: order.deliveryDate,
        status: "SENT",
        notes: order.notes || "",
      });
    }

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

    doc.pipe(res);

    const invoiceId = invoice.invoiceNumber || invoice._id.toString().slice(-6);

    // ================= HEADER =================
    doc.font("Helvetica-Bold").fontSize(16);
    doc.text(invoice.customer?.company || "Company Name", 40, 40);

    doc.font("Helvetica").fontSize(10);
    doc.text(invoice.customer?.address || "", 40, 60);
    doc.text(invoice.customer?.city || "", 40, 75);
    doc.text(`Phone: ${invoice.customer?.phone || ""}`, 40, 90);
    doc.text(`Email: ${invoice.customer?.email || ""}`, 40, 105);

    doc.font("Helvetica-Bold").fontSize(24);
    doc.text("INVOICE", 400, 40, { align: "right" });

    doc.font("Helvetica").fontSize(11);
    doc.text(`#${invoiceId}`, 400, 70, { align: "right" });

    // Status Badge
    doc.fillColor("#e0e7ff").roundedRect(400, 90, 120, 22, 5).fill();
    doc.fillColor("#1e40af")
      .fontSize(10)
      .text(invoice.status || "SENT", 400, 96, { align: "center", width: 120 });

    doc.fillColor("black");
    doc.moveTo(40, 125).lineTo(550, 125).stroke("#d1d5db");

    // ================= BILL TO =================
    doc.font("Helvetica-Bold").fontSize(11).text("Bill To:", 40, 145);

    doc.font("Helvetica").fontSize(10);
    doc.text(invoice.customer?.name || "", 40, 162);
    doc.text(invoice.customer?.company || "", 40, 177);
    doc.text(invoice.customer?.address || "", 40, 192);
    doc.text(invoice.customer?.city || "", 40, 207);
    doc.text(`Email: ${invoice.customer?.email || ""}`, 40, 222);
    doc.text(`Phone: ${invoice.customer?.phone || ""}`, 40, 237);

    doc.font("Helvetica-Bold").text("Invoice Date:", 360, 162);
    doc.font("Helvetica").text(new Date().toLocaleDateString(), 450, 162);

    doc.font("Helvetica-Bold").text("Due Date:", 360, 182);
    doc.font("Helvetica").text(
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A",
      450,
      182
    );

    // ================= ITEMS TABLE =================
    let y = 270;

    doc.rect(40, y - 8, 510, 25).fill("#f3f4f6");
    doc.fillColor("black").font("Helvetica-Bold");

    doc.text("Description", 45, y);
    doc.text("Qty", 290, y);
    doc.text("Rate", 350, y);
    doc.text("Amount", 450, y);

    y += 30;
    doc.font("Helvetica");

    invoice.items.forEach((item) => {
      doc.text(item.description, 45, y, { width: 230 });
      doc.text(item.quantity.toString(), 290, y);
      doc.text(`₹${item.unitPrice}`, 350, y);
      doc.text(`₹${item.total}`, 450, y);

      doc.moveTo(40, y + 18).lineTo(550, y + 18).stroke("#e5e7eb");
      y += 35;
    });

    // ================= TOTALS =================
    y += 10;
    const rightX = 340;

    doc.rect(rightX - 15, y - 10, 225, 110).stroke("#e5e7eb");

    const drawRow = (label, value, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica");
      doc.text(label, rightX, y);
      doc.text(`₹${value}`, 450, y);
      y += 22;
    };

    drawRow("Subtotal:", invoice.subtotal);
    drawRow("Tax:", invoice.tax);

    doc.moveTo(rightX, y).lineTo(550, y).stroke("#000");
    y += 8;

    drawRow("Total:", invoice.total, true);

    // ================= PAYMENT =================
    y += 40;
    doc.font("Helvetica").text("Amount Paid:", 40, y);
    doc.text(`₹${invoice.amountPaid || 0}`, 450, y);

    doc.moveTo(40, y + 18).lineTo(550, y + 18).stroke("#d1d5db");

    y += 28;
    doc.font("Helvetica-Bold").text("Balance Due:", 40, y);
    doc.text(`₹${invoice.balance || 0}`, 450, y);

    // ================= FOOTER =================
    y += 50;
    doc.font("Helvetica-Bold").text("Notes:", 40, y);
    doc.font("Helvetica").fontSize(10).text(
      invoice.notes || "Thank you for your business!",
      40,
      y + 15,
      { width: 230 }
    );

    doc.font("Helvetica-Bold").text("Terms & Conditions:", 320, y);
    doc.font("Helvetica").fontSize(10).text(
      "Please pay within the due date.",
      320,
      y + 15,
      { width: 230 }
    );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Invoice PDF generation failed" });
  }
};

// export const generateInvoicePDF = async (req, res) => {
//   try {
//     const { id: orderId } = req.params;

//     let invoice = await Invoice.findOne({ orderId });

//     if (!invoice) {
//       const order = await orderModel.findById(orderId);
//       if (!order) return res.status(404).json({ message: "Order not found" });

//       const year = new Date().getFullYear();

//       const counter = await InvoiceCounter.findOneAndUpdate(
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
//           company: order.shippingAddress?.company,
//         },
//         items: order.products.map((p) => ({
//           description: p.name,
//           quantity: p.quantity,
//           unitPrice: p.price,
//           total: p.price * p.quantity,
//         })),
//         subtotal: order.totalAmount,
//         tax: order.taxAmount || 0,
//         total: order.finalAmount,
//         dueDate: order.deliveryDate,
//         status: "SENT",
//         notes: order.notes || "",
//       });
//     }

//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();

//     await page.setContent(invoiceHTML(invoice), {
//       waitUntil: "networkidle0",
//     });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
//     });

//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
//       "Content-Length": pdfBuffer.length,
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Invoice PDF Error:", error);
//     res.status(500).json({ message: "Failed to generate invoice PDF" });
//   }
// };
