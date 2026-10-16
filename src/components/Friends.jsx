import { useState, useEffect, useRef } from 'react';
import { Search, Send, LogOut, MessageCircle } from 'lucide-react';
import { Universo } from '../universo/firebase';
import LoginForm from './LoginForm';

function formatTime(ts) {
  try { return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
  catch (_) { return ''; }
}

// Fusiona aliados (following) y chats recientes en una lista de contactos única.
function buildContacts(allies, recent) {
  const map = new Map();
  for (const c of recent) map.set(c.handle, { handle: c.handle, name: c.name, avatar: c.avatar, last: c.text });
  for (const a of allies) {
    if (!map.has(a.handle)) map.set(a.handle, { handle: a.handle, name: a.name, avatar: a.avatar });
  }
  return Array.from(map.values());
}

export default function Friends() {
  const [user, setUser] = useState(undefined); // undefined = cargando, null = sin sesión
  const [profile, setProfile] = useState(null);
  const [allies, setAllies] = useState([]);
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => Universo.onAuth(setUser), []);

  useEffect(() => {
    if (!user) { setProfile(null); setAllies([]); return; }
    Universo.getMyProfile().then(setProfile);
    Universo.getAllies(user.uid).then(setAllies).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    const unsub = Universo.onRecentChats(profile.handle, setRecent);
    return () => { try { unsub && unsub(); } catch (_) {} };
  }, [profile]);

  useEffect(() => {
    if (!profile || !active) { setMessages([]); return; }
    const unsub = Universo.onMessages(profile.handle, active.handle, setMessages);
    return () => { try { unsub && unsub(); } catch (_) {} };
  }, [profile, active]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => Universo.searchUsers(search).then(setResults).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Auto-scroll al final al llegar mensajes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    setDraft('');
    try { await Universo.sendMessage(profile.handle, active.handle, text); }
    catch (ex) { alert(ex.message); }
  };

  if (user === undefined) return <div className="friends-loading">Conectando con Universo…</div>;
  if (!user) return <LoginForm />;

  const contacts = buildContacts(allies, recent);
  const list = search.trim() ? results : contacts;

  return (
    <div className="friends">
      <header className="friends-header">
        <div className="friends-me">
          {profile?.avatar && <img className="avatar" src={profile.avatar} alt="" />}
          <div>
            <div className="friends-me-name">{profile?.name || 'Héroe'}</div>
            <div className="friends-me-handle">{profile?.handle}</div>
          </div>
        </div>
        <button className="friends-logout" onClick={() => Universo.logout()} title="Cerrar sesión">
          <LogOut size={18} /> Salir
        </button>
      </header>

      <div className="friends-body">
        <aside className="contacts">
          <div className="contacts-search">
            <Search size={16} />
            <input placeholder="Buscar héroes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="contacts-list">
            {list.length === 0 && (
              <div className="contacts-empty">
                {search.trim() ? 'Sin resultados.' : 'Aún no tienes aliados. Busca héroes para empezar a chatear.'}
              </div>
            )}
            {list.map(c => (
              <button
                key={c.handle}
                className={`contact${active?.handle === c.handle ? ' active' : ''}`}
                onClick={() => setActive({ handle: c.handle, name: c.name, avatar: c.avatar })}
              >
                {c.avatar ? <img className="avatar" src={c.avatar} alt="" /> : <div className="avatar avatar-fallback">{(c.name || c.handle || '?')[0]}</div>}
                <div className="contact-info">
                  <span className="contact-name">{c.name || c.handle}</span>
                  <span className="contact-last">{c.last || c.handle}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat">
          {!active ? (
            <div className="chat-empty">
              <MessageCircle size={40} />
              <p>Elige un aliado para empezar a chatear.</p>
            </div>
          ) : (
            <>
              <div className="chat-head">
                {active.avatar && <img className="avatar" src={active.avatar} alt="" />}
                <span>{active.name || active.handle}</span>
                <span className="chat-head-handle">{active.handle}</span>
              </div>
              <div className="chat-messages" ref={scrollRef}>
                {messages.map(m => (
                  <div key={m.id} className={`bubble${m.sender === profile.handle ? ' mine' : ''}`}>
                    <span className="bubble-text">{m.text}</span>
                    <span className="bubble-time">{formatTime(m.timestamp)}</span>
                  </div>
                ))}
              </div>
              <form className="chat-composer" onSubmit={send}>
                <input placeholder="Escribe un mensaje…" value={draft} onChange={e => setDraft(e.target.value)} />
                <button type="submit" className="chat-send" title="Enviar"><Send size={18} /></button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
