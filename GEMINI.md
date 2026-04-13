# Weinlager App - Workflow Overview (Stand: 13. April 2026)

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
2. **Datenänderung:** Jede Änderung (Hinzufügen, Löschen, Rating, Kommentar, Flaschenanzahl) wird **sofort** in die Supabase Cloud synchronisiert.
3. **Lokales Backup & Excel:** Führe regelmäßig `npm run backup` am PC aus, um deine lokalen Dateien (`.txt`, `.xlsx`) zu aktualisieren.
4. **Mobile Nutzung:** Die App ist optimiert für Smartphones mit einem ausklappbaren Hamburger-Menü für die Sidebar.

## Technische Highlights
- **Full Cloud Persistence:** Zentrale Datenhaltung in Supabase (PostgreSQL). Neue Weine erhalten automatisch IDs und werden formatiert.
- **Vercel Deployment:** Automatischer Build & Deploy bei jedem Git-Push.
- **Responsive Design:** Sidebar-Overlay für mobile Geräte und kompakte Header-Anzeige.
- **Robustes Error-Handling:** Die App erkennt Verbindungsabbrüche und liefert detaillierte Fehlermeldungen bei Supabase-Problemen.
- **Datenverwaltung:** Volle CRUD-Unterstützung (Erstellen, Lesen, Aktualisieren, Löschen) direkt über das UI.

## File Structure
- `Weinlager_Details.txt`: Lokales Master-Backup im Markdown-Format.
- `Weinlager_Details.xlsx`: Generierter Excel-Bericht für die Offline-Ansicht.
- `sync-from-supabase.mjs`: Zentrales Backup-Skript (Cloud -> Lokal).
- `meineweine-app/src/utils/supabaseClient.ts`: Verbindungskonfiguration zur Cloud.
- `meineweine-app/src/App.tsx`: Hauptanwendung mit Cloud-Logik, mobilem Menü und CRUD-Funktionen.
