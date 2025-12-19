import { useEffect, useState } from 'react';
import * as api from '../lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<api.SettingsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed';
        setError(msg);
      });
  }, []);

  async function save() {
    if (!settings) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await api.patchSettings(settings);
      setSettings(updated);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <div>Loading… {error ? <span style={{ color: '#b42318' }}>{error}</span> : null}</div>;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ margin: 0, color: '#176B87' }}>Settings</h1>
      {error ? <div style={{ marginTop: 10, color: '#b42318' }}>{error}</div> : null}

      <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 800, color: '#176B87' }}>Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Field label="WhatsApp" value={settings.contact?.whatsapp || ''} onChange={(v) => setSettings({ ...settings, contact: { ...(settings.contact || {}), whatsapp: v } })} />
          <Field label="Phone" value={settings.contact?.phone || ''} onChange={(v) => setSettings({ ...settings, contact: { ...(settings.contact || {}), phone: v } })} />
          <Field label="Email" value={settings.contact?.email || ''} onChange={(v) => setSettings({ ...settings, contact: { ...(settings.contact || {}), email: v } })} />
          <Field label="Address" value={settings.contact?.address || ''} onChange={(v) => setSettings({ ...settings, contact: { ...(settings.contact || {}), address: v } })} />
        </div>
      </div>

      <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 800, color: '#176B87' }}>Hero (BN)</div>
        <Field label="Headline" value={settings.bn?.heroHeadline || ''} onChange={(v) => setSettings({ ...settings, bn: { ...(settings.bn || {}), heroHeadline: v } })} />
        <Field label="Subtext" value={settings.bn?.heroSubtext || ''} onChange={(v) => setSettings({ ...settings, bn: { ...(settings.bn || {}), heroSubtext: v } })} />
      </div>

      <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 }}>
        <div style={{ fontWeight: 800, color: '#176B87' }}>Hero (EN)</div>
        <Field label="Headline" value={settings.en?.heroHeadline || ''} onChange={(v) => setSettings({ ...settings, en: { ...(settings.en || {}), heroHeadline: v } })} />
        <Field label="Subtext" value={settings.en?.heroSubtext || ''} onChange={(v) => setSettings({ ...settings, en: { ...(settings.en || {}), heroSubtext: v } })} />
      </div>

      <button onClick={save} disabled={saving} style={{ marginTop: 14, height: 44, background: '#176B87', color: 'white', borderRadius: 10 }}>
        {saving ? 'Saving…' : 'Save'}
      </button>

      <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
        Public site can fetch settings from <code>/settings/public</code>.
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 6, marginTop: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 800 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ height: 40 }} />
    </label>
  );
}
