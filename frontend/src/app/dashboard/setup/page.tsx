'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SetupRestaurantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', description: '', cuisineType: '',
    addressLine1: '', city: '', postalCode: '',
    phone: '',
    offersPickup: true, offersDelivery: false,
    deliveryFeeCents: 350, minOrderCents: 1000, prepTimeMin: 25,
    coverImageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api('/restaurants', { method: 'POST', body: form });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section py-10 max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-2">Configurer mon restaurant</h1>
      <p className="text-tif-gray-500 mb-8">Quelques infos et c'est parti.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="card p-5 space-y-3">
          <input className="input" placeholder="Nom du restaurant" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className="input" placeholder="Type de cuisine (italien, japonais...)" value={form.cuisineType} onChange={(e) => set('cuisineType', e.target.value)} />
          <textarea className="input" placeholder="Description" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          <input className="input" placeholder="URL de l'image de couverture" value={form.coverImageUrl} onChange={(e) => set('coverImageUrl', e.target.value)} />
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="font-semibold">Adresse</h3>
          <input className="input" placeholder="Adresse" required value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Code postal" required value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
            <input className="input" placeholder="Ville" required value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <input className="input" placeholder="Téléphone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="font-semibold">Mode de service</h3>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.offersPickup} onChange={(e) => set('offersPickup', e.target.checked)} />
            À emporter
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.offersDelivery} onChange={(e) => set('offersDelivery', e.target.checked)} />
            Livraison (gérée par mes soins)
          </label>
          {form.offersDelivery && (
            <div>
              <label className="text-sm">Frais de livraison (€)</label>
              <input className="input" type="number" step="0.10" min={0}
                value={(form.deliveryFeeCents / 100).toFixed(2)}
                onChange={(e) => set('deliveryFeeCents', Math.round(parseFloat(e.target.value) * 100))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Min. commande (€)</label>
              <input className="input" type="number" step="0.50" min={0}
                value={(form.minOrderCents / 100).toFixed(2)}
                onChange={(e) => set('minOrderCents', Math.round(parseFloat(e.target.value) * 100))} />
            </div>
            <div>
              <label className="text-sm">Temps de prép (min)</label>
              <input className="input" type="number" min={5}
                value={form.prepTimeMin}
                onChange={(e) => set('prepTimeMin', parseInt(e.target.value, 10))} />
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-tif text-sm">{error}</div>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Création…' : 'Créer mon restaurant'}
        </button>
      </form>
    </div>
  );
}
