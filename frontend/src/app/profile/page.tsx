'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Loading } from '@/components/Loading';
import { Mascot } from '@/components/Mascot';
import type { User } from '@/lib/types';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    addressLine1: '', addressLine2: '', city: '', postalCode: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [geocoded, setGeocoded] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/profile');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      addressLine1: user.address?.line1 || '',
      addressLine2: user.address?.line2 || '',
      city: user.address?.city || '',
      postalCode: user.address?.postalCode || '',
    });
    setGeocoded(!!(user.latitude && user.longitude));
  }, [user]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const { user: updated } = await api<{ user: User }>('/auth/me', {
        method: 'PATCH', body: form,
      });
      setGeocoded(!!(updated.latitude && updated.longitude));
      setMsg(updated.latitude
        ? '✅ Adresse enregistrée et localisée. Vous verrez les restos qui peuvent vous livrer.'
        : '⚠ Adresse enregistrée mais non géolocalisée — vérifiez qu\'elle est correcte.');
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'Erreur'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) return <Loading />;

  return (
    <div className="section py-10 max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-2">Mon profil</h1>
      <p className="text-tif-gray-500 mb-8">
        Indiquez votre adresse pour voir les restaurants qui livrent chez vous.
      </p>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Identité</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Prénom" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          <input className="input" placeholder="Nom" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </div>
        <input className="input mt-3" placeholder="Téléphone (optionnel)" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">📍 Adresse de livraison</h2>
        <input className="input mb-2" placeholder="Adresse" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
        <input className="input mb-2" placeholder="Complément (optionnel)" value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <input className="input col-span-1" placeholder="Code postal" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
          <input className="input col-span-2" placeholder="Ville" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>

        {geocoded ? (
          <div className="mt-3 text-xs text-green-700 bg-green-50 p-2 rounded">
            ✅ Adresse localisée — les restos qui peuvent vous livrer s'affichent en priorité.
          </div>
        ) : user.address ? (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded">
            ⚠ Adresse non localisée. Vérifiez qu'elle est complète et correcte.
          </div>
        ) : null}
      </div>

      {msg && <div className="card p-3 mb-4 text-sm">{msg}</div>}

      <div className="flex gap-3 items-center">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <Mascot variant="bite" size={64} />
      </div>
    </div>
  );
}
