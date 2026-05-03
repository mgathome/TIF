'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatPrice } from '@/lib/api';
import type { Order } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/orders');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api<{ orders: Order[] }>('/orders/me')
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return <Loading />;
  if (orders.length === 0) {
    return (
      <div className="section py-16">
        <EmptyState
          title="Aucune commande pour l'instant"
          description="Découvrez nos restaurants et passez votre première commande."
          action={<Link href="/" className="btn-primary">Voir les restaurants</Link>}
        />
      </div>
    );
  }

  return (
    <div className="section py-10 max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-6">Mes commandes</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="card p-4 flex justify-between items-center hover:shadow-tif-lg transition">
            <div>
              <div className="font-semibold">{o.orderNumber}</div>
              <div className="text-sm text-tif-gray-500">
                {new Date(o.scheduledFor).toLocaleString('fr-FR')} · {o.items.length} article{o.items.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatPrice(o.totalCents)}</div>
              <div className="text-xs text-tif-gray-500">{o.status}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
