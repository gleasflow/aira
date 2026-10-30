import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LinkItem, UserItem, UserRole, UserStatus } from '../types';
import { INITIAL_LINKS, INITIAL_USERS, isTemplateLink } from '../data/initialData';

const DEFAULT_SUPABASE_URL = 'https://zufkcguoiazcctdttnhd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-m6UjRg2VNZzkEGvy9KSfg_YjWwGGnN';

const env = (import.meta as any).env || {};

const rawUrl = (
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  env.SUPABASE_URL ||
  ''
).trim();

const rawKey = (
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

const isValidEnvUrl = Boolean(
  rawUrl &&
  rawUrl !== 'https://your-project-id.supabase.co' &&
  rawUrl.startsWith('http')
);

const isValidEnvKey = Boolean(
  rawKey &&
  rawKey !== 'your-anon-key-here'
);

export const supabaseUrl = isValidEnvUrl ? rawUrl : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = isValidEnvKey ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseProjectRef = (() => {
  try {
    if (!isSupabaseConfigured) return '';
    const host = new URL(supabaseUrl).hostname;
    return host.split('.')[0] || '';
  } catch {
    return '';
  }
})();

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const STORAGE_BUCKET_NAME = 'link-thumbnails';
const CLOUD_LINKS_JSON_PATH = 'db/links.json';
const CLOUD_USERS_JSON_PATH = 'db/user_profiles.json';

// ==========================================
// UUID & NORMALIZATION HELPERS
// ==========================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LEGACY_USER_UUID_MAP: Record<string, string> = {
  'usr-1': '00000000-0000-4000-8000-000000000001',
  'usr-2': '00000000-0000-4000-8000-000000000002',
  'usr-3': '00000000-0000-4000-8000-000000000003',
  'usr-4': '00000000-0000-4000-8000-000000000004',
  'usr-5': '00000000-0000-4000-8000-000000000005',
};

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureValidUuid(id?: string): string {
  if (!id) return generateUuid();
  if (UUID_REGEX.test(id)) return id.toLowerCase();
  if (LEGACY_USER_UUID_MAP[id]) return LEGACY_USER_UUID_MAP[id];
  // Deterministic hex hash fallback for any legacy string ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).padStart(12, '0').slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
}

// ==========================================
// SUPABASE CLOUD STORAGE MIRROR HELPERS
// ==========================================

async function loadJsonFromCloudStorage<T>(path: string): Promise<T | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .download(path);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function saveJsonToCloudStorage<T>(path: string, payload: T): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(path, blob, {
        cacheControl: '0',
        upsert: true,
        contentType: 'application/json',
      });
    return !error;
  } catch {
    return false;
  }
}

function getLocalLinks(): LinkItem[] {
  try {
    const saved = localStorage.getItem('aira_studio_links');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((l: any) => !isTemplateLink(l))
          .map((l: LinkItem) => ({ ...l, id: ensureValidUuid(l.id) }));
      }
    }
  } catch (err) {
    console.warn('Failed parsing aira_studio_links from localStorage:', err);
  }
  return INITIAL_LINKS;
}

function setLocalLinks(links: LinkItem[]): void {
  try {
    localStorage.setItem('aira_studio_links', JSON.stringify(links));
  } catch (err) {
    console.warn('Failed saving aira_studio_links to localStorage:', err);
  }
}

function getLocalUsers(): UserItem[] {
  try {
    const saved = localStorage.getItem('aira_studio_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u: UserItem) => ({
          ...u,
          id: ensureValidUuid(u.id),
        }));
      }
    }
  } catch (err) {
    console.warn('Failed parsing aira_studio_users from localStorage:', err);
  }
  return INITIAL_USERS;
}

function setLocalUsers(users: UserItem[]): void {
  try {
    localStorage.setItem('aira_studio_users', JSON.stringify(users));
  } catch (err) {
    console.warn('Failed saving aira_studio_users to localStorage:', err);
  }
}

