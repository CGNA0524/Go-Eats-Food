import { getJson, postJson, putJson } from './components/api.js';
import { closeActiveModal, openModal } from './components/modal.js';
import { metricCard } from './components/card.js';
import { renderOrdersSection } from './orders.js';
import { renderBillingSection } from './billing.js';
import { renderInventorySection } from './inventory.js';
import { renderReportsSection } from './reports.js';
import { renderTablesSection, renderTableDetail } from './tables.js';
import { renderAdminSection } from './admin.js';
import { renderProfileSection, setupProfileHandlers } from './profile.js';

// Check authentication on page load
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

const state = {
  activeView: 'dashboard',
  orderFilter: 'all',
  inventoryCategory: 'all',
  inventorySearch: '',
  paymentMode: 'Card',
  selectedTableId: 1,
  billingOrderId: '',
  billPreview: null,
  billReceipt: null,
  recentBills: [],
  menuItems: [],
  staff: [],
  suppliers: [],
  categories: [],
  orders: [],
  tables: [],
  inventory: [],
  reports: {},
  currentUser: JSON.parse(localStorage.getItem('user')) || {},
};

const navItems = [
  ['dashboard', 'Dashboard'],
  ['orders', 'Orders'],
  ['tables', 'Tables'],
  ['billing', 'Billing'],
  ['inventory', 'Inventory'],
  ['reports', 'Reports'],
  ['admin', 'Admin'],
  ['profile', 'Profile'],
];

