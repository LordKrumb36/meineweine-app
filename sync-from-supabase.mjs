import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from app folder
dotenv.config({ path: path.join(__dirname, 'meineweine-app', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Fehler: Supabase Keys nicht in meineweine-app/.env gefunden!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncBackup() {
  console.log('🔄 Starte Cloud-Backup von Supabase...');

  try {
    // 1. Daten von Supabase laden
    const { data: wines, error } = await supabase
      .from('wines')
      .select('*')
      .order('id');

    if (error) throw error;
    console.log(`✅ ${wines.length} Weine aus der Cloud geladen.`);

    // 2. wines.json im App-Ordner aktualisieren
    const jsonPath = path.join(__dirname, 'meineweine-app', 'src', 'data', 'wines.json');
    const appWines = wines.map(w => ({
      id: w.id.toString(),
      name: w.name,
      drinkingWindow: w.year ? `${w.year} – ${w.year + 10}` : 'jetzt trinken',
      rating: w.rating || '-',
      price: w.price ? `€${w.price.toFixed(2)}` : '-',
      taste: w.profile || '-',
      userRating: w.userRating || 0,
      userComment: w.userComment || '',
      inventory: w.inventory || 0
    }));
    fs.writeFileSync(jsonPath, JSON.stringify(appWines, null, 2));
    console.log('✅ meineweine-app/src/data/wines.json aktualisiert.');

    // 3. Weinlager_Details.txt aktualisieren (Markdown Format)
    const txtPath = path.join(__dirname, 'Weinlager_Details.txt');
    let txtContent = `# Weinlager Details (Backup aus Cloud vom ${new Date().toLocaleDateString('de-DE')})\n\n`;
    txtContent += `| Wine | Drinking Window | Expert Rating | Price | Inventory | User Rating | User Comment |\n`;
    txtContent += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    wines.forEach(w => {
      const price = w.price ? `€${w.price.toFixed(2)}` : '-';
      const ratingStars = '★'.repeat(w.userRating || 0);
      txtContent += `| ${w.name} | ${w.year ? w.year + ' - ' + (w.year + 8) : 'jetzt trinken'} | ${w.rating || '-'} | ${price} | ${w.inventory || 0} | ${ratingStars} | ${w.userComment || ''} |\n`;
    });

    fs.writeFileSync(txtPath, txtContent);
    console.log('✅ Weinlager_Details.txt (Backup) aktualisiert.');

    // 4. Excel Sync triggern (sync_weine.cjs nutzt jetzt die neue TXT)
    console.log('📊 Erstelle Excel-Bericht...');
    execSync('node sync_weine.cjs', { stdio: 'inherit' });

    console.log('\n✨ Backup erfolgreich abgeschlossen! Dein Weinkeller ist lokal gesichert.');
  } catch (err) {
    console.error('❌ Backup-Fehler:', err.message);
  }
}

syncBackup();
