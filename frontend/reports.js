import { renderBarChart, renderProgressBars } from './components/chart.js';

export function renderReportsSection(state) {
  const daily = state.reports.daily || { data: [], summary: { revenue: 0, bill_count: 0, avg_order_value: 0 } };
  const weekly = state.reports.weekly || { data: [] };
  const hourly = state.reports.hourly || { data: [] };
  const category = state.reports.categoryBreakdown || { data: [] };
  const topItems = state.reports.topItems || { data: [] };

  const todayRevenue = Number(daily.summary?.revenue || 0);
  const totalOrders = state.orders.length;
  const utilization = state.tables.length ? Math.round((state.tables.filter((table) => table.status !== 'available').length / state.tables.length) * 100) : 0;
  const peakHour = hourly.data.reduce((winner, current) => (Number(current.revenue) > Number(winner.revenue) ? current : winner), { hour: '--', revenue: 0 });

  return `
    <div class="section-stack">
      <div class="section-header">
        <div>
          <h2 class="section-title">Sales Reports & Analytics</h2>
          <div class="section-kicker">Aggregate sales, table utilization and product performance across time windows.</div>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">Today revenue</div><div class="metric-value">₹${todayRevenue.toFixed(2)}</div></div>
        <div class="metric-card"><div class="metric-label">Average order value</div><div class="metric-value">₹${Number(daily.summary?.avg_order_value || 0).toFixed(2)}</div></div>
        <div class="metric-card"><div class="metric-label">Total orders</div><div class="metric-value">${totalOrders}</div></div>
        <div class="metric-card"><div class="metric-label">Table utilization</div><div class="metric-value">${utilization}%</div></div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Hourly Revenue</h3><div class="section-kicker">6am to midnight revenue profile.</div></div></div>
          ${renderBarChart(hourlySeries(hourly.data), { height: 200 })}
        </div>
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Weekly Trend</h3><div class="section-kicker">Monday through Sunday revenue trend.</div></div></div>
          ${renderBarChart(weeklySeries(weekly.data), { height: 200 })}
        </div>
      </div>

      <div class="grid-two">
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Category Split</h3><div class="section-kicker">Revenue by category with percentage bars.</div></div></div>
          ${renderProgressBars(category.data.map((item) => ({ label: item.category, value: `₹${Number(item.revenue || 0).toFixed(2)}`, percent: Number(item.percent || 0) })))}
        </div>
        <div class="panel-card">
          <div class="section-header"><div><h3 class="section-title">Peak Orders</h3><div class="section-kicker">Orders per hour highlight for the busiest slot.</div></div></div>
          <div class="panel-card" style="padding:12px; margin-bottom:12px;">
            <div class="card-title">Peak hour</div>
            <div class="bill-total">${peakHour.hour}:00</div>
          </div>
          ${renderBarChart(topItemSeries(topItems.data), { height: 200 })}
        </div>
      </div>

      <div class="panel-card">
        <div class="section-header"><div><h3 class="section-title">Top Performing Items</h3><div class="section-kicker">Rank, order count, weekly revenue and trend.</div></div></div>
        <div class="list-head"><div>Item</div><div>Orders</div><div>Revenue</div><div>Trend</div></div>
        <div class="simple-list">
          ${topItems.data
            .map(
              (item, index) => `
                <div class="list-row top-item-row">
                  <div><strong>#${index + 1} ${item.name}</strong><div class="card-subtitle">${item.category}</div></div>
                  <div>${item.order_count}</div>
                  <div>₹${Number(item.weekly_revenue || 0).toFixed(2)}</div>
                  <div>${Number(item.trend || 0).toFixed(1)}%</div>
                </div>
              `,
            )
            .join('') || '<div class="muted">No item performance data yet.</div>'}
        </div>
      </div>
    </div>
  `;
}

function hourlySeries(data) {
  const map = new Map(data.map((item) => [Number(item.hour), Number(item.revenue || 0)]));
  const hours = Array.from({ length: 19 }, (_, index) => index + 6);
  return hours.map((hour) => ({ label: `${hour}`, value: map.get(hour) || 0 }));
}

function weeklySeries(data) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const valuesByDay = new Map(data.map((item) => [new Date(item.day).getDay(), Number(item.revenue || 0)]));
  return labels.map((label, index) => ({ label, value: valuesByDay.get((index + 1) % 7) || 0 }));
}

function topItemSeries(data) {
  return data.map((item) => ({ label: item.name.slice(0, 7), value: Number(item.order_count || 0) }));
}
