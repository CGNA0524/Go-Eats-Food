import { statusChip } from './components/card.js';

export function renderOrdersSection(state) {
  const filters = ['all', 'pending', 'cooking', 'ready', 'served', 'billed'];
  const orders = state.orders.filter((order) => !state.orderFilter || state.orderFilter === 'all' || order.status === state.orderFilter);
  const activeOrders = orders.filter((order) => ['pending', 'cooking', 'ready'].includes(order.status));
  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Order Management</h2>
          <div class="section-kicker">Create, update and close orders with live kitchen tracking.</div>
        </div>
        <button class="button" data-action="new-order">Add New Order</button>
      </div>

      <div class="toolbar">
        ${filters
          .map(
            (filter) => `
              <button class="button ${state.orderFilter === filter || (!state.orderFilter && filter === 'all') ? 'secondary' : 'ghost'}" data-action="filter-orders" data-filter="${filter}">
                ${filter === 'all' ? 'All statuses' : filter}
              </button>
            `,
          )
          .join('')}
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Live Order Board</h3>
              <div class="section-kicker">Card grid with elapsed time and quick status updates.</div>
            </div>
          </div>
          <div class="order-grid">
            ${orders
              .map(
                (order) => `
                  <article class="order-card">
                    <div class="card-top">
                      <div>
                        <div class="card-title">Order #${order.order_id}</div>
                        <div class="card-subtitle">Table ${order.table_id} · Staff ${order.staff_id}</div>
                      </div>
                      ${statusChip(order.status, statusTone(order.status))}
                    </div>
                    <div class="order-items">${order.item_summary || 'No items yet'}</div>
                    <div class="detail-row"><span class="muted">Elapsed</span><span>${order.elapsed_minutes} min</span></div>
                    <div class="detail-row"><span class="muted">Amount</span><span>₹${Number(order.total || 0).toFixed(2)}</span></div>
                    <div class="toolbar">
                      <button class="button secondary" data-action="advance-order" data-order-id="${order.order_id}">Advance status</button>
                      <button class="button ghost" data-action="load-bill" data-order-id="${order.order_id}">View bill</button>
                    </div>
                  </article>
                `,
              )
              .join('') || '<div class="muted">No orders found for this filter.</div>'}
          </div>
        </div>

        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Kitchen Display</h3>
              <div class="section-kicker">Active tickets only: pending, cooking and ready.</div>
            </div>
          </div>
          <div class="simple-list">
            ${activeOrders
              .map(
                (order) => `
                  <div class="order-card">
                    <div class="detail-row"><strong>#${order.order_id}</strong>${statusChip(order.status, statusTone(order.status))}</div>
                    <div class="card-subtitle">Table ${order.table_id} · ${order.item_summary || 'No summary'}</div>
                    <div class="detail-row"><span>${order.elapsed_minutes} min</span><span>₹${Number(order.total || 0).toFixed(2)}</span></div>
                  </div>
                `,
              )
              .join('') || '<div class="muted">Kitchen queue is empty.</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function statusTone(status) {
  const map = {
    pending: 'blue',
    cooking: 'orange',
    ready: 'purple',
    served: 'green',
    billed: 'gray',
  };
  return map[status] || 'gray';
}
