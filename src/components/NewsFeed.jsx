import { Calendar, Tag } from 'lucide-react';

function buildFeed(games) {
  const items = [];
  for (const g of games) {
    const news = g.news || {};
    for (const ev of news.events || []) {
      items.push({ kind: 'event', game: g, date: ev.date, title: ev.title, body: ev.body });
    }
    for (const pn of news.patchNotes || []) {
      items.push({ kind: 'patch', game: g, date: pn.date, version: pn.version, changes: pn.changes || [] });
    }
  }
  // Orden cronológico descendente (fechas ISO ordenan como texto)
  items.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return items;
}

export default function NewsFeed({ games, onSelect }) {
  const feed = buildFeed(games);

  return (
    <div className="newsfeed">
      <h1 className="newsfeed-title">Novedades del estudio</h1>
      <p className="newsfeed-sub">Lo último de todos nuestros mundos.</p>

      <div className="newsfeed-list">
        {feed.map((item, i) => (
          <article
            key={i}
            className="news-item"
            style={{ '--accent': item.game.accentColor }}
            onClick={() => onSelect(item.game)}
          >
            <div className="news-item-glyph" style={{ background: item.game.accentColor }}>
              {item.game.glyph}
            </div>
            <div className="news-item-body">
              <div className="news-item-head">
                <span className="news-item-game">{item.game.name}</span>
                {item.date && (
                  <span className="news-item-date"><Calendar size={13} /> {item.date}</span>
                )}
              </div>
              {item.kind === 'event' ? (
                <>
                  <h3 className="news-item-heading">{item.title}</h3>
                  {item.body && <p className="news-item-text">{item.body}</p>}
                </>
              ) : (
                <>
                  <h3 className="news-item-heading">
                    <Tag size={14} /> Notas del parche
                    <span className="news-item-ver" style={{ color: item.game.accentColor, borderColor: `${item.game.accentColor}66` }}>v{item.version}</span>
                  </h3>
                  <ul className="news-item-changes">
                    {item.changes.map((c, j) => <li key={j}>{c}</li>)}
                  </ul>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