function mapDbRowToLink(d: any): LinkItem {
  return {
    id: ensureValidUuid(String(d.id)),
    title: d.title || 'Untitled Tool',
    description: d.description || '',
    url: d.url || '#',
    category: (['affiliate', 'animation', 'story'].includes(d.category)
      ? d.category
      : 'affiliate') as any,
    tag: d.tag || 'General',
    thumbnailUrl: d.thumbnail_url || undefined,
    gradientTheme: d.gradient_theme || 'from-indigo-600 to-violet-600',
    clicks: Number(d.clicks) || 0,
    isFavorite: Boolean(d.is_favorite),
    createdAt: d.created_at
      ? String(d.created_at).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    badge: d.badge || undefined,
  };
}

function mapLinkToDbRow(link: LinkItem) {
  return {
    id: ensureValidUuid(link.id),
    title: link.title,
    description: link.description || '',
    url: link.url,
    category: ['affiliate', 'animation', 'story'].includes(link.category)
      ? link.category
      : 'affiliate',
    tag: link.tag || 'General',
    thumbnail_url: link.thumbnailUrl || null,
    gradient_theme: link.gradientTheme || 'from-indigo-600 to-violet-600',
    clicks: Number(link.clicks) || 0,
    is_favorite: Boolean(link.isFavorite),
  };
}

function mapDbRowToUser(d: any): UserItem {
  return {
    id: ensureValidUuid(String(d.id)),
    email: d.email || 'user@airastudio.ai',
    name: d.name || 'Pengguna',
    role: (['admin', 'creator', 'member'].includes(d.role) ? d.role : 'member') as UserRole,
    status: (['active', 'suspended'].includes(d.status) ? d.status : 'active') as UserStatus,
    avatarBg: d.avatar_bg || 'bg-indigo-600',
    joinedDate: d.joined_date
      ? String(d.joined_date).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

function mapUserToDbRow(user: UserItem) {
  return {
    id: ensureValidUuid(user.id),
    email: user.email.trim().toLowerCase(),
    name: user.name.trim(),
    role: ['admin', 'creator', 'member'].includes(user.role) ? user.role : 'member',
    status: ['active', 'suspended'].includes(user.status) ? user.status : 'active',
    avatar_bg: user.avatarBg || 'bg-indigo-600',
  };
}

// ==========================================
// DIAGNOSTICS & FULL TABLE SYNC
// ==========================================

export interface SupabaseDiagnostics {
  configured: boolean;
  projectRef: string;
  tablesReadable: boolean;
  tablesWritable: boolean;
  rlsBlocked: boolean;
  storageConnected: boolean;
  tableLinksCount: number;
  tableUsersCount: number;
  errorMessage: string | null;
}

export let lastRlsWarning: string | null = null;

export async function checkSupabaseDiagnostics(): Promise<SupabaseDiagnostics> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      configured: false,
      projectRef: '',
      tablesReadable: false,
      tablesWritable: false,
      rlsBlocked: false,
      storageConnected: false,
      tableLinksCount: 0,
      tableUsersCount: 0,
      errorMessage: 'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum dikonfigurasi.',
    };
  }

  let tablesReadable = false;
  let tablesWritable = false;
  let rlsBlocked = false;
  let storageConnected = false;
  let tableLinksCount = 0;
  let tableUsersCount = 0;
  let errorMessage: string | null = null;

  try {
    const [linksRes, usersRes, storageRes] = await Promise.all([
      supabase.from('links').select('id', { count: 'exact' }),
      supabase.from('user_profiles').select('id, email', { count: 'exact' }),
      supabase.storage.from(STORAGE_BUCKET_NAME).list('', { limit: 1 }),
    ]);

    if (!storageRes.error) {
      storageConnected = true;
    }

    if (!linksRes.error && !usersRes.error) {
      tablesReadable = true;
      tableLinksCount = linksRes.count ?? (linksRes.data?.length || 0);
      tableUsersCount = usersRes.count ?? (usersRes.data?.length || 0);
    } else {
      errorMessage = linksRes.error?.message || usersRes.error?.message || null;
    }

    // Test whether table write (upsert on existing or admin user) is permitted by RLS
    const localUsers = getLocalUsers();
    const probeUser = localUsers[0] || INITIAL_USERS[0];
    const { error: writeErr } = await supabase
      .from('user_profiles')
      .upsert([mapUserToDbRow(probeUser)], { onConflict: 'email' });

    if (!writeErr) {
      tablesWritable = true;
      lastRlsWarning = null;
      // Refresh user count after probe upsert
      const countCheck = await supabase.from('user_profiles').select('id', { count: 'exact' });
      if (!countCheck.error) {
        tableUsersCount = countCheck.count ?? (countCheck.data?.length || tableUsersCount);
      }
    } else if (writeErr.code === '42501' || writeErr.message?.toLowerCase().includes('row-level security')) {
      rlsBlocked = true;
      tablesWritable = false;
      lastRlsWarning = writeErr.message;
      errorMessage =
        'Tabel public.links & public.user_profiles sudah terhubung, tetapi kebijakan RLS (Row-Level Security) di Supabase belum mengizinkan INSERT/UPDATE. Data Anda tetap aman tersimpan di Supabase Cloud Storage & siap disinkronkan ke tabel setelah SQL kebijakan RLS dijalankan.';
    } else {
      errorMessage = writeErr.message;
    }
  } catch (err: any) {
    errorMessage = err?.message || 'Gagal memeriksa koneksi Supabase.';
  }

  return {
    configured: true,
    projectRef: supabaseProjectRef,
    tablesReadable,
    tablesWritable,
    rlsBlocked,
    storageConnected,
    tableLinksCount,
    tableUsersCount,
    errorMessage,
  };
}

