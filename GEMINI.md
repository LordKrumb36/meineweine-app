# Weinlager App - Workflow Overview (Stand: 15. April 2026)

## Core Commands
- **Cloud Backup (Cloud -> Lokal):**
  ```powershell
  # Im Hauptverzeichnis ausführen
  npm run backup
  ```
  - Lädt alle Daten (Weine, Ratings, Kommentare, Bestand) aus Supabase herunter.
  - Aktualisiert `Weinlager_Details.txt` und `Weinlager_Details.xlsx` lokal.
  - Aktualisiert `meineweine-app/src/data/wines.json` als lokale Datenquelle.

- **Lokale Entwicklung:**
  ```powershell
  cd meineweine-app
  npm run dev
  ```
  - Startet die App lokal unter `http://localhost:5173`.
  - Greift direkt auf die Supabase Cloud-Datenbank zu.

## Application Workflow
1. **Online Nutzung (Handy/PC):** Nutze [https://meineweine-app.vercel.app/](https://meineweine-app.vercel.app/).
2. **Datenänderung:** Jede Änderung (Hinzufügen, Bearbeiten, Löschen, Rating, Kommentar, Flaschenanzahl) wird **sofort** in die Supabase Cloud synchronisiert.
3. **Lokales Backup & Excel:** Führe regelmäßig `npm run backup` am PC aus, um deine lokalen Dateien (`.txt`, `.xlsx`) zu aktualisieren.
4. **Mobile Nutzung:** Die App ist optimiert für Smartphones mit einem ausklappbaren Hamburger-Menü und permanent sichtbaren Aktions-Buttons (Edit/Löschen).

## Technische Highlights
- **Full Cloud Persistence:** Zentrale Datenhaltung in Supabase (PostgreSQL).
- **Vercel Deployment:** Automatischer Build & Deploy bei jedem Git-Push.
- **Responsive Design:** 
  - Sidebar-Overlay für mobile Geräte.
  - Aktions-Buttons (Stift, X) sind mobil immer sichtbar, am PC erst bei Hover.
  - Layout-Schutz gegen Überlagerung von Buttons und Ratings auf schmalen Displays.
- **Datenverwaltung:** 
  - Volle CRUD-Unterstützung (Create, Read, Update, Delete) über das UI.
  - Erweiterte Sortierung: Name, Preis, Rating, Jahrgang und "Neu hinzugefügt" (Standard).
- **ID-Management:** Manuelle ID-Vergabe (Max+1) für neue Weine zur Gewährleistung der Konsistenz.

## File Structure
- `Weinlager_Details.txt`: Lokales Master-Backup im Markdown-Format.
- `Weinlager_Details.xlsx`: Generierter Excel-Bericht für die Offline-Ansicht.
- `sync-from-supabase.mjs`: Zentrales Backup-Skript (Cloud -> Lokal).
- `meineweine-app/src/utils/supabaseClient.ts`: Verbindungskonfiguration zur Cloud.
- `meineweine-app/src/App.tsx`: Hauptanwendung mit Cloud-Logik, mobilem Menü und CRUD-Funktionen.
