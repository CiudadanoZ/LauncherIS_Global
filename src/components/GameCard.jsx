import { useState } from 'react';
import { Download, Play, Globe, Clock } from 'lucide-react';

function getStatus(game) {
  if (game.comingSoon) return { label: 'Próximamente', Icon: Clock, cls: 'soon' };
  if (game.webUrl) return { label: 'Jugar online', Icon: Globe, cls: 'web' };
  if (game.installed) return { label: 'Instalado', Icon: Play, cls: 'installed' };
  return { label: 'Descargar', Icon: Download, cls: 'download' };
}

export default function GameCard({ game, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const status = getStatus(game);
  const { Icon } = status;

  return (
    <button
      className="game-card"
      style={{ '--accent': game.accentColor }}
      onClick={() => onSelect(game)}
    >
      <div className="game-card-art">
        {game.cover && !imgError ? (
          <img src={game.cover} alt={game.name} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="game-card-fallback" style={{ backgroundImage: game.artBg }}>
            <span>{game.glyph}</span>
          </div>
        )}
        <div className="game-card-shade"></div>
        <span className={`game-card-badge ${status.cls}`}>
          <Icon size={13} />
          {status.label}
        </span>
      </div>
      <div className="game-card-info">
        <span className="game-card-name">{game.name}</span>
        <span className="game-card-genre">{game.genre}</span>
      </div>
    </button>
  );
}
