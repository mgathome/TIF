'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, formatPrice } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { Mascot } from '@/components/Mascot';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente de paiement',
  paid: 'Paiement reçu, en attente du restaurant',
  preparing: 'En préparation',
  ready: 'Prête !',
  out_for_delivery: 'En cours de livraison 🛵',
  completed: 'Terminée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-tif-gray-100 text-tif-gray-700',
  paid: 'bg-tif-violet/10 text-tif-violet',
  preparing: 'bg-amber-100 text-amber-800',
  ready: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-tif-violet text-white',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-tif-gray-100 text-tif-gray-700',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const justPaid = search.get('paid') || search.get('welcome');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    function load() {
      api<{ order: Order }>(`/orders/${id}`)
        .then(({ order }) => alive && setOrder(order))
        .finally(() => alive && setLoading(false));
    }
    load();
    // Polling léger pour suivre le statut
    const t = setInterval(load, 8000);
    return () => { alive = false; clearInterval(t); };
  }, [id]);

  if (loading) return <Loading />;
  if (!order) return <div className="section py-16">Commande introuvable.</div>;

  return (
    <div className="section py-10 max-w-2xl">
      {justPaid && (
        <div className="mb-6 card p-5 bg-tif-yellow/30 border-l-4 border-tif-yellow flex items-center gap-4 animate-slide-up">
          <Mascot size={64} />
          <div>
            <div className="font-display font-bold">Merci pour votre commande !</div>
            <div className="text-sm text-tif-gray-700">
              Le restaurant va la préparer pour le créneau choisi.
            </div>
          </div>
        </div>
      )}

      <h1 className="font-display font-bold text-2xl mb-1">Commande {order.orderNumber}</h1>
      <p className="text-tif-gray-500 mb-6">Pour le {new Date(order.scheduledFor).toLocaleString('fr-FR')}</p>

      <span className={`badge ${STATUS_COLOR[order.status]} mb-6`}>
        {STATUS_LABEL[order.status]}
      </span>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Plats</h2>
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm py-1">
            <span>{it.quantity} × {it.name}</span>
            <span>{formatPrice(it.lineTotalCents)}</span>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex justify-between text-sm mb-1">
          <span>Sous-total</span><span>{formatPrice(order.subtotalCents)}</span>
        </div>
        {order.deliveryFeeCents > 0 && (
          <div className="flex justify-between text-sm mb-1">
            <span>Livraison</span><span>{formatPrice(order.deliveryFeeCents)}</span>
          </div>
        )}
        {order.promoDiscountCents > 0 && (
          <div className="flex justify-between text-sm mb-1 text-green-700">
            <span>Promo {order.promoCodeApplied}</span><span>−{formatPrice(order.promoDiscountCents)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg mt-3 pt-3 border-t">
          <span>Total</span><span>{formatPrice(order.totalCents)}</span>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/orders" className="btn-ghost">← Toutes mes commandes</Link>
      </div>
    </div>
  );
}
