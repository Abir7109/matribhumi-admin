import { useEffect, useState } from 'react';
import * as api from '../lib/api';

export default function AnalyticsPage() {
  const [sinceHours, setSinceHours] = useState(168);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await api.getAnalyticsSummary(sinceHours);
        setSummary(res.summary);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed';
        setError(msg);
      }
    })();
  }, [sinceHours]);

  return (
    <div>
      <h1 style={{ margin: 0, color: '#176B87' }}>Analytics</h1>
      <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>Since hours</span>
        <input value={sinceHours} onChange={(e) => setSinceHours(Number(e.target.value))} type="number" style={{ height: 36, width: 120 }} />
      </div>
      {error ? <div style={{ marginTop: 10, color: '#b42318' }}>{error}</div> : null}

      <div style={{ marginTop: 14, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card title="Page views" value={summary.page_view || 0} />
        <Card title="Package views" value={summary.package_view || 0} />
        <Card title="Booking submits" value={summary.booking_submit || 0} />
        <Card title="WhatsApp opens" value={summary.whatsapp_open || 0} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.7)', padding: 14, borderRadius: 16 }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#176B87' }}>{value}</div>
    </div>
  );
}