const refs = {
  nav: document.getElementById('nav'),
  title: document.getElementById('page-title'),
  subtitle: document.getElementById('page-subtitle'),
  clock: document.getElementById('live-clock'),
  alertPill: document.getElementById('alert-pill'),
  currentRole: document.getElementById('current-role'),
  viewRoot: document.getElementById('view-root'),
  detailPanel: document.getElementById('detail-panel'),
  modalRoot: document.getElementById('modal-root'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
};

init();

async function init() {
  renderNav();
  bindChrome();
  await refreshAll();
  render();
  setClock();
  setInterval(setClock, 1000);
  setInterval(refreshAll, 15000);
}

function bindChrome() {
  refs.sidebarToggle?.addEventListener('click', () => refs.sidebar.classList.toggle('open'));
  
  // Avatar pill menu toggle
  const avatarPill = document.querySelector('.avatar-pill');
  const userMenu = document.getElementById('user-menu');
  if (avatarPill && userMenu) {
    avatarPill.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close menu when clicking elsewhere
    document.addEventListener('click', () => {
      userMenu.style.display = 'none';
    });
  }
  
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('input', handleDocumentInput);
  document.addEventListener('change', handleDocumentChange);
  document.addEventListener('submit', handleDocumentSubmit);
}

function renderNav() {
  refs.nav.innerHTML = navItems
    .map(
      ([key, label]) => `
        <button class="${state.activeView === key ? 'active' : ''}" data-action="switch-view" data-view="${key}">${label}</button>
      `,
    )
    .join('');
}

function setClock() {
  refs.clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function refreshAll() {
  try {
    const [menuItems, staff, suppliers, categories, orders, tables, inventory, recentBills, daily, weekly, hourly, topItems, categoryBreakdown] = await Promise.all([
      getJson('/menu-items'),
      getJson('/staff'),
      getJson('/suppliers'),
      getJson('/categories'),
      getJson('/orders'),
      getJson('/tables'),
      getJson('/inventory'),
      getJson('/bills?limit=8'),
      getJson('/reports/daily'),
      getJson('/reports/weekly'),
      getJson('/reports/hourly'),
      getJson('/reports/top-items'),
      getJson('/reports/category-breakdown'),
    ]);

    state.menuItems = menuItems.data || [];
    state.staff = staff.data || [];
    state.suppliers = suppliers.data || [];
    state.categories = categories.data || [];
    state.orders = orders.data || [];
    state.tables = tables.data || [];
    state.inventory = inventory.data || [];
    state.recentBills = recentBills.data || [];
    state.reports = {
      daily,
      weekly,
      hourly,
      topItems,
      categoryBreakdown,
    };
    state.currentRole = 'Admin';
    refs.currentRole.textContent = state.currentRole;
    refs.alertPill.textContent = `${lowStockCount()} alerts`;
    if (state.activeView === 'billing' && !state.billingOrderId && state.orders.length) {
      state.billingOrderId = state.orders.find((order) => order.status !== 'billed')?.order_id || state.orders[0]?.order_id || '';
    }
    render();
  } catch (error) {
    refs.viewRoot.innerHTML = `<div class="panel-card"><h3 class="section-title">Unable to load data</h3><div class="section-kicker">${error.message}</div></div>`;
  }
}

function lowStockCount() {
  return state.inventory.filter((item) => item.alert).length;
}

function render() {
  renderNav();
  const selectedTable = state.tables.find((table) => table.table_id === state.selectedTableId) || state.tables[0];
  refs.detailPanel.innerHTML = renderTableDetail(selectedTable);

  // Update avatar with user initials
  const avatarPill = document.querySelector('.avatar-pill');
  if (avatarPill && state.currentUser.name) {
    const initials = state.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    avatarPill.textContent = initials;
    avatarPill.title = state.currentUser.name;
  }

  if (state.activeView === 'dashboard') {
    refs.title.textContent = 'Dashboard';
    refs.subtitle.textContent = 'Operations overview across orders, tables, billing and inventory';
    refs.viewRoot.innerHTML = renderDashboardView();
  } else if (state.activeView === 'orders') {
    refs.title.textContent = 'Orders';
    refs.subtitle.textContent = 'Live order management and kitchen queue';
    refs.viewRoot.innerHTML = renderOrdersSection(state);
  } else if (state.activeView === 'tables') {
    refs.title.textContent = 'Tables';
    refs.subtitle.textContent = 'Floor plan, occupancy and reservations';
    refs.viewRoot.innerHTML = renderTablesSection(state);
  } else if (state.activeView === 'billing') {
    refs.title.textContent = 'Billing';
    refs.subtitle.textContent = 'Auto-calculated bills and receipt generation';
    refs.viewRoot.innerHTML = renderBillingSection(state);
  } else if (state.activeView === 'inventory') {
    refs.title.textContent = 'Inventory';
    refs.subtitle.textContent = 'Stock levels, alerts and restocks';
    refs.viewRoot.innerHTML = renderInventorySection(state);
  } else if (state.activeView === 'reports') {
    refs.title.textContent = 'Reports';
    refs.subtitle.textContent = 'Revenue trends and performance analytics';
    refs.viewRoot.innerHTML = renderReportsSection(state);
  } else if (state.activeView === 'admin') {
    refs.title.textContent = 'Admin';
    refs.subtitle.textContent = 'Menu, staff and supplier maintenance';
    refs.viewRoot.innerHTML = renderAdminSection(state);
  } else if (state.activeView === 'profile') {
    refs.title.textContent = 'Profile';
    refs.subtitle.textContent = 'Account settings and security';
    refs.viewRoot.innerHTML = renderProfileSection(state.currentUser);
    setupProfileHandlers();
  }
}

function renderDashboardView() {
  const metrics = dashboardMetrics();
  return `
    <div class="section-stack">
      <div class="metric-grid">
        ${metrics.map((metric) => metricCard(metric.label, metric.value, metric.meta, metric.trend)).join('')}
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Order Board</h3><div class="section-kicker">Most recent tickets across the floor.</div></div></div>
          <div class="order-grid">${state.orders.slice(0, 6).map(orderCard).join('') || '<div class="muted">No orders available.</div>'}</div>
        </div>
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Low Stock Alerts</h3><div class="section-kicker">Inventory items below threshold.</div></div></div>
          <div class="simple-list">${state.inventory.filter((item) => item.alert).slice(0, 5).map(lowStockCard).join('') || '<div class="muted">Inventory is healthy.</div>'}</div>
        </div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Table Grid</h3><div class="section-kicker">Status overview for the 15-table floor plan.</div></div></div>
          <div class="table-grid">${state.tables.map(tableCard).join('')}</div>
        </div>
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Revenue Snapshot</h3><div class="section-kicker">Today, week and category mix.</div></div></div>
          <div class="simple-list">
            <div class="card-note">Orders today: ${state.orders.length}</div>
            <div class="card-note">Low stock items: ${lowStockCount()}</div>
            <div class="card-note">Recent bills: ${state.recentBills.length}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function dashboardMetrics() {
  const daily = state.reports.daily?.summary || { revenue: 0, bill_count: 0, avg_order_value: 0 };
  const occupied = state.tables.filter((table) => table.status !== 'available').length;
  const utilization = state.tables.length ? Math.round((occupied / state.tables.length) * 100) : 0;
  const topItem = state.reports.topItems?.data?.[0]?.name || '—';
  const peakHour = state.reports.hourly?.data?.reduce((best, current) => (Number(current.revenue) > Number(best.revenue) ? current : best), { hour: '--', revenue: 0 }) || { hour: '--' };
  return [
    { label: 'Today revenue', value: `₹${Number(daily.revenue || 0).toFixed(2)}`, meta: 'Cashier-ready totals', trend: '+' },
    { label: 'Average order', value: `₹${Number(daily.avg_order_value || 0).toFixed(2)}`, meta: 'Auto-calculated from bills', trend: '±' },
    { label: 'Table utilization', value: `${utilization}%`, meta: `${occupied}/${state.tables.length} tables busy`, trend: 'live' },
    { label: 'Top item', value: topItem, meta: `Peak hour ${peakHour.hour}:00`, trend: 'week' },
  ];
}

function orderCard(order) {
  const tone = { pending: 'blue', cooking: 'orange', ready: 'purple', served: 'green', billed: 'gray' }[order.status] || 'gray';
  return `
    <div class="order-card">
      <div class="card-top">
        <div>
          <div class="card-title">Order #${order.order_id}</div>
          <div class="card-subtitle">Table ${order.table_id} · ${order.elapsed_minutes} min</div>
        </div>
        <span class="status-chip ${tone}">${order.status}</span>
      </div>
      <div class="order-items">${order.item_summary || 'No items yet'}</div>
      <div class="detail-row"><span class="muted">Total</span><strong>₹${Number(order.total || 0).toFixed(2)}</strong></div>
      <div class="toolbar">
        <button class="button secondary" data-action="advance-order" data-order-id="${order.order_id}">Advance</button>
        <button class="button ghost" data-action="load-bill" data-order-id="${order.order_id}">Bill</button>
      </div>
    </div>
  `;
}

function tableCard(table) {
  const tone = { available: 'green', occupied: 'orange', reserved: 'blue' }[table.status] || 'gray';
  return `
    <div class="table-cell ${table.status}" data-action="select-table" data-table-id="${table.table_id}">
      <div class="row-top"><strong>Table ${table.table_id}</strong><span class="status-chip ${tone}">${table.status}</span></div>
      <div class="card-subtitle">Seats ${table.capacity}</div>
      <div class="card-note">${table.item_summary || 'Tap for details'}</div>
    </div>
  `;
}

function lowStockCard(item) {
  return `
    <div class="alert-row low-stock">
      <div class="row-top">
        <div>
          <div class="card-title">${item.name}</div>
          <div class="card-subtitle">${item.category}</div>
        </div>
        <span class="status-chip red">Low</span>
      </div>
      <div class="card-note">${item.quantity}${item.unit} left, threshold ${item.min_threshold}${item.unit}</div>
    </div>
  `;
}

async function handleDocumentClick(event) {
  const action = event.target.closest('[data-action]');
  if (!action) {
    return;
  }
  const { action: actionName } = action.dataset;

  // Handle logout
  if (actionName === 'logout') {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
    return;
  }

  if (actionName === 'switch-view') {
    state.activeView = action.dataset.view;
    render();
  }

  if (actionName === 'select-table') {
    state.selectedTableId = Number(action.dataset.tableId);
    render();
  }

  if (actionName === 'filter-orders') {
    state.orderFilter = action.dataset.filter;
    render();
  }

  if (actionName === 'advance-order') {
    await advanceOrder(Number(action.dataset.orderId));
  }

  if (actionName === 'load-bill') {
    await loadBill(Number(action.dataset.orderId));
  }

  if (actionName === 'load-bill-by-id') {
    await loadBillById(Number(action.dataset.billId));
  }

  if (actionName === 'new-order') {
    openNewOrderModal();
  }

  if (actionName === 'export-inventory') {
    exportInventoryCsv();
  }

  if (actionName === 'restock-item') {
    openRestockModal(Number(action.dataset.inventoryId));
  }

  if (actionName === 'open-add-inventory') {
    openAddInventoryModal();
  }

  if (actionName === 'edit-inventory') {
    const itemId = Number(action.dataset.inventoryId);
    const item = state.inventory.find((inv) => inv.inventory_id === itemId);
    openEditInventoryModal(item);
  }

  if (actionName === 'delete-inventory') {
    const itemId = Number(action.dataset.inventoryId);
    if (confirm('Are you sure you want to delete this inventory item?')) {
      deleteInventoryItem(itemId);
    }
  }

  if (actionName === 'finalize-bill') {
    await finalizeBill();
  }

  if (actionName === 'preview-bill') {
    if (state.billReceipt) {
      openBillWindow(state.billReceipt);
    }
  }

  if (actionName === 'open-reservation') {
    openReservationModal();
  }

  if (actionName === 'merge-tables') {
    openMergeModal();
  }
}

function handleDocumentInput(event) {
  const field = event.target.closest('[data-field]');
  if (!field) {
    return;
  }
  if (field.dataset.field === 'inventory-search') {
    state.inventorySearch = field.value;
    render();
  }
}

function handleDocumentChange(event) {
  const field = event.target.closest('[data-field]');
  if (!field) {
    return;
  }
  if (field.dataset.field === 'inventory-category') {
    state.inventoryCategory = field.value;
    render();
  }
  if (field.dataset.field === 'payment-mode') {
    state.paymentMode = field.value;
    render();
  }
  if (field.dataset.field === 'billing-order-id') {
    state.billingOrderId = field.value;
    updateBillPreview();
    render();
  }
}

async function handleDocumentSubmit(event) {
  const form = event.target.closest('form');
  if (!form) {
    return;
  }
  const type = form.dataset.type;
  if (form.dataset.form === 'new-order') {
    event.preventDefault();
    await submitNewOrder(new FormData(form));
  }
  if (form.dataset.form === 'reservation') {
    event.preventDefault();
    await submitReservation(new FormData(form));
  }
  if (form.dataset.form === 'restock') {
    event.preventDefault();
    await submitRestock(new FormData(form));
  }
  if (form.dataset.form === 'merge') {
    event.preventDefault();
    await submitMerge(new FormData(form));
  }
  if (form.dataset.form === 'admin-create') {
    event.preventDefault();
    await submitAdminCreate(type, new FormData(form));
  }
}

async function advanceOrder(orderId) {
  const order = state.orders.find((entry) => entry.order_id === orderId);
  if (!order) return;
  const sequence = ['pending', 'cooking', 'ready', 'served', 'billed'];
  const currentIndex = sequence.indexOf(order.status);
  const nextStatus = sequence[Math.min(currentIndex + 1, sequence.length - 1)];
  await putJson(`/orders/${orderId}/status`, { status: nextStatus, staff_id: state.staff[0]?.staff_id || 1 });
  await refreshAll();
}

async function loadBill(orderId) {
  state.billingOrderId = orderId;
  const response = await getJson(`/orders/${orderId}/bill`);
  state.billPreview = response.data;
  state.billReceipt = null;
  state.activeView = 'billing';
  render();
}

async function loadBillById(billId) {
  const response = await getJson(`/bills/${billId}`);
  const bill = response.data;
  const orderResponse = await getJson(`/orders/${bill.order_id}/bill`);
  state.billPreview = orderResponse.data;
  state.billingOrderId = bill.order_id;
  state.billReceipt = {
    restaurant: { name: 'Go Eats Food', address: 'Modern Dining Street, City Center' },
    order_id: bill.order_id,
    table_id: bill.table_id || state.tables.find((table) => table.current_order === bill.order_id)?.table_id || '—',
    date_time: bill.billed_at,
    payment_mode: bill.payment_mode,
    items: orderResponse.data.items,
    subtotal: orderResponse.data.subtotal,
    tax_amount: orderResponse.data.tax_amount,
    service_charge: orderResponse.data.service_charge,
    total: orderResponse.data.total,
    footer: 'Thank you for dining with Go Eats Food. Enjoy your next visit coupon.',
  };
  state.activeView = 'billing';
  render();
}

async function finalizeBill() {
  const orderId = Number(state.billingOrderId || state.orders.find((order) => order.status !== 'billed')?.order_id);
  if (!orderId) return;
  const response = await postJson('/bills', { order_id: orderId, payment_mode: state.paymentMode, staff_id: state.staff.find((person) => person.role === 'cashier')?.staff_id || state.staff[0]?.staff_id || 1 });
  const receipt = response.data.receipt;
  state.billReceipt = receipt;
  state.billPreview = await getJson(`/orders/${orderId}/bill`).then((result) => result.data);
  await refreshAll();
  openBillWindow(receipt);
}

function openBillWindow(receipt) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>Receipt</title><style>body{font-family:Arial,sans-serif;padding:24px;}</style></head><body>${receiptToPrintable(receipt)}</body></html>`);
  win.document.close();
  win.focus();
}

function receiptToPrintable(receipt) {
  return `
    <h2>${receipt.restaurant.name}</h2>
    <p>${receipt.restaurant.address}</p>
    <hr />
    <p>Order #${receipt.order_id} · Table ${receipt.table_id}</p>
    <p>${receipt.date_time}</p>
    <p>Payment: ${receipt.payment_mode}</p>
    <ul>${receipt.items.map((item) => `<li>${item.quantity} × ${item.name} - ₹${Number(item.line_total).toFixed(2)}</li>`).join('')}</ul>
    <p>Subtotal: ₹${Number(receipt.subtotal).toFixed(2)}</p>
    <p>GST: ₹${Number(receipt.tax_amount).toFixed(2)}</p>
    <p>Service: ₹${Number(receipt.service_charge).toFixed(2)}</p>
    <h3>Total: ₹${Number(receipt.total).toFixed(2)}</h3>
    <p>${receipt.footer}</p>
  `;
}

function openNewOrderModal() {
  const tableOptions = state.tables.map((table) => `<option value="${table.table_id}">Table ${table.table_id} · ${table.status}</option>`).join('');
  openModal(refs.modalRoot, {
    title: 'Add New Order',
    subtitle: 'Search items, pick a table and capture special instructions.',
    content: `
      <form class="section-stack" data-form="new-order">
        <div class="grid-two">
          <div>
            <label class="label-pill">Table</label>
            <select class="select" name="table_id">${tableOptions}</select>
          </div>
          <div>
            <label class="label-pill">Staff</label>
            <select class="select" name="staff_id">${state.staff.map((person) => `<option value="${person.staff_id}">${person.name} · ${person.role}</option>`).join('')}</select>
          </div>
        </div>
        <div>
          <div class="row-top">
            <label class="label-pill">Order items</label>
            <button class="button secondary" type="button" id="add-order-line">Add line</button>
          </div>
          <div class="simple-list" id="order-lines"></div>
        </div>
        <div>
          <label class="label-pill">Special notes</label>
          <textarea class="textarea" name="notes" placeholder="Extra spicy, no onions, allergy notes..."></textarea>
        </div>
        <button class="button" type="submit">Create order</button>
      </form>
    `,
    onMount: (modal) => {
      const lineContainer = modal.querySelector('#order-lines');
      const addLineButton = modal.querySelector('#add-order-line');
      const itemOptions = state.menuItems.map((item) => `<option value="${item.item_id}">${item.name} · ₹${Number(item.price).toFixed(2)}</option>`).join('');

      const addLine = () => {
        const line = document.createElement('div');
        line.className = 'grid-three';
        line.dataset.orderLine = 'true';
        line.innerHTML = `
          <div><select class="select" name="item_id">${itemOptions}</select></div>
          <div><input class="input" name="quantity" type="number" min="1" value="1" /></div>
          <div><input class="input" name="special_notes" placeholder="Special note" /></div>
        `;
        lineContainer.appendChild(line);
      };

      addLineButton.addEventListener('click', addLine);
      addLine();
    },
  });
}

async function submitNewOrder(formData) {
  const form = document.querySelector('form[data-form="new-order"]');
  const items = Array.from(form.querySelectorAll('[data-order-line]')).map((line) => ({
    item_id: Number(line.querySelector('[name="item_id"]').value),
    quantity: Number(line.querySelector('[name="quantity"]').value || 1),
    special_notes: line.querySelector('[name="special_notes"]').value,
  }));
  await postJson('/orders', {
    table_id: Number(formData.get('table_id')),
    staff_id: Number(formData.get('staff_id')),
    notes: formData.get('notes') || '',
    items,
  });
  closeActiveModal();
  await refreshAll();
  state.activeView = 'orders';
  render();
}

function openRestockModal(inventoryId) {
  const item = state.inventory.find((entry) => entry.inventory_id === inventoryId);
  openModal(refs.modalRoot, {
    title: `Restock ${item?.name || ''}`,
    subtitle: 'Record manual restock and log the change.',
    content: `
      <form class="section-stack" data-form="restock">
        <input type="hidden" name="inventory_id" value="${inventoryId}" />
        <div class="grid-two">
          <div><label class="label-pill">Quantity</label><input class="input" name="quantity" type="number" step="0.01" min="0.01" value="1" /></div>
          <div><label class="label-pill">Staff</label><select class="select" name="staff_id">${state.staff.map((person) => `<option value="${person.staff_id}">${person.name}</option>`).join('')}</select></div>
        </div>
        <button class="button" type="submit" data-action="save-restock">Save restock</button>
      </form>
    `,
  });
}

function openAddInventoryModal() {
  openModal(refs.modalRoot, {
    title: 'Add New Inventory Item',
    subtitle: 'Create a new stock item with initial quantity and threshold.',
    content: `
      <form class="section-stack" data-form="add-inventory">
        <div class="grid-two">
          <div><label class="label-pill">Item Name</label><input class="input" name="name" placeholder="e.g. Tomatoes" required /></div>
          <div><label class="label-pill">Category</label><select class="select" name="category">${state.categories.map((cat) => `<option value="${cat.name}">${cat.name}</option>`).join('')}</select></div>
        </div>
        <div class="grid-three">
          <div><label class="label-pill">Quantity</label><input class="input" name="quantity" type="number" step="0.01" min="0" value="0" /></div>
          <div><label class="label-pill">Unit</label><input class="input" name="unit" placeholder="kg, litre, pcs" required /></div>
          <div><label class="label-pill">Min Threshold</label><input class="input" name="min_threshold" type="number" step="0.01" min="0" value="10" /></div>
        </div>
        <div class="grid-two">
          <div><label class="label-pill">Cost per Unit</label><input class="input" name="cost_per_unit" type="number" step="0.01" min="0" value="0" /></div>
          <div><label class="label-pill">Supplier</label><select class="select" name="supplier_id"><option value="">None</option>${state.suppliers.map((sup) => `<option value="${sup.supplier_id}">${sup.name}</option>`).join('')}</select></div>
        </div>
        <button class="button" type="submit">Add Item</button>
      </form>
    `,
    onMount: (modal) => {
      const form = modal.querySelector('form[data-form="add-inventory"]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = {
          name: formData.get('name'),
          category: formData.get('category'),
          quantity: Number(formData.get('quantity')),
          unit: formData.get('unit'),
          min_threshold: Number(formData.get('min_threshold')),
          cost_per_unit: Number(formData.get('cost_per_unit')),
          supplier_id: formData.get('supplier_id') || null,
        };
        await postJson('/inventory', payload);
        closeActiveModal();
        await refreshAll();
        render();
      });
    },
  });
}

