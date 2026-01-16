// import fs from 'fs';
// import { loadCSV } from './dataLoader.js';
// import { preprocessData, getColumnTypes } from './preprocessing.js';

// /**
//  * Helper: count duplicates using the SAME key as preprocessing
//  */
// function countDuplicates(data) {
//     const seen = new Set();
//     let duplicates = 0;

//     data.forEach(row => {
//         // Create a key using ALL columns
//         const key = Object.keys(row)
//             .sort() // ensure consistent order
//             .map(col => row[col] ?? 'NA') // replace null/undefined with 'NA'
//             .join('|');

//         if (seen.has(key)) {
//             duplicates++;
//         } else {
//             seen.add(key);
//         }
//     });

//     return duplicates;
// }


// /**
//  * Helper: save CSV
//  */
// function saveCSV(data, filePath) {
//     if (data.length === 0) return;

//     const headers = Object.keys(data[0]);
//     const csvRows = [
//         headers.join(','), // header row
//         ...data.map(row =>
//             headers.map(h => {
//                 const value = row[h];
//                 if (value instanceof Date) return value.toISOString();
//                 if (value === null || value === undefined) return '';
//                 return `"${String(value).replace(/"/g, '""')}"`;
//             }).join(',')
//         )
//     ];

//     fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
// }

// async function run() {
//     const rawData = await loadCSV('../data/healthcare_dataset.csv');

//     // Dataset Shape before cleaning 
//     const numRows_raw = rawData.length;
//     const numCols_raw = rawData.length > 0 ? Object.keys(rawData[0]).length : 0;
//     console.log(`Dataset shape before cleaning: ${numRows_raw} rows x ${numCols_raw} columns`);

//     // 🔹 Count duplicates BEFORE preprocessing
//     const duplicateCount = countDuplicates(rawData);
//     console.log(`Duplicates before cleaning: ${duplicateCount}`);

//     // 🔹 Preprocess (duplicates dropped inside)
//     const { cleanedData, summary } = preprocessData(rawData);

//     // Dataset shape
//     const numRows = cleanedData.length;
//     const numCols = cleanedData.length > 0 ? Object.keys(cleanedData[0]).length : 0;
//     console.log(`Dataset shape after cleaning: ${numRows} rows x ${numCols} columns`);

//     // Column types
//     console.log('\n=== Column Data Types ===');
//     console.table(getColumnTypes(cleanedData));

//     // Uniques
//     console.log('Unique hospitals:', new Set(cleanedData.map(r => r.Hospital)).size);
//     console.log('Unique patients:', new Set(cleanedData.map(r => r.Name)).size);
//     console.log('Unique providers:', new Set(cleanedData.map(r => r['Insurance Provider'])).size);
//     console.log('Unique doctors:', new Set(cleanedData.map(r => r.Doctor)).size);

//     // Preview
//     console.log('\nFirst 5 rows after preprocessing:');
//     console.log(cleanedData.slice(0, 5));

//     // Summary
//     console.log('\n=== Missing Values Report ===');
//     console.table(summary.missingValues);

//     console.log('\n=== Numeric Columns Summary ===');
//     console.table(summary.numericStats);

//     console.log('\n=== Categorical Columns Frequency ===');
//     for (const col in summary.categoricalFreq) {
//         console.log(`\n${col}:`);
//         console.table(summary.categoricalFreq[col]);
//     }

//     // 🔹 Save cleaned dataset
//     saveCSV(cleanedData, '../data/healthcare_dataset_cleaned.csv');
//     console.log('\nCleaned dataset saved to healthcare_dataset_cleaned.csv');
// }

// run();

// js/main.js - BROWSER VERSION
// NO IMPORTS FOR D3 - it's loaded globally via <script> tag

import { loadData, getDataStats, validateData } from './dataLoader.js';
import tabManager from './utils/tabManager.js';
import { renderDemographicsTab } from './tabs/demographicsTab.js';
// import { renderHomeTab } from './tabs/homeTab.js'; // ← use when ready

// =====================================================================
// Global data store
// =====================================================================
let globalData = null;
let appReady = false;

