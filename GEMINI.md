# Weinlager App - Workflow Overview (Stand: 05. April 2026)

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

## Technische Neuerungen (05.04.2026)
- **Erweiterte Sortierung:** Weine können nun im Frontend nach Preis (aufsteigend/absteigend), Fachbewertung (normalisierte 100-Punkte-Skala) und eigenem Urteil sortiert werden.
- **Data Parsing & Normalisierung:** Preis- und Bewertungsstrings (z. B. "€11.90", "91/100", "1.5*") werden zur korrekten Sortierung automatisch in numerische Werte konvertiert.
- **Dynamische Pfade (04.04.):** Alle Skripte nutzen nun `__dirname`, was die App zwischen verschiedenen Verzeichnissen portabel macht.
- **Data Enrichment & Fachbewertungen (04.04.):** Neue Weine werden automatisch mit Preis und Geschmacksprofilen angereichert. Bewertungen werden nach Priorität (Falstaff, Parker, Lobenberg, Vivino) recherchiert.
  *(Est.) markiert fundierte Schätzungen basierend auf Vorjahrgängen oder Guide-Durchschnitten.*

## File Structure
- `Weinlager_Details.txt`: Master-Liste (Markdown).
- `Weinlager_Details.xlsx`: Excel-Bericht.
- `Weine.pdf`: Referenz-Quelle für Importe.
- `meineweine-app/src/data/wines.json`: Frontend-Datenquelle.
