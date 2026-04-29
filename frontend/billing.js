import { statusChip } from './components/card.js';
import { receiptHtml } from './components/receipt.js';

export function renderBillingSection(state) {
  const selectedOrder = state.orders.find((order) => String(order.order_id) === String(state.billingOrderId)) || state.orders.find((order) => order.status !== 'billed') || state.orders[0];
  const summary = state.reports.daily?.summary || { revenue: 0, bill_count: 0, avg_order_value: 0 };

  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Automated Billing</h2>
          <div class="section-kicker">Load an order, review the bill, then finalize payment and release the table.</div>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">Today revenue</div><div class="metric-value">₹${Number(summary.revenue || 0).toFixed(2)}</div></div>
        <div class="metric-card"><div class="metric-label">Bill count</div><div class="metric-value">${summary.bill_count || 0}</div></div>
        <div class="metric-card"><div class="metric-label">Average bill</div><div class="metric-value">₹${Number(summary.avg_order_value || 0).toFixed(2)}</div></div>
        <div class="metric-card"><div class="metric-label">Recent bills</div><div class="metric-value">${state.recentBills.length}</div></div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Bill Builder</h3>
              <div class="section-kicker">Select an order to preview taxes, totals and payment modes.</div>
            </div>
          </div>

          <div class="toolbar">
            <select class="select" data-field="billing-order-id">
              <option value="">Select order</option>
              ${state.orders
                .map((order) => `<option value="${order.order_id}" ${selectedOrder && selectedOrder.order_id === order.order_id ? 'selected' : ''}>Order #${order.order_id} · Table ${order.table_id}</option>`)
                .join('')}
            </select>
            <select class="select" data-field="payment-mode">
              ${['Cash', 'UPI', 'Card', 'Split']
                .map((mode) => `<option value="${mode}" ${state.paymentMode === mode ? 'selected' : ''}>${mode}</option>`)
                .join('')}
            </select>
          </div>

          <div class="bill-grid">
            <div class="panel-card" style="padding:12px;">
              <div class="card-title">Selected Order</div>
              <div class="card-note">${selectedOrder ? `Order #${selectedOrder.order_id} · Table ${selectedOrder.table_id} · ${selectedOrder.item_summary}` : 'Choose an order to calculate the bill.'}</div>
            </div>

            <div class="panel-card" style="padding:12px;">
              <div class="detail-row"><span class="muted">Subtotal</span><strong>${state.billPreview ? `₹${state.billPreview.subtotal.toFixed(2)}` : '—'}</strong></div>
              <div class="detail-row"><span class="muted">GST 5%</span><strong>${state.billPreview ? `₹${state.billPreview.tax_amount.toFixed(2)}` : '—'}</strong></div>
              <div class="detail-row"><span class="muted">Service 2%</span><strong>${state.billPreview ? `₹${state.billPreview.service_charge.toFixed(2)}` : '—'}</strong></div>
              <div class="detail-row"><span class="muted">Grand total</span><strong>${state.billPreview ? `₹${state.billPreview.total.toFixed(2)}` : '—'}</strong></div>
            </div>

            <div class="payment-buttons">
              <button class="button success" data-action="finalize-bill">Generate Receipt</button>
              <button class="button secondary" data-action="preview-bill">Preview Bill</button>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Receipt Preview</h3>
              <div class="section-kicker">Printable HTML receipt generated directly from the API response.</div>
            </div>
            ${state.billReceipt ? statusChip('Ready', 'green') : statusChip('Waiting', 'gray')}
          </div>
          <div class="receipt-slot">
            ${state.billReceipt ? receiptHtml(state.billReceipt) : '<div class="muted">Receipt will appear here after bill generation.</div>'}
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="section-header">
          <div>
            <h3 class="section-title">Recent Bills</h3>
            <div class="section-kicker">Quick drill-down into the latest completed payments.</div>
          </div>
        </div>
        <div class="recent-bills">
          ${state.recentBills.map(renderRecentBill).join('') || '<div class="muted">No bills recorded yet.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderRecentBill(bill) {
  return `
    <div class="recent-bill">
      <div class="row-top">
        <div>
          <div class="card-title">Bill #${bill.bill_id} · Order #${bill.order_id}</div>
          <div class="card-subtitle">Table ${bill.table_id} · ${bill.payment_mode} · ${bill.billed_at ? new Date(bill.billed_at).toLocaleString() : ''}</div>
        </div>
        <span class="status-chip green">₹${Number(bill.total || 0).toFixed(2)}</span>
      </div>
      <button class="button ghost" data-action="load-bill-by-id" data-bill-id="${bill.bill_id}">Open receipt</button>
    </div>
  `;
}
