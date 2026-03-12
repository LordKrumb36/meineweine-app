const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PROJECT_DIR = 'C:\\Users\\Brend\\Weinlager';
const TXT_FILE = path.join(PROJECT_DIR, 'Weinlager_Details.txt');
const EXCEL_FILE = path.join(PROJECT_DIR, 'Weinlager_Details.xlsx');
const EXPORT_FILE = path.join(PROJECT_DIR, 'mein_weinlager_export.json');
const ORDERS_FILE = path.join(PROJECT_DIR, 'bestellungen lobenberg.txt');
const PDF_FILE = path.join(PROJECT_DIR, 'Weine.pdf');

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

async function runSync() {
    if (!fs.existsSync(EXPORT_FILE)) {
        console.log(JSON.stringify({
            systemMessage: `⚠️ '${EXPORT_FILE}' nicht gefunden. Bitte exportiere die Datei aus der App.`
        }));
        process.exit(0);
    }

    try {
        let pdfWarning = "";
        let newPdfWinesAdded = false;

        // 1. Process PDF first
        if (fs.existsSync(PDF_FILE)) {
            const pdfParsePath = path.join(PROJECT_DIR, 'meineweine-app', 'node_modules', 'pdf-parse');
            if (fs.existsSync(pdfParsePath)) {
                const pdf = require(pdfParsePath);
                const dataBuffer = fs.readFileSync(PDF_FILE);
                const pdfData = await pdf(dataBuffer);
                const textLines = pdfData.text.split(/\r?\n/);
                
                const pdfWines = [];
                for (let i = 0; i < textLines.length; i++) {
                    const line = textLines[i].trim();
                    if (line.length > 0 && (i === 0 || textLines[i-1].trim() === '')) {
                        let comment = "";
                        if (i + 1 < textLines.length && textLines[i+1].trim() !== '') {
                            comment = textLines[i+1].trim();
                        }
                        pdfWines.push({ name: line, comment: comment });
                    }
                }
                
                const existingContent = fs.readFileSync(TXT_FILE, 'utf8');
                const existingNames = existingContent.split(/\r?\n/)
                    .filter(l => l.trim().startsWith('|') && !l.includes('Wine |') && !l.includes(':---'))
                    .map(l => normalizeName(l.split('|')[1].trim()));

                const missingFromPDF = pdfWines.filter(w => !existingNames.includes(normalizeName(w.name)));
                
                if (missingFromPDF.length > 0) {
                    const newRows = missingFromPDF.map(w => `| ${w.name} |  |  |  |  |  | ${w.comment} |`);
                    fs.writeFileSync(TXT_FILE, existingContent.trimEnd() + '\n' + newRows.join('\n') + '\n');
                    pdfWarning = `\n✅ ${missingFromPDF.length} neue Weine aus Weine.pdf wurden automatisch importiert.`;
                    newPdfWinesAdded = true;
                }
            }
        }

        // 2. Now process TXT to EXCEL as normal
        const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
        let txtContent = fs.readFileSync(TXT_FILE, 'utf8').split(/\r?\n/);

        const tableData = [];
        const updatedContent = txtContent.map(line => {
            if (!line.trim().startsWith('|') || line.includes(':---')) {
                return line;
            }

            const cells = line.split('|').map(c => c.trim());
            
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

        fs.writeFileSync(TXT_FILE, updatedContent.join('\n'));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(tableData);

        const colWidths = tableData[0].map((_, i) => ({
            wch: Math.max(...tableData.map(row => row[i] ? row[i].toString().length : 0)) + 2
        }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Weinlager');
        XLSX.writeFile(wb, EXCEL_FILE);

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

        const message = `✅ Synchronisation abgeschlossen: '${TXT_FILE}' und '${EXCEL_FILE}' wurden aktualisiert.${orderWarning}${pdfWarning}`;
        console.log(JSON.stringify({
            systemMessage: message,
            hookSpecificOutput: {
                additionalContext: "Die Weinlager-Daten wurden erfolgreich synchronisiert. " + (orderWarning ? "Einige bestellte Weine fehlen. " : "") + (newPdfWinesAdded ? "Neue Weine aus der PDF wurden importiert." : "")
            }
        }));

    } catch (err) {
        console.log(JSON.stringify({
            systemMessage: `❌ Fehler bei der Synchronisation: ${err.message}`
        }));
    }
}

runSync();