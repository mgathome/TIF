'use client';

import Link from 'next/link';

export function Logo({ light = false }: { light?: boolean }) {
  const textColor = light ? 'text-white' : 'text-tif-black';
  return (
    <Link href="/" className="flex items-center gap-2 font-display font-bold text-2xl">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-tif bg-tif-yellow text-tif-black">
        <span className="text-lg">🥡</span>
      </span>
      <span className={textColor}>TIF</span>
    </Link>
  );
}
