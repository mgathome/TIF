'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Logo } from './Logo';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();

  // La navbar prend un fond violet sur le dashboard restaurant (cf DA)
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return (
      <header className="bg-tif-violet text-white sticky top-0 z-40">
        <div className="section flex items-center justify-between h-16">
          <Logo light />
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-tif-yellow">Tableau de bord</Link>
            <Link href="/dashboard/orders" className="hover:text-tif-yellow">Commandes</Link>
            <Link href="/dashboard/menu" className="hover:text-tif-yellow">Menu</Link>
            <Link href="/dashboard/settings" className="hover:text-tif-yellow">Paramètres</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:inline opacity-80">{user?.email}</span>
            <button onClick={logout} className="btn-ghost text-white hover:bg-white/10">Déconnexion</button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-tif-gray-100 sticky top-0 z-40">
      <div className="section flex items-center justify-between h-16">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-tif-violet">Accueil</Link>
          <Link href="/restaurants" className="hover:text-tif-violet">Restaurants</Link>
          <Link href="/orders" className="hover:text-tif-violet">Mes commandes</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative btn-ghost" aria-label="Panier">
            🛒
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-tif-violet text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <button onClick={logout} className="btn-ghost text-sm">Déconnexion</button>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm hidden sm:inline-flex">Connexion</Link>
              <Link href="/register" className="btn-primary text-sm">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
