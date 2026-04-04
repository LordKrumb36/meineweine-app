const fs = require('fs');
const path = require('path');

const PROJECT_DIR = __dirname;
const TXT_FILE = path.join(PROJECT_DIR, 'Weinlager_Details.txt');
const EXPORT_FILE = path.join(PROJECT_DIR, 'mein_weinlager_export.json');
const APP_WINES_FILE = path.join(PROJECT_DIR, 'meineweine-app', 'src', 'data', 'wines.json');

try {
    const rawContent = fs.readFileSync(TXT_FILE, 'utf8');
    const txtLines = rawContent.split(/\r?\n/);
    const wines = [];
    let idCounter = 1;

    txtLines.forEach(line => {
        if (line.trim().startsWith('|') && !line.includes('Wine |') && !line.includes(':---')) {
            const cells = line.split('|').map(c => c.trim());
            if (cells[1]) {
                const stars = cells[6] || "";
                wines.push({
                    id: (idCounter++).toString(),
                    name: cells[1],
                    drinkingWindow: cells[2],
                    rating: cells[3],
                    price: cells[4] || "",
                    taste: cells[5] || "",
                    userRating: (stars.match(/★/g) || []).length,
                    userComment: cells[7] || ""
                });
            }
        }
    });

    const jsonContent = JSON.stringify(wines, null, 2);
    // Export-Datei und App-Daten synchronisieren
    fs.writeFileSync(EXPORT_FILE, jsonContent);
    
    // Sicherstellen, dass das Zielverzeichnis existiert
    const appDir = path.dirname(APP_WINES_FILE);
    if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
    }
    
    fs.writeFileSync(APP_WINES_FILE, jsonContent);
    console.log(`Erfolg! ${EXPORT_FILE} und ${APP_WINES_FILE} wurden mit ${wines.length} Weinen aus der Detail-Liste neu erstellt.`);

} catch (err) {
    console.error('Fehler:', err.message);
}
