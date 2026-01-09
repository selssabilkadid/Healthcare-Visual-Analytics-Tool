/**
 * Helper: Convert to number safely
 */
function toNumber(value) {
    const n = Number(value);
    return isNaN(n) ? null : n;
}

/**
 * Helper: Convert to date safely
 */
function toDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate summary stats for numeric array
 */
function stats(values) {
    const valid = values.filter(v => v != null);
    if (valid.length === 0) return null;

    const sum = valid.reduce((a, b) => a + b, 0);
    const mean = sum / valid.length;
    const sorted = [...valid].sort((a, b) => a - b);
    const median = sorted[Math.floor(valid.length / 2)];
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const std = Math.sqrt(valid.reduce((acc, v) => acc + (v - mean) ** 2, 0) / valid.length);

    return { count: valid.length, mean, median, min, max, std };
}

/**
 * Count missing values per column
 */
function missingValuesReport(data) {
    const columns = Object.keys(data[0]);
    const report = {};
    for (const col of columns) {
        report[col] = data.filter(row => row[col] == null || row[col] === '').length;
    }
    return report;
}

/**
 * Count frequency of categorical values
 */
function frequencyCount(data, column) {
    const counts = {};
    for (const row of data) {
        const value = row[column] || 'Unknown';
        counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
}

/**
 * Get column data types
 * @param {Array} data - Array of rows (objects)
 * @returns {Object} columnName: type
 */
export function getColumnTypes(data) {
    if (data.length === 0) return {};

    const columns = Object.keys(data[0]);
    const types = {};

    for (const col of columns) {
        const colTypes = data.map(row => {
            const val = row[col];
            if (val === null) return 'null';
            if (val instanceof Date) return 'Date';
            return typeof val;
        });

        // Get the set of unique types in the column
        const uniqueTypes = [...new Set(colTypes)];
        types[col] = uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes.join(' | ');
    }

    return types;
}


/**
 * Main preprocessing function
 * @param {Array} data - Array of CSV rows
 * @returns {Object} { cleanedData, summary }
 */
export function preprocessData(data) {
    // Step 1: Clean & feature engineering
    const cleanedData = data.map(row => {
        // Numeric conversion
        row.Age = toNumber(row.Age);
        row['Billing Amount'] = toNumber(row['Billing Amount']);
        row['Room Number'] = toNumber(row['Room Number']);

        // Date conversion
        row['Date of Admission'] = toDate(row['Date of Admission']);
        row['Discharge Date'] = toDate(row['Discharge Date']);

        // Missing values: categorical
        row.Gender = row.Gender || 'Unknown';
        row['Blood Type'] = row['Blood Type'] || 'Unknown';
        row['Medical Condition'] = row['Medical Condition'] || 'Unknown';
        row['Doctor'] = row['Doctor'] || 'Unknown';
        row['Hospital'] = row['Hospital'] || 'Unknown';
        row['Insurance Provider'] = row['Insurance Provider'] || 'Unknown';
        row['Admission Type'] = row['Admission Type'] || 'Unknown';

        // Derived feature: Length of stay
        if (row['Date of Admission'] && row['Discharge Date']) {
            const diffTime = row['Discharge Date'] - row['Date of Admission']; // ms
            row['Length of Stay'] = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
        } else {
            row['Length of Stay'] = null;
        }

        // Derived feature: Age group
        if (row.Age != null) {
            if (row.Age <= 18) row['Age Group'] = '0-18';
            else if (row.Age <= 40) row['Age Group'] = '19-40';
            else if (row.Age <= 65) row['Age Group'] = '41-65';
            else row['Age Group'] = '65+';
        } else {
            row['Age Group'] = 'Unknown';
        }

        return row;
    });

    // Step 2: Explore data
    const numericColumns = ['Age', 'Billing Amount', 'Length of Stay'];
    const categoricalColumns = ['Gender', 'Blood Type', 'Medical Condition', 'Admission Type', 'Age Group'];

    const summary = {
        missingValues: missingValuesReport(cleanedData),
        numericStats: {},
        categoricalFreq: {}
    };

    // Numeric summaries
    numericColumns.forEach(col => {
        summary.numericStats[col] = stats(cleanedData.map(row => row[col]));
    });

    // Categorical frequency counts
    categoricalColumns.forEach(col => {
        summary.categoricalFreq[col] = frequencyCount(cleanedData, col);
    });

    return { cleanedData, summary };
}
