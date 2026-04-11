import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  const winesPath = path.join(__dirname, 'src', 'data', 'wines.json');
  const wines = JSON.parse(fs.readFileSync(winesPath, 'utf8'));

  console.log(`Starting migration of ${wines.length} wines...`);

  const formattedWines = wines.map(w => {
    // Extract year from name (e.g., "2022")
    const yearMatch = w.name.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;

    // Extract country from name (e.g., "(IT)")
    const countryMatch = w.name.match(/\(([A-Z]{2,3})\)$/);
    const country = countryMatch ? countryMatch[1] : null;

    // Parse price (e.g., "€11.90" -> 11.9)
    const priceStr = w.price.replace(/[€$~\s]/g, '').replace(',', '.');
    const price = parseFloat(priceStr) || 0;

    return {
      id: parseInt(w.id),
      name: w.name,
      type: w.name.toLowerCase().includes('rosé') ? 'Rosé' : (w.name.toLowerCase().includes('weiß') ? 'Weiß' : 'Rot'),
      year: year,
      country: country,
      price: price,
      rating: w.rating,
      profile: w.taste,
      "userRating": w.userRating || 0,
      "userComment": w.userComment || ''
    };
  });

  // Upsert to Supabase in batches of 50
  const batchSize = 50;
  for (let i = 0; i < formattedWines.length; i += batchSize) {
    const batch = formattedWines.slice(i, i + batchSize);
    const { error } = await supabase
      .from('wines')
      .upsert(batch);

    if (error) {
      console.error(`Error in batch ${i / batchSize}:`, error);
    } else {
      console.log(`Migrated batch ${i / batchSize + 1}`);
    }
  }

  console.log('Migration completed!');
}

migrate();
