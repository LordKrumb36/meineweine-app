const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PROJECT_DIR = 'C:\\Users\\Brend\\Weinlager';
const TXT_FILE = path.join(PROJECT_DIR, 'Weinlager_Details.txt');
const EXCEL_FILE = path.join(PROJECT_DIR, 'Weinlager_Details.xlsx');
const EXPORT_FILE = path.join(PROJECT_DIR, 'mein_weinlager_export.json');
const ORDERS_FILE = path.join(PROJECT_DIR, 'bestellungen lobenberg.txt');

function normalizeName(name) {
    if (!name) return '';
    return name
        .replace(/^(Österreich|Spanien|Italien|Frankreich|Deutschland|Argentinien|Portugal)\s+/i, '')
        .split('0,75l')[0]
        .replace(/\s+(rot|Bio|Biowein|rosé|trocken|weiß)\b.*/gi, '')
        .replace(/\((AT|ES|IT|FR|DE|AR|PT|AU)\)/gi, '')
        .replace(/[\u00c0-\u017f]/g, (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        .replace(/--/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

if (!fs.existsSync(EXPORT_FILE)) {
    console.log(JSON.stringify({
        systemMessage: `⚠️ '${EXPORT_FILE}' nicht gefunden. Bitte exportiere die Datei aus der App.`
    }));
    process.exit(0);
}

try {
    const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
    let txtContent = fs.readFileSync(TXT_FILE, 'utf8').split(/\r?\n/);

    const tableData = [];
    const updatedContent = txtContent.map(line => {
        if (!line.trim().startsWith('|') || line.includes(':---')) {
            return line;
        }

        const cells = line.split('|').map(c => c.trim());
        // Markdown split creates empty first and last elements if line starts/ends with |
        // Index mapping for our table:
        // [0] empty, [1] Wine, [2] Trinkreife, [3] Bewertung, [4] Preis, [5] Geschmack, [6] Meine Bewertung, [7] Kommentar, [8] empty
        
        if (line.includes('Wine |')) {
            const headers = cells.slice(1, -1);
            tableData.push(headers);
            return line;
        }

        const wineName = cells[1];
        const userData = exportData.find(w => w.name === wineName);

        if (userData) {
            cells[6] = userData.userRating > 0 ? '★'.repeat(userData.userRating) : '';
            cells[7] = userData.userComment || '';
        }

        const rowData = cells.slice(1, -1);
        tableData.push(rowData);
        return cells.join(' | ').trim();
    });

    // Write TXT file
    fs.writeFileSync(TXT_FILE, updatedContent.join('\n'));

    // Write EXCEL file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(tableData);

    // Auto-width adjustment (basic)
    const colWidths = tableData[0].map((_, i) => ({
        wch: Math.max(...tableData.map(row => row[i] ? row[i].toString().length : 0)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Weinlager');
    XLSX.writeFile(wb, EXCEL_FILE);

    // Order Sync Check
    let orderWarning = "";
    if (fs.existsSync(ORDERS_FILE)) {
        const ordersRaw = fs.readFileSync(ORDERS_FILE, 'utf8');
        const orderLines = ordersRaw.split(/\r?\n/);
        const orderedWines = [];
        for (let i = 0; i < orderLines.length; i++) {
            if (i > 0 && orderLines[i-1].includes(' Fl ')) {
                orderedWines.push(orderLines[i].trim());
            }
        }
        
        const uniqueOrdered = [...new Set(orderedWines)];
        const detailNormalized = tableData.slice(1).map(row => normalizeName(row[0]));
        
        const missingFromInventory = uniqueOrdered.filter(o => !detailNormalized.includes(normalizeName(o)));
        
        if (missingFromInventory.length > 0) {
            orderWarning = `\n⚠️ ${missingFromInventory.length} Weine aus Bestellungen fehlen in Details! (z.B. ${missingFromInventory[0].substring(0, 30)}...)`;
        }
    }

    const message = `✅ Synchronisation abgeschlossen: '${TXT_FILE}' und '${EXCEL_FILE}' wurden aktualisiert.${orderWarning}`;
    console.log(JSON.stringify({
        systemMessage: message,
        hookSpecificOutput: {
            additionalContext: "Die Weinlager-Daten wurden erfolgreich synchronisiert. " + (orderWarning ? "Einige bestellte Weine fehlen noch in der Detail-Liste." : "Alle bestellten Weine sind erfasst.")
        }
    }));

} catch (err) {
    console.log(JSON.stringify({
        systemMessage: `❌ Fehler bei der Synchronisation: ${err.message}`
    }));
}
