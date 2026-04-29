export function lowStockAlert(item) {
  return `
    <div class="alert-row low-stock">
      <div class="row-top">
        <div>
          <div class="card-title">${item.name}</div>
          <div class="card-subtitle">${item.category} · threshold ${item.min_threshold}${item.unit}</div>
        </div>
        <span class="status-chip red">Low stock</span>
      </div>
      <div class="card-note">Current quantity: ${item.quantity}${item.unit}</div>
    </div>
  `;
}
