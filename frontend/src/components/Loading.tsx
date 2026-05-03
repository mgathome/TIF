import { Mascot } from './Mascot';

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="animate-pulse">
        <Mascot size={100} />
      </div>
      <p className="mt-3 text-tif-gray-500 text-sm">{label}</p>
    </div>
  );
}
