import { useState, useEffect } from 'react';
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

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  async function loadGames(preserveSelectionId) {
    if (window.launcher) {
      setIsDesktop(true);
      try {
        const config = await window.launcher.getConfig();
        setGames(config.games);
        // Conservar el juego seleccionado tras recargar; si no, el primero.
        const keep = config.games.find(g => g.id === preserveSelectionId);
        setSelectedGame(keep || config.games[0] || null);
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
    <div className="app-container" style={{ backgroundImage: selectedGame.artBg }}>
      <div className="app-overlay"></div>
      <Titlebar />
      
      <div style={{ display: 'flex', width: '100%', height: '100%', zIndex: 10 }}>
        <Sidebar 
          games={games} 
          selectedGame={selectedGame} 
          onSelectGame={setSelectedGame} 
        />
        
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto', paddingTop: '60px' }}>
          <Hero game={selectedGame} isDesktop={isDesktop} onLibraryChange={() => loadGames(selectedGame.id)} />
        </div>
      </div>
    </div>
  );
}

export default App;
