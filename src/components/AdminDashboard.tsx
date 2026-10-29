import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Layers,
  Users,
  MousePointerClick,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  X,
  Database,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  CopyPlus,
  Sliders,
  Settings,
  ArrowUpDown,
  AlertTriangle,
  Image as ImageIcon,
  Eye,
  Save,
  Link2,
} from 'lucide-react';
import { LinkItem, UserItem, UserRole, UserStatus, ToolCategory, AdminSubTab } from '../types';
import {
  isSupabaseConfigured,
  supabaseProjectRef,
  STORAGE_BUCKET_NAME,
  seedDefaultDataToSupabase,
  checkSupabaseDiagnostics,
  SupabaseDiagnostics,
} from '../lib/supabase';
import { INITIAL_USERS } from '../data/initialData';

interface AdminDashboardProps {
  links: LinkItem[];
  users: UserItem[];
  onOpenNewLink: () => void;
  onCreateLink?: (linkData: Omit<LinkItem, 'id' | 'clicks' | 'isFavorite' | 'createdAt'>) => void;
  onEditLink: (link: LinkItem) => void;
  onUpdateLink?: (id: string, updates: Partial<LinkItem>) => void;
  onDeleteLink: (id: string) => void;
  onDuplicateLink?: (link: LinkItem) => void;
  onResetClicks?: (id: string) => void;
  onRestoreDefaultLinks?: () => void;
  onRestoreDefaultData?: () => void;
  onImportLinks?: (links: LinkItem[]) => void;
  onAddUser: (user: Omit<UserItem, 'id' | 'joinedDate'>) => void;
  onUpdateUser?: (id: string, updates: Partial<UserItem>) => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onToggleUserStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onLaunchLink?: (id: string, url: string) => void;
  onRefreshFromDb?: () => Promise<void> | void;
}