// ==========================================
// 1. DATABASE LINKS SERVICES
// ==========================================

export async function getLinksFromDb(): Promise<LinkItem[]> {
  const localLinks = getLocalLinks();

  if (isSupabaseConfigured && supabase) {
    try {
      // Hapus template link bawaan lama dari database Supabase jika ada
      await supabase.from('links').delete().ilike('url', '%.airastudio.internal%');

      const [tableRes, cloudStorageLinks] = await Promise.all([
        supabase.from('links').select('*').order('created_at', { ascending: false }),
        loadJsonFromCloudStorage<LinkItem[]>(CLOUD_LINKS_JSON_PATH),
      ]);

      const tableLinks: LinkItem[] =
        !tableRes.error && Array.isArray(tableRes.data)
          ? tableRes.data.map(mapDbRowToLink).filter((item) => !isTemplateLink(item))
          : [];

      const validCloudLinks: LinkItem[] = Array.isArray(cloudStorageLinks)
        ? cloudStorageLinks
            .filter((item) => !isTemplateLink(item))
            .map((item) => ({ ...item, id: ensureValidUuid(item.id) }))
        : [];

      const mergedMap = new Map<string, LinkItem>();
      const hasCloudData = cloudStorageLinks !== null || tableLinks.length > 0;

      if (!hasCloudData) {
        for (const item of localLinks) {
          mergedMap.set(ensureValidUuid(item.id), { ...item, id: ensureValidUuid(item.id) });
        }
      } else {
        for (const item of validCloudLinks) {
          mergedMap.set(ensureValidUuid(item.id), { ...item, id: ensureValidUuid(item.id) });
        }
        for (const item of tableLinks) {
          mergedMap.set(ensureValidUuid(item.id), item);
        }
      }

      const mergedLinks = Array.from(mergedMap.values());

      // Coba sinkronkan otomatis link yang belum ada di tabel PostgreSQL public.links
      const tableIds = new Set(tableLinks.map((l) => l.id));
      const missingInTable = mergedLinks.filter((l) => !tableIds.has(l.id));

      if (missingInTable.length > 0) {
        const rowsToInsert = missingInTable.map(mapLinkToDbRow);
        const { error: syncErr } = await supabase
          .from('links')
          .upsert(rowsToInsert, { onConflict: 'id' });
        if (syncErr) {
          if (syncErr.code === '42501') {
            lastRlsWarning = syncErr.message;
          }
        } else {
          lastRlsWarning = null;
        }
      }

      // Simpan ke Cloud Storage & LocalStorage agar selalu konsisten
      if (mergedLinks.length > 0 || cloudStorageLinks !== null) {
        await saveJsonToCloudStorage(CLOUD_LINKS_JSON_PATH, mergedLinks);
      }
      setLocalLinks(mergedLinks);
      return mergedLinks;
    } catch (err) {
      console.warn('Supabase fetchLinks exception:', err);
    }
  }

  return localLinks;
}

