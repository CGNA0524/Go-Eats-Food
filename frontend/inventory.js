import { lowStockAlert } from './components/alert.js';

export function renderInventorySection(state) {
  const categories = Array.from(new Set(state.inventory.map((item) => item.category))).sort();
  const items = state.inventory.filter((item) => {
    const matchesCategory = !state.inventoryCategory || state.inventoryCategory === 'all' || item.category === state.inventoryCategory;
    const matchesSearch = !state.inventorySearch || item.name.toLowerCase().includes(state.inventorySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const lowStock = items.filter((item) => item.alert);

  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Inventory Management</h2>
          <div class="section-kicker">Track low stock, restock items and export operational snapshots.</div>
        </div>
        <button class="button secondary" data-action="export-inventory">Export CSV</button>
      </div>

      <div class="toolbar">
        <input class="input" data-field="inventory-search" placeholder="Search inventory items" value="${state.inventorySearch || ''}" />
        <select class="select" data-field="inventory-category">
          <option value="all">All categories</option>
          ${categories
            .map((category) => `<option value="${category}" ${state.inventoryCategory === category ? 'selected' : ''}>${category}</option>`)
            .join('')}
        </select>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Stock List</h3>
              <div class="section-kicker">Green, amber and red bars reflect the current level.</div>
            </div>
          </div>
          <div class="inventory-grid">
            ${items
              .map(
                (item) => `
                  <div class="inventory-row ${item.alert ? 'low-stock' : ''}">
                    <div class="row-top">
                      <div>
                        <div class="card-title">${item.name}</div>
                        <div class="card-subtitle">${item.category} · Restocked ${item.last_restocked ? formatDate(item.last_restocked) : 'recently'}</div>
                      </div>
                      <span class="status-chip ${toneClass(item.stock_status)}">${item.stock_status}</span>
                    </div>
                    <div class="detail-row"><span class="muted">Quantity</span><strong>${item.quantity}${item.unit}</strong></div>
                    <div class="stock-bar"><div class="stock-fill ${stockTone(item.stock_status)}" style="width:${stockPercent(item)}%"></div></div>
                    <div class="toolbar">
                      <button class="button secondary" data-action="restock-item" data-inventory-id="${item.inventory_id}">Restock</button>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        </div>

        <div class="panel-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Low Stock Alerts</h3>
              <div class="section-kicker">Red alert cards appear automatically under the minimum threshold.</div>
            </div>
          </div>
          <div class="simple-list">
            ${lowStock.map((item) => lowStockAlert(item)).join('') || '<div class="muted">No low stock alerts.</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function stockPercent(item) {
  const baseline = Math.max(Number(item.min_threshold) * 5, 1);
  return Math.min((Number(item.quantity) / baseline) * 100, 100);
}

function stockTone(status) {
  const map = { 'In Stock': '', Medium: 'medium', Low: 'low' };
  return map[status] || '';
}

function toneClass(status) {
  const map = { 'In Stock': 'green', Medium: 'orange', Low: 'red' };
  return map[status] || 'gray';
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}
