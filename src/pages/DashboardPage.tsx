import { useEffect, useState } from 'react';
import * as api from '../lib/api';

export default function DashboardPage() {
  const [packagesCount, setPackagesCount] = useState<number>(0);
  const [pendingBookings, setPendingBookings] = useState<number>(0);
  const [events, setEvents] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pkgs, bookings, ev] = await Promise.all([api.listPackages(), api.listBookings(), api.getAnalyticsSummary(168)]);
        setPackagesCount(pkgs.filter((p) => p.status !== 'archived').length);
        setPendingBookings(bookings.filter((b) => b.status === 'pending').length);
        setEvents(ev.summary);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        setError(msg);
      }
    })();
  }, []);

  return (
    <div>
      <h1 style={{ margin: 0, color: '#176B87' }}>Dashboard</h1>
      {error ? <div style={{ marginTop: 10, color: '#b42318' }}>{error}</div> : null}

      <div style={{ marginTop: 14, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Kpi title="Active packages" value={packagesCount} />
        <Kpi title="Pending bookings" value={pendingBookings} />
        <Kpi title="Booking submits" value={events.booking_submit || 0} />
        <Kpi title="WhatsApp opens" value={events.whatsapp_open || 0} />
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.7)', padding: 14, borderRadius: 16 }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#176B87' }}>{value}</div>
    </div>
  );
}
