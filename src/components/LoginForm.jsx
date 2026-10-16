import { useState } from 'react';
import { LogIn, Users } from 'lucide-react';
import { Universo } from '../universo/firebase';

const REGISTER_URL = 'https://ciudadanoz.github.io/imperiodelossunos.github.io/UNIVERSO/registro.html';

function openExternal(url) {
  if (window.launcher) window.launcher.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await Universo.login(email.trim(), password);
    } catch (ex) {
      setError('No se pudo iniciar sesión. Revisa tu correo y contraseña.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon"><Users size={34} /></div>
        <h1 className="login-title">Conecta con Universo</h1>
        <p className="login-sub">Inicia sesión con tu cuenta de Universo para ver a tus aliados y chatear sin salir del launcher.</p>

        <form onSubmit={submit} className="login-form">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-primary login-btn" disabled={busy} style={{ '--accent': '#d4af37' }}>
            <LogIn size={18} />
            {busy ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <button className="login-link" onClick={() => openExternal(REGISTER_URL)}>
          ¿No tienes cuenta? Regístrate en Universo
        </button>
      </div>
    </div>
  );
}
