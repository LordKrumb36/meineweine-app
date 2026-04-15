import React, { useState, useEffect } from 'react';
import { X, Plus, Wine, Calendar, CreditCard, Droplets, Star, MessageSquare, Package, Save } from 'lucide-react';
import { WineData } from './WineCard';
import { Rating } from './Rating';

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (wine: WineData, initialQuantity: number) => void;
  wineToEdit?: WineData;
  initialQuantity?: number;
}

export function AddWineModal({ isOpen, onClose, onAdd, wineToEdit, initialQuantity }: AddWineModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    drinkingWindow: '',
    rating: '',
    price: '',
    taste: '',
    userRating: 0,
    userComment: '',
    quantity: 1
  });

  useEffect(() => {
    if (wineToEdit) {
      setFormData({
        name: wineToEdit.name || '',
        drinkingWindow: wineToEdit.drinkingWindow || '',
        rating: wineToEdit.rating || '',
        price: wineToEdit.price || '',
        taste: wineToEdit.taste || '',
        userRating: wineToEdit.userRating || 0,
        userComment: wineToEdit.userComment || '',
        quantity: initialQuantity || 0
      });
    } else {
      setFormData({
        name: '',
        drinkingWindow: '',
        rating: '',
        price: '',
        taste: '',
        userRating: 0,
        userComment: '',
        quantity: 1
      });
    }
  }, [wineToEdit, initialQuantity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const { quantity, ...wineFields } = formData;
    const wineData: WineData = {
      id: wineToEdit ? wineToEdit.id : `custom-${Date.now()}`,
      ...wineFields
    };

    onAdd(wineData, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-wine-600 rounded-lg text-white">
              {wineToEdit ? <Save size={20} /> : <Plus size={20} />}
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              {wineToEdit ? 'Wein bearbeiten' : 'Neuen Wein hinzufügen'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-400 hover:text-stone-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Wine size={14} className="text-wine-600" /> Name des Weins *
            </label>
            <input
              required
              type="text"
              placeholder="z.B. Château Margaux 2018"
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <Calendar size={14} className="text-stone-400" /> Trinkfenster
              </label>
              <input
                type="text"
                placeholder="2025 – 2035"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
                value={formData.drinkingWindow}
                onChange={e => setFormData(prev => ({ ...prev, drinkingWindow: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <Star size={14} className="text-stone-400" /> Score / Bewertung
              </label>
              <input
                type="text"
                placeholder="95/100 (Parker)"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
                value={formData.rating}
                onChange={e => setFormData(prev => ({ ...prev, rating: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <CreditCard size={14} className="text-stone-400" /> Preis
              </label>
              <input
                type="text"
                placeholder="€ 45.00"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                <Droplets size={14} className="text-stone-400" /> Geschmack
              </label>
              <input
                type="text"
                placeholder="fruchtig, herb, ..."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
                value={formData.taste}
                onChange={e => setFormData(prev => ({ ...prev, taste: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Package size={14} className="text-stone-400" /> Anzahl Flaschen
            </label>
            <input
              type="number"
              min="0"
              placeholder="1"
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all"
              value={formData.quantity}
              onChange={e => setFormData(prev => ({ ...prev, quantity: Math.max(0, parseInt(e.target.value) || 0) }))}
            />
          </div>

          <div className="space-y-3 p-4 bg-wine-50/50 rounded-2xl border border-wine-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-wine-800">
                Meine Bewertung
              </label>
              <Rating 
                rating={formData.userRating} 
                onRatingChange={r => setFormData(prev => ({ ...prev, userRating: r }))} 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-wine-700 flex items-center gap-2">
                <MessageSquare size={12} /> Notizen & Tasting Notes
              </label>
              <textarea
                placeholder="Wie hat er geschmeckt? Besondere Merkmale..."
                className="w-full px-4 py-2.5 bg-white border border-wine-100 rounded-xl focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 outline-none transition-all min-h-[80px] resize-none text-sm"
                value={formData.userComment}
                onChange={e => setFormData(prev => ({ ...prev, userComment: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-wine-600 text-white font-semibold rounded-xl hover:bg-wine-700 transition-colors shadow-lg shadow-wine-600/20 flex items-center justify-center gap-2"
            >
              {wineToEdit ? <><Save size={18} /> Speichern</> : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
