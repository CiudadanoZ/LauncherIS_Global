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
    "description": "El inicio de todo. Descubre los orígenes del mundo de las sombras y el destino del héroe elegido. Una aventura épica de rol que te sumergirá en un universo oscuro y misterioso.",
    "engine": "RPG Maker MV",
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
    "size": "1,0 GB",
    "glyph": "RA",
    "accentColor": "#2ECC71",
    "artBg": "linear-gradient(160deg, #081008 0%, #102510 40%, #0A2015 70%, #050F05 100%)",
    "heroBg": "linear-gradient(135deg, #051008 0%, #0D2510 40%, #081A10 70%, #040C05 100%)"
  }
];

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    async function loadGames() {
      if (window.launcher) {
        setIsDesktop(true);
        try {
          const config = await window.launcher.getConfig();
          setGames(config.games);
          if (config.games.length > 0) setSelectedGame(config.games[0]);
        } catch (e) {
          console.error("Error loading games from launcher:", e);
        }
      } else {
        setIsDesktop(false);
        setGames(fallbackGames);
        setSelectedGame(fallbackGames[0]);
      }
    }
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
          <Hero game={selectedGame} isDesktop={isDesktop} />
        </div>
      </div>
    </div>
  );
}

export default App;