export async function insertLinkToDb(
  link: Omit<LinkItem, 'id' | 'clicks' | 'isFavorite' | 'createdAt'>
): Promise<LinkItem> {
  const newId = generateUuid();
  const nowDate = new Date().toISOString().slice(0, 10);

  let createdLink: LinkItem = {
    ...link,
    id: newId,
    clicks: 0,
    isFavorite: false,
    createdAt: nowDate,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const dbPayload = mapLinkToDbRow(createdLink);
      const { data, error } = await supabase
        .from('links')
        .insert([dbPayload])
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          lastRlsWarning = error.message;
        }
        console.warn('Supabase insertLink table notice (saved to Supabase Cloud Storage):', error.message);
      } else if (data) {
        lastRlsWarning = null;
        createdLink = {
          ...mapDbRowToLink(data),
          badge: link.badge,
        };
      }
    } catch (err) {
      console.warn('Supabase insertLink exception:', err);
    }
  }

  // Selalu perbarui LocalStorage & Supabase Cloud Storage Mirror
  const currentLocal = getLocalLinks().filter((l) => l.id !== createdLink.id);
  const updatedList = [createdLink, ...currentLocal];
  setLocalLinks(updatedList);
  await saveJsonToCloudStorage(CLOUD_LINKS_JSON_PATH, updatedList);

  return createdLink;
}

export async function updateLinkInDb(id: string, updates: Partial<LinkItem>): Promise<void> {
  const normalizedId = ensureValidUuid(id);

  // Perbarui LocalStorage & Cloud Storage Mirror terlebih dahulu
  const currentLocal = getLocalLinks();
  const updatedList = currentLocal.map((l) =>
    l.id === id || l.id === normalizedId ? { ...l, ...updates, id: normalizedId } : l
  );
  setLocalLinks(updatedList);
  await saveJsonToCloudStorage(CLOUD_LINKS_JSON_PATH, updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      const targetItem = updatedList.find((l) => l.id === normalizedId);
      if (targetItem) {
        const { error } = await supabase
          .from('links')
          .upsert([mapLinkToDbRow(targetItem)], { onConflict: 'id' });
        if (error) {
          if (error.code === '42501') lastRlsWarning = error.message;
          console.warn('Supabase updateLink notice:', error.message);
        }
      }
    } catch (err) {
      console.warn('Supabase updateLink failed:', err);
    }
  }
}

export async function deleteLinkFromDb(id: string): Promise<void> {
  const normalizedId = ensureValidUuid(id);

  const currentLocal = getLocalLinks();
  const updatedList = currentLocal.filter((l) => l.id !== id && l.id !== normalizedId);
  setLocalLinks(updatedList);
  await saveJsonToCloudStorage(CLOUD_LINKS_JSON_PATH, updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('links').delete().eq('id', normalizedId);
      if (error && error.code === '42501') {
        lastRlsWarning = error.message;
      }
    } catch (err) {
      console.warn('Supabase deleteLink failed:', err);
    }
  }
}

export async function deleteAllLinksFromDb(): Promise<void> {
  setLocalLinks([]);
  await saveJsonToCloudStorage(CLOUD_LINKS_JSON_PATH, []);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('links').delete().neq('title', '___never_match___');
    } catch (err) {
      console.warn('Supabase deleteAllLinks failed:', err);
    }
  }
}

// ==========================================
// 2. DATABASE USERS & LOGIN SERVICES
// ==========================================

