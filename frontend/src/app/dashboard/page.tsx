'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatPrice } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { Loading } from '@/components/Loading';

interface Stats {
  today: { orders_today: number; revenue_today_cents: number };
  week: { orders_week: number; revenue_week_cents: number };
  activeOrders: number;
}

export default function DashboardHome() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ restaurant: Restaurant | null }>('/restaurants/me')
      .then(async ({ restaurant }) => {
        setRestaurant(restaurant);
        if (restaurant) {
          const s = await api<Stats>(`/restaurants/${restaurant.id}/stats`);
          setStats(s);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!restaurant) {
    return (
      <div className="section py-10 max-w-xl">
        <h1 className="font-display font-bold text-2xl mb-4">Bienvenue sur TIF</h1>
        <p className="text-tif-gray-700 mb-6">
          Vous n'avez pas encore créé votre restaurant. Démarrez en quelques clics.
        </p>
        <Link href="/dashboard/setup" className="btn-primary">Créer mon restaurant</Link>
      </div>
    );
  }

  return (
    <div className="section py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl">{restaurant.name}</h1>
          <p className="text-tif-gray-500">{restaurant.address.city}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/orders" className="btn-secondary">Commandes</Link>
          <Link href="/dashboard/menu" className="btn-primary">Gérer le menu</Link>
        </div>
      </div>

      {!restaurant.isPublished && (
        <div className="card p-5 mb-6 bg-tif-yellow/30 border-l-4 border-tif-yellow">
          <strong>Restaurant non publié.</strong> Activez la publication dans les paramètres
          pour apparaître dans la liste publique.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Commandes du jour" value={stats?.today.orders_today ?? 0} />
        <Stat label="Recettes du jour" value={formatPrice(stats?.today.revenue_today_cents ?? 0)} />
        <Stat label="Commandes 7 j." value={stats?.week.orders_week ?? 0} />
        <Stat label="Commandes actives" value={stats?.activeOrders ?? 0} highlight />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-bold mb-2">Démarrage rapide</h3>
          <ol className="text-sm space-y-2 text-tif-gray-700 list-decimal pl-5">
            <li>Ajoutez vos plats dans <Link href="/dashboard/menu" className="text-tif-violet">Menu</Link></li>
            <li>Configurez vos créneaux dans <Link href="/dashboard/settings" className="text-tif-violet">Paramètres</Link></li>
            <li>Activez la publication</li>
            <li>Partagez votre lien : <code className="bg-tif-gray-100 px-2 py-1 rounded">/restaurants/{restaurant.slug}</code></li>
          </ol>
        </div>
        <div className="card p-6">
          <h3 className="font-display font-bold mb-2">Votre formule</h3>
          <p className="text-sm text-tif-gray-700">
            Vous bénéficiez de la formule TIF — pas de commission, abonnement mensuel.
          </p>
          <Link href="/dashboard/settings" className="btn-ghost mt-3 inline-flex">Modifier →</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? 'bg-tif-yellow/30' : ''}`}>
      <div className="text-xs text-tif-gray-500 uppercase tracking-wide">{label}</div>
      <div className="font-display font-bold text-2xl mt-1">{value}</div>
    </div>
  );
}
