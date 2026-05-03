'use client';

import Link from 'next/link';

/**
 * Logo TIF officiel : "T" violet + fourchette jaune + "F" violet
 * Style fidele au board DA (la fourchette remplace le "I").
 */
export function Logo({ light = false, size = 'md' }: { light?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const heightPx = size === 'sm' ? 28 : size === 'lg' ? 56 : 36;
  const violet = light ? '#FFFFFF' : '#5B2EFF';
  const yellow = '#FFD84D';

  return (
    <Link href="/" className="inline-flex items-center" aria-label="TIF - Take Your Food">
      <svg height={heightPx} viewBox="0 0 110 56" xmlns="http://www.w3.org/2000/svg">
        {/* Lettre T */}
        <path d="M2 2 L40 2 L40 14 L26 14 L26 54 L16 54 L16 14 L2 14 Z"
              fill={violet} />

        {/* Fourchette jaune (remplace le I) */}
        <g>
          {/* 4 dents */}
          <rect x="50" y="2"  width="3" height="12" fill={yellow} rx="1" />
          <rect x="55" y="2"  width="3" height="12" fill={yellow} rx="1" />
          <rect x="60" y="2"  width="3" height="12" fill={yellow} rx="1" />
          <rect x="65" y="2"  width="3" height="12" fill={yellow} rx="1" />
          {/* Base de la fourchette */}
          <rect x="48" y="14" width="22" height="6" fill={yellow} rx="1.5" />
          {/* Manche */}
          <rect x="56" y="20" width="6" height="34" fill={yellow} rx="1.5" />
        </g>

        {/* Lettre F */}
        <path d="M78 2 L108 2 L108 14 L92 14 L92 24 L106 24 L106 36 L92 36 L92 54 L78 54 Z"
              fill={violet} />
      </svg>
    </Link>
  );
}
