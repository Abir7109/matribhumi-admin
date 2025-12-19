import { useEffect, useState } from 'react';
import * as api from '../lib/api';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<api.BookingDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      setBookings(await api.listBookings());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ margin: 0, color: '#176B87' }}>Bookings</h1>
        <button onClick={refresh} disabled={loading}>Refresh</button>
      </div>
      {error ? <div style={{ marginTop: 10, color: '#b42318' }}>{error}</div> : null}

      <div style={{ marginTop: 12, overflowX: 'auto', background: 'rgba(255,255,255,0.7)', borderRadius: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: 10 }}>Name</th>
              <th style={{ padding: 10 }}>Phone</th>
              <th style={{ padding: 10 }}>PackageId</th>
              <th style={{ padding: 10 }}>Travelers</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Created</th>
              <th style={{ padding: 10 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <td style={{ padding: 10, fontWeight: 800, color: '#176B87' }}>{b.name}</td>
                <td style={{ padding: 10 }}>{b.phone}</td>
                <td style={{ padding: 10 }}>{String(b.packageId).slice(-6)}</td>
                <td style={{ padding: 10 }}>{b.travelers}</td>
                <td style={{ padding: 10 }}>{b.status}</td>
                <td style={{ padding: 10 }}>{new Date(b.createdAt).toLocaleString()}</td>
                <td style={{ padding: 10 }}>
                  <select
                    value={b.status}
                    onChange={async (e) => {
                      const status = e.target.value as api.BookingDTO['status'];
                      const updated = await api.updateBooking(b._id, { status });
                      setBookings((prev) => prev.map((x) => (x._id === b._id ? updated : x)));
                    }}
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
