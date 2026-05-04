'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, formatPrice } from '@/lib/api';
import type { MenuItem, Restaurant } from '@/lib/types';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { useCart } from '@/contexts/CartContext';

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { itemCount, subtotalCents } = useCart();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api<{ restaurant: Restaurant }>(`/restaurants/${slug}`, { auth: false })
      .then(async ({ restaurant }) => {
        setRestaurant(restaurant);
        const { items } = await api<{ items: MenuItem[] }>(`/menu/restaurant/${restaurant.id}`, { auth: false });
        setMenu(items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (error || !restaurant) {
    return <EmptyState title="Restaurant introuvable" description={error || ''} />;
  }

  // Group menu by category
  const grouped: Record<string, MenuItem[]> = {};
  menu.forEach((m) => {
    const cat = m.category || 'Autres';
    (grouped[cat] = grouped[cat] || []).push(m);
  });

  return (
    <>
      {/* Cover */}
      <div className="aspect-[3/1] bg-tif-gray-200 relative max-h-72 overflow-hidden">
        {restaurant.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.coverImageUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-0 right-0 section text-white">
          <h1 className="font-display font-bold text-3xl sm:text-4xl">{restaurant.name}</h1>
          <p className="text-sm opacity-90">
            {restaurant.cuisineType} · {restaurant.address.city} · ⏱ {restaurant.prepTimeMin} min
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="section py-10 grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          {/* Bloc infos pratiques */}
          <div className="card p-5 mb-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {/* Adresse */}
            <div className="flex items-start gap-2">
              <span className="text-base">📍</span>
              <div>
                <div className="font-medium text-tif-black">
                  {restaurant.address.line1}
                  {restaurant.address.line2 && <>, {restaurant.address.line2}</>}
                </div>
                <div className="text-tif-gray-500">
                  {restaurant.address.postalCode} {restaurant.address.city}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${restaurant.address.line1}, ${restaurant.address.postalCode} ${restaurant.address.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tif-violet font-medium hover:underline"
                >
                  Itinéraire →
                </a>
              </div>
            </div>

            {/* Téléphone */}
            {restaurant.phone && (
              <div className="flex items-start gap-2">
                <span className="text-base">📞</span>
                <a href={`tel:${restaurant.phone}`} className="text-tif-black hover:text-tif-violet">
                  {restaurant.phone}
                </a>
              </div>
            )}

            {/* Modes de service */}
            <div className="flex items-start gap-2">
              <span className="text-base">🍽️</span>
              <div>
                {restaurant.offersPickup && <div>📦 À emporter</div>}
                {restaurant.offersDelivery && (
                  <div>🛵 Livraison ({restaurant.deliveryRadiusKm} km autour)</div>
                )}
              </div>
            </div>
          </div>

          {restaurant.description && (
            <p className="text-tif-gray-700 mb-8 max-w-2xl">{restaurant.description}</p>
          )}
          {Object.keys(grouped).length === 0 ? (
            <EmptyState title="Menu vide" description="Le restaurant n'a pas encore publié de plats." />
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <section key={cat} className="mb-10">
                <h2 className="font-display font-bold text-xl mb-4">{cat}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Aside cart */}
        <aside className="hidden lg:block">
          <div className="card p-5 sticky top-20">
            <h3 className="font-display font-bold text-lg mb-3">Votre panier</h3>
            {itemCount === 0 ? (
              <p className="text-sm text-tif-gray-500">
                Ajoutez des plats pour passer commande.
              </p>
            ) : (
              <>
                <p className="text-sm">
                  {itemCount} article{itemCount > 1 ? 's' : ''} · <span className="font-semibold">{formatPrice(subtotalCents)}</span>
                </p>
                <Link href="/cart" className="btn-primary w-full mt-4">
                  Voir le panier →
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Floating cart button mobile */}
      {itemCount > 0 && (
        <Link
          href="/cart"
          className="lg:hidden fixed bottom-6 left-4 right-4 btn-primary shadow-tif-lg z-30"
        >
          Voir le panier · {formatPrice(subtotalCents)} ({itemCount})
        </Link>
      )}
    </>
  );
}
