import fs from 'fs';
import Papa from 'papaparse';

export function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.readFileSync(filePath, 'utf8');
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: results => resolve(results.data),
            error: err => reject(err)
        });
    });
}
