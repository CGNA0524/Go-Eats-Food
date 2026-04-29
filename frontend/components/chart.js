export function renderBarChart(items, options = {}) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  const height = options.height || 180;
  return `
    <div class="bar-chart" style="grid-template-columns: repeat(${items.length}, minmax(0, 1fr));">
      ${items
        .map(
          (item) => `
            <div class="bar-column">
              <div class="bar-track" style="height:${height}px">
                <div class="bar-fill" style="height:${Math.max(((Number(item.value) || 0) / maxValue) * 100, 6)}%"></div>
              </div>
              <div class="bar-label">${item.label}</div>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

export function renderSparkline(values = []) {
  const maxValue = Math.max(...values.map((value) => Number(value) || 0), 1);
  return `<div class="sparkline">${values
    .map((value) => `<span style="height:${Math.max(((Number(value) || 0) / maxValue) * 100, 10)}%"></span>`)
    .join('')}</div>`;
}

export function renderProgressBars(items) {
  return `
    <div class="progress-group">
      ${items
        .map(
          (item) => `
            <div class="progress-row">
              <div class="progress-label"><span>${item.label}</span><span>${item.value}</span></div>
              <div class="progress-bar"><div class="progress-fill" style="width:${item.percent}%"></div></div>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}
