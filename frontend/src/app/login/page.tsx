'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Mascot } from '@/components/Mascot';

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const u = await login(email, password);
      router.push(u.role === 'restaurant' ? '/dashboard' : redirect);
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <div className="section py-16 max-w-md">
      <div className="text-center mb-6"><Mascot size={100} /></div>
      <h1 className="font-display font-bold text-2xl text-center mb-6">Bon retour !</h1>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" />
        </div>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-tif text-sm">{error}</div>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="text-center mt-4 text-sm">
        Pas de compte ? <Link href="/register" className="text-tif-violet font-semibold">S'inscrire</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
