'use client';

/**
 * Mascotte TIF — petit personnage flat, sandwich qui sourit.
 * Utilisé dans empty states, loading, onboarding.
 */
export function Mascot({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Pain du dessous */}
      <ellipse cx="100" cy="160" rx="78" ry="14" fill="#FFD84D" />
      <path d="M22 158 Q22 130 100 130 Q178 130 178 158 L178 165 Q178 168 175 168 L25 168 Q22 168 22 165 Z"
            fill="#FFD84D" stroke="#0F0F0F" strokeWidth="3" />

      {/* Garniture verte */}
      <path d="M30 130 Q40 122 50 130 Q60 122 70 130 Q80 122 90 130 Q100 122 110 130 Q120 122 130 130 Q140 122 150 130 Q160 122 170 130 L170 138 L30 138 Z"
            fill="#7DD87A" />

      {/* Pain du dessus */}
      <path d="M22 100 Q22 50 100 50 Q178 50 178 100 L178 110 Q178 113 175 113 L25 113 Q22 113 22 110 Z"
            fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />

      {/* Yeux */}
      <circle cx="78" cy="85" r="6" fill="#0F0F0F" />
      <circle cx="122" cy="85" r="6" fill="#0F0F0F" />
      <circle cx="80" cy="83" r="2" fill="#FFFFFF" />
      <circle cx="124" cy="83" r="2" fill="#FFFFFF" />

      {/* Sourire */}
      <path d="M85 96 Q100 108 115 96" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Petites graines de sésame */}
      <ellipse cx="60" cy="68" rx="3" ry="2" fill="#FFD84D" transform="rotate(-15 60 68)" />
      <ellipse cx="100" cy="62" rx="3" ry="2" fill="#FFD84D" />
      <ellipse cx="140" cy="68" rx="3" ry="2" fill="#FFD84D" transform="rotate(15 140 68)" />
    </svg>
  );
}
