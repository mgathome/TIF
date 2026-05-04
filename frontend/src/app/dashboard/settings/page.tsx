'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { ImageUpload } from '@/components/ImageUpload';

export default function DashboardSettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: Restaurant | null }>('/restaurants/me').then(({ restaurant }) => setRestaurant(restaurant));
  }, []);

  async function save() {
    if (!restaurant) return;
    setSaving(true); setMsg(null);
    try {
      const { restaurant: updated } = await api<{ restaurant: Restaurant }>(`/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        body: {
          name: restaurant.name,
          description: restaurant.description,
          cuisineType: restaurant.cuisineType,
          phone: restaurant.phone,
          coverImageUrl: restaurant.coverImageUrl,
          logoUrl: restaurant.logoUrl,
          isPublished: restaurant.isPublished,
          deliveryFeeCents: restaurant.deliveryFeeCents,
          minOrderCents: restaurant.minOrderCents,
          prepTimeMin: restaurant.prepTimeMin,
          offersPickup: restaurant.offersPickup,
          offersDelivery: restaurant.offersDelivery,
        },
      });
      setRestaurant(updated);
      setMsg('Enregistré ✓');
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!restaurant) return <Loading />;

  return (
    <div className="section py-10 max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-6">Paramètres</h1>

      <div className="card p-5 mb-4 space-y-4">
        <h2 className="font-semibold">Identité</h2>
        <input className="input" placeholder="Nom" value={restaurant.name}
          onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Description" value={restaurant.description || ''}
          onChange={(e) => setRestaurant({ ...restaurant, description: e.target.value })} />
        <input className="input" placeholder="Type de cuisine" value={restaurant.cuisineType || ''}
          onChange={(e) => setRestaurant({ ...restaurant, cuisineType: e.target.value })} />
        <input className="input" placeholder="Téléphone" value={restaurant.phone || ''}
          onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })} />

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <ImageUpload
            label="Logo (photo de profil)"
            value={restaurant.logoUrl}
            onChange={(url) => setRestaurant({ ...restaurant, logoUrl: url })}
            shape="square"
            size={140}
            folder="tif/restaurants/logos"
          />
          <ImageUpload
            label="Image de couverture"
            value={restaurant.coverImageUrl}
            onChange={(url) => setRestaurant({ ...restaurant, coverImageUrl: url })}
            shape="wide"
            size={160}
            folder="tif/restaurants/covers"
          />
        </div>
      </div>

      <div className="card p-5 mb-4 space-y-3">
        <h2 className="font-semibold">Service</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={restaurant.offersPickup}
            onChange={(e) => setRestaurant({ ...restaurant, offersPickup: e.target.checked })} />
          À emporter
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={restaurant.offersDelivery}
            onChange={(e) => setRestaurant({ ...restaurant, offersDelivery: e.target.checked })} />
          Livraison
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Min. commande (€)</label>
            <input className="input" type="number" step="0.50" value={(restaurant.minOrderCents / 100).toFixed(2)}
              onChange={(e) => setRestaurant({ ...restaurant, minOrderCents: Math.round(parseFloat(e.target.value) * 100) })} />
          </div>
          <div>
            <label className="text-sm">Livraison (€)</label>
            <input className="input" type="number" step="0.10" value={(restaurant.deliveryFeeCents / 100).toFixed(2)}
              onChange={(e) => setRestaurant({ ...restaurant, deliveryFeeCents: Math.round(parseFloat(e.target.value) * 100) })} />
          </div>
          <div>
            <label className="text-sm">Prépa (min)</label>
            <input className="input" type="number" value={restaurant.prepTimeMin}
              onChange={(e) => setRestaurant({ ...restaurant, prepTimeMin: parseInt(e.target.value, 10) })} />
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-3">Publication</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={restaurant.isPublished}
            onChange={(e) => setRestaurant({ ...restaurant, isPublished: e.target.checked })} />
          Visible par les clients
        </label>
      </div>

      {msg && <div className="text-sm text-tif-violet mb-3">{msg}</div>}
      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}
