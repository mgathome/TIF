'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, formatPrice } from '@/lib/api';
import { Loading } from '@/components/Loading';
import { CheckoutForm } from '@/components/CheckoutForm';
import type { Order } from '@/lib/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CreatedOrder {
  order: Order;
  payment: { clientSecret: string; paymentIntentId: string };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { restaurant, lines, subtotalCents, clear } = useCart();

  const [type, setType] = useState<'pickup' | 'delivery'>('pickup');
  const [scheduledFor, setScheduledFor] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [promo, setPromo] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  // Redirige si pas connecté
  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/checkout');
  }, [authLoading, user, router]);

  // Pré-remplit le créneau (dans 30 min)
  useEffect(() => {
    const d = new Date(Date.now() + 30 * 60_000);
    d.setSeconds(0, 0);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
      .toISOString().slice(0, 16);
    setScheduledFor(iso);
  }, []);

  const deliveryFee = type === 'delivery' && restaurant ? restaurant.deliveryFeeCents : 0;
  const total = useMemo(() => subtotalCents + deliveryFee, [subtotalCents, deliveryFee]);

  if (authLoading || !user) return <Loading />;
  if (!restaurant || lines.length === 0) {
    return <div className="section py-10">Votre panier est vide.</div>;
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const data = await api<CreatedOrder>('/orders', {
        method: 'POST',
        body: {
          restaurantId: restaurant!.id,
          type,
          scheduledFor: new Date(scheduledFor).toISOString(),
          items: lines.map((l) => ({
            menuItemId: l.menuItem.id,
            quantity: l.quantity,
            notes: l.notes,
          })),
          deliveryAddress: type === 'delivery' ? address : undefined,
          customerNotes: notes || undefined,
          promoCode: promo || undefined,
        },
      });
      setOrder(data);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création de la commande');
    } finally {
      setCreating(false);
    }
  }

  if (order) {
    return (
      <div className="section py-10 max-w-xl">
        <h1 className="font-display font-bold text-2xl mb-2">Paiement</h1>
        <p className="text-tif-gray-500 mb-6">
          Commande {order.order.orderNumber} · Total {formatPrice(order.order.totalCents)}
        </p>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: order.payment.clientSecret,
            appearance: {
              theme: 'stripe',
              variables: { colorPrimary: '#5B2EFF', borderRadius: '12px' },
            },
          }}
        >
          <CheckoutForm
            orderId={order.order.id}
            onSuccess={() => { clear(); router.push(`/orders/${order.order.id}?welcome=1`); }}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="section py-10 max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-2">Finaliser la commande</h1>
      <p className="text-tif-gray-500 mb-8">Chez {restaurant.name}</p>

      {/* Type */}
      <div className="card p-5 mb-4">
        <label className="text-sm font-medium block mb-2">Type de commande</label>
        <div className="flex gap-3">
          {restaurant.offersPickup && (
            <button onClick={() => setType('pickup')}
              className={`flex-1 py-3 rounded-tif border-2 transition ${type === 'pickup' ? 'border-tif-violet bg-tif-violet/5' : 'border-tif-gray-200'}`}>
              📦 À emporter
            </button>
          )}
          {restaurant.offersDelivery && (
            <button onClick={() => setType('delivery')}
              className={`flex-1 py-3 rounded-tif border-2 transition ${type === 'delivery' ? 'border-tif-violet bg-tif-violet/5' : 'border-tif-gray-200'}`}>
              🚚 Livraison ({formatPrice(restaurant.deliveryFeeCents)})
            </button>
          )}
        </div>
      </div>

      {/* Créneau */}
      <div className="card p-5 mb-4">
        <label className="text-sm font-medium block mb-2">Créneau souhaité</label>
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="input"
        />
      </div>

      {/* Adresse */}
      {type === 'delivery' && (
        <div className="card p-5 mb-4">
          <label className="text-sm font-medium block mb-2">Adresse de livraison</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="12 rue de la République, Lyon"
            className="input"
          />
        </div>
      )}

      {/* Notes */}
      <div className="card p-5 mb-4">
        <label className="text-sm font-medium block mb-2">Notes (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Allergies, instructions..."
          rows={2}
          className="input"
        />
      </div>

      {/* Promo */}
      <div className="card p-5 mb-4">
        <label className="text-sm font-medium block mb-2">Code promo</label>
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value.toUpperCase())}
          placeholder="BIENVENUE10"
          className="input"
        />
      </div>

      {/* Récap */}
      <div className="card p-5 mb-6">
        <div className="flex justify-between text-sm">
          <span>Sous-total</span><span>{formatPrice(subtotalCents)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span>Livraison</span><span>{formatPrice(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg mt-3 pt-3 border-t">
          <span>Total</span><span>{formatPrice(total)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-tif text-sm mb-4">{error}</div>
      )}

      <button
        onClick={handleCreate}
        disabled={creating || !scheduledFor || (type === 'delivery' && !address)}
        className="btn-primary w-full"
      >
        {creating ? 'Création…' : 'Procéder au paiement →'}
      </button>
    </div>
  );
}
