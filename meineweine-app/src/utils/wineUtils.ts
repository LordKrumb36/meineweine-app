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
