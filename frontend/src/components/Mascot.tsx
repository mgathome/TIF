'use client';

/**
 * Mascotte TIF "Tiffy le chef" — burger avec toque, spatule et baskets violettes.
 * Style flat, fidele au board DA officiel.
 *
 * Pour utiliser une vraie image PNG plus tard :
 *   1. Mettre le fichier dans frontend/public/mascots/tiffy.png
 *   2. Remplacer le SVG par <Image src="/mascots/tiffy.png" .../>
 */

interface MascotProps {
  size?: number;
  className?: string;
  /** Variante optionnelle : tiffy (defaut) | tibo | flamy | bite | chef | tifus */
  variant?: 'tiffy' | 'tibo' | 'flamy' | 'bite' | 'chef' | 'tifus';
}

export function Mascot({ size = 200, variant = 'tiffy', className = '' }: MascotProps) {
  switch (variant) {
    case 'tibo':  return <Tibo  size={size} className={className} />;
    case 'flamy': return <Flamy size={size} className={className} />;
    case 'bite':  return <Bite  size={size} className={className} />;
    case 'chef':  return <Chef  size={size} className={className} />;
    case 'tifus': return <Tifus size={size} className={className} />;
    default:      return <Tiffy size={size} className={className} />;
  }
}

// ============== TIFFY LE CHEF (mascotte principale) ==============
function Tiffy({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 280 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Toque de chef */}
      <ellipse cx="140" cy="56" rx="58" ry="14" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      <path d="M82 56 Q60 30 90 18 Q110 6 140 18 Q170 6 190 18 Q220 30 198 56 Z"
            fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="48" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#0F0F0F">TIF</text>

      {/* Pain dessus */}
      <path d="M50 110 Q50 75 140 75 Q230 75 230 110 L230 130 Q230 134 226 134 L54 134 Q50 134 50 130 Z"
            fill="#FFD84D" stroke="#0F0F0F" strokeWidth="3" />
      {/* Graines */}
      <ellipse cx="90"  cy="100" rx="3" ry="2" fill="#E6BE2E" transform="rotate(-15 90 100)" />
      <ellipse cx="120" cy="92"  rx="3" ry="2" fill="#E6BE2E" />
      <ellipse cx="160" cy="94"  rx="3" ry="2" fill="#E6BE2E" transform="rotate(20 160 94)" />
      <ellipse cx="195" cy="103" rx="3" ry="2" fill="#E6BE2E" transform="rotate(15 195 103)" />

      {/* Salade verte */}
      <path d="M48 134 Q60 124 72 134 Q84 124 96 134 Q108 124 120 134 Q132 124 144 134 Q156 124 168 134 Q180 124 192 134 Q204 124 216 134 Q228 124 232 132 L232 144 L48 144 Z"
            fill="#7DD87A" stroke="#0F0F0F" strokeWidth="2" />

      {/* Steak */}
      <rect x="48" y="142" width="184" height="18" fill="#7A4628" stroke="#0F0F0F" strokeWidth="2" />

      {/* Fromage qui coule */}
      <path d="M50 158 Q60 168 70 158 Q80 172 90 158 Q100 170 110 158 Q120 168 130 158 Q140 172 150 158 Q160 168 170 158 Q180 170 190 158 Q200 168 210 158 Q220 170 230 158 L230 168 L50 168 Z"
            fill="#FFC83D" stroke="#0F0F0F" strokeWidth="2" />

      {/* Pain dessous */}
      <path d="M50 168 Q50 200 140 200 Q230 200 230 168 L226 168 Q226 165 222 165 L58 165 Q54 165 54 168 Z"
            fill="#FFD84D" stroke="#0F0F0F" strokeWidth="3" />

      {/* === Visage sur le pain du dessus === */}
      {/* Oeil gauche (ferme - clin d'oeil) */}
      <path d="M104 110 Q110 105 116 110" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Oeil droit (ouvert) */}
      <circle cx="170" cy="108" r="6" fill="#0F0F0F" />
      <circle cx="172" cy="106" r="2" fill="#FFFFFF" />
      {/* Sourire */}
      <path d="M115 122 Q140 138 165 122" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Joues roses */}
      <ellipse cx="92"  cy="120" rx="6" ry="4" fill="#FFB3C1" opacity="0.6" />
      <ellipse cx="188" cy="120" rx="6" ry="4" fill="#FFB3C1" opacity="0.6" />

      {/* === Bras gauche tenant la spatule === */}
      <path d="M48 165 Q20 175 25 200" stroke="#0F0F0F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="205" r="9" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
      {/* Spatule */}
      <rect x="6" y="160" width="6" height="50" fill="#0F0F0F" rx="2" />
      <rect x="-2" y="140" width="22" height="22" fill="#C0C0C0" stroke="#0F0F0F" strokeWidth="2" rx="2" />

      {/* === Bras droit pouce leve === */}
      <path d="M232 165 Q260 175 258 200" stroke="#0F0F0F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="260" cy="205" r="10" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <rect x="256" y="194" width="8" height="14" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2" rx="2" />

      {/* === Pantalon violet (en bas) === */}
      <path d="M80 200 Q80 240 100 260 L120 260 L120 220 L160 220 L160 260 L180 260 Q200 240 200 200 Z"
            fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="240" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" fill="#FFFFFF">TIF</text>

      {/* Baskets violettes */}
      <ellipse cx="105" cy="280" rx="22" ry="10" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <rect x="88" y="270" width="34" height="12" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2" rx="3" />
      <ellipse cx="175" cy="280" rx="22" ry="10" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <rect x="158" y="270" width="34" height="12" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2" rx="3" />
    </svg>
  );
}

