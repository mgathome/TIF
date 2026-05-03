'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';

export default function RestaurantsListPage() {
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (cuisine) params.set('cuisine', cuisine);
    api<{ items: Restaurant[] }>(`/restaurants?${params}`, { auth: false })
      .then(({ items }) => setItems(items))
      .finally(() => setLoading(false));
  }, [city, cuisine]);

  return (
    <div className="section py-10">
      <h1 className="font-display font-bold text-3xl mb-6">Tous les restaurants</h1>

      <div className="grid sm:grid-cols-2 gap-3 mb-8 max-w-xl">
        <input className="input" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
        <input className="input" placeholder="Type de cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
      </div>

      {loading ? <Loading /> : items.length === 0 ? (
        <EmptyState title="Aucun restaurant" description="Modifiez vos filtres ou revenez plus tard." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
}
