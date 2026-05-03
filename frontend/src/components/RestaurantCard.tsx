import Link from 'next/link';
import type { Restaurant } from '@/lib/types';
import { formatPrice } from '@/lib/api';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="card hover:shadow-tif-lg transition-shadow group block"
    >
      <div className="aspect-[16/10] relative bg-tif-gray-100 overflow-hidden">
        {restaurant.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        {restaurant.cuisineType && (
          <span className="absolute top-3 left-3 badge bg-white/90 text-tif-black backdrop-blur">
            {restaurant.cuisineType}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-lg text-tif-black">{restaurant.name}</h3>
        <p className="text-sm text-tif-gray-500 mt-1 line-clamp-2">
          {restaurant.description || ' '}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-tif-gray-700">
          <span>⏱ {restaurant.prepTimeMin} min</span>
          {restaurant.offersDelivery && (
            <span>🚚 {formatPrice(restaurant.deliveryFeeCents)}</span>
          )}
          {restaurant.offersPickup && <span>📦 À emporter</span>}
        </div>
        <div className="text-xs text-tif-gray-500 mt-2">{restaurant.address.city}</div>
      </div>
    </Link>
  );
}
