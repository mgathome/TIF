'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, formatPrice } from '@/lib/api';
import type { Order, Restaurant, OrderStatus } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';

const COLUMNS: { status: OrderStatus; label: string; nextStatus?: OrderStatus; nextLabel?: string }[] = [
  { status: 'paid', label: 'En attente', nextStatus: 'preparing', nextLabel: 'Démarrer la préparation →' },
  { status: 'preparing', label: 'En préparation', nextStatus: 'ready', nextLabel: 'Marquer prête →' },
  { status: 'ready', label: 'Prêtes', nextStatus: 'completed', nextLabel: 'Marquer remise →' },
];

export default function DashboardOrdersPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { restaurant } = await api<{ restaurant: Restaurant | null }>('/restaurants/me');
    if (!restaurant) { setLoading(false); return; }
    setRestaurant(restaurant);
    const { orders } = await api<{ orders: Order[] }>(`/orders/restaurant/${restaurant.id}`);
    setOrders(orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  async function transition(orderId: string, status: OrderStatus) {
    await api(`/orders/${orderId}/status`, { method: 'PATCH', body: { status } });
    load();
  }

  if (loading) return <Loading />;
  if (!restaurant) return <div className="section py-10">Configurez d'abord votre restaurant.</div>;

  return (
    <div className="section py-10">
      <h1 className="font-display font-bold text-3xl mb-6">Commandes</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{col.label}</h2>
                <span className="badge bg-tif-gray-100 text-tif-gray-700">{colOrders.length}</span>
              </div>
              {colOrders.length === 0 ? (
                <div className="card p-6 text-center text-sm text-tif-gray-500">
                  Aucune commande
                </div>
              ) : (
                <div className="space-y-3">
                  {colOrders.map((o) => (
                    <div key={o.id} className="card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{o.orderNumber}</div>
                          <div className="text-xs text-tif-gray-500">
                            {new Date(o.scheduledFor).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })} · {o.type === 'delivery' ? '🚚' : '📦'}
                          </div>
                        </div>
                        <span className="font-semibold">{formatPrice(o.totalCents)}</span>
                      </div>
                      <ul className="text-sm text-tif-gray-700 mb-3">
                        {o.items.map((it) => (
                          <li key={it.id}>{it.quantity} × {it.name}</li>
                        ))}
                      </ul>
                      {o.customerNotes && (
                        <div className="text-xs bg-amber-50 p-2 rounded mb-2">
                          📝 {o.customerNotes}
                        </div>
                      )}
                      {col.nextStatus && (
                        <button onClick={() => transition(o.id, col.nextStatus!)} className="btn-primary w-full text-sm py-2">
                          {col.nextLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <EmptyState title="Pas encore de commande" description="Les commandes payées apparaîtront ici." />
      )}
    </div>
  );
}
