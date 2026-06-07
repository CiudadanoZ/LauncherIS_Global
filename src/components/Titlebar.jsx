import { Minus, Square, X } from 'lucide-react';

export default function Titlebar() {
  const isDesktop = !!window.launcher;

  if (!isDesktop) return null;

  return (
    <div className="titlebar">
      <div className="window-controls">
        <button className="window-btn" onClick={() => window.launcher.minimize()}>
          <Minus size={16} />
        </button>
        <button className="window-btn" onClick={() => window.launcher.maximize()}>
          <Square size={14} />
        </button>
        <button className="window-btn close" onClick={() => window.launcher.close()}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
