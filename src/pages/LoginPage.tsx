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
    <div className="mb-loginPage">
      <div className="mb-loginBlob blob1" aria-hidden="true" />
      <div className="mb-loginBlob blob2" aria-hidden="true" />
      <div className="mb-loginBlob blob3" aria-hidden="true" />

      <form
        className="mb-loginCard"
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
      >
        <div className="mb-loginHeader">
          <div className="mb-loginBrand">
            <div className="mb-loginTitle">Matribhumi Admin</div>
            <div className="mb-loginSubtitle">Matribhumi Hajj Kafela • Secure access</div>
          </div>
          <div className="mb-loginBadge">Admin</div>
        </div>

        <div className="mb-loginDivider" />

        <label className="mb-loginFieldLabel">Email</label>
        <input
          className="mb-loginField"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
          placeholder="admin@domain.com"
        />

        <label className="mb-loginFieldLabel">Password</label>
        <input
          className="mb-loginField"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />

        {error ? <div className="mb-loginError">{error}</div> : null}

        <button disabled={loading} className="mb-loginButton">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
          Tip: If you forgot credentials, contact the site owner.
        </div>
      </form>
    </div>
  );
}
