import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, ExternalLink } from 'lucide-react';

export default function Hero({ game, isDesktop }) {
  const [status, setStatus] = useState('idle'); // idle, downloading, extracting, installed
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Reset state when game changes
    setStatus(game.installed ? 'installed' : 'idle');
    setProgress(0);
    setError(null);
    setHasUpdate(false);

    if (isDesktop && window.launcher) {
      if (game.installed && !game.localDir) {
        window.launcher.checkUpdate(game.id).then(res => {
          if (res.hasUpdate) setHasUpdate(true);
        }).catch(console.error);
      }

      window.launcher.removeDownloadListeners();
      window.launcher.onDownloadProgress((data) => {
        if (data.gameId === game.id) {
          if (data.status === 'extracting') {
            setStatus('extracting');
            setProgress(100);
          } else if (data.status === 'done') {
            setStatus('installed');
            setProgress(100);
          } else {
            setStatus('downloading');
            setProgress(data.progress || 0);
          }
        }
      });
    }
  }, [game.id, game.installed, isDesktop]);

  const handleInstall = async () => {
    if (!isDesktop) {
      alert("Para instalar y jugar, descarga la versión de escritorio de LauncherIS Global.");
      return;
    }
    try {
      setStatus('downloading');
      setProgress(0);
      setError(null);
      await window.launcher.install(game.id);
      setStatus('installed');
      // Update config behind the scenes might be needed, but app state reload does it
    } catch (e) {
      console.error(e);
      setError(e.message);
      setStatus('idle');
    }
  };

  const handlePlay = async () => {
    if (!isDesktop) return;
    try {
      await window.launcher.launch(game.id);
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const handleUninstall = async () => {
    if (!isDesktop) return;
    try {
      const res = await window.launcher.uninstall(game.id);
      if (res.success) {
        setStatus('idle');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: game.accentColor,
          marginBottom: '20px',
          border: `1px solid ${game.accentColor}40`
        }}>
          {game.tag}
        </div>
        
        <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '24px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {game.name}
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', maxWidth: '600px', lineHeight: '1.6', textShadow: '0 2px 10px rgba(0,0,0,0.5)', whiteSpace: 'pre-wrap' }}>
          {game.description}
        </p>

        <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Motor</div>
            <div style={{ fontWeight: 600 }}>{game.engine}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Tamaño</div>
            <div style={{ fontWeight: 600 }}>{game.size}</div>
          </div>
          {game.installedVersion && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Versión</div>
              <div style={{ fontWeight: 600 }}>{game.installedVersion}</div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px', marginTop: '40px' }}>
        {!isDesktop ? (
          <button className="btn-primary" onClick={handleInstall} style={{ '--accent': game.accentColor }}>
            <Download size={20} />
            Descargar Launcher para Jugar
          </button>
        ) : (
          <>
            {status === 'idle' && (
              <button className="btn-primary" onClick={handleInstall} style={{ '--accent': game.accentColor }}>
                <Download size={20} />
                Instalar Juego
              </button>
            )}
            
            {(status === 'downloading' || status === 'extracting') && (
              <div style={{ flex: 1, maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>{status === 'extracting' ? 'Descomprimiendo e instalando...' : 'Descargando...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-container">
                  <div className="progress-fill" style={{ width: `${progress}%`, '--accent': game.accentColor }}></div>
                </div>
              </div>
            )}
            
            {status === 'installed' && (
              <>
                {hasUpdate ? (
                  <button className="btn-primary" onClick={handleInstall} style={{ '--accent': '#F39C12', padding: '16px 32px' }}>
                    <Download size={20} />
                    Actualizar Juego
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handlePlay} style={{ '--accent': game.accentColor, padding: '16px 48px', fontSize: '1.2rem' }}>
                    <Play size={24} fill="currentColor" />
                    JUGAR
                  </button>
                )}
                <button className="btn-secondary" onClick={handleUninstall} title="Desinstalar" style={{ padding: '16px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Trash2 size={20} />
                  Desinstalar
                </button>
              </>
            )}
          </>
        )}
        
        {error && <div style={{ color: '#E74C3C', fontSize: '0.9rem' }}>{error}</div>}
      </div>
    </div>
  );
}