// =====================================================================
// Initialize the dashboard application
// =====================================================================
async function init() {
  console.log('=== Healthcare Dashboard Initialization ===');

  try {
    // Check if D3 is available
    if (typeof d3 === 'undefined') {
      throw new Error('D3.js is not loaded! Check your HTML <script> tags.');
    }
    console.log('D3.js version:', d3.version);

    showLoading('Initializing dashboard...');

    // -----------------------------------------------------------------
    // Load data
    // -----------------------------------------------------------------
    showLoading('Loading healthcare dataset...');
    console.time('Total Data Load');

    globalData = await loadData('./data/healthcare_dataset_with_coords.csv');

    console.timeEnd('Total Data Load');
    console.log('Data loaded successfully');

    // -----------------------------------------------------------------
    // Validate data
    // -----------------------------------------------------------------
    showLoading('Validating data...');
    const validation = validateData(globalData);
    console.log('Data validation:', validation);

    if (!validation.isValid) {
      console.warn('Data quality issues found:', validation.issues);
    }

    // -----------------------------------------------------------------
    // Data statistics
    // -----------------------------------------------------------------
    const stats = getDataStats(globalData);
    console.log('Data Statistics:', stats);

    // -----------------------------------------------------------------
    // Register tabs
    // -----------------------------------------------------------------
    showLoading('Setting up visualizations...');

    tabManager.registerTab('home', () => {
      renderHomePlaceholder(globalData);
    });

    tabManager.registerTab('demographics', () => {
      renderDemographicsTab(globalData);
    });

    tabManager.registerTab('financial', () => {
      renderFinancialPlaceholder(globalData);
    });

    tabManager.registerTab('geographic', () => {
      renderGeographicPlaceholder(globalData);
    });

    console.log('All tabs registered');

    // -----------------------------------------------------------------
    // Initialize tab system
    // -----------------------------------------------------------------
    tabManager.init();

    appReady = true;

    console.log('Dashboard initialized successfully!');
    console.log('=== Initialization Complete ===');

    // -----------------------------------------------------------------
    // Hide loading & show success
    // -----------------------------------------------------------------
    setTimeout(() => {
      hideLoading();
      showSuccessMessage();
    }, 400);

  } catch (error) {
    console.error('Initialization Error:', error);
    showError(`Failed to initialize dashboard: ${error.message}`);
  }
}

// =====================================================================
// Placeholder tab renderers
// =====================================================================
function renderHomePlaceholder(data) {
  const container = d3.select('#home-content');
  container.html('');

  container.append('div')
    .attr('class', 'placeholder')
    .style('padding', '2rem')
    .style('text-align', 'center')
    .html(`
      <h2>Welcome to Healthcare Analytics</h2>
      <p><strong>Total Patients:</strong> ${data.length.toLocaleString()}</p>
      <p>Use the navigation tabs to explore insights.</p>
    `);
}

function renderFinancialPlaceholder() {
  const container = d3.select('#financial-content');
  container.html('');

  container.append('div')
    .attr('class', 'placeholder')
    .style('padding', '2rem')
    .html('<h2>Financial Analytics</h2><p>Coming soon...</p>');
}

function renderGeographicPlaceholder() {
  const container = d3.select('#geographic-content');
  container.html('');

  container.append('div')
    .attr('class', 'placeholder')
    .style('padding', '2rem')
    .html('<h2>Geographic Distribution</h2><p>Coming soon...</p>');
}

// =====================================================================
// Resize handling (SAFE)
// =====================================================================
let resizeTimer;
window.addEventListener('resize', () => {
  if (!appReady) return;

  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const currentTab = tabManager.getCurrentTab();
    console.log('Window resized → re-render:', currentTab);
    tabManager.renderCurrentTab();
  }, 250);
});

// =====================================================================
// Loading / feedback helpers
// =====================================================================
function showLoading(message = 'Loading...') {
  const loader = document.getElementById('loading');
  const loadingText = document.getElementById('loading-text');

  if (loader) loader.style.display = 'flex';
  if (loadingText) loadingText.textContent = message;
}

function hideLoading() {
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'none';
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.innerHTML = `
      <strong>Error:</strong> ${message}
      <br><small>Check the browser console (F12) for details.</small>
    `;
    errorDiv.style.display = 'block';
  }
  hideLoading();
}

function showSuccessMessage() {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #48bb78;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
  `;
  successDiv.textContent = 'Dashboard loaded successfully!';
  document.body.appendChild(successDiv);

  setTimeout(() => successDiv.remove(), 3000);
}

// =====================================================================
// Start application
// =====================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// =====================================================================
// Debug helpers
// =====================================================================
window.getDashboardData = () => globalData;
window.getDataStats = () => globalData ? getDataStats(globalData) : null;
window.tabManager = tabManager;
