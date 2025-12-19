import { getToken } from './storage';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function headers(extra?: Record<string, string>) {
  const token = getToken();
  const h: Record<string, string> = { ...(extra || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function json<T>(res: Response): Promise<T> {
  const data: unknown = await res.json();
  if (!res.ok) {
    const msg = typeof (data as { error?: unknown })?.error === 'string' ? (data as { error: string }).error : 'Request failed';
    throw new Error(msg);
  }
  return data as T;
}

export type AdminUser = { name: string; email: string; role: 'admin' | 'editor' | 'viewer' };

export type PackageDTO = {
  _id: string;
  title: string;
  type: 'hajj' | 'umrah';
  status: 'published' | 'draft' | 'archived';
  price: { currency: string; amount: number };
  durationDays: number;
  seatsAvailable: number;
  badges?: string[];
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: { day: number; title: string; desc: string }[];
  gallery?: string[];
  thumbnail?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type BookingDTO = {
  _id: string;
  packageId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  passportNumber: string;
  passportExpiry: string;
  travelers: number;
  preferredMonth: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: 'web' | 'whatsapp';
  createdAt: string;
};

export type SettingsDTO = {
  whatsappNumber?: string;
  contact?: { whatsapp?: string; phone?: string; email?: string; address?: string };
  bn?: { heroHeadline?: string; heroSubtext?: string; faqs?: { q: string; a: string }[] };
  en?: { heroHeadline?: string; heroSubtext?: string; faqs?: { q: string; a: string }[] };
};

export async function login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return json(res);
}

export async function me(): Promise<{ user: AdminUser }> {
  const res = await fetch(`${BASE}/admin/me`, { headers: headers() });
  return json(res);
}

export async function listPackages(): Promise<PackageDTO[]> {
  const res = await fetch(`${BASE}/admin/packages`, { headers: headers() });
  return (await json<{ packages: PackageDTO[] }>(res)).packages;
}

export async function createPackage(payload: Omit<PackageDTO, '_id'>): Promise<PackageDTO> {
  const res = await fetch(`${BASE}/admin/packages`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  return (await json<{ package: PackageDTO }>(res)).package;
}

export async function updatePackage(id: string, payload: Partial<PackageDTO>): Promise<PackageDTO> {
  const res = await fetch(`${BASE}/admin/packages/${id}`, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  return (await json<{ package: PackageDTO }>(res)).package;
}

export async function archivePackage(id: string): Promise<PackageDTO> {
  const res = await fetch(`${BASE}/admin/packages/${id}`, { method: 'DELETE', headers: headers() });
  return (await json<{ package: PackageDTO }>(res)).package;
}

export async function listBookings(): Promise<BookingDTO[]> {
  const res = await fetch(`${BASE}/admin/bookings`, { headers: headers() });
  return (await json<{ bookings: BookingDTO[] }>(res)).bookings;
}

export async function updateBooking(id: string, payload: Partial<Pick<BookingDTO, 'status' | 'notes'>>): Promise<BookingDTO> {
  const res = await fetch(`${BASE}/admin/bookings/${id}`, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  return (await json<{ booking: BookingDTO }>(res)).booking;
}

export async function getSettings(): Promise<SettingsDTO | null> {
  const res = await fetch(`${BASE}/admin/settings`, { headers: headers() });
  return (await json<{ settings: SettingsDTO | null }>(res)).settings;
}

export async function patchSettings(payload: Partial<SettingsDTO>): Promise<SettingsDTO> {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  return (await json<{ settings: SettingsDTO }>(res)).settings;
}

export async function getCloudinarySignature(): Promise<{ cloudName: string; apiKey: string; timestamp: number; folder?: string; signature: string }> {
  const res = await fetch(`${BASE}/admin/media/cloudinary-signature`, { headers: headers() });
  return json(res);
}

export async function getAnalyticsSummary(sinceHours = 168): Promise<{ since: string; summary: Record<string, number> }> {
  const res = await fetch(`${BASE}/events/admin/summary?sinceHours=${sinceHours}`, { headers: headers() });
  return json(res);
}

export type AnalyticsSeriesRow = {
  bucket: string;
  page_view: number;
  package_view: number;
  booking_submit: number;
  whatsapp_open: number;
};

export type AnalyticsReport = {
  since: string;
  sinceHours: number;
  bucket: 'hour' | 'day';
  summary: Record<string, number>;
  uniqueVisitors: number;
  series: AnalyticsSeriesRow[];
  topPages: { path: string; count: number }[];
  topPackages: { packageId: string; count: number }[];
};

export async function getAnalyticsReport(params: { sinceHours: number; bucket: 'hour' | 'day'; limit?: number }): Promise<AnalyticsReport> {
  const q = new URLSearchParams();
  q.set('sinceHours', String(params.sinceHours));
  q.set('bucket', params.bucket);
  if (params.limit) q.set('limit', String(params.limit));

  const res = await fetch(`${BASE}/events/admin/report?${q.toString()}`, { headers: headers() });
  return json(res);
}
