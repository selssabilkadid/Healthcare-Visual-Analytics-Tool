// js/main.js - Main application with filters

import { loadData } from './dataLoader.js';
import tabManager from './utils/tabManager.js';
import filterManager from './utils/filterManager.js';
import { renderDemographicsTab } from './tabs/demographicsTab.js';
import { renderFinancialTab } from './tabs/financialTab.js';

let globalData = null;
let appReady = false;

// =====================================================================
// Initialize dashboard
// =====================================================================
async function init() {
  console.log('=== Healthcare Dashboard Initialization ===');

  try {
    if (typeof d3 === 'undefined') throw new Error('D3.js is not loaded!');
    console.log('D3.js version:', d3.version);

    showLoading('Loading healthcare dataset...');

    // Load data
    console.time('Data Load');
    globalData = await loadData('./data/healthcare_dataset_with_coords.csv');
    console.timeEnd('Data Load');
    console.log('Data loaded:', globalData.length, 'records');

    // Initialize filter manager
    filterManager.init(globalData, (filteredData) => {
      console.log('Filter changed, updating visualizations...');
      // Re-render current tab with filtered data
      const currentTab = tabManager.getCurrentTab();
      tabManager.switchTab(currentTab);
    });

    showLoading('Setting up visualizations...');

    // Register tabs with filter-aware render functions
    tabManager.registerTab('overview', () => {
      const data = filterManager.getFilteredData();
      renderOverviewTab(data);
    });
    
    tabManager.registerTab('demographics', () => {
      const data = filterManager.getFilteredData();
      renderDemographicsTab(data);
    });
    
    tabManager.registerTab('financial', () => {
      const data = filterManager.getFilteredData();
      renderFinancialTab(data);
    });
    
    tabManager.registerTab('geographic', () => {
      const data = filterManager.getFilteredData();
      renderGeographicTab(data);
    });

    console.log('All tabs registered');

    // Initialize tab manager with overview as default
    tabManager.init('overview');

    appReady = true;

    console.log('Dashboard initialized successfully!');
    hideLoading();
    showSuccessMessage('Dashboard loaded successfully!');

  } catch (error) {
    console.error('Initialization Error:', error);
    showError(`Failed to initialize dashboard: ${error.message}`);
  }
}

// =====================================================================
// Overview Tab - Key Metrics
// =====================================================================
function renderOverviewTab(data) {
  const container = d3.select('#overview-content');
  container.html('');

  // Show filter stats if filters are active
  const stats = filterManager.getFilterStats();
  if (stats.activeFilters > 0) {
    container.append('div')
      .attr('class', 'filter-info')
      .style('padding', '1rem')
      .style('background', '#EBF8FF')
      .style('border-radius', '8px')
      .style('margin-bottom', '1.5rem')
      .style('color', '#2C5282')
      .style('font-size', '0.875rem')
      .html(`
        Showing <strong>${stats.filtered.toLocaleString()}</strong> of 
        <strong>${stats.total.toLocaleString()}</strong> records 
        (${stats.activeFilters} filter${stats.activeFilters > 1 ? 's' : ''} active)
      `);
  }

  // Create metrics grid
  const metricsGrid = container.append('div').attr('class', 'metrics-grid');

  const metrics = [
    {
      title: 'Total Patients',
      value: data.length.toLocaleString(),
      change: calculateChange(data.length, globalData.length),
      icon: '👥',
      color: '#667EEA'
    },
    {
      title: 'Avg Age',
      value: d3.mean(data, d => d.Age).toFixed(1) + ' yrs',
      icon: '🎂',
      color: '#9F7AEA'
    },
    {
      title: 'Avg Billing',
      value: '$' + d3.mean(data, d => d['Billing Amount']).toFixed(0),
      icon: '💰',
      color: '#48BB78'
    },
    {
      title: 'Emergency Cases',
      value: data.filter(d => d['Admission Type'] === 'Emergency').length.toLocaleString(),
      change: calculatePercentage(data.filter(d => d['Admission Type'] === 'Emergency').length, data.length),
      icon: '🚨',
      color: '#FC8181'
    }
  ];

  const cards = metricsGrid.selectAll('.metric-card')
    .data(metrics)
    .enter()
    .append('div')
    .attr('class', 'metric-card');

  cards.append('div')
    .attr('class', 'metric-icon')
    .style('background', d => d.color + '20')
    .style('color', d => d.color)
    .text(d => d.icon);

  const content = cards.append('div').attr('class', 'metric-content');

  content.append('div')
    .attr('class', 'metric-title')
    .text(d => d.title);

  content.append('div')
    .attr('class', 'metric-value')
    .text(d => d.value);

  content.filter(d => d.change)
    .append('div')
    .attr('class', d => 'metric-change ' + (d.change.startsWith('+') ? 'positive' : d.change.startsWith('-') ? 'negative' : ''))
    .html(d => d.change);

  // Add quick insights
  container.append('h2')
    .style('margin-top', '2rem')
    .style('margin-bottom', '1rem')
    .style('font-size', '1.25rem')
    .text('Quick Insights');

  const insights = container.append('div')
    .attr('class', 'charts-grid');

  renderQuickInsights(insights, data);
}

