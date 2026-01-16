// js/dataLoader.js - BROWSER VERSION
// No imports needed - d3 is loaded globally via <script> tag

/**
 * Load CSV data using D3.js (browser-compatible)
 * @param {string} filePath - Path to CSV file (e.g., './data/healthcare_dataset.csv')
 * @returns {Promise<Array>} - Array of parsed data objects
 */
export async function loadData(filePath = './data/healthcare_dataset.csv') {
  console.log('Loading data from:', filePath);
  console.time('CSV Load Time');

  try {
    // Check if d3 is available
    if (typeof d3 === 'undefined') {
      throw new Error('D3.js is not loaded. Make sure to include D3 script tag in HTML.');
    }

    // Load and parse CSV using D3
    const data = await d3.csv(filePath, (row, index) => {
      // Show progress every 10000 rows
      if (index % 10000 === 0 && index > 0) {
        console.log(`Loaded ${index} rows...`);
        updateLoadingText(`Loading data... ${index.toLocaleString()} records`);
      }

      // Parse and return each row
      return {
        Name: row.Name,
        Age: +row.Age || 0,  // Convert to number, default 0 if invalid
        Gender: row.Gender,
        'Blood Type': row['Blood Type'],
        'Medical Condition': row['Medical Condition'],
        'Date of Admission': parseDate(row['Date of Admission']),
        Doctor: row.Doctor,
        Hospital: row.Hospital,
        'Insurance Provider': row['Insurance Provider'],
        'Billing Amount': +row['Billing Amount'] || 0,
        'Room Number': +row['Room Number'] || 0,
        'Admission Type': row['Admission Type'],
        'Discharge Date': parseDate(row['Discharge Date']),
        Medication: row.Medication,
        'Test Results': row['Test Results'],
        // Add computed fields
        'Age Group': getAgeGroup(+row.Age)
      };
    });

    console.timeEnd('CSV Load Time');
    console.log(`✅ Successfully loaded ${data.length} records`);

    return data;

  } catch (error) {
    console.error('❌ Error loading CSV:', error);
    throw new Error(`Failed to load data: ${error.message}`);
  }
}

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string in format YYYY-MM-DD or MM/DD/YYYY
 * @returns {Date|null} - Parsed date or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get age group category
 * @param {number} age - Age in years
 * @returns {string} - Age group category
 */
function getAgeGroup(age) {
  if (age < 19) return '0-18';
  if (age < 41) return '19-40';
  if (age < 66) return '41-65';
  return '65+';
}

/**
 * Update loading text (if element exists)
 * @param {string} text - Loading message
 */
function updateLoadingText(text) {
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent = text;
  }
}

/**
 * Load CSV with progress tracking
 * @param {string} filePath - Path to CSV file
 * @param {function} onProgress - Callback for progress updates (optional)
 * @returns {Promise<Array>} - Array of parsed data
 */
export async function loadDataWithProgress(filePath, onProgress) {
  console.time('CSV Load with Progress');

  try {
    // Fetch the CSV file
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const totalLines = lines.length;

    console.log(`Total lines in CSV: ${totalLines}`);

    // Parse CSV with D3
    const data = await d3.csv(filePath, (row, index) => {
      // Report progress
      if (onProgress && index % 5000 === 0) {
        const progress = Math.round((index / totalLines) * 100);
        onProgress(progress, index);
      }

      return {
        Age: +row.Age || 0,
        Gender: row.Gender,
        'Blood Type': row['Blood Type'],
        'Medical Condition': row['Medical Condition'],
        'Admission Type': row['Admission Type'],
        'Billing Amount': +row['Billing Amount'] || 0,
        'Test Results': row['Test Results'],
        'Age Group': getAgeGroup(+row.Age)
      };
    });

    console.timeEnd('CSV Load with Progress');
    return data;

  } catch (error) {
    console.error('Error in loadDataWithProgress:', error);
    throw error;
  }
}

/**
 * Get basic statistics about the loaded data
 * @param {Array} data - Array of data objects
 * @returns {Object} - Statistics object
 */
export function getDataStats(data) {
  if (!data || data.length === 0) {
    return { error: 'No data provided' };
  }

  return {
    totalRecords: data.length,
    avgAge: d3.mean(data, d => d.Age).toFixed(1),
    avgBilling: d3.mean(data, d => d['Billing Amount']).toFixed(2),
    genderCounts: {
      Male: data.filter(d => d.Gender === 'Male').length,
      Female: data.filter(d => d.Gender === 'Female').length
    },
    ageGroups: {
      '0-18': data.filter(d => d['Age Group'] === '0-18').length,
      '19-40': data.filter(d => d['Age Group'] === '19-40').length,
      '41-65': data.filter(d => d['Age Group'] === '41-65').length,
      '65+': data.filter(d => d['Age Group'] === '65+').length
    }
  };
}

/**
 * Validate data quality
 * @param {Array} data - Array of data objects
 * @returns {Object} - Validation results
 */
export function validateData(data) {
  const issues = [];

  // Check for missing critical fields
  const missingAge = data.filter(d => !d.Age || d.Age === 0).length;
  const missingGender = data.filter(d => !d.Gender).length;
  const invalidBilling = data.filter(d => d['Billing Amount'] < 0).length;

  if (missingAge > 0) issues.push(`${missingAge} records with missing age`);
  if (missingGender > 0) issues.push(`${missingGender} records with missing gender`);
  if (invalidBilling > 0) issues.push(`${invalidBilling} records with negative billing`);

  return {
    isValid: issues.length === 0,
    totalRecords: data.length,
    issues: issues
  };
}