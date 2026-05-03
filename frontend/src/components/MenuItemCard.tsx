'use client';

import { useState } from 'react';
import type { MenuItem, Restaurant } from '@/lib/types';
import { formatPrice } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

export function MenuItemCard({ item, restaurant }: { item: MenuItem; restaurant: Restaurant }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    addItem(item, restaurant);
    setAdding(true);
    setTimeout(() => setAdding(false), 600);
  }

  return (
    <div className="card flex gap-4 p-4 hover:shadow-tif-lg transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-tif-black">{item.name}</h3>
          {item.isVegetarian && <span className="badge bg-green-100 text-green-800">Végé</span>}
          {item.isVegan && <span className="badge bg-green-100 text-green-800">Vegan</span>}
          {item.isGlutenFree && <span className="badge bg-amber-100 text-amber-800">Sans gluten</span>}
        </div>
        {item.description && (
          <p className="text-sm text-tif-gray-500 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-semibold text-tif-black">{formatPrice(item.priceCents)}</span>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary px-4 py-2 text-sm"
          >
            {adding ? '✓ Ajouté' : '+ Ajouter'}
          </button>
        </div>
      </div>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-tif object-cover flex-shrink-0"
        />
      )}
    </div>
  );
}
