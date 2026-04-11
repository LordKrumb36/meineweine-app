import React, { useState, useMemo, useEffect } from 'react';
import { Search, Wine, LayoutDashboard, Settings, LogOut, Filter, Download, CheckCircle, Clock, Upload, Plus, ArrowUpDown } from 'lucide-react';
import { supabase } from './utils/supabaseClient';
import { WineCard, type UserWineData, type WineData } from './components/WineCard';
import { AddWineModal } from './components/AddWineModal';
import { isReadyToDrink, parsePrice, parseRating } from './utils/wineUtils';

type FilterType = 'all' | 'ready' | 'inStock';
type SortType = 'name' | 'price-asc' | 'price-desc' | 'rating-desc' | 'user-rating-desc';

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentinien',
  AT: 'Österreich',
  DE: 'Deutschland',
  ES: 'Spanien',
  FR: 'Frankreich',
  IT: 'Italien',
  PT: 'Portugal',
};

function getCountryCode(name: string): string {
  const match = name.match(/\(([A-Z]{2,3})\)$/);
  return match ? match[1] : '';
}

function App() {
  const [wines, setWines] = useState<WineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Fetch wines from Supabase on mount
  useEffect(() => {
    fetchWines();
  }, []);

  async function fetchWines() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .order('name');

      if (error) throw error;
      setWines(data || []);
    } catch (error) {
      console.error('Error fetching wines:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (id: string, data: Partial<UserWineData>) => {
    // 1. Optimistic UI update
    setWines(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));

    // 2. Update Supabase
    try {
      const { error } = await supabase
        .from('wines')
        .update({
          userRating: data.rating,
          userComment: data.comment
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating wine:', error);
      fetchWines(); 
    }
  };

  const handleInventoryChange = async (id: string, quantity: number) => {
    // 1. Optimistic UI update
    setWines(prev => prev.map(w => w.id === id ? { ...w, inventory: quantity } : w));

    // 2. Update Supabase
    try {
      const { error } = await supabase
        .from('wines')
        .update({ inventory: quantity })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating inventory:', error);
      fetchWines();
    }
  };

  const handleAddWine = async (newWine: WineData, initialQuantity: number = 1) => {
    const wineWithInventory = { ...newWine, inventory: initialQuantity };
    try {
      const { error } = await supabase
        .from('wines')
        .insert([wineWithInventory]);

      if (error) throw error;
      
      setWines(prev => [...prev, wineWithInventory]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding wine:', error);
      alert('Fehler beim Hinzufügen des Weins.');
    }
  };

  const availableCountries = useMemo(() => {
    const codes = [...new Set(wines.map(w => getCountryCode(w.name)).filter(Boolean))].sort();
    return codes;
  }, [wines]);

  const filteredWines = useMemo(() => {
    const filtered = wines.filter((wine) => {
      const matchesSearch =
        wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.taste.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = activeFilter === 'all' ||
        (activeFilter === 'ready' && isReadyToDrink(wine.drinkingWindow)) ||
        (activeFilter === 'inStock' && (wine.inventory || 0) > 0);

      const matchesCountry = !selectedCountry || getCountryCode(wine.name) === selectedCountry;

      return matchesSearch && matchesFilter && matchesCountry;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return parsePrice(a.price) - parsePrice(b.price);
        case 'price-desc':
          return parsePrice(b.price) - parsePrice(a.price);
        case 'rating-desc':
          return parseRating(b.rating) - parseRating(a.rating);
        case 'user-rating-desc':
          return (b.userRating || 0) - (a.userRating || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [wines, searchTerm, activeFilter, selectedCountry, sortBy]);

  const stats = useMemo(() => {
    const rated = wines.filter(w => (w.userRating || 0) > 0);
    const avg = rated.length > 0 ? rated.reduce((acc, curr) => acc + (curr.userRating || 0), 0) / rated.length : 0;
    const readyCount = wines.filter(w => isReadyToDrink(w.drinkingWindow)).length;
    const inStockCount = wines.filter(w => (w.inventory || 0) > 0).length;

    return {
      count: wines.length,
      rated: rated.length,
      avg: avg.toFixed(1),
      ready: readyCount,
      inStock: inStockCount
    };
  }, [wines]);

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
            <h1 className="text-xl font-serif font-bold tracking-tight">Meine Wein-Cloud</h1>
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
            <div className="px-4 py-3 text-white/40 text-xs italic">
              Alle Änderungen werden automatisch in die Cloud synchronisiert.
            </div>
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
              
              <div className="flex gap-2 flex-wrap">
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
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 cursor-pointer outline-none"
                >
                  <option value="">Alle Länder</option>
                  {availableCountries.map(code => (
                    <option key={code} value={code}>
                      {COUNTRY_NAMES[code] || code}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 transition-colors">
                  <ArrowUpDown size={16} className="text-stone-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="text-sm font-medium bg-transparent text-stone-600 cursor-pointer outline-none"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="price-asc">Preis (aufst.)</option>
                    <option value="price-desc">Preis (abst.)</option>
                    <option value="rating-desc">Fachbewertung</option>
                    <option value="user-rating-desc">Eigene Bewertung</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {filteredWines.map((wine) => (
                <WineCard
                  key={wine.id}
                  wine={wine}
                  userData={{ rating: wine.userRating || 0, comment: wine.userComment || '' }}
                  inventory={wine.inventory || 0}
                  onUpdate={handleUpdate}
                  onInventoryChange={handleInventoryChange}
                  onSync={() => {}}
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
                    : selectedCountry
                    ? `Keine Weine aus ${COUNTRY_NAMES[selectedCountry] || selectedCountry} gefunden.`
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
