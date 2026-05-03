'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export function CheckoutForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?paid=1`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Paiement refusé');
      setLoading(false);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <PaymentElement />
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-tif text-sm">{error}</div>}
      <button disabled={!stripe || loading} className="btn-primary w-full">
        {loading ? 'Paiement…' : 'Payer maintenant'}
      </button>
      <p className="text-xs text-tif-gray-500 text-center">
        Paiement sécurisé via Stripe. Vos informations bancaires ne transitent pas par TIF.
      </p>
    </form>
  );
}
