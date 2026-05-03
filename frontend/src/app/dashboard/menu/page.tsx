'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, formatPrice } from '@/lib/api';
import type { MenuItem, Restaurant } from '@/lib/types';
import { Loading } from '@/components/Loading';

interface FormState {
  id?: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  imageUrl: string;
}

const emptyForm: FormState = {
  name: '', description: '', category: '', priceCents: 0,
  isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, imageUrl: '',
};

export default function DashboardMenuPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormState | null>(null);

  const load = useCallback(async () => {
    const { restaurant } = await api<{ restaurant: Restaurant | null }>('/restaurants/me');
    if (!restaurant) { setLoading(false); return; }
    setRestaurant(restaurant);
    const { items } = await api<{ items: MenuItem[] }>(`/menu/restaurant/${restaurant.id}/all`);
    setItems(items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing || !restaurant) return;
    const payload = {
      name: editing.name,
      description: editing.description || undefined,
      category: editing.category || undefined,
      priceCents: Math.round(editing.priceCents),
      isAvailable: editing.isAvailable,
      isVegetarian: editing.isVegetarian,
      isVegan: editing.isVegan,
      isGlutenFree: editing.isGlutenFree,
      imageUrl: editing.imageUrl || undefined,
    };
    if (editing.id) {
      await api(`/menu/${editing.id}`, { method: 'PATCH', body: payload });
    } else {
      await api(`/menu/restaurant/${restaurant.id}`, { method: 'POST', body: payload });
    }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Désactiver ce plat ?')) return;
    await api(`/menu/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <Loading />;
  if (!restaurant) return <div className="section py-10">Configurez d'abord votre restaurant.</div>;

  return (
    <div className="section py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-3xl">Menu</h1>
        <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary">+ Ajouter un plat</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className={`card p-4 ${!item.isAvailable ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-tif-gray-500">{item.category || '—'}</div>
              </div>
              <div className="font-semibold">{formatPrice(item.priceCents)}</div>
            </div>
            {item.description && (
              <p className="text-sm text-tif-gray-700 mt-2 line-clamp-2">{item.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditing({
                  id: item.id,
                  name: item.name,
                  description: item.description || '',
                  category: item.category || '',
                  priceCents: item.priceCents,
                  isAvailable: item.isAvailable,
                  isVegetarian: item.isVegetarian,
                  isVegan: item.isVegan,
                  isGlutenFree: item.isGlutenFree,
                  imageUrl: item.imageUrl || '',
                })}
                className="btn-ghost text-sm flex-1"
              >Modifier</button>
              <button onClick={() => remove(item.id)} className="btn-ghost text-sm text-red-600">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl mb-4">
              {editing.id ? 'Modifier le plat' : 'Nouveau plat'}
            </h2>
            <div className="space-y-3">
              <input className="input" placeholder="Nom du plat" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <input className="input" placeholder="Catégorie (Pizza, Dessert...)" value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <textarea className="input" placeholder="Description" rows={2} value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <div>
                <label className="text-sm font-medium block mb-1">Prix (€)</label>
                <input className="input" type="number" step="0.10" min={0}
                  value={(editing.priceCents / 100).toFixed(2)}
                  onChange={(e) => setEditing({ ...editing, priceCents: Math.round(parseFloat(e.target.value) * 100) })} />
              </div>
              <input className="input" placeholder="URL image (optionnel)" value={editing.imageUrl}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Toggle label="Disponible" value={editing.isAvailable} onChange={(v) => setEditing({ ...editing, isAvailable: v })} />
                <Toggle label="Végétarien" value={editing.isVegetarian} onChange={(v) => setEditing({ ...editing, isVegetarian: v })} />
                <Toggle label="Vegan" value={editing.isVegan} onChange={(v) => setEditing({ ...editing, isVegan: v })} />
                <Toggle label="Sans gluten" value={editing.isGlutenFree} onChange={(v) => setEditing({ ...editing, isGlutenFree: v })} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="btn-ghost flex-1">Annuler</button>
              <button onClick={save} className="btn-primary flex-1" disabled={!editing.name || editing.priceCents <= 0}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" />
      <span>{label}</span>
    </label>
  );
}
