import { NavLink } from 'react-router-dom';
import { Home, ScanLine, Inbox, Layers, LogOut } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const links = [
  { to: '/home',        label: 'Inicio',       icon: Home },
  { to: '/scanner',     label: 'Escáner',      icon: ScanLine },
  { to: '/buzon',       label: 'Buzón',        icon: Inbox },
  { to: '/operaciones', label: 'Operaciones',  icon: Layers },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const initial = user?.nombre?.charAt(0)?.toUpperCase() || '?';

  const roleColors = {
    'Operativo': 'bg-success/15 text-success border-success/20',
    'Táctico': 'bg-primary/15 text-primary border-primary/20',
    'Auditor': 'bg-warning/15 text-warning border-warning/20'
  };

  const userRoles = user?.roles ? user.roles.split(', ') : [];

  return (
    <nav className="flex items-center justify-between px-6 py-3 glass sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">SP</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-text">SILPP</span>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted hover:text-text hover:bg-card'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden lg:block">
          <p className="text-sm font-semibold text-text leading-none mb-1.5">{user?.nombre}</p>
          <div className="flex items-center justify-end gap-1">
            {userRoles.map((role) => (
              <span 
                key={role} 
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${roleColors[role] || 'bg-surface text-muted border-border'}`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">{initial}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
