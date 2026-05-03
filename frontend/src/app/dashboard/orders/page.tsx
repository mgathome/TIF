'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, formatPrice } from '@/lib/api';
import type { Order, Restaurant, OrderStatus, OrderType } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';

// Colonnes du kanban (le statut "out_for_delivery" est partage avec "ready"
// quand on n'est pas en mode delivery, donc on ne l'affiche qu'au besoin).
interface ColumnDef {
  status: OrderStatus;
  label: string;
}
const COLUMNS: ColumnDef[] = [
  { status: 'paid',             label: 'En attente' },
  { status: 'preparing',        label: 'En préparation' },
  { status: 'ready',            label: 'Prêtes' },
  { status: 'out_for_delivery', label: 'En livraison' },
];

// Pour un ordre donne, retourne la prochaine action possible.
function nextAction(order: Order): { status: OrderStatus; label: string } | null {
  switch (order.status) {
    case 'paid':       return { status: 'preparing', label: 'Démarrer la préparation →' };
    case 'preparing':  return order.type === 'delivery'
                         ? { status: 'ready', label: 'Prête à partir →' }
                         : { status: 'ready', label: 'Marquer prête →' };
    case 'ready':      return order.type === 'delivery'
                         ? { status: 'out_for_delivery', label: '🛵 Livreur parti →' }
                         : { status: 'completed', label: 'Marquer remise ✓' };
    case 'out_for_delivery': return { status: 'completed', label: 'Marquer livrée ✓' };
    default: return null;
  }
}

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

  // On masque la colonne "En livraison" si aucun ordre dedans ET si le restaurant n'offre pas la livraison
  const visibleColumns = COLUMNS.filter((c) => {
    if (c.status !== 'out_for_delivery') return true;
    return restaurant.offersDelivery || orders.some((o) => o.status === 'out_for_delivery');
  });

  return (
    <div className="section py-10">
      <h1 className="font-display font-bold text-3xl mb-6">Commandes</h1>

      <div className={`grid gap-6 ${visibleColumns.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {visibleColumns.map((col) => {
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
                  {colOrders.map((o) => <OrderCard key={o.id} order={o} onTransition={transition} />)}
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

// === Order card ===
function OrderCard({ order: o, onTransition }: { order: Order; onTransition: (id: string, s: OrderStatus) => void }) {
  const isDelivery = o.type === 'delivery';
  const mapsUrl = o.deliveryAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.deliveryAddress)}`
    : null;
  const scheduled = new Date(o.scheduledFor);
  const minutesLeft = Math.round((scheduled.getTime() - Date.now()) / 60000);
  const next = nextAction(o);

  return (
    <div className="card p-4">
      {/* En-tete */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{o.orderNumber}</div>
          <div className="text-xs text-tif-gray-500">
            {scheduled.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            {minutesLeft > 0 && minutesLeft < 120 && (
              <span className={`ml-1 font-medium ${minutesLeft < 15 ? 'text-red-600' : 'text-tif-violet'}`}>
                · dans {minutesLeft} min
              </span>
            )}
            {minutesLeft <= 0 && minutesLeft > -240 && (
              <span className="ml-1 font-medium text-red-600">· en retard ({-minutesLeft} min)</span>
            )}
          </div>
        </div>
        <span className="font-semibold whitespace-nowrap ml-2">{formatPrice(o.totalCents)}</span>
      </div>

      {/* Badge type */}
      <div className="mb-3">
        {isDelivery ? (
          <span className="badge bg-tif-violet text-white">🛵 LIVRAISON</span>
        ) : (
          <span className="badge bg-tif-yellow text-tif-black">📦 À EMPORTER</span>
        )}
      </div>

      {/* Bloc adresse de livraison */}
      {isDelivery && o.deliveryAddress && (
        <div className="bg-tif-violet/5 border border-tif-violet/20 rounded-tif p-3 mb-3 text-sm">
          <div className="font-medium text-tif-black mb-1">📍 Adresse de livraison</div>
          <div className="text-tif-gray-700">{o.deliveryAddress}</div>
          {o.deliveryNotes && (
            <div className="text-xs text-tif-gray-500 mt-1 italic">ℹ️ {o.deliveryNotes}</div>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-tif-violet font-medium hover:underline text-xs"
            >
              🗺️ Itinéraire Google Maps →
            </a>
          )}
        </div>
      )}

      {/* Plats */}
      <ul className="text-sm text-tif-gray-700 mb-3 space-y-0.5">
        {o.items.map((it) => (
          <li key={it.id} className="flex justify-between">
            <span>{it.quantity} × {it.name}</span>
            <span className="text-tif-gray-500">{formatPrice(it.lineTotalCents)}</span>
          </li>
        ))}
      </ul>

      {/* Notes client */}
      {o.customerNotes && (
        <div className="text-xs bg-amber-50 border border-amber-200 p-2 rounded mb-2">
          📝 <span className="font-medium">Note :</span> {o.customerNotes}
        </div>
      )}

      {/* CTA dynamique */}
      {next && (
        <button onClick={() => onTransition(o.id, next.status)} className="btn-primary w-full text-sm py-2">
          {next.label}
        </button>
      )}
    </div>
  );
}
