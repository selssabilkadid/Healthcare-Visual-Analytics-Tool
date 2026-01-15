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
 * Helper: Standardize text names
 */
function standardizeName(name) {
    if (!name || typeof name !== 'string') return 'Unknown';
    return name
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,\s*$/, '')
        .replace(/\s+,/g, ',')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Helper: Identify bill type
 */
function getBillType(amount) {
    if (amount == null) return 'Unknown';
    return amount < 0 ? 'Refund' : 'Normal';
}

/**
 * Helper: Validate admission & discharge dates
 */
function isValidStay(admission, discharge) {
    if (!admission || !discharge) return null;
    return discharge > admission;
}

/**
 * Helper: Remove duplicate rows
 * Composite key: Name + Date of Admission + Billing Amount
 */
function dropDuplicates(data) {
    const seen = new Set();

    return data.filter(row => {
        const key = Object.keys(row)
            .sort()
            .map(col => {
                const val = row[col];
                if (val instanceof Date) return val.toISOString(); // handle dates
                return val ?? 'NA';
            })
            .join('|');

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
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
    const std = Math.sqrt(
        valid.reduce((acc, v) => acc + (v - mean) ** 2, 0) / valid.length
    );

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
        const value = row[column] ?? 'Unknown';
        counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
}

/**
 * Get column data types
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

        const uniqueTypes = [...new Set(colTypes)];
        types[col] = uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes.join(' | ');
    }

    return types;
}

/**
 * Main preprocessing function
 */
export function preprocessData(data) {

    const cleanedData = dropDuplicates(
        data.map(row => {
            // Standardize text
            row.Name = standardizeName(row.Name);
            row.Doctor = standardizeName(row.Doctor);
            row.Hospital = standardizeName(row.Hospital);

            // Numeric conversion
            row.Age = toNumber(row.Age);
            row['Billing Amount'] = toNumber(row['Billing Amount']);
            row['Room Number'] = toNumber(row['Room Number']);

            // Date conversion
            row['Date of Admission'] = toDate(row['Date of Admission']);
            row['Discharge Date'] = toDate(row['Discharge Date']);

            // Fill missing categorical values
            row.Gender = row.Gender || 'Unknown';
            row['Blood Type'] = row['Blood Type'] || 'Unknown';
            row['Medical Condition'] = row['Medical Condition'] || 'Unknown';
            row['Doctor'] = row['Doctor'] || 'Unknown';
            row['Hospital'] = row['Hospital'] || 'Unknown';
            row['Insurance Provider'] = row['Insurance Provider'] || 'Unknown';
            row['Admission Type'] = row['Admission Type'] || 'Unknown';

            // Derived feature: Type of Bill
            row['Type of Bill'] = getBillType(row['Billing Amount']);

            // Date validation
            row['Dates Valid'] = isValidStay(
                row['Date of Admission'],
                row['Discharge Date']
            );

            // Length of Stay (only if dates valid)
            if (row['Dates Valid']) {
                const diffTime = row['Discharge Date'] - row['Date of Admission'];
                row['Length of Stay'] = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
                row['Length of Stay'] = null;
            }

            // Age group
            if (row.Age != null) {
                if (row.Age <= 18) row['Age Group'] = '0-18';
                else if (row.Age <= 40) row['Age Group'] = '19-40';
                else if (row.Age <= 65) row['Age Group'] = '41-65';
                else row['Age Group'] = '65+';
            } else {
                row['Age Group'] = 'Unknown';
            }

            return row;
        })
    );

    // Summary
    const numericColumns = ['Age', 'Billing Amount', 'Length of Stay'];
    const categoricalColumns = [
        'Gender',
        'Blood Type',
        'Medical Condition',
        'Admission Type',
        'Age Group',
        'Type of Bill',
        'Dates Valid'
    ];

    const summary = {
        missingValues: missingValuesReport(cleanedData),
        numericStats: {},
        categoricalFreq: {}
    };

    numericColumns.forEach(col => {
        summary.numericStats[col] = stats(cleanedData.map(row => row[col]));
    });

    categoricalColumns.forEach(col => {
        summary.categoricalFreq[col] = frequencyCount(cleanedData, col);
    });

    return { cleanedData, summary };
}
