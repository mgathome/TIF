import { Mascot } from './Mascot';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="flex justify-center mb-4">
        <Mascot size={140} />
      </div>
      <h3 className="font-display font-bold text-xl text-tif-black">{title}</h3>
      {description && <p className="text-tif-gray-500 mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
