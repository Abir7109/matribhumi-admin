import { useEffect, useMemo, useState } from 'react';
import * as api from '../lib/api';

export default function PackagesPage() {
  const [packages, setPackages] = useState<api.PackageDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await api.listPackages();
      setPackages(data);
      if (!selectedId && data[0]?._id) setSelectedId(data[0]._id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load packages';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const selected = useMemo(() => packages.find((p) => p._id === selectedId) || null, [packages, selectedId]);

  function removePackageFromList(id: string) {
    setPackages((prev) => prev.filter((p) => p._id !== id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, color: '#176B87' }}>Packages</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              setSelectedId(null);
            }}
            style={{ background: '#176B87', color: 'white', borderRadius: 10 }}
          >
            + Add package
          </button>
          <button onClick={refresh} disabled={loading}>Refresh</button>
        </div>
      </div>
      {error ? <div style={{ color: '#b42318' }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, color: '#176B87' }}>List</div>
            <button
              onClick={() => {
                setSelectedId(null);
              }}
              style={{ borderRadius: 10 }}
            >
              + Add
            </button>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {packages.map((p) => (
              <button
                key={p._id}
                onClick={() => setSelectedId(p._id)}
                style={{
                  textAlign: 'left',
                  padding: 10,
                  borderRadius: 12,
                  background: p._id === selectedId ? '#B4D4FF' : 'rgba(255,255,255,0.8)'
                }}
              >
                <div style={{ fontWeight: 800, color: '#176B87' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{p.type} • {p.status} • {p.price.currency} {p.price.amount}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 10, color: '#176B87' }}>Editor</div>
          <PackageEditor
            key={selected?._id || 'new'}
            initial={selected}
            onSaved={(p) => {
              setPackages((prev) => {
                const idx = prev.findIndex((x) => x._id === p._id);
                if (idx >= 0) {
                  const copy = prev.slice();
                  copy[idx] = p;
                  return copy;
                }
                return [p, ...prev];
              });
              setSelectedId(p._id);
            }}
            onArchived={(id) => {
              // remove from list for a simple “delete” UX (API archives server-side)
              removePackageFromList(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PackageEditor({
  initial,
  onSaved,
  onArchived,
}: {
  initial: api.PackageDTO | null;
  onSaved: (p: api.PackageDTO) => void;
  onArchived: (id: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState<api.PackageDTO['type']>(initial?.type || 'hajj');
  const [status, setStatus] = useState<api.PackageDTO['status']>(initial?.status || 'draft');
  const [currency, setCurrency] = useState(initial?.price.currency || 'BDT');
  const [amount, setAmount] = useState<number>(initial?.price.amount || 0);
  const [durationDays, setDurationDays] = useState<number>(initial?.durationDays || 10);
  const [seatsAvailable, setSeatsAvailable] = useState<number>(initial?.seatsAvailable || 0);
  const [thumbnail, setThumbnail] = useState<string>(initial?.thumbnail || '');

  const [badgesText, setBadgesText] = useState<string>((initial?.badges || []).join('\n'));
  const [inclusionsText, setInclusionsText] = useState<string>((initial?.inclusions || []).join('\n'));
  const [exclusionsText, setExclusionsText] = useState<string>((initial?.exclusions || []).join('\n'));

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function uploadThumbnail(file: File) {
    const sig = await api.getCloudinarySignature();
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', String(sig.timestamp));
    fd.append('signature', sig.signature);
    if (sig.folder) fd.append('folder', sig.folder);

    const res = await fetch(url, { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'Upload failed');

    setThumbnail(String(json.secure_url || ''));
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const toList = (text: string) =>
        text
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);

      const payload: Omit<api.PackageDTO, '_id'> = {
        title,
        type,
        status,
        price: { currency, amount },
        durationDays,
        seatsAvailable,
        thumbnail,
        badges: toList(badgesText),
        inclusions: toList(inclusionsText),
        exclusions: toList(exclusionsText),
        itinerary: initial?.itinerary || [],
        gallery: initial?.gallery || [],
      };

      const saved = initial?._id ? await api.updatePackage(initial._id, payload) : await api.createPackage(payload);
      onSaved(saved);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!initial?._id) return;
    setError(null);
    setSaving(true);
    try {
      await api.archivePackage(initial._id);
      onArchived(initial._id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Archive failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 800 }}>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ height: 40 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Type</label>
          <select
            value={type}
            onChange={(e) => {
              const v = e.target.value;
              setType(v === 'umrah' ? 'umrah' : 'hajj');
            }}
            style={{ height: 40, width: '100%' }}
          >
            <option value="hajj">Hajj</option>
            <option value="umrah">Umrah</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Status</label>
          <select
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              setStatus(v === 'published' || v === 'archived' ? v : 'draft');
            }}
            style={{ height: 40, width: '100%' }}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Currency</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ height: 40, width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Price</label>
          <input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" style={{ height: 40, width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Duration (days)</label>
          <input value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} type="number" style={{ height: 40, width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Seats</label>
          <input value={seatsAvailable} onChange={(e) => setSeatsAvailable(Number(e.target.value))} type="number" style={{ height: 40, width: '100%' }} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 800 }}>Thumbnail</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." style={{ height: 40, flex: 1 }} />
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await uploadThumbnail(file);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Upload failed';
                setError(msg);
              }
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Inclusions (one per line)</label>
          <textarea
            value={inclusionsText}
            onChange={(e) => setInclusionsText(e.target.value)}
            rows={7}
            style={{ width: '100%' }}
            placeholder={'Flight\nHotel\nTransport\nGuidance'}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 800 }}>Exclusions (one per line)</label>
          <textarea
            value={exclusionsText}
            onChange={(e) => setExclusionsText(e.target.value)}
            rows={7}
            style={{ width: '100%' }}
            placeholder={'Personal expenses\nVisa fees (if applicable)'}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 800 }}>Badges (one per line)</label>
        <textarea
          value={badgesText}
          onChange={(e) => setBadgesText(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
          placeholder={'Group\nFamily\nLimited seats'}
        />
      </div>

      {error ? <div style={{ color: '#b42318' }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving} style={{ flex: 1, background: '#176B87', color: 'white', borderRadius: 10 }}>
          {saving ? 'Saving…' : initial?._id ? 'Save changes' : 'Create package'}
        </button>
        {initial?._id ? (
          <button
            onClick={archive}
            disabled={saving}
            style={{ borderRadius: 10, background: '#b42318', color: 'white' }}
          >
            Remove package
          </button>
        ) : null}
      </div>

      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
        Media upload uses Cloudinary signed uploads via API.
      </div>
    </div>
  );
}
