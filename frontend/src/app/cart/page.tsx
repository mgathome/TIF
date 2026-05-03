'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';

export default function CartPage() {
  const { restaurant, lines, updateQuantity, removeItem, subtotalCents } = useCart();

  if (lines.length === 0 || !restaurant) {
    return (
      <div className="section py-16">
        <EmptyState
          title="Votre panier est vide"
          description="Découvrez nos restaurants pour passer une commande."
          action={<Link href="/" className="btn-primary">Voir les restaurants</Link>}
        />
      </div>
    );
  }

  const minOrderOk = subtotalCents >= restaurant.minOrderCents;

  return (
    <div className="section py-10 max-w-3xl">
      <h1 className="font-display font-bold text-3xl mb-2">Votre panier</h1>
      <p className="text-tif-gray-500 mb-8">Chez {restaurant.name}</p>

      <div className="space-y-3 mb-8">
        {lines.map((line) => (
          <div key={line.menuItem.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{line.menuItem.name}</div>
              <div className="text-sm text-tif-gray-500">
                {formatPrice(line.menuItem.priceCents)} l'unité
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(line.menuItem.id, line.quantity - 1)}
                className="btn-ghost w-8 h-8 p-0"
                aria-label="Diminuer"
              >−</button>
              <span className="w-6 text-center font-medium">{line.quantity}</span>
              <button
                onClick={() => updateQuantity(line.menuItem.id, line.quantity + 1)}
                className="btn-ghost w-8 h-8 p-0"
                aria-label="Augmenter"
              >+</button>
            </div>
            <div className="font-semibold w-20 text-right">
              {formatPrice(line.menuItem.priceCents * line.quantity)}
            </div>
            <button
              onClick={() => removeItem(line.menuItem.id)}
              className="text-tif-gray-500 hover:text-red-600 text-sm"
              aria-label="Supprimer"
            >×</button>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-6">
        <div className="flex justify-between mb-2">
          <span>Sous-total</span>
          <span className="font-semibold">{formatPrice(subtotalCents)}</span>
        </div>
        {!minOrderOk && (
          <p className="text-sm text-amber-700 mt-2">
            Minimum de commande : {formatPrice(restaurant.minOrderCents)}
          </p>
        )}
      </div>

      <Link
        href="/checkout"
        className={`btn-primary w-full ${!minOrderOk ? 'pointer-events-none opacity-50' : ''}`}
      >
        Continuer vers le paiement →
      </Link>
    </div>
  );
}