function openEditInventoryModal(item) {
  if (!item) return;
  openModal(refs.modalRoot, {
    title: `Edit ${item.name}`,
    subtitle: 'Update stock details and thresholds.',
    content: `
      <form class="section-stack" data-form="edit-inventory">
        <input type="hidden" name="inventory_id" value="${item.inventory_id}" />
        <div class="grid-two">
          <div><label class="label-pill">Item Name</label><input class="input" name="name" value="${item.name}" required /></div>
          <div><label class="label-pill">Category</label><select class="select" name="category">${state.categories.map((cat) => `<option value="${cat.name}" ${cat.name === item.category ? 'selected' : ''}>${cat.name}</option>`).join('')}</select></div>
        </div>
        <div class="grid-three">
          <div><label class="label-pill">Quantity</label><input class="input" name="quantity" type="number" step="0.01" min="0" value="${item.quantity}" /></div>
          <div><label class="label-pill">Unit</label><input class="input" name="unit" value="${item.unit}" required /></div>
          <div><label class="label-pill">Min Threshold</label><input class="input" name="min_threshold" type="number" step="0.01" min="0" value="${item.min_threshold}" /></div>
        </div>
        <div class="grid-two">
          <div><label class="label-pill">Cost per Unit</label><input class="input" name="cost_per_unit" type="number" step="0.01" min="0" value="${item.cost_per_unit}" /></div>
          <div><label class="label-pill">Supplier</label><select class="select" name="supplier_id"><option value="">None</option>${state.suppliers.map((sup) => `<option value="${sup.supplier_id}" ${sup.supplier_id === item.supplier_id ? 'selected' : ''}>${sup.name}</option>`).join('')}</select></div>
        </div>
        <button class="button" type="submit">Save Changes</button>
      </form>
    `,
    onMount: (modal) => {
      const form = modal.querySelector('form[data-form="edit-inventory"]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = {
          name: formData.get('name'),
          category: formData.get('category'),
          quantity: Number(formData.get('quantity')),
          unit: formData.get('unit'),
          min_threshold: Number(formData.get('min_threshold')),
          cost_per_unit: Number(formData.get('cost_per_unit')),
          supplier_id: formData.get('supplier_id') || null,
        };
        await putJson(`/inventory/${item.inventory_id}`, payload);
        closeActiveModal();
        await refreshAll();
        render();
      });
    },
  });
}

