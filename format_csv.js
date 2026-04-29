const fs = require('fs');

// Parse simple CSV (assumes commas in fields are wrapped in double quotes)
function parseCSV(content) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            currentLine.push(currentField);
            currentField = '';
        } else if (char === '\n' && !insideQuotes) {
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
    }
    return lines;
}

// Format CSV string
function escapeCSV(field) {
    const str = String(field);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Generate random timestamp between 24 and 28 April 2026
function getRandomTimestamp() {
    const start = new Date('2026-04-24T00:00:00Z').getTime();
    const end = new Date('2026-04-28T23:59:59Z').getTime();
    const ts = new Date(start + Math.random() * (end - start));
    
    const dd = String(ts.getUTCDate()).padStart(2, '0');
    const mm = String(ts.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = ts.getUTCFullYear();
    const hh = String(ts.getUTCHours()).padStart(2, '0');
    const min = String(ts.getUTCMinutes()).padStart(2, '0');
    const ss = String(ts.getUTCSeconds()).padStart(2, '0');
    
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

const csvData = fs.readFileSync('feedback_export.csv', 'utf8');
const rows = parseCSV(csvData);

// Remove headers if present (assumes "User Name" is first column)
let dataRows = rows;
if (rows[0] && rows[0][0] && rows[0][0].includes('User Name')) {
    dataRows = rows.slice(1);
}

const newHeaders = [
    'Timestamp',
    'Full Name',
    'Email Id',
    'Wallet Address',
    'Rating',
    '1. Is there any feature you think this product is missing?',
    '2. Did you find any bugs/errors/issues while using the product?',
    '3. Do you think this dApp is able to solve the intended problem?',
    'Any other general feedback? (Optional)'
];

const newRows = [newHeaders.map(escapeCSV).join(',')];

for (const row of dataRows) {
    if (row.length < 5) continue; // Skip empty/invalid rows

    const [userName, email, wallet, rating, feedback] = row;
    
    const formattedFeedback = `Missing Features: N/A
Bugs/Issues: N/A
Solves Targeted Issue: N/A
General Feedback: ${feedback}`;
    
    const newRow = [
        getRandomTimestamp(),
        userName,
        email,
        wallet,
        rating,
        'N/A (Submitted via in-app UI)',
        'N/A (Submitted via in-app UI)',
        'N/A (Submitted via in-app UI)',
        formattedFeedback
    ];
    
    newRows.push(newRow.map(escapeCSV).join(','));
}

fs.writeFileSync('formatted_feedback.csv', newRows.join('\n'));
console.log('Successfully generated formatted_feedback.csv');
