export function receiptHtml(receipt) {
  return `
    <div class="receipt">
      <h3>${receipt.restaurant.name}</h3>
      <p>${receipt.restaurant.address}</p>
      <hr />
      <p>Order ID: ${receipt.order_id}</p>
      <p>Table: ${receipt.table_id}</p>
      <p>Date: ${receipt.date_time}</p>
      <p>Payment: ${receipt.payment_mode}</p>
      <h4>Items</h4>
      <div>
        ${receipt.items
          .map((item) => `<div>${item.quantity} × ${item.name} - ${item.line_total.toFixed(2)}</div>`)
          .join('')}
      </div>
      <hr />
      <p>Subtotal: ${receipt.subtotal.toFixed(2)}</p>
      <p>Tax: ${receipt.tax_amount.toFixed(2)}</p>
      <p>Service: ${receipt.service_charge.toFixed(2)}</p>
      <h4>Total: ${receipt.total.toFixed(2)}</h4>
      <p>${receipt.footer}</p>
    </div>
  `;
}
