# Weinlager App - Workflow Overview (Stand: 04. April 2026)

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

## Technische Neuerungen (04.04.2026)
- **Dynamische Pfade:** Alle Skripte nutzen nun `__dirname`, was die App zwischen verschiedenen Verzeichnissen portabel macht.
- **Data Enrichment & Fachbewertungen:** Neue Weine werden automatisch mit Preis und Geschmacksprofilen angereichert. Bewertungen werden nach folgender Priorität recherchiert:
  1. **Falstaff / Eichelmann / Vinum:** (0–100 Punkte) Standard für DE, AT, IT.
  2. **Robert Parker / James Suckling:** Internationaler Standard.
  3. **Lobenberg / Mundus Vini:** Fundierte Händler- & Wettbewerbs-Scores.
  4. **Vivino:** Nur als Ergänzung (Nutzer-Durchschnitt).
  *(Est.) markiert fundierte Schätzungen basierend auf Vorjahrgängen oder Guide-Durchschnitten.*

## File Structure
- `Weinlager_Details.txt`: Master-Liste (Markdown).
- `Weinlager_Details.xlsx`: Excel-Bericht.
- `Weine.pdf`: Referenz-Quelle für Importe.
- `meineweine-app/src/data/wines.json`: Frontend-Datenquelle.
