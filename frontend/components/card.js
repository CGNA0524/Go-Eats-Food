export function statusChip(label, tone = 'gray') {
  return `<span class="status-chip ${tone}">${label}</span>`;
}

export function metricCard(label, value, meta = '', trend = '') {
  const spark = Array.from({ length: 6 }, (_, index) => `<span style="height:${22 + index * 12}%"></span>`).join('');
  return `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
      <div class="metric-meta"><span>${meta}</span><span>${trend}</span></div>
      <div class="sparkline">${spark}</div>
    </div>
  `;
}

export function panelCard(title, subtitle, body) {
  return `
    <div class="panel-card">
      <div class="section-header">
        <div>
          <h3 class="section-title">${title}</h3>
          <div class="section-kicker">${subtitle || ''}</div>
        </div>
      </div>
      ${body}
    </div>
  `;
}
