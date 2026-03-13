import React, { useState, useMemo } from 'react';
import { Search, Wine, LayoutDashboard, Settings, LogOut, Filter, Download, CheckCircle, Clock, Upload, Plus } from 'lucide-react';
import winesData from './data/wines.json';
import { WineCard, type UserWineData, type WineData } from './components/WineCard';
import { AddWineModal } from './components/AddWineModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { isReadyToDrink, exportData } from './utils/wineUtils';

type FilterType = 'all' | 'ready' | 'inStock';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userRatings, setUserRatings] = useLocalStorage<Record<string, UserWineData>>('weinlager-user-data', {});
  const [customWines, setCustomWines] = useLocalStorage<WineData[]>('weinlager-custom-wines', []);
  const [inventory, setInventory] = useLocalStorage<Record<string, number>>('weinlager-inventory', {});

  const allWines = useMemo(() => {
    // Filter out custom wines that have been synced and are now in winesData
    const staticNames = new Set(winesData.map(w => w.name.toLowerCase()));
    const uniqueCustomWines = customWines.filter(w => !staticNames.has(w.name.toLowerCase()));
    return [...winesData, ...uniqueCustomWines];
  }, [customWines]);

  const handleUpdate = (id: string, data: Partial<UserWineData>) => {
    setUserRatings((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { rating: 0, comment: '' }),
        ...data,
      },
    }));
  };

  const handleInventoryChange = (id: string, quantity: number) => {
    setInventory((prev) => ({
      ...prev,
      [id]: quantity,
    }));
  };

  const handleAddWine = async (newWine: WineData, initialQuantity: number = 1) => {
    // 1. Update local state immediately
    setCustomWines((prev) => [...prev, newWine]);

    // Set initial inventory
    setInventory((prev) => ({
      ...prev,
      [newWine.id]: initialQuantity,
    }));

    // 2. Sync to the master TXT file via our backend server
    try {
      const response = await fetch('http://localhost:3001/api/add-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWine),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern in Weinlager_Details.txt');
      }
      
      console.log('Erfolgreich in Weinlager_Details.txt gespeichert.');
    } catch (err) {
      console.error('Sync-Fehler:', err);
      alert('Der Wein wurde lokal hinzugefügt, konnte aber nicht in der Datei Weinlager_Details.txt gespeichert werden. Läuft der Sync-Server?');
    }
  };

  const handleExport = async () => {
    // 1. Prepare data for export, merging current userRatings
    const exportData = allWines.map(wine => ({
      ...wine,
      userRating: userRatings[wine.id]?.rating || 0,
      userComment: userRatings[wine.id]?.comment || '',
    }));

    // 2. Sync directly to our local file system via backend
    try {
      const response = await fetch('http://localhost:3001/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Serverfehler');
      }
      
      alert('Alle Daten wurden in mein_weinlager_export.json gespeichert.');
    } catch (err: any) {
      console.error('Export-Fehler:', err);
      alert(`Fehler beim Exportieren: ${err.message}. Läuft der Sync-Server?`);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setUserRatings((prev) => {
          const next = { ...prev };
          let count = 0;
          
          json.forEach((item: any) => {
            // Find wine by ID first, then by name
            const wine = allWines.find(w => w.id === item.id) || 
                         allWines.find(w => w.name.toLowerCase() === item.name?.toLowerCase());
            
            if (wine && (item.userRating !== undefined || item.userComment !== undefined)) {
              next[wine.id] = {
                rating: item.userRating || 0,
                comment: item.userComment || ''
              };
              count++;
            }
          });
          
          console.log(`Imported ${count} ratings/comments.`);
          return next;
        });
        alert('Daten erfolgreich importiert!');
      } catch (err) {
        console.error(err);
        alert('Fehler beim Importieren der Datei.');
      }
    };
    reader.readAsText(file);
  };

  const handleSyncToTxt = async (wine: WineData) => {
    try {
      const response = await fetch('http://localhost:3001/api/add-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wine),
      });

      if (!response.ok) throw new Error();
      alert(`"${wine.name}" wurde erfolgreich in Weinlager_Details.txt gespeichert.`);
    } catch (err) {
      alert('Speichern fehlgeschlagen. Läuft der Sync-Server?');
    }
  };

  const filteredWines = useMemo(() => {
    return allWines.filter((wine) => {
      const matchesSearch = 
        wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.taste.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = activeFilter === 'all' ||
        (activeFilter === 'ready' && isReadyToDrink(wine.drinkingWindow)) ||
        (activeFilter === 'inStock' && (inventory[wine.id] || 0) > 0);

      return matchesSearch && matchesFilter;
    });
  }, [allWines, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    const rated = Object.values(userRatings).filter(u => u.rating > 0);
    const avg = rated.length > 0 ? rated.reduce((acc, curr) => acc + curr.rating, 0) / rated.length : 0;
    const readyCount = allWines.filter(w => isReadyToDrink(w.drinkingWindow)).length;
    const inStockCount = allWines.filter(w => (inventory[w.id] || 0) > 0).length;

    return {
      count: allWines.length,
      rated: rated.length,
      avg: avg.toFixed(1),
      ready: readyCount,
      inStock: inStockCount
    };
  }, [allWines, userRatings, inventory]);

  return (
    <div className="min-h-screen flex bg-stone-50">
      <AddWineModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddWine}
      />

      {/* Sidebar */}
      <aside className="w-64 wine-gradient text-white flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Wine size={24} />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight">Meine Weine</h1>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
              Übersicht
            </button>
            <button
              onClick={() => setActiveFilter('ready')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'ready' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
            >
              <Clock size={20} />
              Jetzt trinken
            </button>
            <button
              onClick={() => setActiveFilter('inStock')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'inStock' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
            >
              <CheckCircle size={20} />
              Vorrätig
            </button>
            <div className="py-2 border-t border-white/10 my-2" />
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-all shadow-lg shadow-black/5"
            >
              <Plus size={20} />
              Wein hinzufügen
            </button>
            <div className="py-2 border-t border-white/10 my-2" />
            <button 
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-white/70 hover:text-white transition-colors"
            >
              <Download size={20} />
              Synchronisieren
            </button>
            <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-white/70 hover:text-white transition-colors cursor-pointer">
              <Upload size={20} />
              Importieren
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/10">
          <div className="flex items-center gap-3 text-white/60 text-sm cursor-pointer hover:text-white transition-colors">
            <LogOut size={18} />
            Abmelden
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 px-8 py-6 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Suchen nach Wein, Geschmack oder Region..."
              className="w-full pl-10 pr-4 py-2 bg-stone-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-8 items-center">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-stone-500">Gesamtbestand</div>
              <div className="text-2xl font-bold text-stone-800">{stats.count}</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-green-600">Vorrätig</div>
              <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-stone-500">Jetzt trinken</div>
              <div className="text-2xl font-bold text-stone-800">{stats.ready}</div>
            </div>
            <div className="h-8 w-px bg-stone-200 hidden sm:block" />
            <div className="text-right">
              <div className="text-sm font-medium text-stone-500">Durchschn. Rating</div>
              <div className="text-2xl font-bold text-wine-600">{stats.avg} ★</div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900">
                  {activeFilter === 'all' ? 'Alle Weine' : activeFilter === 'ready' ? 'Jetzt trinken' : 'Vorrätig'}
                </h2>
                <p className="text-stone-500 mt-1">
                  {filteredWines.length} {filteredWines.length === 1 ? 'Wein' : 'Weine'} gefunden
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                >
                  Alle anzeigen
                </button>
                <button
                  onClick={() => setActiveFilter('ready')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'ready' ? 'bg-wine-600 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                >
                  Jetzt trinken
                </button>
                <button
                  onClick={() => setActiveFilter('inStock')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === 'inStock' ? 'bg-green-600 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                >
                  Vorrätig
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {filteredWines.map((wine) => (
                <WineCard
                  key={wine.id}
                  wine={wine}
                  userData={userRatings[wine.id]}
                  inventory={inventory[wine.id] || 0}
                  onUpdate={handleUpdate}
                  onInventoryChange={handleInventoryChange}
                  onSync={handleSyncToTxt}
                />
              ))}
            </div>

            {filteredWines.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
                <div className="text-stone-400 mb-4 flex justify-center">
                  <Wine size={48} />
                </div>
                <h3 className="text-lg font-medium text-stone-900">Keine Weine gefunden</h3>
                <p className="text-stone-500 mt-2 mb-6">
                  {activeFilter === 'ready'
                    ? 'Es scheinen momentan keine Weine zum sofortigen Genuss bereit zu sein.'
                    : activeFilter === 'inStock'
                    ? 'Es sind momentan keine Weine auf Lager.'
                    : 'Probiere es mit einem anderen Suchbegriff oder füge einen neuen Wein hinzu.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {activeFilter === 'ready' || activeFilter === 'inStock' ? (
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="px-6 py-2 bg-stone-800 text-white rounded-xl font-semibold hover:bg-stone-900 transition-colors"
                    >
                      Alle Weine anzeigen
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-6 py-2 bg-wine-600 text-white rounded-xl font-semibold hover:bg-wine-700 transition-colors flex items-center gap-2 justify-center"
                    >
                      <Plus size={18} />
                      Neuen Wein hinzufügen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
