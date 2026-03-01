import React from 'react';
import { Star } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  max?: number;
  readOnly?: boolean;
}

export function Rating({ rating, onRatingChange, max = 5, readOnly = false }: RatingProps) {
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          disabled={readOnly}
          onClick={() => onRatingChange?.(i + 1)}
          className={cn(
            "transition-colors duration-200",
            i < rating ? "text-amber-400 fill-amber-400" : "text-stone-300",
            !readOnly && "hover:scale-110 active:scale-95"
          )}
        >
          <Star size={20} />
        </button>
      ))}
    </div>
  );
}
