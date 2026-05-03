'use client';

import Image from 'next/image';

/**
 * Mascotte TIF — utilise les vraies images PNG officielles dans /public/mascots/
 * 6 variantes disponibles selon le contexte.
 */

export type MascotVariant = 'tiffy' | 'tibo' | 'flamy' | 'bite' | 'chef' | 'tifus';

interface MascotProps {
  size?: number;
  className?: string;
  variant?: MascotVariant;
  /** Texte alt pour l'accessibilite. Genere automatiquement si non fourni. */
  alt?: string;
  /** Anime la mascotte (rebond doux). Utile sur les call-to-action. */
  animated?: boolean;
}

const MASCOT_NAMES: Record<MascotVariant, string> = {
  tiffy: 'Tiffy le chef',
  tibo: 'Tibo Express',
  flamy: 'Flamy',
  bite: 'Bite',
  chef: 'Chef TIF',
  tifus: 'Tifus',
};

export function Mascot({
  size = 200,
  variant = 'tiffy',
  className = '',
  alt,
  animated = false,
}: MascotProps) {
  const src = `/mascots/${variant}.png`;
  const name = MASCOT_NAMES[variant];

  return (
    <div
      className={`inline-block ${animated ? 'animate-bounce-soft' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt || `Mascotte TIF ${name}`}
        width={size}
        height={size}
        priority={variant === 'tiffy'}
        className="object-contain w-full h-full select-none drop-shadow-sm"
        draggable={false}
      />
    </div>
  );
}
