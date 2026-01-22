// js/main.js - Main application with filters

import { loadData } from './dataLoader.js';
import tabManager from './utils/tabManager.js';
import filterManager from './utils/filterManager.js';
import themeManager from './utils/themeManager.js';

// Import visualization modules
import { renderOverviewTab } from './tabs/overviewTab.js';
import { renderDemographicsTab } from './tabs/demographicsTab.js';
import { renderFinancialTab } from './tabs/financialTab.js';
import { renderGeographicTab } from './tabs/geographicTab.js';

let globalData = null;
let appReady = false;

// =====================================================================
// Initialize dashboard
// =====================================================================
async function init() {
  console.log('=== Healthcare Dashboard Initialization ===');

  try {
    themeManager.init();
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
    const currentTab = tabManager.getCurrentTab();
    

    if (currentTab !== 'geographic') {
        tabManager.renderCurrentTab();
    } else {
        console.log('Filtre appliqué : la carte reste stable, les autres onglets sont prêts.');
    }
});

    showLoading('Setting up visualizations...');
  
    tabManager.registerTab('overview', () => {
        const data = filterManager.getFilteredData();
        d3.select('#overview-content').selectAll('*').remove();
        renderOverviewTab(data);
    });

    tabManager.registerTab('geographic', () => {
        const data = filterManager.getFilteredData();
        d3.select('#geographic-content').selectAll('*').remove();
        renderGeographicTab(data);
    });
        
    tabManager.registerTab('demographics', () => {
      const data = filterManager.getFilteredData();
      renderDemographicsTab(data);
    });
    
    tabManager.registerTab('financial', () => {
      const data = filterManager.getFilteredData();
      renderFinancialTab(data);
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
  successDiv.textContent = message;
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

document.body.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('filter-btn')) {
        const hospitalName = e.target.getAttribute('data-hospital');
        if (hospitalName) {
            applyGlobalFilter(hospitalName);
        }
    }
});
// =====================================================================
// Debug Helpers
// =====================================================================
window.getDashboardData = () => globalData;
window.getFilteredData = () => filterManager.getFilteredData();
window.filterManager = filterManager;
window.tabManager = tabManager;

