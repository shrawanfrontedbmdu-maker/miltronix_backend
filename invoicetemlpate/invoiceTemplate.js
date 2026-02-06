export const invoiceHTML = (invoice) => {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        color: #111;
      }
      .invoice-card { width: 100%; }

      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .company-name { margin: 0; font-size: 20px; }
      .invoice-title { margin: 0; font-size: 28px; text-align: right; }

      .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 6px;
        background: #e0e7ff;
        color: #1e40af;
        font-size: 12px;
        margin-top: 5px;
      }

      .invoice-info-grid {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
      }

      h3 { margin-bottom: 5px; }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 25px;
      }

      th {
        background: #f3f4f6;
        text-align: left;
        padding: 8px;
        font-size: 13px;
      }

      td {
        padding: 8px;
        border-bottom: 1px solid #eee;
        font-size: 13px;
      }

      .invoice-totals {
        width: 320px;
        margin-left: auto;
        margin-top: 25px;
        border: 1px solid #eee;
        padding: 15px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .grand-total {
        font-weight: bold;
        border-top: 1px solid #000;
        padding-top: 6px;
      }

      .payment-summary {
        margin-top: 25px;
        font-size: 14px;
      }

      .invoice-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        font-size: 12px;
      }
    </style>
  </head>
  <body>

    <div class="invoice-card">

      <!-- Header -->
      <div class="invoice-header">
        <div>
          <h2 class="company-name">${invoice.customer?.company || "Company Name"}</h2>
          <p>${invoice.customer?.address || ""}</p>
          <p>${invoice.customer?.city || ""}</p>
          <p>Phone: ${invoice.customer?.phone || ""}</p>
          <p>Email: ${invoice.customer?.email || ""}</p>
        </div>

        <div style="text-align:right;">
          <h1 class="invoice-title">INVOICE</h1>
          <div>#${invoice.invoiceNumber}</div>
          <div class="status-badge">${invoice.status || "SENT"}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="invoice-info-grid">
        <div>
          <h3>Bill To:</h3>
          <p>${invoice.customer?.name || ""}</p>
          <p>${invoice.customer?.address || ""}</p>
          <p>${invoice.customer?.city || ""}</p>
          <p>Email: ${invoice.customer?.email || ""}</p>
          <p>Phone: ${invoice.customer?.phone || ""}</p>
        </div>

        <div>
          <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"
        }</p>
        </div>
      </div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || [])
            .map(
                (item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unitPrice}</td>
              <td>₹${item.total}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="invoice-totals">
        <div class="total-row"><span>Subtotal</span><span>₹${invoice.subtotal}</span></div>
        <div class="total-row"><span>Tax</span><span>₹${invoice.tax}</span></div>
        <div class="total-row grand-total"><span>Total</span><span>₹${invoice.total}</span></div>
      </div>

      <!-- Payment -->
      <div class="payment-summary">
        <p><strong>Amount Paid:</strong> ₹${invoice.amountPaid || 0}</p>
        <p><strong>Balance Due:</strong> ₹${invoice.balance || 0}</p>
      </div>

      <!-- Footer -->
      <div class="invoice-footer">
        <div>
          <strong>Notes:</strong>
          <p>${invoice.notes || "Thank you for your business!"}</p>
        </div>
        <div>
          <strong>Terms & Conditions:</strong>
          <p>Please pay within the due date.</p>
        </div>
      </div>

    </div>

  </body>
  </html>
  `;
};
