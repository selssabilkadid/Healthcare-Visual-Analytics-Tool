// js/dataLoader.js - BROWSER VERSION
// No imports needed - d3 is loaded globally via <script> tag

/**
 * Load CSV data using D3.js (browser-compatible)
 * @param {string} filePath - Path to CSV file (e.g., './data/healthcare_dataset.csv')
 * @returns {Promise<Array>} - Array of parsed data objects
 */
export async function loadData(filePath = './data/healthcare_dataset_with_coords.csv') {
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
      }

      // Parse and return each row
      return {
        Name: row.Name,
        Age: +row.Age || 0,  // Convert to number, default 0 if invalid
        Gender: row.Gender,
        'Blood Type': row['Blood Type'],
        'Medical Condition': row['Medical Condition'],
        'Date of Admission': row['Date of Admission'],
        Doctor: row.Doctor,
        Hospital: row.Hospital,
        'Insurance Provider': row['Insurance Provider'],
        'Billing Amount': +row['Billing Amount'] || 0,
        'Room Number': +row['Room Number'] || 0,
        'Admission Type': row['Admission Type'],
        'Discharge Date': row['Discharge Date'],
        Medication: row.Medication,
        'Test Results': row['Test Results'],
        // Additional fields 
        'Type of Bill': row['Type of Bill'],
        'Dates Valid': row['Dates Valid'],
        'Length of Stay': row['Length of Stay'],
        'Age Group': row['Age Group'],
        'City': row['City'],
        'Country': row['Country'],
        'Latitude': row['Latitude'],
        'Longitude': row['Longitude']
      };
    });

    console.timeEnd('CSV Load Time');
    console.log(`Successfully loaded ${data.length} records`);

    return data;

  } catch (error) {
    console.error('Error loading CSV:', error);
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
      // if (onProgress && index % 5000 === 0) {
      //   const progress = Math.round((index / totalLines) * 100);
      //   onProgress(progress, index);
      // }

      return {
        Age: +row.Age || 0,
        Gender: row.Gender,
        'Blood Type': row['Blood Type'],
        'Medical Condition': row['Medical Condition'],
        'Admission Type': row['Admission Type'],
        'Billing Amount': row['Billing Amount'] ,
        'Test Results': row['Test Results'],
        // Additional fields 
        'Type of Bill': row['Type of Bill'],
        'Dates Valid': row['Dates Valid'],
        'Length of Stay': row['Length of Stay'],
        'Age Group': row['Age Group'],
        'City': row['City'],
        'Country': row['Country'],
        'Latitude': row['Latitude'],
        'Longitude': row['Longitude']
      };
    });

    console.timeEnd('CSV Load with Progress');
    return data;

  } catch (error) {
    console.error('Error in loadDataWithProgress:', error);
    throw error;
  }
}