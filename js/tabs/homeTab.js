//import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function renderHomeTab(data) {
  console.log('Rendering Home Tab');
  
  // Clear previous content
  const container = d3.select('#home-content');
  container.html('');

  // Create summary cards (like the bank accounts in your image)
  renderSummaryCards(container, data);
  
  // Create recent transactions/activity
  renderRecentActivity(container, data);
  
  // Create overview charts
  renderOverviewCharts(container, data);
}

function renderSummaryCards(container, data) {
  const summaryData = [
    { title: 'Total Patients', value: data.length, icon: '👥' },
    { title: 'Avg Age', value: d3.mean(data, d => d.age).toFixed(1), icon: '📊' },
    { title: 'Medical Claims', value: d3.sum(data, d => d.claim).toLocaleString(), icon: '💰' }
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
  // Implementation for recent activity section
}

function renderOverviewCharts(container, data) {
  // Implementation for overview visualizations
}