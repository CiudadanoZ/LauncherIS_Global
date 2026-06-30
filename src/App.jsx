import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Titlebar from './components/Titlebar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import './index.css';

// Fallback data for Web version
const fallbackGames = [
  {
    "id": "tsw-origin",
    "name": "The Shadow World Origin",
    "tag": "Saga The Shadow World · Capítulo I",
    "description": "Próximamente con la expansión Las Armas del Viejo Mundo.",
    "comingSoon": true,
    "engine": "RPG Maker MZ",
    "genre": "RPG",
    "size": "~350 MB",
    "glyph": "TSW",
    "accentColor": "#4A90E2",
    "artBg": "linear-gradient(160deg, #05080F 0%, #0D1525 40%, #151030 70%, #050810 100%)",
    "heroBg": "linear-gradient(135deg, #050810 0%, #0D1830 40%, #081525 70%, #030810 100%)"
  },
  {
    "id": "reinos-aethemoor",
    "name": "Los Reinos de Aethemoor",
    "tag": "Universo Aethemoor",
    "description": "Bienvenidos a Los Reinos de Aethermoor\nUn viaje incremental a través de tierras olvidadas y peligros ancestrales.\n¡Ya disponible la temporada 3: Guerra de Banderas!\n\nEn este juego IDLE de aventuras y fantasía, tu leyenda no se detiene nunca. Tu héroe se adentrará en los confines de un mundo lleno de magia, tesoros y peligros que acechan en cada sombra.\nAhora también incluye un modo llamado The Shadow World Saga, un mundo MMORPG y supervivencia donde podrás recorrer los reinos de Aethermoor, enfrentarte a enemigos, y completar misiones por el amplio mundo abierto.",
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

// Compara versiones "1.2.3" → 1 si a>b, -1 si a<b, 0 iguales
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

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [launcherUpdate, setLauncherUpdate] = useState(null); // { latest, url } o null

  async function loadGames(preserveSelectionId) {
    if (window.launcher) {
      setIsDesktop(true);
      try {
        const config = await window.launcher.getConfig();
        setGames(config.games);
        // Conservar el juego seleccionado tras recargar; si no, el primero.
        const keep = config.games.find(g => g.id === preserveSelectionId);
        setSelectedGame(keep || config.games[0] || null);

        // Avisar si el catálogo anuncia una versión del launcher más nueva que la instalada
        try {
          if (config.launcherVersion && window.launcher.getVersion) {
            const current = await window.launcher.getVersion();
            if (compareVersions(config.launcherVersion, current) > 0) {
              setLauncherUpdate({ latest: config.launcherVersion, url: config.launcherDownloadUrl || LAUNCHER_RELEASES_URL });
            } else {
              setLauncherUpdate(null);
            }
          }
        } catch (_) { /* no bloquear la carga por esto */ }
      } catch (e) {
        console.error("Error loading games from launcher:", e);
      }
    } else {
      setIsDesktop(false);
      setGames(fallbackGames);
      setSelectedGame(fallbackGames[0]);
    }
  }

  useEffect(() => {
    loadGames();
  }, []);

  if (!selectedGame) {
    return <div className="app-container" style={{ background: 'var(--bg-dark)' }}><Titlebar /></div>;
  }

  return (
    <div className="app-container" style={{ backgroundImage: selectedGame.artBg, '--accent': selectedGame.accentColor, '--accent-glow': `${selectedGame.accentColor}66` }}>
      <div className="app-overlay"></div>
      <div className="app-vignette"></div>
      <div className="app-grain"></div>
      <div className="ambient-embers">
        {EMBERS.map((e, i) => (
          <span key={i} className="ember" style={{ left: e.left, animationDuration: e.dur, animationDelay: e.delay }}></span>
        ))}
      </div>
      <Titlebar />

      <div style={{ display: 'flex', width: '100%', height: '100%', zIndex: 10, position: 'relative' }}>
        <Sidebar
          games={games}
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
        />

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto', paddingTop: '60px' }}>
          {launcherUpdate && (
            <div
              onClick={() => window.launcher?.openLink(launcherUpdate.url)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 20px', marginBottom: '24px', borderRadius: '12px',
                background: 'rgba(243, 156, 18, 0.12)', border: '1px solid rgba(243, 156, 18, 0.4)',
                color: '#F39C12', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600
              }}
              title="Abrir la página de descarga"
            >
              <Download size={18} />
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                Hay una nueva versión del launcher disponible (v{launcherUpdate.latest}). Haz clic para descargarla.
              </span>
            </div>
          )}
          <Hero key={selectedGame.id} game={selectedGame} isDesktop={isDesktop} onLibraryChange={() => loadGames(selectedGame.id)} />
        </div>
      </div>
    </div>
  );
}

export default App;
