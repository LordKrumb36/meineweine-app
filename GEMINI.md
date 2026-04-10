# Weinlager App - Workflow Overview (Stand: 10. April 2026)

## Core Commands
- **Start Development & Sync Servers:** 
  ```powershell
  cd meineweine-app
  npm run dev:all
  ```
  - App: `http://localhost:5173`
  - Sync Server: `http://localhost:3001` (Runs in background)

## Application Workflow
1. **Add Wine:** Use the "Wein hinzufügen" button in the app. Es schreibt direkt in `Weinlager_Details.txt`.
2. **Synchronize:** Click the **"Synchronisieren"** button. Das triggert:
   - `sync_weine.js`: Schreibt von TXT in Excel (`.xlsx`).
   - `sync_to_export.js`: Schreibt von TXT in JSON (`wines.json`).
3. **Auto-Import & Monitoring:** 
   - **Weine.pdf:** Neue Einträge in der PDF werden beim Sync automatisch als neue Zeilen in `Weinlager_Details.txt` importiert.
   - **Bestellungen:** `bestellungen lobenberg.txt` wird auf Vollständigkeit geprüft.

## Technische Neuerungen & Updates (10.04.2026)
- **User-Daten Sync (10.04.):** Manuelle User-Bewertungen und Kommentare (z.B. ID 55) werden nun über Git versioniert und konsistent in alle Export-Formate (`.json`, `.xlsx`) synchronisiert.
- **Erweiterte Sortierung (05.04.):** Weine können im Frontend nach Preis, Fachbewertung (normalisierte 100-Punkte-Skala) und eigenem Urteil sortiert werden.
- **Data Parsing & Normalisierung:** Automatische Konvertierung von Preis- und Bewertungsstrings in numerische Werte zur korrekten Sortierung.
- **Dynamische Pfade:** Alle Skripte nutzen `__dirname` für Verzeichnis-Portabilität.

## Zukünftige Planung (Cloud Migration)
- **Supabase Integration:** Umstellung von lokalen Files auf eine Cloud-Datenbank für Smartphone-Zugriff von unterwegs.
- **Vercel Serverless Functions:** Ablösung des lokalen `server.js` für echten Online-Betrieb der Vercel-App.
- **Authentication:** Implementierung eines Logins für sicheren, privaten Zugriff über das Internet.

## File Structure
- `Weinlager_Details.txt`: Master-Liste (Markdown).
- `Weinlager_Details.xlsx`: Excel-Bericht.
- `Weine.pdf`: Referenz-Quelle für Importe.
- `meineweine-app/src/data/wines.json`: Frontend-Datenquelle.
