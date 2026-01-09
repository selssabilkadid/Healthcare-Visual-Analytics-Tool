import { loadCSV } from './dataLoader.js';
import { preprocessData, getColumnTypes} from './preprocessing.js';

async function run() {
    const rawData = await loadCSV('../data/healthcare_dataset.csv');
    const { cleanedData, summary } = preprocessData(rawData);
    // Number of rows
    const numRows = cleanedData.length;
    // Number of columns
    const numCols = cleanedData.length > 0 ? Object.keys(cleanedData[0]).length : 0;
    
    console.log(`Dataset shape: ${numRows} rows x ${numCols} columns`);

    console.log('\n=== Column Data Types ===');
    const columnTypes = getColumnTypes(cleanedData);
    console.table(columnTypes);

    console.log('First 5 rows after preprocessing:');
    console.log(cleanedData.slice(0, 5));

    console.log('\n=== Missing Values Report ===');
    console.table(summary.missingValues);

    console.log('\n=== Numeric Columns Summary ===');
    console.table(summary.numericStats);

    console.log('\n=== Categorical Columns Frequency ===');
    for (const col in summary.categoricalFreq) {
        console.log(`\n${col}:`);
        console.table(summary.categoricalFreq[col]);
    }
}

run();
