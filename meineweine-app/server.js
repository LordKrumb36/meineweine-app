const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

// Path to the master TXT file in the project root
const TXT_FILE = path.join(__dirname, '..', 'Weinlager_Details.txt');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Path to the sync file in the root
const EXPORT_FILE = path.join(__dirname, '..', 'mein_weinlager_export.json');

app.post('/api/export', (req, res) => {
  const data = req.body;
  
  try {
    fs.writeFileSync(EXPORT_FILE, JSON.stringify(data, null, 2));
    console.log(`Updated sync file: ${EXPORT_FILE}`);
    
    // Automatically run the full sync process
    // 1. sync_weine.js: Updates TXT and Excel from the new JSON
    // 2. sync_to_export.js: Updates the app's internal wines.json from the TXT
    const syncCommand = 'node ../sync_weine.js && node ../sync_to_export.js';
    
    exec(syncCommand, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Sync error: ${error}`);
        return res.status(500).json({ 
          error: 'Sync scripts failed', 
          details: error.message 
        });
      }
      
      console.log('Automatic sync completed successfully');
      res.json({ 
        success: true, 
        message: 'Synchronisierung erfolgreich: JSON, TXT, Excel und App-Daten wurden aktualisiert.',
        stdout: stdout
      });
    });
    
  } catch (err) {
    console.error('Failed to write export file:', err);
    res.status(500).json({ 
      error: 'Failed to update export file', 
      details: err.message 
    });
  }
});

app.post('/api/add-wine', (req, res) => {
  const wine = req.body;
  
  if (!wine.name) {
    return res.status(400).json({ error: 'Wine name is required' });
  }

  // Format the rating stars
  const stars = wine.userRating > 0 ? '★'.repeat(wine.userRating) : '';
  
  // Create the Markdown table row
  const newRow = `| ${wine.name} | ${wine.drinkingWindow || ''} | ${wine.rating || ''} | ${wine.price || ''} | ${wine.taste || ''} | ${stars} | ${wine.userComment || ''} |`;

  try {
    // Read and clean the file first to remove excessive trailing newlines
    let content = fs.readFileSync(TXT_FILE, 'utf8').trimEnd();
    
    // Write back the cleaned content plus the new row
    fs.writeFileSync(TXT_FILE, content + '\n' + newRow);
    
    console.log(`Added new wine to TXT: ${wine.name}`);

    // Update the app's wines.json and the JSON export from the new TXT
    // and refresh the Excel file.
    const syncCommand = 'node ../sync_to_export.js && node ../sync_weine.js';
    
    exec(syncCommand, { cwd: __dirname }, (error) => {
      if (error) {
        console.error(`Sync error after adding wine: ${error}`);
        // We still respond success because the TXT was updated
      }
      res.json({ success: true, message: 'Wein hinzugefügt und Daten synchronisiert.' });
    });
  } catch (err) {
    console.error('Failed to write to TXT file:', err);
    res.status(500).json({ error: 'Failed to update Weinlager_Details.txt' });
  }
});

app.listen(PORT, () => {
  console.log(`Sync Server running at http://localhost:${PORT}`);
});
