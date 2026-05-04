/**
 * Service de geocodage via Nominatim (OpenStreetMap, gratuit, pas de cle API).
 * Convertit une adresse (texte) en coordonnees GPS (lat/lon).
 *
 * Conditions d'usage Nominatim :
 *   - Max 1 requete / seconde
 *   - User-Agent identifiant requis
 *   - Mettre en cache les resultats (on garde lat/lon en DB)
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'TIF/1.0 (mgathomeconciergerie@gmail.com)';

/**
 * Geocode une adresse en {lat, lon}.
 * Renvoie null si introuvable.
 *
 * @param {string} addressLine
 * @param {string} city
 * @param {string} postalCode
 * @param {string} country - code pays ISO (FR, BE, ...)
 */
async function geocode({ addressLine, city, postalCode, country = 'FR' }) {
  const query = [addressLine, postalCode, city, country].filter(Boolean).join(', ');
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn('[geocode] HTTP error', res.status, query);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[geocode] No result for', query);
      return null;
    }
    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
  } catch (err) {
    console.error('[geocode] failed', err.message);
    return null;
  }
}

/**
 * Calcule la distance en km entre 2 points GPS (formule de Haversine).
 */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // rayon Terre en km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

module.exports = { geocode, distanceKm };
