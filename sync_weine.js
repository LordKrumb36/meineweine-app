const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Dynamische Pfaderkennung
const PROJECT_DIR = __dirname;
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
    // Falls kein Export da ist, versuchen wir trotzdem weiterzumachen (nur ohne App-Daten Sync)
    let exportData = [];
    if (fs.existsSync(EXPORT_FILE)) {
        try {
            exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
        } catch (e) {
            console.log("Hinweis: Konnte Export-Datei nicht parsen.");
        }
    }

    try {
        let pdfWarning = "";
        let newPdfWinesAdded = false;

        // 1. Process PDF first
        if (fs.existsSync(PDF_FILE)) {
            try {
                // Versuche pdf-parse aus dem lokalen oder App-Verzeichnis zu laden
                let pdf;
                try {
                    pdf = require('pdf-parse');
                } catch (e) {
                    const appPdfPath = path.join(PROJECT_DIR, 'meineweine-app', 'node_modules', 'pdf-parse');
                    if (fs.existsSync(appPdfPath)) {
                        pdf = require(appPdfPath);
                    }
                }

                if (pdf) {
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
                    const existingLines = existingContent.split(/\r?\n/);
                    const existingNames = existingLines
                        .filter(l => l.trim().startsWith('|') && !l.includes('Wine |') && !l.includes(':---'))
                        .map(l => normalizeName(l.split('|')[1].trim()));

                    const missingFromPDF = pdfWines.filter(w => {
                        const norm = normalizeName(w.name);
                        return norm.length > 3 && !existingNames.includes(norm);
                    });
                    
                    if (missingFromPDF.length > 0) {
                        const newRows = missingFromPDF.map(w => `| ${w.name} | jetzt trinken | - | - |  |  | ${w.comment} |`);
                        fs.writeFileSync(TXT_FILE, existingContent.trimEnd() + '\n' + newRows.join('\n') + '\n');
                        pdfWarning = `\n✅ ${missingFromPDF.length} neue Weine aus Weine.pdf wurden automatisch importiert.`;
                        newPdfWinesAdded = true;
                    }
                }
            } catch (pdfErr) {
                console.log("PDF-Import übersprungen: " + pdfErr.message);
            }
        }

        // 2. Now process TXT to EXCEL as normal
        let txtRaw = fs.readFileSync(TXT_FILE, 'utf8');
        let txtLines = txtRaw.split(/\r?\n/);

        const tableData = [];
        const updatedContent = txtLines.map(line => {
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
            // Suche in Export-Daten nach Bewertungen/Kommentaren
            const userData = exportData.find(w => normalizeName(w.name) === normalizeName(wineName));

            if (userData) {
                if (userData.userRating && !cells[6]) {
                    cells[6] = '★'.repeat(userData.userRating);
                }
                if (userData.userComment && !cells[7]) {
                    cells[7] = userData.userComment;
                }
            }

            const rowData = cells.slice(1, -1);
            if (rowData.length > 0) {
                tableData.push(rowData);
            }
            return cells.join(' | ').trim();
        });

        fs.writeFileSync(TXT_FILE, updatedContent.join('\n'));

        if (tableData.length > 0) {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(tableData);

            const colWidths = tableData[0].map((_, i) => ({
                wch: Math.max(...tableData.map(row => row[i] ? row[i].toString().length : 0)) + 2
            }));
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Weinlager');
            XLSX.writeFile(wb, EXCEL_FILE);
        }

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
            
            const missingFromInventory = uniqueOrdered.filter(o => {
                const norm = normalizeName(o);
                return norm.length > 3 && !detailNormalized.includes(norm);
            });
            
            if (missingFromInventory.length > 0) {
                orderWarning = `\n⚠️ ${missingFromInventory.length} Weine aus Bestellungen fehlen in Details! (z.B. ${missingFromInventory[0].substring(0, 30)}...)`;
            }
        }

        const message = `✅ Synchronisation abgeschlossen: '${TXT_FILE}' und '${EXCEL_FILE}' wurden aktualisiert.${orderWarning}${pdfWarning}`;
        console.log(JSON.stringify({
            systemMessage: message
        }));

    } catch (err) {
        console.log(JSON.stringify({
            systemMessage: `❌ Fehler bei der Synchronisation: ${err.message}`
        }));
    }
}

runSync();