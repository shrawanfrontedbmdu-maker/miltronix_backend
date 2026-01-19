import Invoice from "../models/invoice.model.js";

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    if (!invoices) {
      return res.status(400).json({success:false,
        message:"No Invoice are Found"
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

export const getInvoicesThisYear = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear() + 1, 0, 1);

    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lt: endDate },
    }).sort({ invoiceDate: "asc" });

    res.status(200).json({
      message: `Invoices for the year ${now.getFullYear()}`,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
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

export const updateInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, tax, dueDate, notes, termsAndConditions } = req.body;

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      {
        items,
        tax: tax || 0,
        dueDate,
        notes,
        termsAndConditions,
      },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "error updating invoice",
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
    const { thisMonth } = req.query;
    if (!thisMonth) {
      return res.status(400).json({
        success: false,
        message: "thisMonth Query is Required"
      });
    }
    // For current date
    const now = new Date()

    //Start of Month
    const startofMonth = new Date(
      now.getFullYear(),
      now.getMonth(), 1
    )

    // End of Month
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const invoices = invoiceModel.find({
      createdAt: {
        $gte: startofMonth,
        $lte: endOfMonth,
      },
    }
    )
    if (invoices) {
      return res.status(200).json({
        success: true,
        data: invoices,
        message: "This Month Data Found Successful"
      })
    } else {
      return res.status(400).json({
        success: false,
        message: "No Any Invoices are Present"
      })
    }

  } catch (error) {
    res.status(500).json({
      message: "Couldn't get invoice",
    });
  };
};
