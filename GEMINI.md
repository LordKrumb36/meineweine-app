# Weinlager App - Workflow Overview

Whenever this workspace is opened, Gemini CLI MUST provide the following overview to the user.

## Core Commands
- **Start Development & Sync Servers:** 
  ```powershell
  cd meineweine-app
  npm run dev:all
  ```
  - App: `http://localhost:5173`
  - Sync Server: `http://localhost:3001` (Runs in background)

## Application Workflow
1. **Add Wine:** Use the "Wein hinzufügen" button in the app. It appends new entries directly to `Weinlager_Details.txt` and **automatically triggers a full sync** (Excel, JSON & App data).
2. **Rate/Comment:** Update ratings or notes in the app.
3. **Synchronize:** Click the **"Synchronisieren"** button in the app's sidebar. This **automatically updates all files** (TXT, Excel, and static app data) on your disk.
4. **Auto-Import & Monitoring:** 
   - **Weine.pdf:** Weine aus der PDF werden beim Sync automatisch in dein Lager importiert, falls sie dort noch fehlen.
   - **Bestellungen:** `bestellungen lobenberg.txt` wird beim Sync geprüft; du erhältst eine Warnung, falls bestellte Weine noch nicht im Lager erfasst sind.

*Note: You no longer need to run manual sync scripts; the app handles everything upon clicking "Synchronisieren" or adding a wine.*

## File Structure
- `Weinlager_Details.txt`: Master Markdown-Tabelle (Die "Basis").
- `Weine.pdf`: Referenz-PDF (Wird automatisch eingelesen und importiert).
- `bestellungen lobenberg.txt`: Bestell-Referenz (Wird beim Sync auf Vollständigkeit geprüft).
- `Weinlager_Details.xlsx`: Excel-Übersicht (Automatisch aktualisiert).
- `meineweine-app/src/data/wines.json`: Statische App-Daten (Automatisch aktualisiert).