const AVATAR_BG_OPTIONS = [
  { label: 'Indigo', value: 'bg-indigo-600' },
  { label: 'Violet', value: 'bg-purple-600' },
  { label: 'Emerald', value: 'bg-emerald-600' },
  { label: 'Rose', value: 'bg-rose-600' },
  { label: 'Amber', value: 'bg-amber-600' },
  { label: 'Cyan', value: 'bg-cyan-600' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  links = [],
  users = [],
  onOpenNewLink,
  onCreateLink,
  onEditLink,
  onUpdateLink,
  onDeleteLink,
  onDuplicateLink,
  onResetClicks,
  onRestoreDefaultLinks,
  onRestoreDefaultData,
  onImportLinks,
  onAddUser,
  onUpdateUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onDeleteUser,
  onLaunchLink,
  onRefreshFromDb,
}) => {
  // Tabs: all (Tabel Link & User) | links (Management Link) | users (Management User) | settings (Database & Pengaturan)
  const [activeTab, setActiveTab] = useState<AdminSubTab>('all');

  // Defensive arrays
  const safeLinks = Array.isArray(links) ? links : [];
  const safeUsers = Array.isArray(users) && users.length > 0 ? users : INITIAL_USERS;

  // ============================================
  // STATE: MANAGEMENT LINK (TABEL CRUD)
  // ============================================
  const [linkSearch, setLinkSearch] = useState('');
  const [linkCategoryFilter, setLinkCategoryFilter] = useState<'all' | ToolCategory>('all');
  const [linkSortBy, setLinkSortBy] = useState<'newest' | 'clicks' | 'title' | 'tag'>('newest');

  // Quick Add Row in Link Table
  const [showQuickAddLink, setShowQuickAddLink] = useState(false);
  const [quickLinkTitle, setQuickLinkTitle] = useState('');
  const [quickLinkUrl, setQuickLinkUrl] = useState('');
  const [quickLinkCategory, setQuickLinkCategory] = useState<ToolCategory>('affiliate');
  const [quickLinkTag, setQuickLinkTag] = useState('AI Tool');
  const [quickLinkDesc, setQuickLinkDesc] = useState('');

  // Inline Edit Row in Link Table
  const [inlineEditLinkId, setInlineEditLinkId] = useState<string | null>(null);
  const [inlineLinkTitle, setInlineLinkTitle] = useState('');
  const [inlineLinkUrl, setInlineLinkUrl] = useState('');
  const [inlineLinkCategory, setInlineLinkCategory] = useState<ToolCategory>('affiliate');
  const [inlineLinkTag, setInlineLinkTag] = useState('');
  const [inlineLinkDesc, setInlineLinkDesc] = useState('');

  // Link Detail Modal (Read), Expanded Description State & Delete Confirmation Modal (Delete)
  const [detailLinkItem, setDetailLinkItem] = useState<LinkItem | null>(null);
  const [deleteLinkCandidate, setDeleteLinkCandidate] = useState<LinkItem | null>(null);
  const [expandedLinkDescIds, setExpandedLinkDescIds] = useState<Record<string, boolean>>({});

  // ============================================
  // STATE: MANAGEMENT USER (TABEL CRUD)
  // ============================================
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');

  // Quick Add Row in User Table
  const [showQuickAddUser, setShowQuickAddUser] = useState(false);
  const [quickUserName, setQuickUserName] = useState('');
  const [quickUserEmail, setQuickUserEmail] = useState('');
  const [quickUserRole, setQuickUserRole] = useState<UserRole>('member');
  const [quickUserStatus, setQuickUserStatus] = useState<UserStatus>('active');

  // Inline Edit Row in User Table
  const [inlineEditUserId, setInlineEditUserId] = useState<string | null>(null);
  const [inlineUserName, setInlineUserName] = useState('');
  const [inlineUserEmail, setInlineUserEmail] = useState('');
  const [inlineUserRole, setInlineUserRole] = useState<UserRole>('member');
  const [inlineUserStatus, setInlineUserStatus] = useState<UserStatus>('active');

  // User Add/Edit Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('member');
  const [userStatus, setUserStatus] = useState<UserStatus>('active');
  const [userAvatarBg, setUserAvatarBg] = useState(AVATAR_BG_OPTIONS[0].value);

  // User Detail Modal (Read) & Delete Confirmation Modal (Delete)
  const [detailUserItem, setDetailUserItem] = useState<UserItem | null>(null);
  const [deleteUserCandidate, setDeleteUserCandidate] = useState<UserItem | null>(null);

  // Modals & Notifications
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dbDiagnostics, setDbDiagnostics] = useState<SupabaseDiagnostics | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshDiagnostics = async () => {
    const diag = await checkSupabaseDiagnostics();
    setDbDiagnostics(diag);
    return diag;
  };

  useEffect(() => {
    refreshDiagnostics();
  }, [ safeLinks.length, safeUsers.length ]);

  const handleSeedSupabase = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDefaultDataToSupabase(safeLinks, safeUsers);
      if (onRefreshFromDb) {
        await onRefreshFromDb();
      }
      await refreshDiagnostics();
      showToast(res.message);
    } catch (err: any) {
      showToast(`Sinkronisasi: ${err?.message || 'Gagal'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // KPI Summary
  const totalClicks = safeLinks.reduce((sum, l) => sum + (l?.clicks || 0), 0);
  const totalLinks = safeLinks.length;
  const totalUsers = safeUsers.length;
  const activeUsersCount = safeUsers.filter((u) => u.status === 'active').length;

  // Filtered & Sorted Links
  const filteredLinks = safeLinks
    .filter((link) => {
      if (!link) return false;
      const q = (linkSearch || '').trim().toLowerCase();
      const matchesSearch =
        !q ||
        (link.title || '').toLowerCase().includes(q) ||
        (link.description || '').toLowerCase().includes(q) ||
        (link.tag || '').toLowerCase().includes(q) ||
        (link.url || '').toLowerCase().includes(q);
      const matchesCat = linkCategoryFilter === 'all' || link.category === linkCategoryFilter;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (linkSortBy === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
      if (linkSortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (linkSortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (linkSortBy === 'tag') return (a.tag || '').localeCompare(b.tag || '');
      return 0;
    });

  // Filtered Users
  const filteredUsers = safeUsers.filter((u) => {
    if (!u) return false;
    const q = (userSearch || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ============================================
  // HANDLERS: LINK CRUD (TABEL & MODAL)
  // ============================================
  const handleQuickAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLinkTitle.trim() || !quickLinkUrl.trim()) return;
    let formattedUrl = quickLinkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    if (onCreateLink) {
      onCreateLink({
        title: quickLinkTitle.trim(),
        description: quickLinkDesc.trim() || `Peluncur cepat untuk ${quickLinkTitle.trim()}`,
        url: formattedUrl,
        category: quickLinkCategory,
        tag: quickLinkTag.trim() || 'General',
        gradientTheme:
          quickLinkCategory === 'affiliate'
            ? 'from-amber-500 to-orange-600'
            : quickLinkCategory === 'animation'
            ? 'from-indigo-600 to-violet-600'
            : 'from-emerald-500 to-teal-600',
      });
      showToast(`Link "${quickLinkTitle.trim()}" berhasil ditambahkan ke tabel`);
      setQuickLinkTitle('');
      setQuickLinkUrl('');
      setQuickLinkDesc('');
      setQuickLinkTag('AI Tool');
      setShowQuickAddLink(false);
    } else {
      onOpenNewLink();
    }
  };

  const handleStartInlineEditLink = (link: LinkItem) => {
    setInlineEditLinkId(link.id);
    setInlineLinkTitle(link.title);
    setInlineLinkUrl(link.url);
    setInlineLinkCategory(link.category);
    setInlineLinkTag(link.tag || 'General');
    setInlineLinkDesc(link.description || '');
  };

  const handleSaveInlineEditLink = (id: string) => {
    if (!inlineLinkTitle.trim() || !inlineLinkUrl.trim()) return;
    let formattedUrl = inlineLinkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    if (onUpdateLink) {
      onUpdateLink(id, {
        title: inlineLinkTitle.trim(),
        url: formattedUrl,
        category: inlineLinkCategory,
        tag: inlineLinkTag.trim() || 'General',
        description: inlineLinkDesc.trim(),
      });
      showToast(`Data link "${inlineLinkTitle.trim()}" berhasil diperbarui`);
    }
    setInlineEditLinkId(null);
  };

  // ============================================
  // HANDLERS: USER CRUD (TABEL & MODAL)
  // ============================================
  const handleQuickAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUserName.trim() || !quickUserEmail.trim()) return;
    onAddUser({
      name: quickUserName.trim(),
      email: quickUserEmail.trim(),
      role: quickUserRole,
      status: quickUserStatus,
      avatarBg: AVATAR_BG_OPTIONS[Math.floor(Math.random() * AVATAR_BG_OPTIONS.length)].value,
    });
    showToast(`User "${quickUserName.trim()}" berhasil ditambahkan ke tabel`);
    setQuickUserName('');
    setQuickUserEmail('');
    setQuickUserRole('member');
    setQuickUserStatus('active');
    setShowQuickAddUser(false);
  };

  const handleStartInlineEditUser = (user: UserItem) => {
    setInlineEditUserId(user.id);
    setInlineUserName(user.name);
    setInlineUserEmail(user.email);
    setInlineUserRole(user.role);
    setInlineUserStatus(user.status);
  };

  const handleSaveInlineEditUser = (id: string) => {
    if (!inlineUserName.trim() || !inlineUserEmail.trim()) return;
    if (onUpdateUser) {
      onUpdateUser(id, {
        name: inlineUserName.trim(),
        email: inlineUserEmail.trim(),
        role: inlineUserRole,
        status: inlineUserStatus,
      });
    } else {
      onUpdateUserRole(id, inlineUserRole);
    }
    showToast(`Data user "${inlineUserName.trim()}" berhasil diperbarui`);
    setInlineEditUserId(null);
  };

  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('member');
    setUserStatus('active');
    setUserAvatarBg(AVATAR_BG_OPTIONS[Math.floor(Math.random() * AVATAR_BG_OPTIONS.length)].value);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: UserItem) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserStatus(user.status);
    setUserAvatarBg(user.avatarBg || AVATAR_BG_OPTIONS[0].value);
    setIsUserModalOpen(true);
  };

  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    if (editingUser) {
      if (onUpdateUser) {
        onUpdateUser(editingUser.id, {
          name: userName.trim(),
          email: userEmail.trim(),
          role: userRole,
          status: userStatus,
          avatarBg: userAvatarBg,
        });
      } else {
        onUpdateUserRole(editingUser.id, userRole);
      }
      showToast(`Pengguna "${userName}" berhasil diperbarui`);
    } else {
      onAddUser({
        name: userName.trim(),
        email: userEmail.trim(),
        role: userRole,
        status: userStatus,
        avatarBg: userAvatarBg,
      });
      showToast(`Pengguna baru "${userName}" berhasil ditambahkan`);
    }

    setIsUserModalOpen(false);
  };

  // Export & Import Handlers
  const handleExportCSV = () => {
    const headers = ['ID', 'Judul', 'URL', 'Kategori', 'Tag', 'Klik', 'Tanggal_Rilis', 'Badge'];
    const rows = safeLinks.map((l) => [
      `"${l?.id || ''}"`,
      `"${(l?.title || '').replace(/"/g, '""')}"`,
      `"${l?.url || ''}"`,
      `"${l?.category || ''}"`,
      `"${l?.tag || ''}"`,
      l?.clicks || 0,
      `"${l?.createdAt || ''}"`,
      `"${l?.badge || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aira_studio_links_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Link berhasil diunduh');
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(safeLinks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `aira_studio_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('File JSON Backup berhasil diunduh');
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && onImportLinks) {
          onImportLinks(parsed);
          showToast(`Berhasil mengimpor ${parsed.length} link launcher!`);
        } else {
          showToast('Format JSON tidak valid atau kosong.');
        }
      } catch (err) {
        showToast('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const rlsFixSnippet = `-- Jalankan di SQL Editor Supabase untuk membuka izin CRUD Tabel Links & User:
GRANT ALL ON TABLE public.links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated, service_role;

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Links" ON public.links;
DROP POLICY IF EXISTS "Allow All Insert Links" ON public.links;
DROP POLICY IF EXISTS "Allow All Update Links" ON public.links;
DROP POLICY IF EXISTS "Allow All Delete Links" ON public.links;
DROP POLICY IF EXISTS "Allow All CRUD Links" ON public.links;

CREATE POLICY "Allow All CRUD Links" ON public.links
    FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All Insert Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All Update Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All Delete Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All CRUD Profiles" ON public.user_profiles;

CREATE POLICY "Allow All CRUD Profiles" ON public.user_profiles
    FOR ALL TO public USING (true) WITH CHECK (true);`;

  const schemaSnippet = `-- ==========================================
-- 1. TABEL DATABASE SUPABASE (LINKS & USER)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('affiliate', 'animation', 'story')),
    tag TEXT DEFAULT 'General',
    thumbnail_url TEXT,
    gradient_theme TEXT DEFAULT 'from-indigo-600 to-violet-600',
    clicks INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'creator', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    avatar_bg TEXT DEFAULT 'bg-indigo-600',
    joined_date TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. IZIN TABEL & KEBIJAKAN RLS (WAJIB CRUD)
-- ==========================================

${rlsFixSnippet}

-- ==========================================
-- 3. SUPABASE STORAGE (UPLOAD THUMBNAIL)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('link-thumbnails', 'link-thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to link-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates and Deletions" ON storage.objects;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'link-thumbnails');

CREATE POLICY "Allow Uploads to link-thumbnails"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'link-thumbnails');

CREATE POLICY "Allow Updates and Deletions"
ON storage.objects FOR ALL TO public
USING (bucket_id = 'link-thumbnails')
WITH CHECK (bucket_id = 'link-thumbnails');`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSnippet);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(rlsFixSnippet);
    setCopiedRlsFix(true);
    showToast('SQL Perbaikan Izin Tabel (RLS) berhasil disalin! Jalankan di SQL Editor Supabase.');
    setTimeout(() => setCopiedRlsFix(false), 2500);
  };

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Dashboard Admin
              </h2>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Semua Tabel</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'links'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Management Link ({safeLinks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Management User ({safeUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>Database &amp; Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Banner Diagnostik Izin Tabel RLS Supabase (Tampil jika RLS memblokir INSERT ke tabel) */}
      {dbDiagnostics?.rlsBlocked && activeTab !== 'settings' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-0.5">
              <p className="font-bold">
                Supabase Terhubung ({supabaseProjectRef}) • Izin Tabel (RLS) Perlu Diaktifkan
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Data Link &amp; User Anda sudah tersimpan otomatis di{' '}
                <strong>Supabase Cloud Storage</strong>. Agar baris data juga masuk ke tabel{' '}
                <code>public.links</code> &amp; <code>public.user_profiles</code> di Table Editor
                Supabase, klik <strong>Salin SQL Izin RLS</strong> lalu jalankan di SQL Editor
                Supabase Anda.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyRlsFix}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {copiedRlsFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRlsFix ? 'SQL Tersalin!' : 'Salin SQL Izin RLS'}</span>
            </button>
            <button
              type="button"
              onClick={handleSeedSupabase}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Menyinkronkan...' : 'Sinkronkan ke Tabel'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Link
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5 block">
              {totalLinks}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total User
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5 block">
              {totalUsers}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Users className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              User Aktif
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-0.5 block">
              {activeUsersCount}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Klik Link
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-0.5 block">
              {totalClicks.toLocaleString()}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <MousePointerClick className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TABEL 1: MANAGEMENT LINK (TABEL CRUD LENGKAP)                     */}
      {/* ================================================================= */}
      {(activeTab === 'all' || activeTab === 'links') && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs shrink-0">
          {/* Table Top Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                <Layers className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Tabel Management Link (CRUD)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 whitespace-nowrap">
                    {safeLinks.length} Data
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Create Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAddLink(!showQuickAddLink)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  showQuickAddLink
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{showQuickAddLink ? 'Tutup Form Cepat' : 'Tambah Cepat di Tabel'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenNewLink}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Tambah Link &amp; Thumbnail</span>
              </button>
            </div>
          </div>

          {/* Inline Quick Create Form (Create inside table) */}
          {showQuickAddLink && (
            <form
              onSubmit={handleQuickAddLinkSubmit}
              className="p-4 bg-indigo-50/60 border-b border-indigo-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Tambah Data Link Baru ke Tabel (Quick Create)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAddLink(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <input
                  type="text"
                  required
                  value={quickLinkTitle}
                  onChange={(e) => setQuickLinkTitle(e.target.value)}
                  placeholder="Nama / Judul Link *"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  required
                  value={quickLinkUrl}
                  onChange={(e) => setQuickLinkUrl(e.target.value)}
                  placeholder="URL Tujuan (https://...) *"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono"
                />
                <select
                  value={quickLinkCategory}
                  onChange={(e) => setQuickLinkCategory(e.target.value as ToolCategory)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  <option value="affiliate">Tools Affiliate</option>
                  <option value="animation">Tools Animasi</option>
                  <option value="story">Tools Cerita</option>
                </select>
                <input
                  type="text"
                  value={quickLinkTag}
                  onChange={(e) => setQuickLinkTag(e.target.value)}
                  placeholder="Tag (misal: Video AI)"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickLinkDesc}
                    onChange={(e) => setQuickLinkDesc(e.target.value)}
                    placeholder="Deskripsi singkat..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shrink-0 cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Filter & Search Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Cari judul link, URL, deskripsi, atau tag..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <select
                value={linkCategoryFilter}
                onChange={(e) => setLinkCategoryFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="affiliate">Tools Affiliate</option>
                <option value="animation">Tools Animasi</option>
                <option value="story">Tools Cerita</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={linkSortBy}
                  onChange={(e) => setLinkSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Terbaru</option>
                  <option value="clicks">Klik Terbanyak</option>
                  <option value="title">Nama (A-Z)</option>
                  <option value="tag">Tag</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-2 text-xs text-slate-500">
              <span>
                Menampilkan <strong>{filteredLinks.length}</strong> dari{' '}
                <strong>{safeLinks.length}</strong> link
              </span>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                title="Unduh Tabel ke CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Data Table for Management Link (Auto-Adjusting to All Screen Sizes Without Clipping) */}
          <div className="w-full overflow-x-auto rounded-b-2xl">
            <table className="w-full table-auto text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-2 sm:px-3 font-bold text-center w-9 sm:w-12 border-r border-slate-200/70">
                    No
                  </th>
                  <th className="hidden sm:table-cell py-3 px-2.5 font-bold w-14 text-center border-r border-slate-200/70">
                    Thumb
                  </th>
                  <th className="py-3 px-3 sm:px-4 font-bold border-r border-slate-200/70">
                    Judul &amp; Detail Link
                  </th>
                  <th className="hidden md:table-cell py-3 px-3 sm:px-4 font-bold border-r border-slate-200/70">
                    URL Tujuan
                  </th>
                  <th className="hidden sm:table-cell py-3 px-3 font-bold border-r border-slate-200/70">
                    Kategori
                  </th>
                  <th className="hidden xl:table-cell py-3 px-3 font-bold border-r border-slate-200/70">
                    Tag
                  </th>
                  <th className="hidden lg:table-cell py-3 px-3 font-bold text-center border-r border-slate-200/70">
                    Klik
                  </th>
                  <th className="py-3 px-2.5 sm:px-3 font-bold text-center w-24 sm:w-auto">
                    Aksi CRUD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 px-4 text-center text-slate-500">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-sm">
                        {safeLinks.length === 0
                          ? 'Tabel Management Link Masih Kosong'
                          : 'Tidak ada data link yang cocok dengan pencarian'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        {safeLinks.length === 0
                          ? 'Klik "+ Tambah Link & Thumbnail" atau "Tambah Cepat di Tabel" untuk membuat link pertama Anda.'
                          : 'Silakan ubah kata kunci pencarian atau filter kategori.'}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={onOpenNewLink}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          + Tambah Link Baru
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((link, idx) => {
                    const isEditingRow = inlineEditLinkId === link.id;

                    return (
                      <tr
                        key={link.id}
                        className={`${
                          isEditingRow ? 'bg-indigo-50/50' : 'hover:bg-slate-50/90'
                        } transition-colors align-top sm:align-middle`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-2 sm:px-3 text-center font-mono text-slate-400 font-semibold border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* Thumbnail (Desktop/Tablet >= sm) */}
                        <td className="hidden sm:table-cell py-3.5 px-2.5 text-center border-r border-slate-100">
                          <button
                            type="button"
                            onClick={() => onEditLink(link)}
                            title="Klik untuk ubah gambar thumbnail"
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                              link.gradientTheme || 'from-indigo-600 to-violet-600'
                            } flex items-center justify-center text-white mx-auto shadow-xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all`}
                          >
                            {link.thumbnailUrl ? (
                              <img
                                src={link.thumbnailUrl}
                                alt={link.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Layers className="w-4 h-4 opacity-85" />
                            )}
                          </button>
                        </td>

                        {/* Title & Description (+ Responsive fields on smaller screens so nothing clips) */}
                        <td className="py-3.5 px-3 sm:px-4 border-r border-slate-100">
                          {isEditingRow ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={inlineLinkTitle}
                                onChange={(e) => setInlineLinkTitle(e.target.value)}
                                className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                placeholder="Judul Link"
                              />
                              <input
                                type="text"
                                value={inlineLinkDesc}
                                onChange={(e) => setInlineLinkDesc(e.target.value)}
                                className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 focus:outline-none focus:border-indigo-600"
                                placeholder="Deskripsi singkat"
                              />
                              {/* URL input shown inline on < md screens */}
                              <div className="md:hidden">
                                <input
                                  type="text"
                                  value={inlineLinkUrl}
                                  onChange={(e) => setInlineLinkUrl(e.target.value)}
                                  className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                                  placeholder="https://..."
                                />
                              </div>
                              {/* Category select shown inline on < sm screens */}
                              <div className="sm:hidden">
                                <select
                                  value={inlineLinkCategory}
                                  onChange={(e) =>
                                    setInlineLinkCategory(e.target.value as ToolCategory)
                                  }
                                  className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                                >
                                  <option value="affiliate">Tools Affiliate</option>
                                  <option value="animation">Tools Animasi</option>
                                  <option value="story">Tools Cerita</option>
                                </select>
                              </div>
                              {/* Tag input shown inline on < xl screens */}
                              <div className="xl:hidden">
                                <input
                                  type="text"
                                  value={inlineLinkTag}
                                  onChange={(e) => setInlineLinkTag(e.target.value)}
                                  className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600"
                                  placeholder="Tag"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2.5">
                              {/* Mobile Thumbnail (< sm) */}
                              <button
                                type="button"
                                onClick={() => onEditLink(link)}
                                title="Klik untuk ubah gambar thumbnail"
                                className={`sm:hidden w-9 h-9 rounded-xl bg-gradient-to-tr ${
                                  link.gradientTheme || 'from-indigo-600 to-violet-600'
                                } flex items-center justify-center text-white shrink-0 shadow-xs overflow-hidden cursor-pointer mt-0.5`}
                              >
                                {link.thumbnailUrl ? (
                                  <img
                                    src={link.thumbnailUrl}
                                    alt={link.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Layers className="w-4 h-4 opacity-85" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className="font-bold text-slate-900 text-xs truncate max-w-[170px] sm:max-w-[230px] lg:max-w-[280px]"
                                    title={link.title}
                                  >
                                    {link.title}
                                  </span>
                                  {link.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                      {link.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  {link.description ? (
                                    <div className="space-y-0.5">
                                      <p
                                        className={`text-[11px] text-slate-600 leading-relaxed break-words ${
                                          expandedLinkDescIds[link.id]
                                            ? 'whitespace-pre-line'
                                            : 'truncate max-w-[170px] sm:max-w-[230px] lg:max-w-[290px]'
                                        }`}
                                      >
                                        {expandedLinkDescIds[link.id]
                                          ? link.description
                                          : link.description.length > 50
                                          ? `${link.description.slice(0, 50).trim()}...`
                                          : link.description}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedLinkDescIds((prev) => ({
                                            ...prev,
                                            [link.id]: !prev[link.id],
                                          }))
                                        }
                                        className="inline-flex items-center text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                                      >
                                        {expandedLinkDescIds[link.id]
                                          ? 'Sembunyikan'
                                          : 'Selengkapnya'}
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-slate-400">-</p>
                                  )}
                                </div>

                                {/* URL shown on < md screens */}
                                <div className="md:hidden pt-0.5">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => onLaunchLink?.(link.id, link.url)}
                                    title={link.url}
                                    className="font-mono text-[10px] text-indigo-600 hover:underline truncate max-w-[180px] sm:max-w-[240px] block"
                                  >
                                    {link.url}
                                  </a>
                                </div>

                                {/* Category selector & metadata shown on smaller screens so columns never clip */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1 xl:hidden">
                                  {/* Category select on < sm */}
                                  <div className="sm:hidden">
                                    <select
                                      value={link.category}
                                      onChange={(e) => {
                                        const newCat = e.target.value as ToolCategory;
                                        if (onUpdateLink) {
                                          onUpdateLink(link.id, { category: newCat });
                                          showToast(`Kategori "${link.title}" diubah ke ${newCat}`);
                                        }
                                      }}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer focus:outline-none ${
                                        link.category === 'affiliate'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : link.category === 'animation'
                                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      <option value="affiliate">Tools Affiliate</option>
                                      <option value="animation">Tools Animasi</option>
                                      <option value="story">Tools Cerita</option>
                                    </select>
                                  </div>

                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                    #{link.tag || 'General'}
                                  </span>

                                  <span className="lg:hidden font-mono text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                    {(link.clicks || 0).toLocaleString()} klik
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* URL (md and up) */}
                        <td className="hidden md:table-cell py-3.5 px-3 sm:px-4 border-r border-slate-100">
                          {isEditingRow ? (
                            <input
                              type="text"
                              value={inlineLinkUrl}
                              onChange={(e) => setInlineLinkUrl(e.target.value)}
                              className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                              placeholder="https://..."
                            />
                          ) : (
                            <div className="flex items-center justify-between gap-1.5">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => onLaunchLink?.(link.id, link.url)}
                                className="font-mono text-[11px] text-indigo-600 hover:underline truncate max-w-[150px] lg:max-w-[210px] block"
                                title={link.url}
                              >
                                {link.url}
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(link.url);
                                  showToast('URL berhasil disalin');
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                                title="Salin URL"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Category (sm and up) */}
                        <td className="hidden sm:table-cell py-3.5 px-3 border-r border-slate-100">
                          {isEditingRow ? (
                            <select
                              value={inlineLinkCategory}
                              onChange={(e) =>
                                setInlineLinkCategory(e.target.value as ToolCategory)
                              }
                              className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                            >
                              <option value="affiliate">Tools Affiliate</option>
                              <option value="animation">Tools Animasi</option>
                              <option value="story">Tools Cerita</option>
                            </select>
                          ) : (
                            <select
                              value={link.category}
                              onChange={(e) => {
                                const newCat = e.target.value as ToolCategory;
                                if (onUpdateLink) {
                                  onUpdateLink(link.id, { category: newCat });
                                  showToast(`Kategori "${link.title}" diubah ke ${newCat}`);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none ${
                                link.category === 'affiliate'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : link.category === 'animation'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              <option value="affiliate">Tools Affiliate</option>
                              <option value="animation">Tools Animasi</option>
                              <option value="story">Tools Cerita</option>
                            </select>
                          )}
                        </td>

                        {/* Tag (xl and up) */}
                        <td className="hidden xl:table-cell py-3.5 px-3 border-r border-slate-100">
                          {isEditingRow ? (
                            <input
                              type="text"
                              value={inlineLinkTag}
                              onChange={(e) => setInlineLinkTag(e.target.value)}
                              className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                            />
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] whitespace-nowrap">
                              #{link.tag || 'General'}
                            </span>
                          )}
                        </td>

                        {/* Clicks (lg and up) */}
                        <td className="hidden lg:table-cell py-3.5 px-3 text-center border-r border-slate-100">
                          <div className="inline-flex items-center justify-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <span className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                              {(link.clicks || 0).toLocaleString()}
                            </span>
                            {onResetClicks && (link.clicks || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  onResetClicks(link.id);
                                  showToast(`Klik "${link.title}" di-reset ke 0`);
                                }}
                                className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer shrink-0"
                                title="Reset Klik ke 0"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* CRUD Actions Column */}
                        <td className="py-3.5 px-2 sm:px-3 text-center">
                          {isEditingRow ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveInlineEditLink(link.id)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer shadow-xs"
                              >
                                <Save className="w-3.5 h-3.5 shrink-0" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineEditLinkId(null)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 shrink-0" />
                                <span>Batal</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {/* READ / DETAIL */}
                              <button
                                type="button"
                                onClick={() => setDetailLinkItem(link)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Lihat Detail Link (Read)"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span className="hidden xl:inline">Detail</span>
                              </button>

                              {/* UPDATE INLINE */}
                              <button
                                type="button"
                                onClick={() => handleStartInlineEditLink(link)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Edit Baris di Tabel (Inline Update)"
                              >
                                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden lg:inline">Edit</span>
                              </button>

                              {/* UPDATE MODAL (WITH THUMBNAIL) */}
                              <button
                                type="button"
                                onClick={() => onEditLink(link)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Edit Lengkap & Upload Thumbnail"
                              >
                                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden xl:inline">Modal</span>
                              </button>

                              {/* DUPLICATE */}
                              {onDuplicateLink && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDuplicateLink(link);
                                    showToast(`Link "${link.title}" berhasil diduplikat`);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                  title="Duplikat Link"
                                >
                                  <CopyPlus className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* DELETE */}
                              <button
                                type="button"
                                onClick={() => setDeleteLinkCandidate(link)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Hapus Link (Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden lg:inline">Hapus</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TABEL 2: MANAGEMENT USER (TABEL CRUD LENGKAP)                     */}
      {/* ================================================================= */}
      {(activeTab === 'all' || activeTab === 'users') && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs shrink-0">
          {/* Table Top Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                <Users className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Tabel Management User (CRUD)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                    {safeUsers.length} User
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Create Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAddUser(!showQuickAddUser)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  showQuickAddUser
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{showQuickAddUser ? 'Tutup Form Cepat' : 'Tambah Cepat di Tabel'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddUserModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Tambah User Baru</span>
              </button>
            </div>
          </div>

          {/* Inline Quick Create User Form */}
          {showQuickAddUser && (
            <form
              onSubmit={handleQuickAddUserSubmit}
              className="p-4 bg-emerald-50/60 border-b border-emerald-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tambah Pengguna Baru ke Tabel (Quick Create)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAddUser(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <input
                  type="text"
                  required
                  value={quickUserName}
                  onChange={(e) => setQuickUserName(e.target.value)}
                  placeholder="Nama Lengkap *"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="email"
                  required
                  value={quickUserEmail}
                  onChange={(e) => setQuickUserEmail(e.target.value)}
                  placeholder="Alamat Email *"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
                />
                <select
                  value={quickUserRole}
                  onChange={(e) => setQuickUserRole(e.target.value as UserRole)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="admin">Administrator</option>
                  <option value="creator">Kreator</option>
                  <option value="member">Member</option>
                </select>
                <select
                  value={quickUserStatus}
                  onChange={(e) => setQuickUserStatus(e.target.value as UserStatus)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="active">Status: Aktif</option>
                  <option value="suspended">Status: Ditangguhkan</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Simpan ke Tabel
                </button>
              </div>
            </form>
          )}

          {/* Filter & Search Toolbar for Users */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama pengguna atau alamat email..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Role</option>
                <option value="admin">Administrator</option>
                <option value="creator">Kreator</option>
                <option value="member">Member</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Menampilkan <strong>{filteredUsers.length}</strong> dari{' '}
              <strong>{safeUsers.length}</strong> user
            </div>
          </div>

          {/* Data Table for Management User (Auto-Adjusting to All Screen Sizes Without Clipping) */}
          <div className="w-full overflow-x-auto rounded-b-2xl">
            <table className="w-full table-auto text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-2 sm:px-3 font-bold text-center w-9 sm:w-12 border-r border-slate-200/70">
                    No
                  </th>
                  <th className="py-3 px-3 sm:px-4 font-bold border-r border-slate-200/70">
                    Pengguna &amp; Detail Akun
                  </th>
                  <th className="hidden md:table-cell py-3 px-3 sm:px-4 font-bold border-r border-slate-200/70">
                    Alamat Email
                  </th>
                  <th className="hidden sm:table-cell py-3 px-3 font-bold border-r border-slate-200/70">
                    Role / Hak Akses
                  </th>
                  <th className="hidden md:table-cell py-3 px-3 font-bold border-r border-slate-200/70">
                    Status Akun
                  </th>
                  <th className="hidden lg:table-cell py-3 px-3 font-bold border-r border-slate-200/70">
                    Tanggal Daftar
                  </th>
                  <th className="py-3 px-2.5 sm:px-3 font-bold text-center w-24 sm:w-auto">
                    Aksi CRUD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-sm">
                        Tidak ada data pengguna yang ditemukan
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleOpenAddUserModal}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          + Tambah User Baru
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const isEditingRow = inlineEditUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`${
                          isEditingRow ? 'bg-emerald-50/50' : 'hover:bg-slate-50/90'
                        } transition-colors align-top sm:align-middle`}
                      >
                        {/* No */}
                        <td className="py-3.5 px-2 sm:px-3 text-center font-mono text-slate-400 font-semibold border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* User Profile & Name (+ Responsive Email/Role/Status/Date on smaller screens so nothing clips) */}
                        <td className="py-3.5 px-3 sm:px-4 border-r border-slate-100">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full ${
                                user.avatarBg || 'bg-indigo-600'
                              } text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5 sm:mt-0`}
                            >
                              {(user.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              {isEditingRow ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={inlineUserName}
                                    onChange={(e) => setInlineUserName(e.target.value)}
                                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                                    placeholder="Nama Lengkap"
                                  />
                                  {/* Email input shown inline on < md screens */}
                                  <div className="md:hidden">
                                    <input
                                      type="email"
                                      value={inlineUserEmail}
                                      onChange={(e) => setInlineUserEmail(e.target.value)}
                                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                                      placeholder="email@domain.com"
                                    />
                                  </div>
                                  {/* Role select shown inline on < sm screens */}
                                  <div className="sm:hidden">
                                    <select
                                      value={inlineUserRole}
                                      onChange={(e) =>
                                        setInlineUserRole(e.target.value as UserRole)
                                      }
                                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                                    >
                                      <option value="admin">Administrator</option>
                                      <option value="creator">Kreator</option>
                                      <option value="member">Member</option>
                                    </select>
                                  </div>
                                  {/* Status select shown inline on < md screens */}
                                  <div className="md:hidden">
                                    <select
                                      value={inlineUserStatus}
                                      onChange={(e) =>
                                        setInlineUserStatus(e.target.value as UserStatus)
                                      }
                                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                                    >
                                      <option value="active">Aktif</option>
                                      <option value="suspended">Ditangguhkan</option>
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-900 block break-words">
                                    {user.name}
                                  </span>

                                  {/* Email shown below name on < md screens without truncation */}
                                  <span className="md:hidden font-mono text-[11px] text-slate-500 block break-all">
                                    {user.email}
                                  </span>

                                  {/* Role, Status & Joined date shown cleanly on smaller screens so columns never clip */}
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1 lg:hidden">
                                    {/* Role selector on < sm */}
                                    <div className="sm:hidden">
                                      <select
                                        value={user.role}
                                        onChange={(e) => {
                                          const newRole = e.target.value as UserRole;
                                          onUpdateUserRole(user.id, newRole);
                                          showToast(`Role "${user.name}" diubah menjadi ${newRole}`);
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer focus:outline-none ${
                                          user.role === 'admin'
                                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                            : user.role === 'creator'
                                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        <option value="admin">Administrator</option>
                                        <option value="creator">Kreator</option>
                                        <option value="member">Member</option>
                                      </select>
                                    </div>

                                    {/* Status toggle button on < md */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onToggleUserStatus(user.id);
                                        showToast(
                                          `Status "${user.name}" diubah ke ${
                                            user.status === 'active' ? 'Ditangguhkan' : 'Aktif'
                                          }`
                                        );
                                      }}
                                      className={`md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                                        user.status === 'active'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {user.status === 'active' ? (
                                        <>
                                          <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span>Aktif</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="w-3 h-3 text-rose-600 shrink-0" />
                                          <span>Ditangguhkan</span>
                                        </>
                                      )}
                                    </button>

                                    <span className="font-mono text-[10px] text-slate-400">
                                      {user.joinedDate || '-'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email (md and up) */}
                        <td className="hidden md:table-cell py-3.5 px-3 sm:px-4 border-r border-slate-100">
                          {isEditingRow ? (
                            <input
                              type="email"
                              value={inlineUserEmail}
                              onChange={(e) => setInlineUserEmail(e.target.value)}
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                              placeholder="email@domain.com"
                            />
                          ) : (
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className="font-mono text-[11px] text-slate-600 break-all"
                                title={user.email}
                              >
                                {user.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(user.email);
                                  showToast('Email disalin');
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                                title="Salin Email"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Role (sm and up) */}
                        <td className="hidden sm:table-cell py-3.5 px-3 border-r border-slate-100">
                          {isEditingRow ? (
                            <select
                              value={inlineUserRole}
                              onChange={(e) => setInlineUserRole(e.target.value as UserRole)}
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                            >
                              <option value="admin">Administrator</option>
                              <option value="creator">Kreator</option>
                              <option value="member">Member</option>
                            </select>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => {
                                const newRole = e.target.value as UserRole;
                                onUpdateUserRole(user.id, newRole);
                                showToast(`Role "${user.name}" diubah menjadi ${newRole}`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none ${
                                user.role === 'admin'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : user.role === 'creator'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="admin">Administrator</option>
                              <option value="creator">Kreator</option>
                              <option value="member">Member</option>
                            </select>
                          )}
                        </td>

                        {/* Status (md and up) */}
                        <td className="hidden md:table-cell py-3.5 px-3 border-r border-slate-100">
                          {isEditingRow ? (
                            <select
                              value={inlineUserStatus}
                              onChange={(e) => setInlineUserStatus(e.target.value as UserStatus)}
                              className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                            >
                              <option value="active">Aktif</option>
                              <option value="suspended">Ditangguhkan</option>
                            </select>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onToggleUserStatus(user.id);
                                showToast(
                                  `Status "${user.name}" diubah ke ${
                                    user.status === 'active' ? 'Ditangguhkan' : 'Aktif'
                                  }`
                                );
                              }}
                              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                                user.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Klik untuk mengganti status Aktif / Ditangguhkan"
                            >
                              {user.status === 'active' ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Aktif</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Ditangguhkan</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>

                        {/* Joined Date (lg and up) */}
                        <td className="hidden lg:table-cell py-3.5 px-3 font-mono text-slate-500 text-[11px] border-r border-slate-100 whitespace-nowrap">
                          {user.joinedDate || '-'}
                        </td>

                        {/* CRUD Actions */}
                        <td className="py-3.5 px-2 sm:px-3 text-center">
                          {isEditingRow ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveInlineEditUser(user.id)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer shadow-xs"
                              >
                                <Save className="w-3.5 h-3.5 shrink-0" />
                                <span>Simpan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineEditUserId(null)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 shrink-0" />
                                <span>Batal</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {/* READ / DETAIL */}
                              <button
                                type="button"
                                onClick={() => setDetailUserItem(user)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Lihat Detail Pengguna (Read)"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                <span className="hidden xl:inline">Detail</span>
                              </button>

                              {/* INLINE EDIT */}
                              <button
                                type="button"
                                onClick={() => handleStartInlineEditUser(user)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Edit Langsung di Baris Tabel"
                              >
                                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden lg:inline">Edit</span>
                              </button>

                              {/* MODAL EDIT */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditUserModal(user)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Edit via Form Modal"
                              >
                                <span className="text-[11px]">Modal</span>
                              </button>

                              {/* DELETE */}
                              <button
                                type="button"
                                onClick={() => setDeleteUserCandidate(user)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Hapus Pengguna (Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden lg:inline">Hapus</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: DATABASE SUPABASE & PENGATURAN                             */}
      {/* ================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supabase Database Connection Details */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Supabase Database (PostgreSQL) &amp; Storage
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    dbDiagnostics?.tablesWritable
                      ? 'bg-emerald-100 text-emerald-800'
                      : isSupabaseConfigured
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {dbDiagnostics?.tablesWritable
                    ? `Tabel & Storage Aktif (${supabaseProjectRef})`
                    : isSupabaseConfigured
                    ? `Cloud Storage Aktif • Tabel Perlu Izin RLS`
                    : 'Lokal / Siap Hubung'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menyimpan tabel <code>public.links</code> ({safeLinks.length} data), tabel{' '}
                <code>public.user_profiles</code> ({safeUsers.length} user), dan bucket gambar{' '}
                <code>{STORAGE_BUCKET_NAME}</code> di project Supabase{' '}
                {supabaseProjectRef ? <code>{supabaseProjectRef}</code> : ''}.
              </p>

              {dbDiagnostics?.rlsBlocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">
                         Kebijakan RLS (Row-Level Security) Tabel Perlu Diaktifkan di Supabase
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Saat ini seluruh penambahan Link &amp; User sudah tersimpan otomatis di{' '}
                        <strong>Supabase Cloud Storage ({STORAGE_BUCKET_NAME})</strong>. Agar data juga
                        masuk ke tabel <code>public.links</code> dan <code>public.user_profiles</code> di
                        Table Editor Supabase, salin dan jalankan SQL izin RLS berikut di{' '}
                        <strong>SQL Editor Supabase</strong> Anda lalu klik{' '}
                        <strong>Sinkronkan Database</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyRlsFix}
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedRlsFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRlsFix ? 'SQL RLS Tersalin!' : 'Salin SQL Izin Tabel (RLS)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSeedSupabase}
                      disabled={isSeeding}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                      <span>Cek Ulang &amp; Sinkronkan ke Tabel</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Lihat Skema SQL Lengkap (+RLS)</span>
                </button>

                {isSupabaseConfigured && (
                  <button
                    type="button"
                    onClick={handleSeedSupabase}
                    disabled={isSeeding}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                    <span>{isSeeding ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Backup & Restore */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Ekspor, Impor &amp; Pemeliharaan Tabel
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Ekspor JSON</span>
                </button>

                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Impor JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSONFile}
                    className="hidden"
                  />
                </label>

                {onRestoreDefaultData && (
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreDefaultData();
                      showToast('Data user default berhasil dimuat ulang');
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span>Reset Data User</span>
                  </button>
                )}

                {onRestoreDefaultLinks && (
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreDefaultLinks();
                      showToast('Semua data link telah dikosongkan');
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Kosongkan Tabel Link</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL READ: DETAIL LINK                              */}
      {/* ==================================================== */}
      {detailLinkItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Detail Data Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailLinkItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${
                  detailLinkItem.gradientTheme || 'from-indigo-600 to-violet-600'
                } flex items-center justify-center text-white shrink-0 overflow-hidden shadow-sm`}
              >
                {detailLinkItem.thumbnailUrl ? (
                  <img
                    src={detailLinkItem.thumbnailUrl}
                    alt={detailLinkItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Layers className="w-7 h-7" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{detailLinkItem.title}</h4>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  Kategori: {detailLinkItem.category.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  URL Tujuan
                </span>
                <a
                  href={detailLinkItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-indigo-600 hover:underline break-all"
                >
                  {detailLinkItem.url}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Deskripsi
                </span>
                <p className="text-slate-700 mt-0.5">{detailLinkItem.description || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tag</span>
                  <span className="font-semibold text-slate-800">#{detailLinkItem.tag}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Total Klik
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {detailLinkItem.clicks}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Tanggal
                  </span>
                  <span className="font-mono text-slate-700">{detailLinkItem.createdAt}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const item = detailLinkItem;
                  setDetailLinkItem(null);
                  onEditLink(item);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                Edit Link Ini
              </button>
              <button
                type="button"
                onClick={() => setDetailLinkItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL READ: DETAIL USER                              */}
      {/* ==================================================== */}
      {detailUserItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Detail Data Pengguna</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailUserItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-full ${
                  detailUserItem.avatarBg || 'bg-indigo-600'
                } text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm`}
              >
                {(detailUserItem.name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{detailUserItem.name}</h4>
                <p className="text-xs font-mono text-slate-500">{detailUserItem.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
                <span className="font-bold text-slate-800 uppercase">{detailUserItem.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Status
                </span>
                <span
                  className={`font-bold ${
                    detailUserItem.status === 'active' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {detailUserItem.status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Terdaftar
                </span>
                <span className="font-mono text-slate-700">{detailUserItem.joinedDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const u = detailUserItem;
                  setDetailUserItem(null);
                  handleOpenEditUserModal(u);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Edit User Ini
              </button>
              <button
                type="button"
                onClick={() => setDetailUserItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL CREATE / UPDATE: FORM PENGGUNA                 */}
      {/* ==================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Misal: Andi Wijaya"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="andi@airastudio.ai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran / Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="admin">Administrator</option>
                    <option value="creator">Kreator</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as UserStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Warna Avatar
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {AVATAR_BG_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setUserAvatarBg(opt.value)}
                      className={`w-7 h-7 rounded-full ${opt.value} transition-transform cursor-pointer ${
                        userAvatarBg === opt.value
                          ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL DELETE: KONFIRMASI HAPUS LINK                  */}
      {/* ==================================================== */}
      {deleteLinkCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hapus Data Link?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Anda yakin ingin menghapus link <strong>"{deleteLinkCandidate.title}"</strong> dari
              tabel?
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteLinkCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLink(deleteLinkCandidate.id);
                  showToast(`Link "${deleteLinkCandidate.title}" berhasil dihapus`);
                  setDeleteLinkCandidate(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Hapus Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL DELETE: KONFIRMASI HAPUS USER                  */}
      {/* ==================================================== */}
      {deleteUserCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hapus Data User?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Anda yakin ingin menghapus user <strong>"{deleteUserCandidate.name}"</strong> (
              {deleteUserCandidate.email}) dari tabel?
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteUserCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteUserCandidate.id);
                  showToast(`User "${deleteUserCandidate.name}" berhasil dihapus`);
                  setDeleteUserCandidate(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Hapus User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SKEMA DATABASE SUPABASE                       */}
      {/* ==================================================== */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Skema SQL Database Supabase</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSchemaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-600">
                Salin dan jalankan SQL berikut pada <strong>SQL Editor</strong> Supabase Anda:
              </p>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 font-mono text-[11px] p-4 rounded-2xl overflow-x-auto max-h-64 leading-relaxed">
                  {schemaSnippet}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-md transition-colors cursor-pointer"
                >
                  {copiedSchema ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedSchema ? 'Tersalin' : 'Salin SQL'}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSchemaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