async function deleteInventoryItem(inventoryId) {
  await execution_subagent('GET', `/inventory/${inventoryId}`, {});
  // Using a simple DELETE which isn't directly supported, so we'll use putJson to mark as deleted
  // For now, just refresh after deletion
  const response = await fetch(`/inventory/${inventoryId}`, { method: 'DELETE' });
  if (response.ok) {
    await refreshAll();
    render();
  }
}

async function submitRestock(formData) {
  const inventoryId = Number(formData.get('inventory_id'));
  await putJson(`/inventory/${inventoryId}`, { quantity: Number(formData.get('quantity')), staff_id: Number(formData.get('staff_id')) });
  closeActiveModal();
  await refreshAll();
  state.activeView = 'inventory';
  render();
}

function openReservationModal() {
  openModal(refs.modalRoot, {
    title: 'Reserve a Table',
    subtitle: 'Capture the reservation date, time, party size and customer name.',
    content: `
      <form class="section-stack" data-form="reservation">
        <div class="grid-two">
          <div><label class="label-pill">Table</label><select class="select" name="table_id">${state.tables.map((table) => `<option value="${table.table_id}">Table ${table.table_id}</option>`).join('')}</select></div>
          <div><label class="label-pill">Party size</label><input class="input" name="party_size" type="number" min="1" value="2" /></div>
        </div>
        <div class="grid-two">
          <div><label class="label-pill">Customer</label><input class="input" name="customer_name" /></div>
          <div><label class="label-pill">Reserved at</label><input class="input" name="reserved_at" type="datetime-local" /></div>
        </div>
        <button class="button" type="submit" data-action="save-reservation">Save reservation</button>
      </form>
    `,
  });
}

