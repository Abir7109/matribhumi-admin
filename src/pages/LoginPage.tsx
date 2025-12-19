import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#EEF5FF' }}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await login(email, password);
            nav('/');
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            setError(msg);
          } finally {
            setLoading(false);
          }
        }}
        style={{ width: 420, maxWidth: '92vw', background: 'rgba(255,255,255,0.7)', padding: 18, borderRadius: 18 }}
      >
        <div style={{ fontWeight: 800, color: '#176B87', fontSize: 18 }}>Admin Login</div>
        <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>Matribhumi Hajj Kafela</div>

        <label style={{ display: 'block', marginTop: 12, fontSize: 12, fontWeight: 700 }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: '100%', height: 42 }} />

        <label style={{ display: 'block', marginTop: 12, fontSize: 12, fontWeight: 700 }}>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: '100%', height: 42 }} />

        {error ? <div style={{ marginTop: 12, color: '#b42318', fontSize: 13 }}>{error}</div> : null}

        <button disabled={loading} style={{ marginTop: 14, width: '100%', height: 44, background: '#176B87', color: 'white', borderRadius: 10 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