export async function getUsersFromDb(): Promise<UserItem[]> {
  const localUsers = getLocalUsers();

  if (isSupabaseConfigured && supabase) {
    try {
      const [tableRes, cloudStorageUsers] = await Promise.all([
        supabase.from('user_profiles').select('*').order('joined_date', { ascending: false }),
        loadJsonFromCloudStorage<UserItem[]>(CLOUD_USERS_JSON_PATH),
      ]);

      const tableUsers: UserItem[] =
        !tableRes.error && Array.isArray(tableRes.data)
          ? tableRes.data.map(mapDbRowToUser)
          : [];

      const validCloudUsers: UserItem[] = Array.isArray(cloudStorageUsers)
        ? cloudStorageUsers.map((u) => ({ ...u, id: ensureValidUuid(u.id) }))
        : [];

      // Gabungkan berdasarkan email (case-insensitive)
      const byEmail = new Map<string, UserItem>();
      const hasCloudUsers = validCloudUsers.length > 0 || tableUsers.length > 0;

      if (!hasCloudUsers) {
        const fallbackUsers = localUsers.length > 0 ? localUsers : INITIAL_USERS;
        for (const u of fallbackUsers) {
          const key = u.email.trim().toLowerCase();
          byEmail.set(key, { ...u, id: ensureValidUuid(u.id) });
        }
      } else {
        for (const u of validCloudUsers) {
          const key = u.email.trim().toLowerCase();
          byEmail.set(key, { ...u, id: ensureValidUuid(u.id) });
        }
        for (const u of tableUsers) {
          const key = u.email.trim().toLowerCase();
          byEmail.set(key, u);
        }
      }

      const mergedUsers = Array.from(byEmail.values());

      // Coba sinkronkan otomatis user yang belum masuk ke tabel PostgreSQL public.user_profiles
      const tableEmails = new Set(tableUsers.map((u) => u.email.trim().toLowerCase()));
      const missingInTable = mergedUsers.filter(
        (u) => !tableEmails.has(u.email.trim().toLowerCase())
      );

      if (missingInTable.length > 0) {
        const rowsToUpsert = missingInTable.map(mapUserToDbRow);
        const { error: syncErr } = await supabase
          .from('user_profiles')
          .upsert(rowsToUpsert, { onConflict: 'email' });
        if (syncErr) {
          if (syncErr.code === '42501') {
            lastRlsWarning = syncErr.message;
          }
        } else {
          lastRlsWarning = null;
        }
      }

      await saveJsonToCloudStorage(CLOUD_USERS_JSON_PATH, mergedUsers);
      setLocalUsers(mergedUsers);
      return mergedUsers;
    } catch (err) {
      console.warn('Supabase fetchUsers exception:', err);
    }
  }

  return localUsers;
}

/**
 * Sinkronkan Seluruh Data Link & User ke Database Supabase (Tabel PostgreSQL & Cloud Storage)
 */
export async function seedDefaultDataToSupabase(
  currentLinks?: LinkItem[],
  currentUsers?: UserItem[]
): Promise<{ success: boolean; rlsBlocked?: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Database Supabase belum terkonfigurasi di environment.',
    };
  }

  try {
    const linksToSync = (currentLinks ?? getLocalLinks()).filter((l) => !isTemplateLink(l));
    const usersToSync = currentUsers && currentUsers.length > 0 ? currentUsers : getLocalUsers();

    // 1. Simpan ke Supabase Cloud Storage (selalu berhasil karena bucket link-thumbnails aktif)
    const [cloudLinksOk, cloudUsersOk] = await Promise.all([
      saveJsonToCloudStorage(CLOUD_LINKS_JSON_PATH, linksToSync),
      saveJsonToCloudStorage(CLOUD_USERS_JSON_PATH, usersToSync),
    ]);

    // 2. Pastikan template link lama (.airastudio.internal) dihapus dari tabel
    await supabase.from('links').delete().ilike('url', '%.airastudio.internal%');

    // 3. Upsert semua user ke public.user_profiles
    const userPayloads = usersToSync.map(mapUserToDbRow);
    const { error: usersErr } = await supabase
      .from('user_profiles')
      .upsert(userPayloads, { onConflict: 'email' });

    // 4. Upsert semua link ke public.links
    let linksErr: any = null;
    if (linksToSync.length > 0) {
      const linkPayloads = linksToSync.map(mapLinkToDbRow);
      const res = await supabase.from('links').upsert(linkPayloads, { onConflict: 'id' });
      linksErr = res.error;
    }

    if (usersErr || linksErr) {
      const errMsg = usersErr?.message || linksErr?.message || 'RLS Policy Error';
      const isRls =
        usersErr?.code === '42501' ||
        linksErr?.code === '42501' ||
        errMsg.toLowerCase().includes('row-level security');

      if (isRls) {
        lastRlsWarning = errMsg;
        return {
          success: false,
          rlsBlocked: true,
          message:
            cloudLinksOk || cloudUsersOk
              ? `Data (${linksToSync.length} link & ${usersToSync.length} user) telah disimpan ke Supabase Cloud Storage, namun tabel PostgreSQL membutuhkan izin RLS. Klik "Lihat Skema SQL Supabase" lalu jalankan di SQL Editor Supabase Anda.`
              : `Supabase RLS memblokir penulisan ke tabel (${errMsg}). Jalankan skrip SQL Kebijakan RLS di SQL Editor Supabase.`,
        };
      }

      return {
        success: false,
        message: `Gagal menulis ke tabel Supabase: ${errMsg}`,
      };
    }

    lastRlsWarning = null;
    return {
      success: true,
      message: `Berhasil menyinkronkan ${linksToSync.length} link dan ${usersToSync.length} user ke tabel Supabase!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi Supabase: ${err.message || 'Error'}`,
    };
  }
}

