import { Calendar, ChevronRight } from 'lucide-react';

export default function TaskCard({ title, deadline, responsibles = [], onViewMore }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-text text-sm leading-tight">{title}</h3>
        <span className="shrink-0 ml-2 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-medium">
          Pendiente
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-muted text-xs mb-3">
        <Calendar size={13} />
        <span>Fecha límite: {deadline}</span>
      </div>

      <div className="flex items-center justify-between">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {responsibles.slice(0, 3).map((name, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
              title={name}
            >
              <span className="text-primary text-[10px] font-bold">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          ))}
          {responsibles.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-card border-2 border-border flex items-center justify-center">
              <span className="text-muted text-[10px]">+{responsibles.length - 3}</span>
            </div>
          )}
        </div>

        <button
          onClick={onViewMore}
          className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Ver más <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
