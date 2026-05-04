'use client';

/**
 * Carte interactive des restaurants avec react-leaflet (OpenStreetMap, gratuit).
 * Affiche les restaurants sur une carte + marker pour la position client.
 */

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Restaurant } from '@/lib/types';

// On charge react-leaflet en dynamic (pas de SSR — leaflet manipule window)
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then((m) => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then((m) => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import('react-leaflet').then((m) => m.Popup),        { ssr: false });
const Circle       = dynamic(() => import('react-leaflet').then((m) => m.Circle),       { ssr: false });

interface RestaurantMapProps {
  restaurants: Restaurant[];
  /** Position client si dispo (centre la carte autour) */
  clientLat?: number;
  clientLon?: number;
  height?: number;
}

export function RestaurantMap({
  restaurants,
  clientLat,
  clientLon,
  height = 400,
}: RestaurantMapProps) {
  // Hack : leaflet importe ses icones via webpack et ca casse en SSR.
  // On configure l'icone par defaut au mount cote client.
  useEffect(() => {
    (async () => {
      const L = await import('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    })();
  }, []);

  // Centre par defaut : Paris si rien d'autre
  const restaurantsWithGeo = restaurants.filter((r) => r.latitude && r.longitude);
  const center: [number, number] = clientLat && clientLon
    ? [clientLat, clientLon]
    : restaurantsWithGeo[0]
      ? [restaurantsWithGeo[0].latitude!, restaurantsWithGeo[0].longitude!]
      : [48.8566, 2.3522]; // Paris fallback

  if (restaurantsWithGeo.length === 0 && !clientLat) {
    return (
      <div className="card p-6 text-center text-sm text-tif-gray-500">
        Aucun restaurant géolocalisé pour l'instant.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker client + cercle de zone */}
        {clientLat && clientLon && (
          <>
            <Marker position={[clientLat, clientLon]}>
              <Popup>📍 Vous êtes ici</Popup>
            </Marker>
          </>
        )}

        {/* Markers restaurants */}
        {restaurantsWithGeo.map((r) => (
          <Marker key={r.id} position={[r.latitude!, r.longitude!]}>
            <Popup>
              <div className="text-sm">
                <strong>{r.name}</strong>
                {r.cuisineType && <div className="text-xs text-gray-500">{r.cuisineType}</div>}
                <div className="mt-1 text-xs">
                  {r.offersDelivery && <>🛵 livre {r.deliveryRadiusKm} km<br /></>}
                  {r.offersPickup && <>📦 à emporter<br /></>}
                  {typeof r.distanceKm === 'number' && <>📍 {r.distanceKm.toFixed(1)} km de chez vous</>}
                </div>
                <a href={`/restaurants/${r.slug}`} className="text-tif-violet font-medium mt-2 inline-block">
                  Voir le menu →
                </a>
              </div>
            </Popup>
            {r.offersDelivery && r.deliveryRadiusKm > 0 && (
              <Circle
                center={[r.latitude!, r.longitude!]}
                radius={r.deliveryRadiusKm * 1000}
                pathOptions={{ color: '#5B2EFF', fillColor: '#5B2EFF', fillOpacity: 0.05, weight: 1 }}
              />
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
