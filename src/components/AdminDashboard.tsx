import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Users, 
  MousePointerClick, 
  TrendingUp, 
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
  BarChart3,
  Sparkles,
  Settings,
  ArrowUpDown,
  FileSpreadsheet,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { LinkItem, UserItem, UserRole, UserStatus, ToolCategory, AdminSubTab } from '../types';
import { isSupabaseConfigured, STORAGE_BUCKET_NAME } from '../lib/supabase';

interface AdminDashboardProps {
  links: LinkItem[];
  users: UserItem[];
  onOpenNewLink: () => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (id: string) => void;
  onDuplicateLink?: (link: LinkItem) => void;
  onResetClicks?: (id: string) => void;
  onRestoreDefaultLinks?: () => void;
  onImportLinks?: (links: LinkItem[]) => void;
  onAddUser: (user: Omit<UserItem, 'id' | 'joinedDate'>) => void;
  onUpdateUser?: (id: string, updates: Partial<UserItem>) => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onToggleUserStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onLaunchLink?: (id: string, url: string) => void;
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
  links,
  users,
  onOpenNewLink,
  onEditLink,
  onDeleteLink,
  onDuplicateLink,
  onResetClicks,
  onRestoreDefaultLinks,
  onImportLinks,
  onAddUser,
  onUpdateUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onDeleteUser,
  onLaunchLink,
}) => {
  // Tabs: overview | links | users | settings
  const [activeTab, setActiveTab] = useState<AdminSubTab>('overview');

  // Search and filters for Links
  const [linkSearch, setLinkSearch] = useState('');
  const [linkCategoryFilter, setLinkCategoryFilter] = useState<'all' | ToolCategory>('all');
  const [linkSortBy, setLinkSortBy] = useState<'clicks' | 'newest' | 'title' | 'tag'>('clicks');

  // Search and filters for Users
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');

  // Modals & Notifications
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Link deletion confirmation dialog
  const [deleteLinkCandidate, setDeleteLinkCandidate] = useState<LinkItem | null>(null);

  // User Add/Edit modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('member');
  const [userStatus, setUserStatus] = useState<UserStatus>('active');
  const [userAvatarBg, setUserAvatarBg] = useState(AVATAR_BG_OPTIONS[0].value);
  const [deleteUserCandidate, setDeleteUserCandidate] = useState<UserItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPI calculations
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalLinks = links.length;
  const totalUsers = users.length;
  const affiliateLinks = links.filter((l) => l.category === 'affiliate');
  const animationLinks = links.filter((l) => l.category === 'animation');
  const storyLinks = links.filter((l) => l.category === 'story');

  const affiliateClicks = affiliateLinks.reduce((sum, l) => sum + l.clicks, 0);
  const animationClicks = animationLinks.reduce((sum, l) => sum + l.clicks, 0);
  const storyClicks = storyLinks.reduce((sum, l) => sum + l.clicks, 0);

  // Top 5 links by clicks
  const topLinks = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  // Filtered & sorted Links
  const filteredLinks = links
    .filter((link) => {
      const q = linkSearch.toLowerCase();
      const matchesSearch =
        link.title.toLowerCase().includes(q) ||
        link.description.toLowerCase().includes(q) ||
        link.tag.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q);
      const matchesCat = linkCategoryFilter === 'all' || link.category === linkCategoryFilter;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (linkSortBy === 'clicks') return b.clicks - a.clicks;
      if (linkSortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (linkSortBy === 'title') return a.title.localeCompare(b.title);
      if (linkSortBy === 'tag') return a.tag.localeCompare(b.tag);
      return 0;
    });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // User Form Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('member');
    setUserStatus('active');
    setUserAvatarBg(AVATAR_BG_OPTIONS[Math.floor(Math.random() * AVATAR_BG_OPTIONS.length)].value);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserItem) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserStatus(user.status);
    setUserAvatarBg(user.avatarBg || AVATAR_BG_OPTIONS[0].value);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
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

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['ID', 'Judul', 'URL', 'Kategori', 'Tag', 'Klik', 'Tanggal_Rilis', 'Badge'];
    const rows = links.map(l => [
      `"${l.id}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.url}"`,
      `"${l.category}"`,
      `"${l.tag}"`,
      l.clicks,
      `"${l.createdAt}"`,
      `"${l.badge || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aira_studio_links_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV berhasil diunduh');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(links, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aira_studio_backup_${new Date().toISOString().slice(0, 10)}.json`);
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
          alert('Format JSON tidak valid atau kosong.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const schemaSnippet = `-- ==========================================
-- 1. TABEL DATABASE SUPABASE
-- ==========================================

-- Tabel Links (Katalog Peluncur Tools)
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

-- Tabel User Profiles (Manajemen Akun & Role)
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
-- 2. SUPABASE STORAGE (UPLOAD THUMBNAIL)
-- ==========================================

-- Buat Bucket Publik 'link-thumbnails'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('link-thumbnails', 'link-thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy 1: Izinkan publik melihat gambar thumbnail (SELECT)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'link-thumbnails');

-- Policy 2: Izinkan upload gambar thumbnail (INSERT)
CREATE POLICY "Allow Uploads to link-thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'link-thumbnails');

-- Policy 3: Izinkan pembaruan dan penghapusan thumbnail (UPDATE & DELETE)
CREATE POLICY "Allow Updates and Deletions"
ON storage.objects FOR ALL
USING (bucket_id = 'link-thumbnails');`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSnippet);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Admin AIRA Studio
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pusat manajemen lengkap untuk mengelola Link Launcher, Pengguna, dan Database Web App.
          </p>
        </div>

        {/* Primary Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ringkasan</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kelola Links ({links.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kelola Pengguna ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan & DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Status Strip */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isSupabaseConfigured
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isSupabaseConfigured ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">
                {isSupabaseConfigured ? 'Database Supabase Terhubung Aktif' : 'Database Supabase Terkonfigurasi (Dual-Mode)'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isSupabaseConfigured
                ? 'Semua penambahan, perubahan, dan penghapusan link serta pengguna langsung tersimpan ke Supabase.'
                : 'Data saat ini tersimpan otomatis di penyimpanan lokal browser. Siap disinkronkan ke Supabase kapan saja.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSchemaModalOpen(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
        >
          Lihat Skema SQL Supabase
        </button>
      </div>

      {/* ==================================================== */}
      {/* SUBTAB 1: RINGKASAN & OVERVIEW                       */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Link Terbit</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-slate-900">{totalLinks}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
                <span className="text-amber-600 font-semibold">{affiliateLinks.length} Affiliate</span> · 
                <span className="text-indigo-600 font-semibold">{animationLinks.length} Animasi</span> · 
                <span className="text-emerald-600 font-semibold">{storyLinks.length} Cerita</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Peluncuran</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <MousePointerClick className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-slate-900">{totalClicks.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600 mt-2 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24.5% interaksi klik launcher bulan ini</span>
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Pengguna Terdaftar</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-slate-900">{totalUsers}</p>
              <p className="text-[11px] text-slate-500 mt-2">
                {users.filter(u => u.status === 'active').length} akun aktif · {users.filter(u => u.status === 'suspended').length} ditangguhkan
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Kategori Paling Populer</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-indigo-900 mt-1">Tools Animasi</p>
              <p className="text-[11px] text-slate-500 mt-2">
                Total {animationClicks.toLocaleString()} klik dari kreator video
              </p>
            </div>
          </div>

          {/* 2-Column Section: Category Click Distribution & Quick Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Performance Breakdown */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Distribusi Performa Kategori Tools</h3>
                  <p className="text-xs text-slate-500">Jumlah tautan dan persentase klik peluncuran per kategori</p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
                  {totalClicks.toLocaleString()} Total Klik
                </span>
              </div>

              {/* Affiliate Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Tools Affiliate ({affiliateLinks.length} tools)
                  </span>
                  <span className="font-mono text-slate-600">
                    {affiliateClicks.toLocaleString()} klik ({totalClicks > 0 ? Math.round((affiliateClicks / totalClicks) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalClicks > 0 ? (affiliateClicks / totalClicks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Animation Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    Tools Animasi ({animationLinks.length} tools)
                  </span>
                  <span className="font-mono text-slate-600">
                    {animationClicks.toLocaleString()} klik ({totalClicks > 0 ? Math.round((animationClicks / totalClicks) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalClicks > 0 ? (animationClicks / totalClicks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Story Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Tools Cerita ({storyLinks.length} tools)
                  </span>
                  <span className="font-mono text-slate-600">
                    {storyClicks.toLocaleString()} klik ({totalClicks > 0 ? Math.round((storyClicks / totalClicks) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalClicks > 0 ? (storyClicks / totalClicks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Summary note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <span>Rata-rata peluncuran per link:</span>
                <span className="font-bold font-mono text-slate-900">
                  {totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0} klik / tool
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Aksi Cepat Kelola</h3>
                <p className="text-xs text-slate-500 mt-0.5">Operasi instan untuk mengelola web app</p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={onOpenNewLink}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Tambah Link Baru</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full">Modal CRUD</span>
                </button>

                <button
                  onClick={handleOpenAddUser}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span>Tambah Pengguna</span>
                  </div>
                  <span className="text-[10px] text-slate-500">+ Baru</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Ekspor Katalog ke CSV</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>Konfigurasi Supabase SQL</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('links')}
                  className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  Buka Tabel Lengkap CRUD Link →
                </button>
              </div>
            </div>
          </div>

          {/* Top 5 Leaderboard Tools */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">5 Link Tools Terpopuler (Top Clicks)</h3>
                <p className="text-xs text-slate-500">Tautan dengan interaksi tertinggi dari seluruh pengguna</p>
              </div>
              <button
                onClick={() => setActiveTab('links')}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {topLinks.map((tool, idx) => (
                <div key={tool.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      idx === 1 ? 'bg-slate-200 text-slate-800' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      #{idx + 1}
                    </span>

                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${tool.gradientTheme} flex items-center justify-center text-white shrink-0`}>
                      <Layers className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">{tool.title}</span>
                        {tool.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 truncate block font-mono">{tool.url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                      {tool.clicks.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">klik</span>
                    </span>

                    <button
                      onClick={() => onEditLink(tool)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Link"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Luncurkan Tautan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUBTAB 2: KELOLA LINKS (FULL CRUD)                   */}
      {/* ==================================================== */}
      {activeTab === 'links' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Cari judul, tag, atau URL..."
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
                  <option value="clicks">Paling Banyak Diklik</option>
                  <option value="newest">Terbaru</option>
                  <option value="title">Judul (A-Z)</option>
                  <option value="tag">Berdasarkan Tag</option>
                </select>
              </div>
            </div>

            {/* Actions: Add New, Export, Import */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                title="Ekspor data link ke file CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Impor JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSONFile}
                  className="hidden"
                />
              </label>

              <button
                onClick={onOpenNewLink}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Link</span>
              </button>
            </div>
          </div>

          {/* Table Header Info */}
          <div className="px-6 py-2 bg-slate-50/70 border-b border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Menampilkan <strong>{filteredLinks.length}</strong> dari <strong>{links.length}</strong> total link</span>
            {linkCategoryFilter !== 'all' && (
              <button
                onClick={() => setLinkCategoryFilter('all')}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Links CRUD Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Judul & URL</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Tag</th>
                  <th className="py-3 px-4 font-semibold text-center">Total Klik</th>
                  <th className="py-3 px-4 font-semibold">Tanggal Rilis</th>
                  <th className="py-3 px-6 font-semibold text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada link yang sesuai</p>
                      <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian lain atau buat link baru.</p>
                      <button
                        onClick={onOpenNewLink}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        + Tambah Link Sekarang
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Preview */}
                      <td className="py-3.5 px-6 max-w-sm">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onEditLink(link)}
                            title={link.thumbnailUrl ? 'Klik untuk mengganti thumbnail gambar' : 'Klik untuk mengunggah thumbnail gambar'}
                            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${link.gradientTheme} flex items-center justify-center text-white shrink-0 shadow-xs overflow-hidden relative group/thumb cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all`}
                          >
                            {link.thumbnailUrl ? (
                              <img src={link.thumbnailUrl} alt={link.title} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                            ) : (
                              <Layers className="w-4 h-4 opacity-80" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 block truncate text-xs">
                                {link.title}
                              </span>
                              {link.thumbnailUrl && (
                                <span 
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-semibold shrink-0 ${
                                    link.thumbnailUrl.includes('supabase.co') 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : 'bg-indigo-50 text-indigo-700'
                                  }`}
                                  title={link.thumbnailUrl}
                                >
                                  {link.thumbnailUrl.includes('supabase.co') ? 'Supabase' : 'Gambar'}
                                </span>
                              )}
                              {link.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 shrink-0">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono truncate block mt-0.5">
                              {link.url}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          link.category === 'affiliate' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          link.category === 'animation' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            link.category === 'affiliate' ? 'bg-amber-500' :
                            link.category === 'animation' ? 'bg-indigo-600' : 'bg-emerald-500'
                          }`} />
                          {link.category === 'affiliate' ? 'Affiliate' :
                           link.category === 'animation' ? 'Animasi' : 'Cerita'}
                        </span>
                      </td>

                      {/* Tag */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          #{link.tag}
                        </span>
                      </td>

                      {/* Click Counter + Quick Reset */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                          <span className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                            {link.clicks.toLocaleString()}
                          </span>
                          {onResetClicks && link.clicks > 0 && (
                            <button
                              onClick={() => {
                                onResetClicks(link.id);
                                showToast(`Klik untuk "${link.title}" di-reset ke 0`);
                              }}
                              className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                              title="Reset Jumlah Klik ke 0"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {link.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Launch */}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => onLaunchLink?.(link.id, link.url)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Luncurkan Tautan"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Duplicate */}
                          {onDuplicateLink && (
                            <button
                              onClick={() => {
                                onDuplicateLink(link);
                                showToast(`Link "${link.title}" berhasil disalin`);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Duplikatkan Link"
                            >
                              <CopyPlus className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => onEditLink(link)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Link (Ubah judul, url, deskripsi)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteLinkCandidate(link)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Link dari Katalog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUBTAB 3: KELOLA PENGGUNA (FULL CRUD)                */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari pengguna berdasarkan nama atau email..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Peran</option>
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

            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengguna</span>
            </button>
          </div>

          {/* Table Header Info */}
          <div className="px-6 py-2 bg-slate-50/70 border-b border-slate-200 text-[11px] text-slate-500">
            Menampilkan <strong>{filteredUsers.length}</strong> pengguna terdaftar dalam sistem
          </div>

          {/* Users CRUD Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Nama & Email</th>
                  <th className="py-3 px-4 font-semibold">Peran (Role)</th>
                  <th className="py-3 px-4 font-semibold">Status Akun</th>
                  <th className="py-3 px-4 font-semibold">Tanggal Daftar</th>
                  <th className="py-3 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada pengguna yang cocok</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${user.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{user.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => {
                            onUpdateUserRole(user.id, e.target.value as UserRole);
                            showToast(`Peran ${user.name} diubah menjadi ${e.target.value}`);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 cursor-pointer"
                        >
                          <option value="admin">Administrator</option>
                          <option value="creator">Kreator</option>
                          <option value="member">Member</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            onToggleUserStatus(user.id);
                            showToast(`Status ${user.name} diubah menjadi ${user.status === 'active' ? 'Ditangguhkan' : 'Aktif'}`);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" />
                              <span>Ditangguhkan</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {user.joinedDate}
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteUserCandidate(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUBTAB 4: PENGATURAN WEB APP & DATABASE              */}
      {/* ==================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* App Branding & Configuration */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Informasi Web App AIRA Studio</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Nama Aplikasi</span>
                  <span className="font-bold text-slate-900 text-sm">AIRA Studio AI</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Tema Tampilan</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-semibold text-[11px] mt-1">
                    Light Mode (Bersih, Kontras Tinggi, Slate-50)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Sidebar Navigation</span>
                  <span className="text-slate-800 font-medium">
                    Auto-Hide Flyout Menu (Sisi kiri layar / Cmd+B)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Kategori Menu Aktif</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      Tools Affiliate
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                      Tools Animasi
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      Tools Cerita
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supabase Database Connection Details */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Supabase Database (PostgreSQL)</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSupabaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {isSupabaseConfigured ? 'Terkoneksi' : 'Lokal / Siap Hubung'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Menyimpan data katalog <code>links</code> dan profil pengguna <code>user_profiles</code> untuk login & permission role.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Lihat Skema SQL Lengkap</span>
                </button>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Supabase Storage Details */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Supabase Storage (Thumbnails)</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {STORAGE_BUCKET_NAME}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Penyimpanan cloud object untuk gambar thumbnail link. Upload drag & drop otomatis menyimpan ke bucket <code>{STORAGE_BUCKET_NAME}</code> dan menghasilkan link CDN publik.
              </p>

              <button
                type="button"
                onClick={() => {
                  const storageSql = `INSERT INTO storage.buckets (id, name, public) VALUES ('link-thumbnails', 'link-thumbnails', true) ON CONFLICT (id) DO UPDATE SET public = true;
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'link-thumbnails');
CREATE POLICY "Allow Uploads to link-thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'link-thumbnails');
CREATE POLICY "Allow Updates and Deletions" ON storage.objects FOR ALL USING (bucket_id = 'link-thumbnails');`;
                  navigator.clipboard.writeText(storageSql);
                  showToast('Skrip SQL Storage bucket berhasil disalin!');
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-2.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salin SQL Storage Bucket Saja</span>
              </button>
            </div>
          </div>

          {/* Backup, Restore, and Reset Section */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Pemeliharaan & Cadangan Data (Backup & Restore)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Unduh Cadangan JSON</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Pulihkan dari File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSONFile}
                  className="hidden"
                />
              </label>

              {onRestoreDefaultLinks && (
                <button
                  onClick={() => {
                    onRestoreDefaultLinks();
                    showToast('Data link bawaan berhasil dipulihkan');
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Reset ke Data Bawaan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT / TAMBAH PENGGUNA                       */}
      {/* ==================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
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
                        userAvatarBg === opt.value ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-80 hover:opacity-100'
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Perbarui Pengguna' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: KONFIRMASI HAPUS LINK                        */}
      {/* ==================================================== */}
      {deleteLinkCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hapus Link Launcher?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Anda akan menghapus tautan <strong>"{deleteLinkCandidate.title}"</strong>. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteLinkCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteLink(deleteLinkCandidate.id);
                  showToast(`Link "${deleteLinkCandidate.title}" telah dihapus`);
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
      {/* MODAL: KONFIRMASI HAPUS USER                        */}
      {/* ==================================================== */}
      {deleteUserCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hapus Pengguna?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Anda akan menghapus akun <strong>"{deleteUserCandidate.name}"</strong> ({deleteUserCandidate.email}) dari sistem.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteUserCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deleteUserCandidate.id);
                  showToast(`Pengguna "${deleteUserCandidate.name}" telah dihapus`);
                  setDeleteUserCandidate(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SKEMA DATABASE SUPABASE                      */}
      {/* ==================================================== */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Skema Database Supabase</h3>
              </div>
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-600">
                Salin skrip SQL berikut dan jalankan di menu <strong>SQL Editor</strong> pada dashboard Supabase Anda untuk membuat tabel <code>links</code> dan <code>user_profiles</code>:
              </p>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 font-mono text-[11px] p-4 rounded-2xl overflow-x-auto max-h-64 leading-relaxed">
                  {schemaSnippet}
                </pre>
                <button
                  onClick={handleCopySchema}
                  className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-md transition-colors cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Tersalin' : 'Salin SQL'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Langkah Konfigurasi Supabase:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                  <li>Buka project Supabase Anda di <code>supabase.com</code>.</li>
                  <li>Buka <strong>Project Settings → API</strong>, salin Project URL dan anon key.</li>
                  <li>Masukkan ke environment variable <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>.</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
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

export default AdminDashboard;
