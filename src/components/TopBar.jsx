import { Minus, Square, X, Library, Newspaper, Users } from 'lucide-react';

const TABS = [
  { id: 'library', label: 'Biblioteca', Icon: Library },
  { id: 'news', label: 'Novedades', Icon: Newspaper },
  { id: 'friends', label: 'Amigos', Icon: Users },
];

export default function TopBar({ view, onNavigate, isDesktop }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2 className="epic-logo topbar-logo">IS LAUNCHER</h2>
      </div>

      <nav className="topbar-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`topbar-tab${view === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        {isDesktop && (
          <div className="window-controls">
            <button className="window-btn" onClick={() => window.launcher.minimize()} title="Minimizar">
              <Minus size={16} />
            </button>
            <button className="window-btn" onClick={() => window.launcher.maximize()} title="Maximizar">
              <Square size={13} />
            </button>
            <button className="window-btn close" onClick={() => window.launcher.close()} title="Cerrar">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
