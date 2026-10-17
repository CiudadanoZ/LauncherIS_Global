import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import GameCard from './GameCard';

export default function Library({ games, onSelect }) {
  const featured = games.filter(g => g.featured);
  const [idx, setIdx] = useState(0);
  const [logoError, setLogoError] = useState(false);

  // Rotación automática del destacado
  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  // Si cambia el destacado activo, reiniciar el fallback del logo
  useEffect(() => { setLogoError(false); }, [idx]);

  const hero = featured[idx] || games[0];

  return (
    <div className="library">
      {hero && (
        <section
          className="featured"
          style={{ '--accent': hero.accentColor }}
          onClick={() => onSelect(hero)}
        >
          <div className="featured-bg" style={{ backgroundImage: hero.banner ? `url("${hero.banner}")` : (hero.cover ? `url("${hero.cover}")` : hero.artBg) }}></div>
          <div className="featured-shade"></div>
          <div className="featured-content">
            <span className="featured-kicker">Destacado</span>
            {hero.heroLogo && !logoError ? (
              <img className="featured-logo" src={hero.heroLogo} alt={hero.name} onError={() => setLogoError(true)} />
            ) : (
              <h1 className="featured-title">{hero.name}</h1>
            )}
            <p className="featured-tag">{hero.tag}</p>
            <span className="featured-cta">
              Ver juego <ChevronRight size={18} />
            </span>
          </div>
          {featured.length > 1 && (
            <div className="featured-dots" onClick={e => e.stopPropagation()}>
              {featured.map((f, i) => (
                <button
                  key={f.id}
                  className={`featured-dot${i === idx ? ' active' : ''}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Destacado ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="shelf">
        <h2 className="shelf-title">Todos los juegos</h2>
        <div className="game-grid">
          {games.map(g => (
            <GameCard key={g.id} game={g} onSelect={onSelect} />
          ))}
        </div>
      </section>
    </div>
  );
}
