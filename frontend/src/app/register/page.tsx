'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mascot } from '@/components/Mascot';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: 'client' as 'client' | 'restaurant',
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
      const u = await register(form);
      router.push(u.role === 'restaurant' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <div className="section py-16 max-w-md">
      <div className="text-center mb-6"><Mascot size={100} /></div>
      <h1 className="font-display font-bold text-2xl text-center mb-6">Créer un compte TIF</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => set('role', 'client')}
            className={`flex-1 py-2 rounded-tif border-2 ${form.role === 'client' ? 'border-tif-violet bg-tif-violet/5' : 'border-tif-gray-200'}`}>
            👤 Client
          </button>
          <button type="button" onClick={() => set('role', 'restaurant')}
            className={`flex-1 py-2 rounded-tif border-2 ${form.role === 'restaurant' ? 'border-tif-violet bg-tif-violet/5' : 'border-tif-gray-200'}`}>
            🍽️ Restaurant
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Prénom" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          <input className="input" placeholder="Nom" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </div>
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        <input className="input" type="password" placeholder="Mot de passe (8+ caractères)" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} />
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-tif text-sm">{error}</div>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="text-center mt-4 text-sm">
        Déjà inscrit ? <Link href="/login" className="text-tif-violet font-semibold">Connexion</Link>
      </p>
    </div>
  );
}
