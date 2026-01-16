export function renderHomeTab(data) {
  console.log('Rendering Home Tab');

  const container = d3.select('#home-content');

  // Avoid clearing repeatedly
  if (!container.selectAll('.summary-cards').empty()) return;

  container.html('');

  // Summary cards
  renderSummaryCards(container, data);

  // Recent activity
  renderRecentActivity(container, data);

  // Overview charts
  renderOverviewCharts(container, data);
}

function renderSummaryCards(container, data) {
  const summaryData = [
    { title: 'Total Patients', value: data.length, icon: '👥' },
    { title: 'Avg Age', value: d3.mean(data, d => +d.age || 0).toFixed(1), icon: '📊' },
    { title: 'Medical Claims', value: d3.sum(data, d => +d.claim || 0).toLocaleString(), icon: '💰' }
  ];

  const cards = container.append('div')
    .attr('class', 'summary-cards')
    .selectAll('.card')
    .data(summaryData)
    .enter()
    .append('div')
    .attr('class', 'summary-card');

  cards.append('div')
    .attr('class', 'card-icon')
    .text(d => d.icon);

  cards.append('div')
    .attr('class', 'card-title')
    .text(d => d.title);

  cards.append('div')
    .attr('class', 'card-value')
    .text(d => d.value);
}

function renderRecentActivity(container, data) {
  // Only log for now
  console.log('Render recent activity placeholder');
}

function renderOverviewCharts(container, data) {
  // Only log for now
  console.log('Render overview charts placeholder');
}
