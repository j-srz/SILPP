import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message = 'Vaya... no pudimos encontrar ninguna coincidencia' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-card/80 border border-border flex items-center justify-center">
          <PackageOpen size={48} className="text-muted/60" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-warning/20 border border-warning/30 flex items-center justify-center">
          <span className="text-warning text-lg">!</span>
        </div>
      </div>
      <p className="text-muted text-center text-sm max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}
