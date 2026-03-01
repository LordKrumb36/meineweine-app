const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Path to the master TXT file in the project root
const TXT_FILE = path.join(__dirname, '..', 'Weinlager_Details.txt');

app.use(cors());
app.use(express.json());

// Path to the sync file in the root
const EXPORT_FILE = path.join(__dirname, '..', 'mein_weinlager_export.json');

app.post('/api/export', (req, res) => {
  const data = req.body;
  
  try {
    fs.writeFileSync(EXPORT_FILE, JSON.stringify(data, null, 2));
    console.log(`Updated sync file: ${EXPORT_FILE}`);
    res.json({ success: true, message: 'mein_weinlager_export.json updated successfully' });
  } catch (err) {
    console.error('Failed to write export file:', err);
    res.status(500).json({ error: 'Failed to update export file' });
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
    res.json({ success: true, message: 'Wine added to Weinlager_Details.txt' });
  } catch (err) {
    console.error('Failed to write to TXT file:', err);
    res.status(500).json({ error: 'Failed to update Weinlager_Details.txt' });
  }
});

app.listen(PORT, () => {
  console.log(`Sync Server running at http://localhost:${PORT}`);
});
