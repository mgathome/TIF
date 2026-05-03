'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { RestaurantCard } from '@/components/RestaurantCard';
import { Mascot } from '@/components/Mascot';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api<{ items: Restaurant[] }>('/restaurants?limit=20', { auth: false })
      .then(({ items }) => setRestaurants(items))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
                || r.cuisineType?.toLowerCase().includes(search.toLowerCase())
                || r.address.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-tif-violet text-white">
        <div className="section py-16 sm:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div className="animate-slide-up">
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight">
              Précommandez. <br />
              <span className="text-tif-yellow">Récupérez.</span> <br />
              Dégustez.
            </h1>
            <p className="mt-4 text-lg opacity-90 max-w-md">
              TIF vous permet de réserver vos repas dans vos restaurants préférés et de choisir un créneau qui vous convient.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/restaurants" className="btn-primary">Voir les restaurants</Link>
              <Link href="/pricing" className="btn-ghost text-white hover:bg-white/10">Je suis restaurateur →</Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <Mascot size={260} />
          </div>
        </div>
      </section>

      {/* Recherche */}
      <section className="section -mt-8 relative z-10">
        <div className="card p-2 flex items-center gap-2 max-w-2xl mx-auto">
          <span className="text-xl pl-2">🔎</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Restaurant, cuisine, ville..."
            className="flex-1 px-2 py-3 outline-none text-tif-black bg-transparent"
          />
        </div>
      </section>

      {/* Liste */}
      <section className="section py-12">
        <h2 className="font-display font-bold text-2xl text-tif-black mb-6">
          Restaurants à découvrir
        </h2>
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucun restaurant trouvé"
            description="Essayez avec d'autres mots-clés."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </section>
    </>
  );
}
