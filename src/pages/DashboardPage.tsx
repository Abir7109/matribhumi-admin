import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';

type RangePreset = { label: string; sinceHours: number; bucket: 'hour' | 'day' };

const PRESETS: RangePreset[] = [
  { label: '24h', sinceHours: 24, bucket: 'hour' },
  { label: '7d', sinceHours: 24 * 7, bucket: 'day' },
  { label: '30d', sinceHours: 24 * 30, bucket: 'day' },
];

export default function DashboardPage() {
  const [presetIdx, setPresetIdx] = useState(1);
  const preset = PRESETS[presetIdx] || PRESETS[1]!;

  const [packages, setPackages] = useState<api.PackageDTO[]>([]);
  const [bookings, setBookings] = useState<api.BookingDTO[]>([]);
  const [report, setReport] = useState<api.AnalyticsReport | null>(null);
  const [apiNeedsDeploy, setApiNeedsDeploy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);
      try {
        setApiNeedsDeploy(false);

        let rep: api.AnalyticsReport;
        try {
          rep = await api.getAnalyticsReport({ sinceHours: preset.sinceHours, bucket: preset.bucket, limit: 8 });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.toLowerCase().includes('not found')) {
            setApiNeedsDeploy(true);
            const basic = await api.getAnalyticsSummary(preset.sinceHours);
            rep = {
              since: basic.since,
              sinceHours: preset.sinceHours,
              bucket: preset.bucket,
              summary: basic.summary,
              uniqueVisitors: 0,
              series: [],
              topPages: [],
              topPackages: [],
            };
          } else {
            throw err;
          }
        }

        const [pkgs, bks] = await Promise.all([api.listPackages(), api.listBookings()]);
        setPackages(pkgs);
        setBookings(bks);
        setReport(rep);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [preset.sinceHours, preset.bucket]);

  const summary = report?.summary || {};
  const pageViews = Number(summary.page_view || 0);
  const packageViews = Number(summary.package_view || 0);
  const bookingSubmits = Number(summary.booking_submit || 0);
  const whatsappOpens = Number(summary.whatsapp_open || 0);

  const packageStats = useMemo(() => {
    const active = packages.filter((p) => p.status !== 'archived');
    const published = packages.filter((p) => p.status === 'published');
    const draft = packages.filter((p) => p.status === 'draft');
    return { active: active.length, published: published.length, draft: draft.length };
  }, [packages]);

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending');
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    return { total: bookings.length, pending: pending.length, confirmed: confirmed.length, cancelled: cancelled.length };
  }, [bookings]);

  const packageTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of packages) map[p._id] = p.title;
    return map;
  }, [packages]);

  const recentBookings = useMemo(() => {
    return bookings
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [bookings]);

  const rates = useMemo(() => {
    const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
    return {
      viewToPackage: pct(packageViews, pageViews),
      packageToBooking: pct(bookingSubmits, packageViews),
      bookingToWhatsapp: pct(whatsappOpens, bookingSubmits),
      viewToBooking: pct(bookingSubmits, pageViews),
    };
  }, [pageViews, packageViews, bookingSubmits, whatsappOpens]);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: '#176B87' }}>Dashboard</h1>
          <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.60)' }}>
            Quick overview of packages, bookings and conversions.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={p.label}
              onClick={() => setPresetIdx(idx)}
              style={{
                borderRadius: 999,
                padding: '8px 12px',
                background: idx === presetIdx ? '#176B87' : 'rgba(255,255,255,0.7)',
                color: idx === presetIdx ? 'white' : '#176B87',
                border: '1px solid rgba(0,0,0,0.08)',
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {p.label}
            </button>
          ))}

          <Link
            to="/analytics"
            style={{
              textDecoration: 'none',
              borderRadius: 999,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,0,0,0.08)',
              fontWeight: 900,
              fontSize: 12,
              color: '#176B87',
            }}
          >
            View analytics →
          </Link>
        </div>
      </div>

      {apiNeedsDeploy ? (
        <div
          style={{
            borderRadius: 14,
            padding: '10px 12px',
            background: 'rgba(255, 244, 229, 0.9)',
            border: '1px solid rgba(255, 179, 71, 0.35)',
            color: 'rgba(0,0,0,0.75)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          API update not deployed yet — showing basic dashboard only. Redeploy the Render API to enable charts + top pages/packages.
        </div>
      ) : null}

      {error ? <div style={{ color: '#b42318' }}>{error}</div> : null}

      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <StatCard title="Active packages" value={packageStats.active} subtitle={`${packageStats.published} published • ${packageStats.draft} draft`} accent="#176B87" loading={loading} />
        <StatCard title="Bookings" value={bookingStats.total} subtitle={`${bookingStats.pending} pending • ${bookingStats.confirmed} confirmed`} accent="#B42318" loading={loading} />
        <StatCard title="Visitors" value={report?.uniqueVisitors ?? 0} subtitle="Unique (IP-based)" accent="#7C3AED" loading={loading} />
        <StatCard title="Page views" value={pageViews} subtitle="All pages" accent="#0D9276" loading={loading} />
        <StatCard title="Package views" value={packageViews} subtitle={`${fmtPct(rates.viewToPackage)} of page views`} accent="#1D4ED8" loading={loading} />
        <StatCard title="WhatsApp opens" value={whatsappOpens} subtitle={`${fmtPct(rates.bookingToWhatsapp)} of bookings`} accent="#16A34A" loading={loading} />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1.1fr 0.9fr' }}>
        <Panel title="Trend" subtitle={report ? `Bucket: ${report.bucket} • Since: ${new Date(report.since).toLocaleString()}` : ''}>
          <TrendChart
            series={report?.series || []}
            lines={[
              { key: 'page_view', label: 'Page views', color: '#0D9276' },
              { key: 'booking_submit', label: 'Bookings', color: '#B42318' },
              { key: 'whatsapp_open', label: 'WhatsApp', color: '#16A34A' },
            ]}
          />
        </Panel>

        <Panel title="Funnel" subtitle="Conversion rates">
          <FunnelRow label="Page → Package" value={rates.viewToPackage} color="#1D4ED8" />
          <FunnelRow label="Package → Booking" value={rates.packageToBooking} color="#B42318" />
          <FunnelRow label="Booking → WhatsApp" value={rates.bookingToWhatsapp} color="#16A34A" />
          <div style={{ height: 10 }} />
          <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(0,0,0,0.7)' }}>Overall</div>
          <FunnelRow label="Page → Booking" value={rates.viewToBooking} color="#176B87" />
        </Panel>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="Recent bookings" subtitle="Latest submissions">
          <div style={{ display: 'grid', gap: 8 }}>
            {recentBookings.length ? (
              recentBookings.map((b) => (
                <div
                  key={b._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 10,
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(0,0,0,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.name} • {packageTitleById[b.packageId] || b.packageId}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
                      {new Date(b.createdAt).toLocaleString()} • {b.phone}
                    </div>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>{loading ? 'Loading…' : 'No bookings yet'}</div>
            )}

            <div style={{ marginTop: 4 }}>
              <Link to="/bookings" style={{ color: '#176B87', fontWeight: 900, textDecoration: 'none' }}>
                Manage bookings →
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title="Top pages" subtitle="Most visited (from analytics)">
          <SimpleTable
            rows={(report?.topPages || []).map((r) => ({ left: r.path, right: String(r.count) }))}
            emptyText={loading ? 'Loading…' : apiNeedsDeploy ? 'API not deployed yet' : 'No data'}
          />
        </Panel>
      </div>
    </div>
  );
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 18, padding: 14, border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 950, color: '#176B87' }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 2, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>{subtitle}</div> : null}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  accent,
  loading,
}: {
  title: string;
  value: number;
  subtitle: string;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.75)',
        padding: 14,
        borderRadius: 18,
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.62)', fontWeight: 900 }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 950, color: accent, lineHeight: 1.1 }}>{loading ? '…' : value}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>{subtitle}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 14, background: accent, opacity: 0.12 }} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: api.BookingDTO['status'] }) {
  const cfg =
    status === 'pending'
      ? { bg: 'rgba(255,179,71,0.22)', fg: '#B54708' }
      : status === 'confirmed'
        ? { bg: 'rgba(22,163,74,0.18)', fg: '#166534' }
        : { bg: 'rgba(180,35,24,0.14)', fg: '#B42318' };

  return (
    <span
      style={{
        justifySelf: 'end',
        fontSize: 12,
        fontWeight: 900,
        padding: '6px 10px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.fg,
        border: '1px solid rgba(0,0,0,0.06)',
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

function FunnelRow({ label, value, color }: { label: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: 'rgba(0,0,0,0.70)' }}>
        <span>{label}</span>
        <span style={{ color }}>{fmtPct(v)}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function SimpleTable({
  rows,
  emptyText,
}: {
  rows: { left: string; right: string }[];
  emptyText: string;
}) {
  if (!rows.length) {
    return <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>{emptyText}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map((r, idx) => (
        <div
          key={`${r.left}_${idx}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 10,
            alignItems: 'center',
            padding: '10px 12px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(0,0,0,0.70)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.left}</div>
          <div style={{ fontSize: 13, fontWeight: 950, color: '#176B87' }}>{r.right}</div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({
  series,
  lines,
}: {
  series: api.AnalyticsSeriesRow[];
  lines: { key: keyof api.AnalyticsSeriesRow; label: string; color: string }[];
}) {
  const width = 900;
  const height = 220;
  const pad = 18;

  const xs = series.map((_, i) => i);
  const maxY = Math.max(1, ...lines.map((l) => Math.max(0, ...series.map((s) => Number(s[l.key] || 0)))));

  const xTo = (x: number) => {
    if (xs.length <= 1) return pad;
    return pad + (x * (width - pad * 2)) / (xs.length - 1);
  };

  const yTo = (y: number) => {
    const inner = height - pad * 2;
    return height - pad - (y * inner) / maxY;
  };

  const makePath = (key: keyof api.AnalyticsSeriesRow) => {
    if (!series.length) return '';
    return series
      .map((s, i) => {
        const x = xTo(i);
        const y = yTo(Number(s[key] || 0));
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {lines.map((l) => (
          <div key={l.label} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'rgba(0,0,0,0.65)', fontWeight: 800 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: l.color, display: 'inline-block' }} />
            {l.label}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(23,107,135,0.06), rgba(23,107,135,0))' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
          <g opacity={0.25}>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = pad + (height - pad * 2) * t;
              return <line key={t} x1={pad} y1={y} x2={width - pad} y2={y} stroke="#176B87" strokeWidth={1} />;
            })}
          </g>

          {lines.map((l) => (
            <path key={String(l.key)} d={makePath(l.key)} fill="none" stroke={l.color} strokeWidth={3} strokeLinecap="round" />
          ))}
        </svg>
      </div>

      {!series.length ? <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>No data</div> : null}
    </div>
  );
}
