import { renderBarChart } from './components/chart.js';
import { statusChip } from './components/card.js';

export function renderTablesSection(state) {
  const turns = tableTurnover(state.orders);
  const selected = state.tables.find((table) => table.table_id === state.selectedTableId) || state.tables[0];
  
  // Group tables by section (A, B, C)
  const sections = {};
  state.tables.forEach(table => {
    const section = table.location ? table.location.charAt(0) : 'A';
    if (!sections[section]) sections[section] = [];
    sections[section].push(table);
  });

  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Table Management</h2>
          <div class="section-kicker">View floor plan, manage table status and process reservations.</div>
        </div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Floor Plan</h3>
              <div class="section-kicker">Click a table to view details, change status or process bills.</div>
            </div>
          </div>
          <div class="floor-plan">
            ${Object.keys(sections).sort().map(section => `
              <div class="floor-section">
                <div class="section-label">Section ${section}</div>
                <div class="table-row">
                  ${sections[section].map(table => `
                    <div class="table-cell ${table.status}" data-action="select-table" data-table-id="${table.table_id}">
                      <div class="table-header">
                        <strong>Table ${table.table_id}</strong>
                        <span class="capacity-badge">${table.capacity} seats</span>
                      </div>
                      <div class="status-indicator ${table.status}">
                        ${table.status === 'available' ? 'Available' : table.status === 'occupied' ? 'Occupied' : 'Reserved'}
                      </div>
                      ${table.current_order ? `<div class="order-note">Order #${table.current_order}</div>` : '<div class="order-note muted">No active order</div>'}
                      ${table.running_bill_total > 0 ? `<div class="bill-preview">₹${Number(table.running_bill_total).toFixed(0)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Table Turnover</h3>
              <div class="section-kicker">Orders per table today.</div>
            </div>
          </div>
          ${renderBarChart(turns, { height: 200 })}
        </div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Summary</h3>
              <div class="section-kicker">Quick overview of table status.</div>
            </div>
          </div>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Available</span>
              <span class="summary-value">${state.tables.filter(t => t.status === 'available').length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Occupied</span>
              <span class="summary-value">${state.tables.filter(t => t.status === 'occupied').length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Reserved</span>
              <span class="summary-value">${state.tables.filter(t => t.status === 'reserved').length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Revenue</span>
              <span class="summary-value">₹${state.tables.reduce((sum, t) => sum + (t.running_bill_total || 0), 0).toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Actions</h3>
              <div class="section-kicker">Manage reservations and table operations.</div>
            </div>
          </div>
          <div class="toolbar">
            <button class="button secondary" data-action="open-reservation">Reserve a Table</button>
            <button class="button ghost" data-action="merge-tables">Merge Tables</button>
          </div>
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
          <div class="section-kicker">${table.location || 'Floor'} · Capacity ${table.capacity} guests</div>
        </div>
        ${statusChip(table.status, tableTone(table.status))}
      </div>
      
      <div class="panel-card">
        <div class="card-title">Current Status</div>
        <div class="detail-list">
          <div class="detail-row">
            <span class="muted">Table Status</span>
            <strong class="status-${table.status}">${table.status.charAt(0).toUpperCase() + table.status.slice(1)}</strong>
          </div>
          <div class="detail-row">
            <span class="muted">Active Order</span>
            <strong>${table.current_order ? `#${table.current_order}` : 'None'}</strong>
          </div>
          <div class="detail-row">
            <span class="muted">Guests</span>
            <strong>${table.guests_count || '—'}</strong>
          </div>
          <div class="detail-row">
            <span class="muted">Running Total</span>
            <strong>₹${Number(table.running_bill_total || 0).toFixed(2)}</strong>
          </div>
          <div class="detail-row">
            <span class="muted">Time Occupied</span>
            <strong>${table.time_occupied_minutes !== null && table.time_occupied_minutes !== undefined ? table.time_occupied_minutes + ' min' : '—'}</strong>
          </div>
        </div>
      </div>

      ${table.item_summary ? `
        <div class="panel-card">
          <div class="card-title">Order Items</div>
          <div class="card-note">${table.item_summary}</div>
        </div>
      ` : ''}

      <div class="toolbar">
        <button class="button secondary" data-action="mark-table-available" data-table-id="${table.table_id}">Mark Available</button>
        <button class="button secondary" data-action="mark-table-occupied" data-table-id="${table.table_id}">Mark Occupied</button>
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
