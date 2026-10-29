import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LinkItem, UserItem, UserRole, UserStatus } from '../types';
import { INITIAL_LINKS, INITIAL_USERS } from '../data/initialData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

// ==========================================
// 1. DATABASE LINKS SERVICES
// ==========================================

export async function getLinksFromDb(): Promise<LinkItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          url: d.url,
          category: d.category,
          tag: d.tag || 'General',
          thumbnailUrl: d.thumbnail_url || undefined,
          gradientTheme: d.gradient_theme || 'from-indigo-600 to-violet-600',
          clicks: d.clicks || 0,
          isFavorite: d.is_favorite || false,
          createdAt: d.created_at ? d.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchLinks failed, falling back to local storage:', err);
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem('aira_studio_links');
  return saved ? JSON.parse(saved) : INITIAL_LINKS;
}

export async function insertLinkToDb(link: Omit<LinkItem, 'id' | 'clicks' | 'isFavorite' | 'createdAt'>): Promise<LinkItem> {
  const newLinkData = {
    title: link.title,
    description: link.description,
    url: link.url,
    category: link.category,
    tag: link.tag,
    thumbnail_url: link.thumbnailUrl || null,
    gradient_theme: link.gradientTheme,
    clicks: 0,
    is_favorite: false,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('links')
        .insert([newLinkData])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          url: data.url,
          category: data.category,
          tag: data.tag || 'General',
          thumbnailUrl: data.thumbnail_url || undefined,
          gradientTheme: data.gradient_theme,
          clicks: data.clicks,
          isFavorite: data.is_favorite,
          createdAt: data.created_at.slice(0, 10),
        };
      }
    } catch (err) {
      console.warn('Supabase insertLink failed, using local mock:', err);
    }
  }

  // Fallback
  return {
    ...link,
    id: `link-${Date.now()}`,
    clicks: 0,
    isFavorite: false,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

export async function updateLinkInDb(id: string, updates: Partial<LinkItem>): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.url !== undefined) payload.url = updates.url;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.tag !== undefined) payload.tag = updates.tag;
      if (updates.thumbnailUrl !== undefined) payload.thumbnail_url = updates.thumbnailUrl;
      if (updates.gradientTheme !== undefined) payload.gradient_theme = updates.gradientTheme;
      if (updates.clicks !== undefined) payload.clicks = updates.clicks;
      if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;

      const { error } = await supabase.from('links').update(payload).eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase updateLink failed:', err);
    }
  }
}

export async function deleteLinkFromDb(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('links').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase deleteLink failed:', err);
    }
  }
}

// ==========================================
// 2. DATABASE USERS & LOGIN SERVICES
// ==========================================

export async function getUsersFromDb(): Promise<UserItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('joined_date', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          email: d.email,
          name: d.name,
          role: d.role as UserRole,
          status: d.status as UserStatus,
          avatarBg: d.avatar_bg || 'bg-indigo-600',
          joinedDate: d.joined_date ? d.joined_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchUsers failed:', err);
    }
  }

  // Fallback
  const saved = localStorage.getItem('aira_studio_users');
  return saved ? JSON.parse(saved) : INITIAL_USERS;
}

export async function insertUserToDb(user: Omit<UserItem, 'id' | 'joinedDate'>): Promise<UserItem> {
  const payload = {
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatar_bg: user.avatarBg,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          status: data.status as UserStatus,
          avatarBg: data.avatar_bg,
          joinedDate: data.joined_date.slice(0, 10),
        };
      }
    } catch (err) {
      console.warn('Supabase insertUser failed:', err);
    }
  }

  return {
    ...user,
    id: `usr-${Date.now()}`,
    joinedDate: new Date().toISOString().slice(0, 10),
  };
}

export async function updateUserRoleInDb(id: string, role: UserRole): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('user_profiles').update({ role }).eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase updateUserRole failed:', err);
    }
  }
}

export async function toggleUserStatusInDb(id: string, newStatus: UserStatus): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('user_profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase toggleUserStatus failed:', err);
    }
  }
}

export async function updateUserInDb(id: string, updates: Partial<UserItem>): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.avatarBg !== undefined) payload.avatar_bg = updates.avatarBg;

      const { error } = await supabase.from('user_profiles').update(payload).eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase updateUser failed:', err);
    }
  }
}

export async function deleteUserFromDb(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('user_profiles').delete().eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.warn('Supabase deleteUser failed:', err);
    }
  }
}

// Login verification against Supabase Auth & user_profiles table
export async function authenticateWithDb(email: string, role: UserRole): Promise<UserItem> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Find or insert into user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          status: data.status as UserStatus,
          avatarBg: data.avatar_bg || 'bg-indigo-600',
          joinedDate: data.joined_date ? data.joined_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        };
      } else {
        // Create user in Supabase
        const newUser = await insertUserToDb({
          name: email.split('@')[0],
          email: email.toLowerCase(),
          role: role,
          status: 'active',
          avatarBg: role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600',
        });
        return newUser;
      }
    } catch (err) {
      console.warn('Supabase authenticate failed, using fallback:', err);
    }
  }

  // Fallback
  return {
    id: `usr-${Date.now()}`,
    name: email.split('@')[0],
    email: email.toLowerCase(),
    role: role,
    status: 'active',
    avatarBg: role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600',
    joinedDate: new Date().toISOString().slice(0, 10),
  };
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

export const STORAGE_BUCKET_NAME = 'link-thumbnails';

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
      // Coba upload ke bucket 'link-thumbnails' terlebih dahulu
      let targetBucket = STORAGE_BUCKET_NAME;
      let uploadRes = await supabase.storage.from(targetBucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

      // Jika bucket 'link-thumbnails' belum ada, coba fallback ke bucket 'thumbnails'
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
  } catch (err) {
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
    // Cek apakah URL berasal dari Supabase Storage
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

