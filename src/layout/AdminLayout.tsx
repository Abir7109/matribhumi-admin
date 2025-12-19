import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside style={{ padding: 16, background: '#B4D4FF' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 800, color: '#176B87' }}>Matribhumi Admin</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Live</div>
        </Link>

        <nav style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/packages">Packages</NavLink>
          <NavLink to="/bookings">Bookings</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
          <div style={{ fontWeight: 700, color: '#176B87' }}>{user?.name || '—'}</div>
          <div>{user?.email || ''}</div>
          <div>{user?.role || ''}</div>
          <button onClick={logout} style={{ marginTop: 10 }}>Logout</button>

          <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.10)', paddingTop: 12 }}>
            <div style={{ fontWeight: 700, color: 'rgba(0,0,0,0.70)' }}>Creator</div>
            <div>Rahikul Makhtum Abir</div>
            <a href="mailto:rahikulmakhtum147@gmail.com">rahikulmakhtum147@gmail.com</a>
          </div>
        </div>
      </aside>

      <main style={{ padding: 20, background: '#EEF5FF' }}>
        <Outlet />
      </main>
    </div>
  );
}
