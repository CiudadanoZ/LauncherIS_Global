import React from 'react';
import { Gamepad2, Settings, Download } from 'lucide-react';

export default function Sidebar({ games, selectedGame, onSelectGame }) {
  return (
    <div style={{
      width: '300px',
      background: 'var(--bg-panel)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      paddingTop: '60px'
    }}>
      <div style={{ padding: '0 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img 
          src="./logo.png" 
          alt="IS Logo" 
          style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)' }} 
          onError={(e) => e.target.style.display = 'none'} 
        />
        <h2 style={{ 
          fontSize: '1.5rem', 
          letterSpacing: '3px', 
          textTransform: 'uppercase', 
          fontWeight: 900,
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0px 4px 15px rgba(255, 165, 0, 0.3)',
          margin: 0,
          fontFamily: "'Cinzel', 'Trajan Pro', serif, var(--font-display)"
        }}>
          IS Launcher
        </h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {games.map(game => (
          <div 
            key={game.id}
            onClick={() => onSelectGame(game)}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: selectedGame?.id === game.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: `1px solid ${selectedGame?.id === game.id ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (selectedGame?.id !== game.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              if (selectedGame?.id !== game.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: game.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              fontFamily: 'var(--font-display)',
              boxShadow: `0 0 15px ${game.accentColor}50`
            }}>
              {game.glyph}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.95rem' }}>{game.name}</div>
              <div style={{ fontSize: '0.8rem', color: game.installed ? '#2ECC71' : 'var(--text-muted)', marginTop: '4px' }}>
                {game.installed ? 'Instalado' : game.genre}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '20px', color: 'var(--text-muted)' }}>
        <Settings 
          size={22} 
          style={{ cursor: 'pointer' }} 
          className="hover-white" 
          onClick={() => {
            if (window.launcher) {
              window.launcher.changeGamesDir().then(dir => {
                if (dir) alert('Directorio de instalación cambiado a: ' + dir);
              });
            } else {
              alert('Los ajustes solo están disponibles en la versión de escritorio.');
            }
          }}
          title="Cambiar directorio de instalación"
        />
        <Download 
          size={22} 
          style={{ cursor: 'pointer', opacity: 0.5 }} 
          className="hover-white" 
          title="Cola de descargas (Próximamente)"
        />
      </div>
      <style>{`
        .hover-white { transition: 0.2s; }
        .hover-white:hover { color: white; transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