// ============== TIBO EXPRESS (sac livreur) ==============
function Tibo({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 280 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Lignes de vitesse */}
      <line x1="20" y1="160" x2="60" y2="160" stroke="#5B2EFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="180" x2="55" y2="180" stroke="#5B2EFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="25" y1="200" x2="65" y2="200" stroke="#5B2EFF" strokeWidth="4" strokeLinecap="round" />

      {/* Anses du sac */}
      <path d="M110 80 Q110 50 140 50 Q170 50 170 80" stroke="#0F0F0F" strokeWidth="6" fill="none" />

      {/* Sac violet */}
      <path d="M85 80 L195 80 L210 250 L70 250 Z" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="170" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="32" fontWeight="900" fill="#FFFFFF">TIF</text>

      {/* Yeux */}
      <circle cx="115" cy="120" r="8" fill="#FFFFFF" />
      <circle cx="165" cy="120" r="8" fill="#FFFFFF" />
      <circle cx="117" cy="122" r="4" fill="#0F0F0F" />
      <circle cx="167" cy="122" r="4" fill="#0F0F0F" />

      {/* Bras qui courent */}
      <path d="M70 180 Q40 200 50 230" stroke="#0F0F0F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="232" r="9" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <path d="M210 180 Q240 195 230 220" stroke="#0F0F0F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="232" cy="222" r="9" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />

      {/* Jambes qui courent */}
      <path d="M110 250 Q90 280 105 295" stroke="#0F0F0F" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M170 250 Q200 270 195 295" stroke="#0F0F0F" strokeWidth="8" fill="none" strokeLinecap="round" />

      {/* Baskets */}
      <ellipse cx="100" cy="298" rx="20" ry="9" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <ellipse cx="200" cy="298" rx="20" ry="9" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
    </svg>
  );
}

