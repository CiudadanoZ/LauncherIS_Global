import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import TopBar from './components/TopBar';
import Library from './components/Library';
import NewsFeed from './components/NewsFeed';
import GameDetail from './components/GameDetail';
import './index.css';

// Fallback para la versión web (sin Electron)
const fallbackGames = [
  {
    "id": "reinos-aethemoor",
    "name": "Los Reinos de Aethemoor",
    "tag": "Universo Aethemoor",
    "description": "Aventura idle de fantasía que se juega directamente en el navegador.",
    "engine": "Web (React / Vite)",
    "genre": "RPG / Estrategia",
    "size": "En la nube",
    "glyph": "RA",
    "accentColor": "#2ECC71",
    "artBg": "linear-gradient(160deg, #081008 0%, #102510 40%, #0A2015 70%, #050F05 100%)",
    "heroBg": "linear-gradient(135deg, #051008 0%, #0D2510 40%, #081A10 70%, #040C05 100%)",
    "webUrl": "https://aethermoor-idle.vercel.app"
  }
];

// Ascuas ambientales: posiciones/tiempos fijos (no se regeneran en cada render)
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7 + (i % 3) * 5) % 100}%`,
  dur: `${9 + (i % 5) * 2.5}s`,
  delay: `${(i % 7) * 1.3}s`,
}));

function compareVersions(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

const LAUNCHER_RELEASES_URL = 'https://github.com/CiudadanoZ/LauncherIS_Global/releases';
const STUDIO_ACCENT = '#d4af37';

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [launcherUpdate, setLauncherUpdate] = useState(null);
  const [view, setView] = useState('library'); // library | news | detail

  async function loadGames(preserveSelectionId) {
    if (window.launcher) {
      setIsDesktop(true);
      try {
        const config = await window.launcher.getConfig();
        setGames(config.games);
        if (preserveSelectionId) {
          const keep = config.games.find(g => g.id === preserveSelectionId);
          if (keep) setSelectedGame(keep);
        }
        try {
          if (config.launcherVersion && window.launcher.getVersion) {
            const current = await window.launcher.getVersion();
            if (compareVersions(config.launcherVersion, current) > 0) {
              setLauncherUpdate({ latest: config.launcherVersion, url: config.launcherDownloadUrl || LAUNCHER_RELEASES_URL });
            } else {
              setLauncherUpdate(null);
            }
          }
        } catch (_) { /* no bloquear la carga */ }
      } catch (e) {
        console.error('Error loading games from launcher:', e);
      }
    } else {
      setIsDesktop(false);
      // Versión web: leer el catálogo real empaquetado; si falla, fallback mínimo.
      try {
        const res = await fetch('games.json', { cache: 'no-store' });
        const config = await res.json();
        setGames((config.games && config.games.length) ? config.games : fallbackGames);
      } catch (_) {
        setGames(fallbackGames);
      }
    }
  }

  useEffect(() => { loadGames(); }, []);

  const openGame = (g) => { setSelectedGame(g); setView('detail'); };
  const navigate = (v) => { setView(v); };

  const inDetail = view === 'detail' && selectedGame;
  const accent = inDetail ? selectedGame.accentColor : STUDIO_ACCENT;

  return (
    <div
      className={`app-container ${inDetail ? 'themed' : 'studio'}`}
      style={{
        backgroundImage: inDetail ? selectedGame.artBg : undefined,
        '--accent': accent,
        '--accent-glow': `${accent}66`,
      }}
    >
      <div className="app-vignette"></div>
      <div className="app-grain"></div>
      <div className="ambient-embers">
        {EMBERS.map((e, i) => (
          <span key={i} className="ember" style={{ left: e.left, animationDuration: e.dur, animationDelay: e.delay }}></span>
        ))}
      </div>

      <TopBar view={inDetail ? 'library' : view} onNavigate={navigate} isDesktop={isDesktop} />

      <main className="app-main">
        {launcherUpdate && (
          <div
            className="launcher-update-banner"
            onClick={() => window.launcher?.openLink(launcherUpdate.url)}
            title="Abrir la página de descarga"
          >
            <Download size={18} />
            <span>Hay una nueva versión del launcher disponible (v{launcherUpdate.latest}). Haz clic para descargarla.</span>
          </div>
        )}

        {view === 'library' && <Library games={games} onSelect={openGame} />}
        {view === 'news' && <NewsFeed games={games} onSelect={openGame} />}
        {inDetail && (
          <GameDetail
            key={selectedGame.id}
            game={selectedGame}
            isDesktop={isDesktop}
            onLibraryChange={() => loadGames(selectedGame.id)}
            onBack={() => setView('library')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
