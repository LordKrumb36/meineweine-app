import React, { useState, useMemo, useEffect } from 'react';
import { Search, Wine, LayoutDashboard, LogOut, CheckCircle, Clock, Plus, ArrowUpDown, AlertCircle } from 'lucide-react';
import { supabase } from './utils/supabaseClient';
import { WineCard, type UserWineData, type WineData } from './components/WineCard';
import { AddWineModal } from './components/AddWineModal';
import { isReadyToDrink, parsePrice, parseRating } from './utils/wineUtils';

type FilterType = 'all' | 'ready' | 'inStock';
type SortType = 'name' | 'price-asc' | 'price-desc' | 'rating-desc' | 'user-rating-desc';

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentinien', AT: 'Österreich', DE: 'Deutschland', ES: 'Spanien', FR: 'Frankreich', IT: 'Italien', PT: 'Portugal',
};

function getCountryCode(name: string): string {
  const match = name.match(/\(([A-Z]{2,3})\)$/);
  return match ? match[1] : '';
}

function App() {
  const [wines, setWines] = useState<WineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  useEffect(() => {
    fetchWines();
  }, []);

  async function fetchWines() {
    try {
      setLoading(true);
      setError(null);
      
      // Prüfen ob Keys da sind
      if (!import.meta.env.VITE_SUPABASE_URL) {
        throw new Error('API Konfiguration fehlt (URL)');
      }

      const { data, error: dbError } = await supabase.from('wines').select('*');
      
      if (dbError) throw dbError;
      
      console.log('Daten empfangen:', data?.length);
      setWines(data || []);
      
      if (!data || data.length === 0) {
        setError('Die Datenbank ist aktuell leer. Bitte starte den Import erneut oder füge einen Wein hinzu.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Verbindung zur Cloud fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (id: string, data: Partial<UserWineData>) => {
    setWines(prev => prev.map(w => w.id === id ? { ...w, userRating: data.rating, userComment: data.comment } : w));
    try {
      const { error: dbError } = await supabase.from('wines').update({ userRating: data.rating, userComment: data.comment }).eq('id', id);
      if (dbError) throw dbError;
    } catch (err) { fetchWines(); }
  };

  const handleInventoryChange = async (id: string, quantity: number) => {
    setWines(prev => prev.map(w => w.id === id ? { ...w, inventory: quantity } : w));
    try {
      const { error: dbError } = await supabase.from('wines').update({ inventory: quantity }).eq('id', id);
      if (dbError) throw dbError;
    } catch (err) { fetchWines(); }
  };

  const handleAddWine = async (newWine: WineData, initialQuantity: number = 1) => {
    const wineWithInventory = { ...newWine, inventory: initialQuantity };
    try {
      const { error: dbError } = await supabase.from('wines').insert([wineWithInventory]);
      if (dbError) throw dbError;
      setWines(prev => [...prev, wineWithInventory]);
      setIsAddModalOpen(false);
    } catch (err) { alert('Fehler beim Hinzufügen'); }
  };

  const availableCountries = useMemo(() => {
    return [...new Set(wines.map(w => getCountryCode(w.name)).filter(Boolean))].sort();
  }, [wines]);

  const filteredWines = useMemo(() => {
    const filtered = wines.filter((wine) => {
      const matchesSearch = wine.name.toLowerCase().includes(searchTerm.toLowerCase()) || wine.taste?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || (activeFilter === 'ready' && isReadyToDrink(wine.drinkingWindow)) || (activeFilter === 'inStock' && (wine.inventory || 0) > 0);
      const matchesCountry = !selectedCountry || getCountryCode(wine.name) === selectedCountry;
      return matchesSearch && matchesFilter && matchesCountry;
    });
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return parsePrice(a.price) - parsePrice(b.price);
        case 'price-desc': return parsePrice(b.price) - parsePrice(a.price);
        case 'rating-desc': return parseRating(b.rating) - parseRating(a.rating);
        case 'user-rating-desc': return (b.userRating || 0) - (a.userRating || 0);
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [wines, searchTerm, activeFilter, selectedCountry, sortBy]);

  const stats = useMemo(() => {
    const rated = wines.filter(w => (w.userRating || 0) > 0);
    const avg = rated.length > 0 ? rated.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / rated.length : 0;
    const inStockCount = wines.filter(w => (w.inventory || 0) > 0).length;
    return { count: wines.length, rated: rated.length, avg: avg.toFixed(1), inStock: inStockCount };
  }, [wines]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-wine-600">
        <Wine className="animate-bounce mb-4" size={48} />
        <span className="font-serif text-xl">Weinkeller wird geladen...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      <AddWineModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddWine} />
      <aside className="w-64 wine-gradient text-white flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm"><Wine size={24} /></div>
            <h1 className="text-xl font-serif font-bold tracking-tight">Meine Weine</h1>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setActiveFilter('all')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}><LayoutDashboard size={20} /> Übersicht</button>
            <button onClick={() => setActiveFilter('ready')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'ready' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}><Clock size={20} /> Jetzt trinken</button>
            <button onClick={() => setActiveFilter('inStock')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'inStock' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}><CheckCircle size={20} /> Vorrätig</button>
            <div className="py-2 border-t border-white/10 my-2" />
            <button onClick={() => setIsAddModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-all shadow-lg shadow-black/5"><Plus size={20} /> Wein hinzufügen</button>
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/10 text-white/40 text-[10px] uppercase tracking-widest text-center">Cloud Sync Aktiv</div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-stone-200 px-8 py-6 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-md"><Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input type="text" placeholder="Wein suchen..." className="w-full pl-10 pr-4 py-2 bg-stone-100 border-transparent rounded-full text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex gap-8 items-center">
            <div className="text-right hidden sm:block"><div className="text-sm font-medium text-stone-500">Bestand</div><div className="text-2xl font-bold text-stone-800">{stats.count}</div></div>
            <div className="text-right"><div className="text-sm font-medium text-stone-500">Rating</div><div className="text-2xl font-bold text-wine-600">{stats.avg} ★</div></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {error ? (
            <div className="max-w-md mx-auto mt-20 text-center bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
              <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-bold text-stone-900 mb-2">Hinweis</h2>
              <p className="text-stone-600 mb-6">{error}</p>
              <button onClick={() => fetchWines()} className="px-6 py-2 bg-stone-800 text-white rounded-xl font-semibold">Aktualisieren</button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 flex justify-between items-end">
                <h2 className="text-2xl font-serif font-bold text-stone-900">{activeFilter === 'all' ? 'Alle Weine' : activeFilter === 'ready' ? 'Bereit' : 'Auf Lager'}</h2>
                <div className="flex gap-2">
                  <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="px-4 py-2 rounded-lg text-sm bg-white border border-stone-200 shadow-sm outline-none">
                    <option value="">Alle Länder</option>
                    {availableCountries.map(code => <option key={code} value={code}>{COUNTRY_NAMES[code] || code}</option>)}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)} className="px-4 py-2 rounded-lg text-sm bg-white border border-stone-200 shadow-sm outline-none">
                    <option value="name">Name (A-Z)</option>
                    <option value="price-asc">Preis ↑</option>
                    <option value="price-desc">Preis ↓</option>
                    <option value="user-rating-desc">Rating</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWines.map((wine) => (
                  <WineCard key={wine.id} wine={wine} userData={{ rating: wine.userRating || 0, comment: wine.userComment || '' }} inventory={wine.inventory || 0} onUpdate={handleUpdate} onInventoryChange={handleInventoryChange} onSync={() => {}} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