function renderQuickInsights(container, data) {
  // Medical Conditions Distribution
  const conditionsCard = container.append('div').attr('class', 'chart-card');
  
  const header = conditionsCard.append('div').attr('class', 'chart-header');
  header.append('div')
    .html('<div class="chart-title">Medical Conditions</div><div class="chart-subtitle">Distribution by condition type</div>');

  const conditionCounts = d3.rollup(data, v => v.length, d => d['Medical Condition']);
  const conditionData = Array.from(conditionCounts, ([key, value]) => ({
    condition: key,
    count: value,
    percentage: ((value / data.length) * 100).toFixed(1)
  })).sort((a, b) => b.count - a.count);

  const chartDiv = conditionsCard.append('div')
    .style('padding', '1rem 0');

  conditionData.forEach(d => {
    const row = chartDiv.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('padding', '0.75rem 0')
      .style('border-bottom', '1px solid #E2E8F0');

    row.append('span')
      .style('font-weight', '500')
      .style('color', '#2D3748')
      .text(d.condition);

    row.append('span')
      .style('font-weight', '600')
      .style('color', '#667EEA')
      .text(`${d.count} (${d.percentage}%)`);
  });

  // Admission Types
  const admissionCard = container.append('div').attr('class', 'chart-card');
  
  const admHeader = admissionCard.append('div').attr('class', 'chart-header');
  admHeader.append('div')
    .html('<div class="chart-title">Admission Types</div><div class="chart-subtitle">Emergency vs Urgent vs Elective</div>');

  const admissionCounts = d3.rollup(data, v => v.length, d => d['Admission Type']);
  const admissionData = Array.from(admissionCounts, ([key, value]) => ({
    type: key,
    count: value,
    percentage: ((value / data.length) * 100).toFixed(1)
  }));

  const admChartDiv = admissionCard.append('div')
    .style('padding', '1rem 0');

  admissionData.forEach(d => {
    const row = admChartDiv.append('div')
      .style('margin-bottom', '0.75rem');

    row.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('margin-bottom', '0.5rem')
      .html(`
        <span style="font-weight: 500; color: #2D3748;">${d.type}</span>
        <span style="font-weight: 600;">${d.count} (${d.percentage}%)</span>
      `);

    const bar = row.append('div')
      .style('width', '100%')
      .style('height', '8px')
      .style('background', '#E2E8F0')
      .style('border-radius', '4px')
      .style('overflow', 'hidden');

    bar.append('div')
      .style('width', d.percentage + '%')
      .style('height', '100%')
      .style('background', d.type === 'Emergency' ? '#FC8181' : d.type === 'Urgent' ? '#F6AD55' : '#4299E1')
      .style('border-radius', '4px')
      .style('transition', 'width 0.3s ease');
  });
}

function calculateChange(current, total) {
  if (current === total) return null;
  const percent = ((current / total) * 100 - 100).toFixed(1);
  return (percent > 0 ? '+' : '') + percent + '%';
}

function calculatePercentage(value, total) {
  return ((value / total) * 100).toFixed(1) + '% of total';
}


// =====================================================================
// Geographic Tab
// =====================================================================
function renderGeographicTab(data) {
  const container = d3.select('#geographic-content');
  container.html('');

  container.append('div')
    .attr('class', 'placeholder')
    .html(`
      <h2>🗺️ Geographic Distribution</h2>
      <p>Showing <strong>${data.length.toLocaleString()}</strong> patient locations</p>
      <p style="margin-top: 1rem;">Map visualization coming soon...</p>
    `);
}

// =====================================================================
// UI Helper Functions
// =====================================================================
function showLoading(message = 'Loading...') {
  const loader = document.getElementById('loading');
  const text = document.getElementById('loading-text');
  if (loader) loader.style.display = 'flex';
  if (text) text.textContent = message;
}

function hideLoading() {
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'none';
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    errorDiv.style.display = 'block';
  }
  hideLoading();
}

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 20px; right: 20px;
    background: #48bb78; color: white;
    padding: 1rem 1.5rem; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999; font-size: 0.875rem; font-weight: 500;
  `;
  successDiv.textContent = '✅ ' + message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

// =====================================================================
// Start Application
// =====================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// =====================================================================
// Debug Helpers
// =====================================================================
window.getDashboardData = () => globalData;
window.getFilteredData = () => filterManager.getFilteredData();
window.filterManager = filterManager;
window.tabManager = tabManager;