import { useState, useEffect } from 'react';
import { Play, Download, Trash2, ExternalLink, X, Info, ArrowLeft } from 'lucide-react';

export default function GameDetail({ game, isDesktop, onLibraryChange, onBack }) {
  const [status, setStatus] = useState('idle'); // idle, downloading, extracting, installed
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
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
          if (data.status === 'extracting') { setStatus('extracting'); setProgress(100); }
          else if (data.status === 'done') { setStatus('installed'); setProgress(100); }
          else { setStatus('downloading'); setProgress(data.progress || 0); }
        }
      });
      return () => window.launcher.removeDownloadListeners();
    }
  }, [game.id, game.installed, isDesktop]);

  const handleInstall = async () => {
    if (!isDesktop) { alert('Para instalar y jugar, descarga la versión de escritorio de IS Launcher.'); return; }
    try {
      setStatus('downloading'); setProgress(0); setError(null);
      const res = await window.launcher.install(game.id);
      if (res && res.cancelled) { setStatus('idle'); setProgress(0); return; }
      setStatus('installed'); setHasUpdate(false);
      if (onLibraryChange) onLibraryChange();
    } catch (e) { console.error(e); setError(e.message); setStatus('idle'); }
  };

  const handleCancel = async () => {
    try { await window.launcher.cancelInstall(game.id); } catch (_) {}
    setStatus('idle'); setProgress(0);
  };

  const handlePlay = async () => {
    if (!isDesktop) return;
    try { await window.launcher.launch(game.id); }
    catch (e) { console.error(e); setError(e.message); }
  };

  const handlePlayWeb = () => {
    if (isDesktop && window.launcher) window.launcher.openLink(game.webUrl);
    else window.open(game.webUrl, '_blank', 'noopener');
    if (game.launchNotice) setNotice(game.launchNotice);
  };

  const handleUninstall = async () => {
    if (!isDesktop) return;
    try {
      const res = await window.launcher.uninstall(game.id);
      if (res.success) { setStatus('idle'); if (onLibraryChange) onLibraryChange(); }
    } catch (e) { console.error(e); }
  };

  const hasNews = game.news && ((game.news.events || []).length > 0 || (game.news.patchNotes || []).length > 0);

  return (
    <div className="detail" style={{ '--accent': game.accentColor }}>
      <button className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Biblioteca
      </button>

      <section className="detail-banner">
        <div className="detail-banner-bg" style={{ backgroundImage: game.banner ? `url("${game.banner}")` : game.artBg }}></div>
        <div className="detail-banner-shade"></div>
        <div className="detail-banner-inner">
          <div className="detail-headline">
            <span className="detail-tag reveal reveal-1">{game.tag}</span>
            {game.heroLogo && !logoError ? (
              <div className="reveal reveal-2">
                <img className="hero-logo-img" src={game.heroLogo} alt={game.name} onError={() => setLogoError(true)} />
                <h2 className="hero-name-under">{game.name}</h2>
              </div>
            ) : (
              <h1 className="hero-title reveal reveal-2" style={{ fontSize: '3.8rem', lineHeight: 1.1 }}>{game.name}</h1>
            )}
          </div>

          <div className="detail-actions reveal reveal-3">
            {game.comingSoon ? (
              <button className="btn-primary" disabled style={{ '--accent': '#888', padding: '16px 48px', fontSize: '1.15rem', opacity: 0.7, cursor: 'not-allowed' }}>
                Próximamente
              </button>
            ) : game.webUrl ? (
              <button className="btn-play" onClick={handlePlayWeb} style={{ '--accent': game.accentColor }}>
                <Play size={24} fill="currentColor" /> JUGAR
                <ExternalLink size={18} style={{ marginLeft: '2px', opacity: 0.75 }} />
              </button>
            ) : !isDesktop ? (
              <button className="btn-primary" onClick={handleInstall} style={{ '--accent': game.accentColor }}>
                <Download size={20} /> Descargar Launcher para Jugar
              </button>
            ) : (
              <>
                {status === 'idle' && (
                  <button className="btn-primary" onClick={handleInstall} style={{ '--accent': game.accentColor, padding: '16px 40px', fontSize: '1.1rem' }}>
                    <Download size={20} /> Instalar
                  </button>
                )}
                {(status === 'downloading' || status === 'extracting') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '340px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                        <span>{status === 'extracting' ? 'Instalando...' : 'Descargando...'}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-fill" style={{ width: `${progress}%`, '--accent': game.accentColor }}></div>
                      </div>
                    </div>
                    {status === 'downloading' && (
                      <button className="btn-secondary" onClick={handleCancel} title="Cancelar descarga" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                        <X size={18} />
                      </button>
                    )}
                  </div>
                )}
                {status === 'installed' && (
                  <>
                    {hasUpdate ? (
                      <button className="btn-primary" onClick={handleInstall} style={{ '--accent': '#F39C12', padding: '16px 32px' }}>
                        <Download size={20} /> Actualizar
                      </button>
                    ) : (
                      <button className="btn-play" onClick={handlePlay} style={{ '--accent': game.accentColor }}>
                        <Play size={24} fill="currentColor" /> JUGAR
                      </button>
                    )}
                    <button className="btn-secondary" onClick={handleUninstall} title="Desinstalar" style={{ padding: '15px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
              </>
            )}
            {error && <div style={{ color: '#E74C3C', fontSize: '0.9rem', alignSelf: 'center' }}>{error}</div>}
          </div>
        </div>
      </section>

      {notice && (
        <div className="detail-notice" style={{ background: `${game.accentColor}1A`, borderColor: `${game.accentColor}66` }}>
          <Info size={20} style={{ color: game.accentColor, flexShrink: 0, marginTop: '1px' }} />
          <span style={{ flex: 1 }}>{notice}</span>
          <button onClick={() => setNotice(null)} title="Entendido" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="detail-body">
        <div className="detail-main">
          <p className="detail-desc reveal reveal-4">{game.description}</p>

          {hasNews && (
            <div className="news-panel reveal reveal-5">
              {(game.news.events || []).length > 0 && (
                <div className="news-section">
                  <div className="news-section-title" style={{ color: game.accentColor }}>Eventos</div>
                  {game.news.events.map((ev, i) => (
                    <div className="event-card" key={i} style={{ borderColor: `${game.accentColor}40` }}>
                      <div className="news-head">
                        <span className="news-item-title">{ev.title}</span>
                        {ev.date && <span className="news-date">{ev.date}</span>}
                      </div>
                      {ev.body && <div className="news-body">{ev.body}</div>}
                    </div>
                  ))}
                </div>
              )}
              {(game.news.patchNotes || []).length > 0 && (
                <div className="news-section">
                  <div className="news-section-title" style={{ color: game.accentColor }}>Notas del parche</div>
                  {game.news.patchNotes.map((pn, i) => (
                    <div className="patch-entry" key={i}>
                      <div className="news-head">
                        <span className="patch-version" style={{ background: `${game.accentColor}22`, color: game.accentColor, border: `1px solid ${game.accentColor}55` }}>v{pn.version}</span>
                        {pn.date && <span className="news-date">{pn.date}</span>}
                      </div>
                      {pn.changes && (
                        <ul className="patch-changes">
                          {pn.changes.map((c, j) => <li key={j}>{c}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="detail-side reveal reveal-4">
          <div className="detail-stat"><span>Motor</span><strong>{game.engine}</strong></div>
          <div className="detail-stat"><span>Género</span><strong>{game.genre}</strong></div>
          <div className="detail-stat"><span>Tamaño</span><strong>{game.size}</strong></div>
          {(game.installedVersion || game.version) && (
            <div className="detail-stat"><span>Versión</span><strong>{game.installedVersion || game.version}</strong></div>
          )}
        </aside>
      </div>
    </div>
  );
}