export async function insertUserToDb(
  user: Omit<UserItem, 'id' | 'joinedDate'>
): Promise<UserItem> {
  const newId = generateUuid();
  const nowDate = new Date().toISOString().slice(0, 10);

  let createdUser: UserItem = {
    ...user,
    id: newId,
    email: user.email.trim().toLowerCase(),
    name: user.name.trim(),
    joinedDate: nowDate,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const payload = mapUserToDbRow(createdUser);
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert([payload], { onConflict: 'email' })
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          lastRlsWarning = error.message;
        }
        console.warn('Supabase insertUser table notice (saved to Supabase Cloud Storage):', error.message);
      } else if (data) {
        lastRlsWarning = null;
        createdUser = mapDbRowToUser(data);
      }
    } catch (err) {
      console.warn('Supabase insertUser exception:', err);
    }
  }

  // Selalu simpan ke LocalStorage & Supabase Cloud Storage Mirror
  const currentLocal = getLocalUsers().filter(
    (u) => u.id !== createdUser.id && u.email.toLowerCase() !== createdUser.email.toLowerCase()
  );
  const updatedList = [createdUser, ...currentLocal];
  setLocalUsers(updatedList);
  await saveJsonToCloudStorage(CLOUD_USERS_JSON_PATH, updatedList);

  return createdUser;
}

export async function updateUserRoleInDb(id: string, role: UserRole): Promise<void> {
  await updateUserInDb(id, { role });
}

export async function toggleUserStatusInDb(id: string, newStatus: UserStatus): Promise<void> {
  await updateUserInDb(id, { status: newStatus });
}

export async function updateUserInDb(id: string, updates: Partial<UserItem>): Promise<void> {
  const normalizedId = ensureValidUuid(id);

  const currentLocal = getLocalUsers();
  const updatedList = currentLocal.map((u) =>
    u.id === id || u.id === normalizedId ? { ...u, ...updates, id: normalizedId } : u
  );
  setLocalUsers(updatedList);
  await saveJsonToCloudStorage(CLOUD_USERS_JSON_PATH, updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      const targetUser = updatedList.find((u) => u.id === normalizedId);
      if (targetUser) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert([mapUserToDbRow(targetUser)], { onConflict: 'email' });
        if (error) {
          if (error.code === '42501') lastRlsWarning = error.message;
          console.warn('Supabase updateUser notice:', error.message);
        }
      }
    } catch (err) {
      console.warn('Supabase updateUser failed:', err);
    }
  }
}

export async function deleteUserFromDb(id: string): Promise<void> {
  const normalizedId = ensureValidUuid(id);
  const currentLocal = getLocalUsers();
  const targetUser = currentLocal.find((u) => u.id === id || u.id === normalizedId);
  const updatedList = currentLocal.filter((u) => u.id !== id && u.id !== normalizedId);

  setLocalUsers(updatedList);
  await saveJsonToCloudStorage(CLOUD_USERS_JSON_PATH, updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('user_profiles').delete().eq('id', normalizedId);
      if (error && error.code === '42501') {
        lastRlsWarning = error.message;
      }
      if (targetUser?.email) {
        await supabase.from('user_profiles').delete().eq('email', targetUser.email.toLowerCase());
      }
    } catch (err) {
      console.warn('Supabase deleteUser failed:', err);
    }
  }
}