// ============== FLAMY (flamme violette) ==============
function Flamy({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 280 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Forme flamme */}
      <path d="M140 30 Q100 80 90 130 Q70 160 80 200 Q90 250 140 270 Q190 250 200 200 Q210 160 190 130 Q180 80 140 30 Z"
            fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="200" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF">TIF</text>

      {/* Yeux */}
      <circle cx="118" cy="140" r="9" fill="#FFFFFF" />
      <circle cx="162" cy="140" r="9" fill="#FFFFFF" />
      <circle cx="120" cy="142" r="5" fill="#0F0F0F" />
      <circle cx="164" cy="142" r="5" fill="#0F0F0F" />

      {/* Sourire */}
      <path d="M120 168 Q140 182 160 168" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Pouces leves */}
      <circle cx="65" cy="195" r="14" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <rect x="58" y="180" width="14" height="20" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2" rx="3" />
      <circle cx="215" cy="195" r="14" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <rect x="208" y="180" width="14" height="20" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2" rx="3" />

      {/* Cloche argentee a la main */}
      <path d="M105 220 Q140 210 175 220" stroke="#0F0F0F" strokeWidth="2" fill="none" />
      <ellipse cx="140" cy="225" rx="35" ry="14" fill="#C0C0C0" stroke="#0F0F0F" strokeWidth="2" />

      {/* Baskets */}
      <ellipse cx="115" cy="295" rx="20" ry="8" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <ellipse cx="165" cy="295" rx="20" ry="8" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
    </svg>
  );
}

// ============== BITE (cookie casquette) ==============
function Bite({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 280 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Casquette violette */}
      <ellipse cx="140" cy="55" rx="68" ry="16" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <path d="M80 55 Q80 25 140 25 Q200 25 200 55 Z" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="50" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#FFFFFF">TIF</text>

      {/* Cookie rond avec encoche */}
      <path d="M80 160 Q80 100 140 80 Q200 100 200 160 L 195 165 L 180 155 L 165 165 L 200 175 Q200 220 140 240 Q80 220 80 160 Z"
            fill="#FFD84D" stroke="#0F0F0F" strokeWidth="3" />

      {/* Yeux */}
      <circle cx="115" cy="155" r="8" fill="#0F0F0F" />
      <circle cx="165" cy="155" r="8" fill="#0F0F0F" />
      <circle cx="117" cy="153" r="3" fill="#FFFFFF" />
      <circle cx="167" cy="153" r="3" fill="#FFFFFF" />

      {/* Sourire avec dent */}
      <path d="M118 180 Q140 198 162 180" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="135" y="180" width="6" height="6" fill="#FFFFFF" />

      {/* Bras gauche - signe V */}
      <path d="M85 200 Q60 195 50 175" stroke="#0F0F0F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="173" r="9" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />

      {/* Bras droit avec sac */}
      <path d="M195 220 Q220 225 215 250" stroke="#0F0F0F" strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="195" y="245" width="40" height="40" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2" />
      <text x="215" y="270" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#FFFFFF">TIF</text>
      <path d="M200 245 Q200 235 215 235 Q230 235 230 245" stroke="#0F0F0F" strokeWidth="2" fill="none" />

      {/* Baskets */}
      <ellipse cx="115" cy="293" rx="20" ry="8" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <ellipse cx="165" cy="293" rx="20" ry="8" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
    </svg>
  );
}

