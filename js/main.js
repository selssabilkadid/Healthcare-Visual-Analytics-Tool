import fs from 'fs';
import { loadCSV } from './dataLoader.js';
import { preprocessData, getColumnTypes } from './preprocessing.js';

/**
 * Helper: count duplicates using the SAME key as preprocessing
 */
function countDuplicates(data) {
    const seen = new Set();
    let duplicates = 0;

    data.forEach(row => {
        // Create a key using ALL columns
        const key = Object.keys(row)
            .sort() // ensure consistent order
            .map(col => row[col] ?? 'NA') // replace null/undefined with 'NA'
            .join('|');

        if (seen.has(key)) {
            duplicates++;
        } else {
            seen.add(key);
        }
    });

    return duplicates;
}


/**
 * Helper: save CSV
 */
function saveCSV(data, filePath) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // header row
        ...data.map(row =>
            headers.map(h => {
                const value = row[h];
                if (value instanceof Date) return value.toISOString();
                if (value === null || value === undefined) return '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ];

    fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
}

async function run() {
    const rawData = await loadCSV('../data/healthcare_dataset.csv');

    // Dataset Shape before cleaning 
    const numRows_raw = rawData.length;
    const numCols_raw = rawData.length > 0 ? Object.keys(rawData[0]).length : 0;
    console.log(`Dataset shape before cleaning: ${numRows_raw} rows x ${numCols_raw} columns`);

    // 🔹 Count duplicates BEFORE preprocessing
    const duplicateCount = countDuplicates(rawData);
    console.log(`Duplicates before cleaning: ${duplicateCount}`);

    // 🔹 Preprocess (duplicates dropped inside)
    const { cleanedData, summary } = preprocessData(rawData);

    // Dataset shape
    const numRows = cleanedData.length;
    const numCols = cleanedData.length > 0 ? Object.keys(cleanedData[0]).length : 0;
    console.log(`Dataset shape after cleaning: ${numRows} rows x ${numCols} columns`);

    // Column types
    console.log('\n=== Column Data Types ===');
    console.table(getColumnTypes(cleanedData));

    // Uniques
    console.log('Unique hospitals:', new Set(cleanedData.map(r => r.Hospital)).size);
    console.log('Unique patients:', new Set(cleanedData.map(r => r.Name)).size);
    console.log('Unique providers:', new Set(cleanedData.map(r => r['Insurance Provider'])).size);
    console.log('Unique doctors:', new Set(cleanedData.map(r => r.Doctor)).size);

    // Preview
    console.log('\nFirst 5 rows after preprocessing:');
    console.log(cleanedData.slice(0, 5));

    // Summary
    console.log('\n=== Missing Values Report ===');
    console.table(summary.missingValues);

    console.log('\n=== Numeric Columns Summary ===');
    console.table(summary.numericStats);

    console.log('\n=== Categorical Columns Frequency ===');
    for (const col in summary.categoricalFreq) {
        console.log(`\n${col}:`);
        console.table(summary.categoricalFreq[col]);
    }

    // 🔹 Save cleaned dataset
    saveCSV(cleanedData, '../data/healthcare_dataset_cleaned.csv');
    console.log('\nCleaned dataset saved to healthcare_dataset_cleaned.csv');
}

run();
