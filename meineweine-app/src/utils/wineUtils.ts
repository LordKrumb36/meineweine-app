export function isReadyToDrink(drinkingWindow: string): boolean {
  const lowerWindow = drinkingWindow.toLowerCase();

  // Zählt nur Weine mit expliziten Hinweisen auf sofortige Trinkreife
  if (
    lowerWindow.includes('jetzt') || 
    lowerWindow.includes('sofort') || 
    lowerWindow.includes('bis')
  ) {
    return true;
  }

  return false;
}

export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Entferne Währungssymbole, Tildes, Sterne und andere nicht-numerische Zeichen außer . und ,
  const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
}

export function parseRating(ratingStr: string): number {
  if (!ratingStr) return 0;
  
  // 100-Punkte-Skala: 91/100, 95+/100
  const hundredMatch = ratingStr.match(/(\d+)\s*\/\s*100/);
  if (hundredMatch) return parseInt(hundredMatch[1], 10);

  // Vivino 5-Punkte-Skala: 3.5 / 5
  const fiveMatch = ratingStr.match(/(\d+(\.\d+)?)\s*\/\s*5/);
  if (fiveMatch) return parseFloat(fiveMatch[1]) * 20; // Normalisierung auf 100

  // Eichelmann Sterne: 1.5*
  const starMatch = ratingStr.match(/(\d+(\.\d+)?)\s*\*/);
  if (starMatch) return parseFloat(starMatch[1]) * 20; // Normalisierung auf 100 (Annahme 5 Sterne max)

  // Andere Zahlen: 88 (Eichelmann)
  const numberMatch = ratingStr.match(/(\d+)/);
  if (numberMatch) return parseInt(numberMatch[0], 10);

  return 0;
}

export function exportData(wines: any[], userRatings: any) {
  const exportData = wines.map(wine => ({
    ...wine,
    userRating: userRatings[wine.id]?.rating || 0,
    userComment: userRatings[wine.id]?.comment || '',
  }));

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "meine_weine_export.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
