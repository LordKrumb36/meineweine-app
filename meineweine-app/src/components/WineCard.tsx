import React from 'react';
import { Wine, Calendar, CreditCard, Droplets, MessageSquare, CloudUpload } from 'lucide-react';
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
}

export interface UserWineData {
  rating: number;
  comment: string;
}

interface WineCardProps {
  wine: WineData;
  userData?: UserWineData;
  onUpdate: (id: string, data: Partial<UserWineData>) => void;
  onSync?: (wine: WineData) => void;
}

export function WineCard({ wine, userData, onUpdate, onSync }: WineCardProps) {
  const currentRating = userData?.rating !== undefined ? userData.rating : (wine.userRating || 0);
  const currentComment = userData?.comment !== undefined ? userData.comment : (wine.userComment || '');
  const isCustom = wine.id.startsWith('custom-');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow relative">
      {isCustom && onSync && (
        <button 
          onClick={() => onSync(wine)}
          className="absolute top-4 right-12 p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors group"
          title="In Weinlager_Details.txt speichern"
        >
          <CloudUpload size={16} />
          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-stone-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
            In TXT speichern
          </span>
        </button>
      )}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
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

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 text-sm text-stone-600">
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
