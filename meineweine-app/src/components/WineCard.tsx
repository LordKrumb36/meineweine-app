import React from 'react';
import { Wine, Calendar, CreditCard, Droplets, MessageSquare, CloudUpload, Plus, Minus, X, Pencil } from 'lucide-react';
import { Rating } from './Rating';

export interface WineData {
  id: string;
  name: string;
  drinkingWindow: string;
  rating: string;
  price: string;
  taste: string;
  userRating?: number;
  userComment?: string;
  inventory?: number;
}

export interface UserWineData {
  rating: number;
  comment: string;
}

interface WineCardProps {
  wine: WineData;
  userData?: UserWineData;
  inventory: number;
  onUpdate: (id: string, data: Partial<UserWineData>) => void;
  onInventoryChange: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
  onEdit: (wine: WineData) => void;
  onSync?: (wine: WineData) => void;
}

export function WineCard({ wine, userData, inventory, onUpdate, onInventoryChange, onDelete, onEdit, onSync }: WineCardProps) {
  const currentRating = userData?.rating !== undefined ? userData.rating : (wine.userRating || 0);
  const currentComment = userData?.comment !== undefined ? userData.comment : (wine.userComment || '');
  const wineIdStr = wine.id.toString();
  const isCustom = wineIdStr.startsWith('custom-');
  const isInStock = inventory > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow relative group/card">
      <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity z-10">
        <button 
          onClick={() => onEdit(wine)}
          className="p-1.5 bg-stone-50 text-stone-600 rounded-md hover:bg-stone-100 transition-colors"
          title="Wein bearbeiten"
        >
          <Pencil size={16} />
        </button>
        {isCustom && onSync && (
          <button 
            onClick={() => onSync(wine)}
            className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            title="In Weinlager_Details.txt speichern"
          >
            <CloudUpload size={16} />
          </button>
        )}
        <button 
          onClick={() => {
            if (window.confirm(`Möchtest du "${wine.name}" wirklich löschen?`)) {
              onDelete(wine.id);
            }
          }}
          className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
          title="Wein löschen"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4 md:pr-0 pr-24">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-wine-50 rounded-lg text-wine-600">
              <Wine size={24} />
            </div>
            <h3 className="font-semibold text-lg text-stone-800 leading-tight">{wine.name}</h3>
          </div>
          <span className="text-sm font-medium text-stone-500 whitespace-nowrap px-2 py-1 bg-stone-100 rounded-md">
            {wine.rating || '-'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-stone-400" />
            <span>{wine.drinkingWindow}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-stone-400" />
            <span>{wine.price}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Droplets size={16} className="text-stone-400" />
            <span className="italic">{wine.taste}</span>
          </div>
        </div>

        {/* Inventory Section */}
        <div className={`mb-4 p-3 rounded-lg border ${isInStock ? 'bg-green-50 border-green-200' : 'bg-stone-100 border-stone-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine size={16} className={isInStock ? 'text-green-600' : 'text-stone-400'} />
              <span className={`text-sm font-medium ${isInStock ? 'text-green-700' : 'text-stone-500'}`}>
                {isInStock ? 'Vorrätig' : 'Nicht vorrätig'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onInventoryChange(wine.id, Math.max(0, inventory - 1))}
                className="p-1.5 rounded-md bg-white border border-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-50"
                disabled={inventory === 0}
              >
                <Minus size={14} className="text-stone-600" />
              </button>
              <span className="w-8 text-center font-semibold text-stone-800">{inventory}</span>
              <button
                onClick={() => onInventoryChange(wine.id, inventory + 1)}
                className="p-1.5 rounded-md bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
              >
                <Plus size={14} className="text-stone-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Meine Bewertung</span>
            <Rating 
              rating={currentRating} 
              onRatingChange={(r) => onUpdate(wine.id, { rating: r })} 
            />
          </div>
          
          <div className="relative">
            <MessageSquare size={14} className="absolute left-3 top-3 text-stone-400" />
            <textarea
              placeholder="Notizen hinzufügen..."
              value={currentComment}
              onChange={(e) => onUpdate(wine.id, { comment: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500/20 focus:border-wine-500 min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