// Login verification against Supabase Auth & user_profiles table
export async function authenticateWithDb(
  email: string,
  role: UserRole,
  customName?: string
): Promise<UserItem> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data) {
        return mapDbRowToUser(data);
      }
    } catch (err) {
      console.warn('Supabase authenticate query notice:', err);
    }
  }

  // Cek di daftar user lokal / Cloud Storage terlebih dahulu
  const existingLocal = getLocalUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingLocal) {
    return existingLocal;
  }

  const resolvedName =
    customName && customName.trim().length > 0
      ? customName.trim()
      : cleanEmail
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

  // Buat user baru dan simpan ke Supabase + Cloud Storage
  return await insertUserToDb({
    name: resolvedName,
    email: cleanEmail,
    role,
    status: 'active',
    avatarBg:
      role === 'admin'
        ? 'bg-indigo-600'
        : role === 'creator'
        ? 'bg-violet-600'
        : 'bg-emerald-600',
  });
}

// ==========================================
// 3. SUPABASE STORAGE SERVICES (THUMBNAILS)
// ==========================================

export interface UploadThumbnailResult {
  url: string | null;
  error: string | null;
  isSupabase: boolean;
  bucketName?: string;
}

/**
 * Upload an image file to Supabase Storage bucket ('link-thumbnails')
 * If Supabase is not configured or bucket is missing, falls back cleanly to Data URL
 */
export async function uploadThumbnailToStorage(file: File): Promise<UploadThumbnailResult> {
  // 1. Validasi tipe file
  if (!file.type.startsWith('image/')) {
    return {
      url: null,
      error: 'File harus berupa gambar (JPG, PNG, WEBP, GIF, SVG).',
      isSupabase: false,
    };
  }

  // 2. Validasi ukuran file (maksimal 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      url: null,
      error: 'Ukuran gambar maksimal adalah 5MB.',
      isSupabase: false,
    };
  }

  // Sanitize file extension
  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt) ? rawExt : 'png';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 20);
  const fileName = `${Date.now()}_${cleanBaseName}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const filePath = `thumbnails/${fileName}`;

  // 3. Jika Supabase terhubung, unggah ke Storage
  if (isSupabaseConfigured && supabase) {
    try {
      let targetBucket = STORAGE_BUCKET_NAME;
      let uploadRes = await supabase.storage.from(targetBucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

      if (
        uploadRes.error &&
        (uploadRes.error.message?.toLowerCase().includes('not found') ||
          (uploadRes.error as any).statusCode === 404 ||
          (uploadRes.error as any).status === 404)
      ) {
        targetBucket = 'thumbnails';
        uploadRes = await supabase.storage.from(targetBucket).upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
      }

      if (!uploadRes.error && uploadRes.data) {
        const { data: publicUrlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(uploadRes.data.path);

        return {
          url: publicUrlData.publicUrl,
          error: null,
          isSupabase: true,
          bucketName: targetBucket,
        };
      }

      console.warn('Supabase storage upload failed:', uploadRes.error);
      const fallbackDataUrl = await fileToDataUrl(file);
      return {
        url: fallbackDataUrl,
        error: `Supabase Storage: ${uploadRes.error?.message || 'Bucket belum disiapkan'}. Gambar disimpan lokal.`,
        isSupabase: false,
      };
    } catch (err: any) {
      console.warn('Supabase storage upload exception:', err);
      const fallbackDataUrl = await fileToDataUrl(file);
      return {
        url: fallbackDataUrl,
        error: `Koneksi Supabase Storage: ${err?.message || 'Terputus'}. Gambar disimpan lokal.`,
        isSupabase: false,
      };
    }
  }

  // 4. Fallback ke Data URL (Base64) jika belum terhubung ke Supabase
  try {
    const dataUrl = await fileToDataUrl(file);
    return {
      url: dataUrl,
      error: null,
      isSupabase: false,
    };
  } catch {
    return {
      url: null,
      error: 'Gagal memproses file gambar lokal.',
      isSupabase: false,
    };
  }
}

/**
 * Hapus file thumbnail dari Supabase Storage jika URL berasal dari Supabase Storage
 */
export async function deleteThumbnailFromStorage(url: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !url) return;

  try {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const path = match[2];
      await supabase.storage.from(bucket).remove([path]);
    }
  } catch (err) {
    console.warn('Supabase deleteThumbnail failed:', err);
  }
}

/**
 * Konversi File menjadi Data URL Base64
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