// ============== CHEF TIF (chef humain) ==============
function Chef({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 280 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Toque */}
      <path d="M85 70 Q60 35 100 25 Q120 10 140 25 Q160 10 180 25 Q220 35 195 70 L195 90 L85 90 Z"
            fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="55" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#0F0F0F">TIF</text>

      {/* Tete */}
      <ellipse cx="140" cy="115" rx="40" ry="38" fill="#FFD3A8" stroke="#0F0F0F" strokeWidth="3" />
      {/* Yeux fermes contents */}
      <path d="M118 115 Q124 110 130 115" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M150 115 Q156 110 162 115" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Moustache */}
      <path d="M125 130 Q140 138 155 130" stroke="#0F0F0F" strokeWidth="3" fill="none" />
      {/* Sourire */}
      <path d="M125 138 Q140 148 155 138" stroke="#0F0F0F" strokeWidth="2.5" fill="#7A4628" />
      {/* Joues */}
      <circle cx="105" cy="125" r="5" fill="#FFB3C1" opacity="0.5" />
      <circle cx="175" cy="125" r="5" fill="#FFB3C1" opacity="0.5" />

      {/* Foulard violet */}
      <path d="M115 155 L165 155 L160 175 L120 175 Z" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />

      {/* Veste blanche */}
      <path d="M90 175 Q90 250 110 270 L170 270 Q190 250 190 175 Z"
            fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" />
      {/* Boutons */}
      <circle cx="140" cy="195" r="3" fill="#0F0F0F" />
      <circle cx="140" cy="220" r="3" fill="#0F0F0F" />
      <circle cx="140" cy="245" r="3" fill="#0F0F0F" />

      {/* Bras gauche signe OK */}
      <path d="M88 195 Q60 200 55 220" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
      <path d="M88 195 Q60 200 55 220" stroke="#0F0F0F" strokeWidth="2.5" fill="none" />
      <circle cx="50" cy="222" r="11" fill="#FFD3A8" stroke="#0F0F0F" strokeWidth="2.5" />

      {/* Bras droit avec cloche */}
      <path d="M192 195 Q220 195 230 215" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
      <path d="M192 195 Q220 195 230 215" stroke="#0F0F0F" strokeWidth="2.5" fill="none" />
      <ellipse cx="232" cy="225" rx="32" ry="13" fill="#C0C0C0" stroke="#0F0F0F" strokeWidth="2" />

      {/* Baskets */}
      <ellipse cx="120" cy="298" rx="18" ry="8" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <ellipse cx="160" cy="298" rx="18" ry="8" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
    </svg>
  );
}

// ============== TIFUS (cookie hoodie cool) ==============
function Tifus({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 280 320" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Capuche violette */}
      <path d="M70 130 Q70 60 140 50 Q210 60 210 130 Z" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />

      {/* Casquette */}
      <ellipse cx="140" cy="65" rx="62" ry="14" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <path d="M85 65 Q85 35 140 30 Q195 35 195 65 Z" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="60" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#FFFFFF">TIF</text>

      {/* Visage cookie */}
      <ellipse cx="140" cy="135" rx="48" ry="42" fill="#FFD84D" stroke="#0F0F0F" strokeWidth="3" />

      {/* Lunettes de soleil */}
      <rect x="105" y="125" width="22" height="14" rx="3" fill="#0F0F0F" />
      <rect x="153" y="125" width="22" height="14" rx="3" fill="#0F0F0F" />
      <line x1="127" y1="132" x2="153" y2="132" stroke="#0F0F0F" strokeWidth="2" />
      {/* Reflet sur lunettes */}
      <line x1="110" y1="128" x2="115" y2="128" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="158" y1="128" x2="163" y2="128" stroke="#FFFFFF" strokeWidth="2" />

      {/* Sourire */}
      <path d="M125 158 Q140 168 155 158" stroke="#0F0F0F" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Hoodie */}
      <path d="M75 175 L205 175 L215 270 L65 270 Z" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="3" />
      <text x="140" y="230" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="36" fontWeight="900" fill="#FFFFFF">TIF</text>

      {/* Cordons hoodie */}
      <line x1="125" y1="180" x2="125" y2="200" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="155" y1="180" x2="155" y2="200" stroke="#FFFFFF" strokeWidth="2" />

      {/* Bras pouce leve */}
      <path d="M210 200 Q235 200 240 225" stroke="#5B2EFF" strokeWidth="14" strokeLinecap="round" />
      <path d="M210 200 Q235 200 240 225" stroke="#0F0F0F" strokeWidth="2.5" fill="none" />
      <circle cx="240" cy="230" r="11" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <rect x="234" y="218" width="12" height="16" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="2" rx="2" />

      {/* Baskets */}
      <ellipse cx="100" cy="296" rx="22" ry="9" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
      <ellipse cx="180" cy="296" rx="22" ry="9" fill="#5B2EFF" stroke="#0F0F0F" strokeWidth="2.5" />
    </svg>
  );
}
