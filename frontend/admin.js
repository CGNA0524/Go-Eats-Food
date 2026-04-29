export function renderAdminSection(state) {
  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Admin Panel</h2>
          <div class="section-kicker">Create and update menu items, staff and suppliers.</div>
        </div>
      </div>

      <div class="grid-three">
        ${renderListCard('Menu Items', state.menuItems, (item) => `${item.name} · ${item.category} · ₹${Number(item.price).toFixed(2)}`)}
        ${renderListCard('Staff', state.staff, (staff) => `${staff.name} · ${staff.role}`)}
        ${renderListCard('Suppliers', state.suppliers, (supplier) => `${supplier.name} · ${supplier.contact || ''}`)}
      </div>

      <div class="grid-three">
        ${renderCreateForm('Create Menu Item', 'menu-item')}
        ${renderCreateForm('Create Staff', 'staff')}
        ${renderCreateForm('Create Supplier', 'supplier')}
      </div>
    </div>
  `;
}

function renderListCard(title, items, formatter) {
  return `
    <div class="panel-card admin-card">
      <div class="section-header"><div><h3 class="section-title">${title}</h3><div class="section-kicker">Live catalog data from the backend.</div></div></div>
      <div class="simple-list">
        ${items.map((item) => `<div class="card-note">${formatter(item)}</div>`).join('') || '<div class="muted">No data.</div>'}
      </div>
    </div>
  `;
}

function renderCreateForm(title, type) {
  const fields = {
    'menu-item': `
      <input class="input" name="name" placeholder="Item name" />
      <input class="input" name="category" placeholder="Category" />
      <input class="input" name="price" type="number" step="0.01" placeholder="Price" />
      <textarea class="textarea" name="description" placeholder="Description"></textarea>
    `,
    staff: `
      <input class="input" name="name" placeholder="Staff name" />
      <input class="input" name="role" placeholder="Role" />
      <input class="input" name="phone" placeholder="Phone" />
    `,
    supplier: `
      <input class="input" name="name" placeholder="Supplier name" />
      <input class="input" name="contact" placeholder="Contact" />
      <input class="input" name="email" placeholder="Email" />
    `,
  };

  return `
    <div class="panel-card admin-card">
      <div class="section-header"><div><h3 class="section-title">${title}</h3><div class="section-kicker">Submit to the admin API.</div></div></div>
      <form class="simple-list" data-form="admin-create" data-type="${type}">
        ${fields[type]}
        <button class="button" type="submit">Create</button>
      </form>
    </div>
  `;
}
