import { NavLink } from 'react-router-dom';
import { Home, ScanLine, Wrench, Menu } from 'lucide-react';

const items = [
  { to: '/home',        label: 'Inicio',       icon: Home },
  { to: '/scanner',     label: 'Escáner',      icon: ScanLine },
  { to: '/herramientas',label: 'Herramientas', icon: Wrench },
  { to: '/menu',        label: 'Menú',         icon: Menu },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-glass-border">
      <div className="flex items-center justify-around px-2 py-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
