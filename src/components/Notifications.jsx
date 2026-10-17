import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Universo } from '../universo/firebase';

const PROCLAMAS_URL = 'https://ciudadanoz.github.io/imperiodelossunos.github.io/UNIVERSO/proclamas.html';

function openExternal(url) {
  if (window.launcher) window.launcher.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

const TEXT = {
  like: 'le dio me gusta a tu leyenda',
  comment: 'comentó tu leyenda',
  message: 'te envió un mensaje',
  follow: 'ahora es tu aliado',
  mention: 'te mencionó',
  quote: 'citó tu leyenda',
  retweet: 'compartió tu leyenda',
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => Universo.onAuth(setUser), []);

  useEffect(() => {
    if (!user) { setNotifs([]); return; }
    const unsub = Universo.onNotifications(setNotifs);
    return () => { try { unsub && unsub(); } catch (_) {} };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!user) return null;

  const unread = notifs.filter(n => !n.read).length;

  const toggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) Universo.markNotificationsRead().catch(() => {});
  };

  return (
    <div className="notif" ref={ref}>
      <button className="notif-bell" onClick={toggle} title="Proclamas">
        <Bell size={18} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">Proclamas</div>
          <div className="notif-list">
            {notifs.length === 0 && <div className="notif-empty">No tienes notificaciones.</div>}
            {notifs.slice(0, 30).map(n => (
              <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                <span className="notif-text">
                  <strong>{n.fromName || n.fromHandle}</strong> {TEXT[n.type] || 'interactuó contigo'}
                </span>
                <span className="notif-time">{timeAgo(n.timestamp)}</span>
              </div>
            ))}
          </div>
          <button className="notif-foot" onClick={() => openExternal(PROCLAMAS_URL)}>
            Abrir en Universo
          </button>
        </div>
      )}
    </div>
  );
}