async function submitReservation(formData) {
  await postJson('/reservations', {
    table_id: Number(formData.get('table_id')),
    customer_name: formData.get('customer_name'),
    party_size: Number(formData.get('party_size')),
    reserved_at: new Date(formData.get('reserved_at')).toISOString(),
  });
  closeActiveModal();
  await refreshAll();
  state.activeView = 'tables';
  render();
}

function openMergeModal() {
  openModal(refs.modalRoot, {
    title: 'Merge Tables',
    subtitle: 'Move active orders from source tables to one target table.',
    content: `
      <form class="section-stack" data-form="merge">
        <div class="grid-two">
          <div><label class="label-pill">Target table</label><select class="select" name="target_table_id">${state.tables.map((table) => `<option value="${table.table_id}">Table ${table.table_id}</option>`).join('')}</select></div>
          <div><label class="label-pill">Source table IDs</label><input class="input" name="source_table_ids" placeholder="e.g. 1,2" /></div>
        </div>
        <button class="button" type="submit" data-action="save-merge">Merge tables</button>
      </form>
    `,
  });
}

async function submitMerge(formData) {
  const sourceIds = String(formData.get('source_table_ids') || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter(Boolean);
  await postJson('/tables/merge', {
    target_table_id: Number(formData.get('target_table_id')),
    source_table_ids: sourceIds,
  });
  closeActiveModal();
  await refreshAll();
  state.activeView = 'tables';
  render();
}

async function submitAdminCreate(type, formData) {
  const endpointMap = { 'menu-item': '/admin/menu-items', staff: '/admin/staff', supplier: '/admin/suppliers' };
  const payload = Object.fromEntries(formData.entries());
  if (payload.price) payload.price = Number(payload.price);
  await postJson(endpointMap[type], payload);
  closeActiveModal();
  await refreshAll();
  state.activeView = 'admin';
  render();
}

async function updateBillPreview() {
  if (!state.billingOrderId) {
    state.billPreview = null;
    return;
  }
  try {
    const response = await getJson(`/orders/${state.billingOrderId}/bill`);
    state.billPreview = response.data;
    state.billReceipt = null;
  } catch {
    state.billPreview = null;
  }
}

function exportInventoryCsv() {
  const header = ['inventory_id', 'name', 'category', 'quantity', 'unit', 'min_threshold', 'stock_status'];
  const rows = state.inventory.map((item) => [item.inventory_id, item.name, item.category, item.quantity, item.unit, item.min_threshold, item.stock_status]);
  const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'go-eats-inventory-report.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
