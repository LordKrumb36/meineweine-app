import React, { useState, useMemo, useEffect } from 'react';
import { Search, Wine, LayoutDashboard, LogOut, CheckCircle, Clock, Plus, ArrowUpDown, AlertCircle, Database, Menu, X } from 'lucide-react';
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
  if (!name) return '';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => { fetchWines(); }, []);

  async function fetchWines() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase.from('wines').select('*');
      if (dbError) throw dbError;
      const normalized = (data || []).map(w => ({
        ...w,
        id: w.id.toString(),
        name: w.name || 'Unbekannter Wein',
        price: w.price ? `€${Number(w.price).toFixed(2)}` : '-',
        rating: w.rating || '-',
        taste: w.profile || '-',
        drinkingWindow: w.year ? `${w.year} - ${w.year + 10}` : 'jetzt trinken'
      }));
      setWines(normalized);
      if (normalized.length === 0) setError('Die Datenbank ist aktuell leer.');
    } catch (err: any) {
      setError('Fehler beim Laden: ' + (err.message || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (id: string, data: Partial<UserWineData>) => {
    setWines(prev => prev.map(w => w.id === id ? { ...w, userRating: data.rating, userComment: data.comment } : w));
    try {
      await supabase.from('wines').update({ userRating: data.rating, userComment: data.comment }).eq('id', id);
    } catch (err) { fetchWines(); }
  };

  const handleInventoryChange = async (id: string, quantity: number) => {
    setWines(prev => prev.map(w => w.id === id ? { ...w, inventory: quantity } : w));
    try {
      await supabase.from('wines').update({ inventory: quantity }).eq('id', id);
    } catch (err) { fetchWines(); }
  };

  const handleAddWine = async (newWine: WineData, initialQuantity: number = 1) => {
    console.log('--- handleAddWine gestartet ---', newWine);
    try {
      // Extrahiere Jahr, Land und Typ
      const yearMatch = newWine.name.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : 
                   (newWine.drinkingWindow ? parseInt(newWine.drinkingWindow.split(/[-–]/)[0]) : null);
      
      const countryMatch = newWine.name.match(/\(([A-Z]{2,3})\)$/);
      const country = countryMatch ? countryMatch[1] : null;

      const type = newWine.name.toLowerCase().includes('rosé') ? 'Rosé' : 
                   (newWine.name.toLowerCase().includes('weiß') ? 'Weiß' : 'Rot');

      const priceNum = parseFloat(newWine.price.replace(/[€$~\s]/g, '').replace(',', '.')) || 0;

      const dbWine = {
        name: newWine.name,
        year: year,
        type: type,
        country: country,
        price: priceNum,
        rating: newWine.rating,
        profile: newWine.taste,
        userRating: newWine.userRating || 0,
        userComment: newWine.userComment || '',
        inventory: initialQuantity
      };

      console.log('Sende an Supabase:', dbWine);
      const { data, error: dbError } = await supabase.from('wines').insert([dbWine]).select();
      
      if (dbError) {
        console.error('Supabase Error Details:', dbError);
        throw new Error(`DB-Fehler: ${dbError.message} (${dbError.code}) - Details: ${JSON.stringify(dbError)}`);
      }
      
      console.log('Erfolgreich eingefügt:', data);
      await fetchWines();
      setIsAddModalOpen(false);
    } catch (err: any) { 
      console.error('Add wine CRASH:', err);
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      alert('DEBUG-ALARM: ' + errorMsg); 
    }
  };

  const availableCountries = useMemo(() => {
    return [...new Set(wines.map(w => getCountryCode(w.name)).filter(Boolean))].sort();
  }, [wines]);

  const filteredWines = useMemo(() => {
    const filtered = wines.filter((wine) => {
      const name = wine.name?.toLowerCase() || '';
      const taste = wine.taste?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || taste.includes(search);
      const matchesFilter = activeFilter === 'all' || 
                           (activeFilter === 'ready' && isReadyToDrink(wine.drinkingWindow)) || 
                           (activeFilter === 'inStock' && (wine.inventory || 0) > 0);
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
    return { count: wines.length, rated: rated.length, avg: avg.toFixed(1), inStock: wines.filter(w => (w.inventory || 0) > 0).length };
  }, [wines]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-wine-600">
      <Wine className="animate-bounce mb-4" size={48} />
      <span className="font-serif text-xl">Weinkeller wird geladen...</span>
    </div>
  );

  const NavigationContent = () => (
    <nav className="space-y-1">
      <button onClick={() => { setActiveFilter('all'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}><LayoutDashboard size={20} /> Übersicht</button>
      <button onClick={() => { setActiveFilter('ready'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'ready' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}><Clock size={20} /> Jetzt trinken</button>
      <button onClick={() => { setActiveFilter('inStock'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeFilter === 'inStock' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}><CheckCircle size={20} /> Vorrätig</button>
      <div className="py-2 border-t border-white/10 my-2" />
      <button onClick={() => { setIsAddModalOpen(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-all shadow-lg shadow-black/5"><Plus size={20} /> Wein hinzufügen</button>
      <div className="py-4 text-white/40 text-[10px] uppercase tracking-widest text-center mt-4">Cloud Sync Aktiv</div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-stone-50">
      <AddWineModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddWine} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-64 h-full wine-gradient p-8 text-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg"><Wine size={20} /></div>
                <h1 className="text-lg font-serif font-bold">Menü</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
            </div>
            <NavigationContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 wine-gradient text-white flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm"><Wine size={24} /></div>
            <h1 className="text-xl font-serif font-bold tracking-tight">Meine Weine</h1>
          </div>
          <NavigationContent />
        </div>
        <div className="mt-auto p-8 border-t border-white/10"><div className="flex items-center gap-3 text-white/60 text-sm cursor-pointer hover:text-white transition-colors"><LogOut size={18} /> Abmelden</div></div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg"><Menu size={24} /></button>
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" placeholder="Wein suchen..." className="w-full pl-10 pr-4 py-2 bg-stone-100 border-transparent rounded-full text-sm outline-none shadow-inner focus:bg-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-4 md:gap-8 items-center ml-4">
            <div className="text-right"><div className="text-[10px] md:text-sm font-medium text-stone-500 uppercase tracking-wider">Bestand</div><div className="text-lg md:text-2xl font-bold text-stone-800">{stats.count}</div></div>
            <div className="text-right"><div className="text-[10px] md:text-sm font-medium text-stone-500 uppercase tracking-wider">Rating</div><div className="text-lg md:text-2xl font-bold text-wine-600">{stats.avg} ★</div></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {error ? (
            <div className="max-w-md mx-auto mt-10 md:mt-20 text-center bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
              <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-bold text-stone-900 mb-2">Hinweis</h2>
              <p className="text-stone-600 mb-6">{error}</p>
              <button onClick={() => fetchWines()} className="px-6 py-2 bg-stone-800 text-white rounded-xl font-semibold">Neu laden</button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900">{activeFilter === 'all' ? 'Alle Weine' : activeFilter === 'ready' ? 'Bereit zum Trinken' : 'Vorrätig'}</h2>
                  <p className="text-sm text-stone-500">{filteredWines.length} Weine gefunden</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm bg-white border border-stone-200 shadow-sm outline-none"><option value="">Alle Länder</option>{availableCountries.map(code => <option key={code} value={code}>{COUNTRY_NAMES[code] || code}</option>)}</select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)} className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm bg-white border border-stone-200 shadow-sm outline-none"><option value="name">Name</option><option value="price-asc">Preis ↑</option><option value="price-desc">Preis ↓</option><option value="user-rating-desc">Rating</option></select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-10">
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
