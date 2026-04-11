# Weinlager App - Workflow Overview (Stand: 11. April 2026)

## Core Commands
- **Start Development & Sync Servers:** 
  ```powershell
  cd meineweine-app
  npm run dev:all
  ```
  - App: `http://localhost:5173`
  - Sync Server: `http://localhost:3001` (Runs in background)

- **Cloud Backup (Cloud -> Lokal):**
  ```powershell
  # Im Hauptverzeichnis ausführen
  npm run backup
  ```
  - Lädt alle Daten aus Supabase (Cloud) herunter.
  - Aktualisiert `Weinlager_Details.txt` und `Weinlager_Details.xlsx` lokal.

## Application Workflow
1. **Online Nutzung (Handy/PC):** Nutze [https://meineweine-app.vercel.app/](https://meineweine-app.vercel.app/).
2. **Datenänderung:** Alle Ratings, Kommentare und Bestandsänderungen gehen direkt in die **Supabase Cloud**.
3. **Lokales Backup & Excel:** Führe `npm run backup` am PC aus, um deine lokalen Dateien (`.txt`, `.xlsx`, `.json`) mit der Cloud zu synchronisieren.
4. **PDF-Import:** Neue Weine in `Weine.pdf` werden beim lokalen Sync weiterhin in `Weinlager_Details.txt` importiert und können danach in die Cloud migriert werden.

## Technische Neuerungen & Updates (11.04.2026)
- **Full Cloud Migration (11.04.):** Die App nutzt nun **Supabase** als zentrale Datenbank. Alle Daten (Weine, Ratings, Kommentare, Bestand) sind auf allen Geräten synchron.
- **Vercel Deployment (11.04.):** Die App ist unter einer öffentlichen URL erreichbar und nutzt Vercel Environment Variables für die DB-Anbindung.
- **Cloud-to-Local Sync (11.04.):** Neues Backup-System (`npm run backup`) sichert Cloud-Daten lokal in TXT und Excel.
- **User-Daten Sync (10.04.):** Manuelle User-Bewertungen werden konsistent synchronisiert.
- **Erweiterte Sortierung (05.04.):** Weine im Frontend nach Preis, Fachbewertung und eigenem Urteil sortierbar.

## File Structure
- `Weinlager_Details.txt`: Lokales Master-Backup (Markdown).
- `Weinlager_Details.xlsx`: Lokaler Excel-Bericht.
- `sync-from-supabase.mjs`: Script für Cloud -> Lokal Sync.
- `meineweine-app/src/utils/supabaseClient.ts`: Cloud-Anbindung.
- `meineweine-app/src/data/wines.json`: Lokale Kopie der Frontend-Datenquelle.
