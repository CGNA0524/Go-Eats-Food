import { renderBarChart } from './components/chart.js';
import { statusChip } from './components/card.js';

export function renderTablesSection(state) {
  const turns = tableTurnover(state.orders);
  const selected = state.tables.find((table) => table.table_id === state.selectedTableId) || state.tables[0];
  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Table Management</h2>
          <div class="section-kicker">Five-by-three floor plan with occupancy, reservation and billing context.</div>
        </div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Floor Plan</h3>
              <div class="section-kicker">Tap a table to inspect the current order and bill.</div>
            </div>
          </div>
          <div class="table-grid">
            ${state.tables
              .map(
                (table) => `
                  <div class="table-cell ${table.status}" data-action="select-table" data-table-id="${table.table_id}">
                    <div class="row-top">
                      <strong>Table ${table.table_id}</strong>
                      ${statusChip(table.status, tableTone(table.status))}
                    </div>
                    <div class="card-subtitle">Seats ${table.capacity} · ${table.location || 'Floor'}</div>
                    <div class="card-note">${table.item_summary || 'No active order'}</div>
                  </div>
                `,
              )
              .join('')}
          </div>
        </div>

        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Turnover</h3>
              <div class="section-kicker">Per-table turns today, derived from current orders.</div>
            </div>
          </div>
          ${renderBarChart(turns, { height: 180 })}
        </div>
      </div>

      <div class="panel-card">
        <div class="section-header">
          <div>
            <h3 class="section-title">Table Actions</h3>
            <div class="section-kicker">Reserve, merge or mark availability in one place.</div>
          </div>
        </div>
        <div class="toolbar">
          <button class="button secondary" data-action="open-reservation">Reserve a table</button>
          <button class="button ghost" data-action="merge-tables">Merge tables</button>
        </div>
      </div>
    </div>
  `;
}

export function renderTableDetail(table) {
  if (!table) {
    return `<div class="muted">Select a table to inspect its active order, guests and bill.</div>`;
  }

  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h3 class="section-title">Table ${table.table_id}</h3>
          <div class="section-kicker">${table.location || 'Floor'} · Seats ${table.capacity}</div>
        </div>
        ${statusChip(table.status, tableTone(table.status))}
      </div>
      <div class="detail-list">
        <div class="detail-row"><span class="muted">Current order</span><strong>${table.current_order || 'None'}</strong></div>
        <div class="detail-row"><span class="muted">Guests</span><strong>${table.guests_count || '—'}</strong></div>
        <div class="detail-row"><span class="muted">Running total</span><strong>₹${Number(table.running_bill_total || 0).toFixed(2)}</strong></div>
        <div class="detail-row"><span class="muted">Time occupied</span><strong>${table.time_occupied_minutes ?? '—'} min</strong></div>
      </div>
      <div class="panel-card" style="padding:12px;">
        <div class="card-title">Order Summary</div>
        <div class="card-note">${table.item_summary || 'No active items on this table.'}</div>
      </div>
    </div>
  `;
}

function tableTone(status) {
  const map = {
    available: 'green',
    occupied: 'orange',
    reserved: 'blue',
  };
  return map[status] || 'gray';
}

function tableTurnover(orders) {
  const counts = new Map();
  orders.forEach((order) => {
    counts.set(order.table_id, (counts.get(order.table_id) || 0) + 1);
  });
  const tables = Array.from({ length: 15 }, (_, index) => index + 1);
  return tables.map((tableId) => ({ label: `T${tableId}`, value: counts.get(tableId) || 0 }));
}
