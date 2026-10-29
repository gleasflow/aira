import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, LayoutGrid, LogIn } from 'lucide-react';
import { AutoHideSidebar } from './components/AutoHideSidebar';
import { TopHeader } from './components/TopHeader';
import { CatalogView } from './components/CatalogView';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { LinkModal } from './components/LinkModal';
import { 
  MainNavigationId, 
  LinkItem, 
  UserItem, 
  UserRole, 
  ToolCategory 
} from './types';
import { INITIAL_LINKS, INITIAL_USERS, isTemplateLink } from './data/initialData';
import { 
  getLinksFromDb, 
  insertLinkToDb, 
  updateLinkInDb, 
  deleteLinkFromDb,
  deleteAllLinksFromDb,
  getUsersFromDb,
  insertUserToDb,
  updateUserInDb,
  updateUserRoleInDb,
  toggleUserStatusInDb,
  deleteUserFromDb,
  authenticateWithDb,
  seedDefaultDataToSupabase,
  ensureValidUuid,
  isSupabaseConfigured
} from './lib/supabase';

export function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<MainNavigationId>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Default false = Auto-Hide mode
  const [isZenMode, setIsZenMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data States (tanpa template link bawaan)
  const [links, setLinks] = useState<LinkItem[]>(() => {
    try {
      const saved = localStorage.getItem('aira_studio_links');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((l: any) => !isTemplateLink(l));
          localStorage.setItem('aira_studio_links', JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Failed parsing aira_studio_links:', e);
    }
    return INITIAL_LINKS;
  });

  const [users, setUsers] = useState<UserItem[]>(() => {
    try {
      const saved = localStorage.getItem('aira_studio_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed parsing aira_studio_users:', e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserItem | null>(() => {
    try {
      const saved = localStorage.getItem('aira_studio_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS[0]; // Super Admin demo account
  });

  // Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Initial load & refresh from Supabase database
  const loadDataFromSupabase = async () => {
    try {
      const [fetchedLinks, fetchedUsers] = await Promise.all([
        getLinksFromDb(),
        getUsersFromDb(),
      ]);
      if (Array.isArray(fetchedLinks)) {
        setLinks(fetchedLinks.filter((l) => !isTemplateLink(l)));
      }

      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      } else {
        setUsers((prev) => (prev.length > 0 ? prev : INITIAL_USERS));
      }
    } catch (e) {
      console.warn('Initial Supabase load error:', e);
      setUsers((prev) => (prev.length > 0 ? prev : INITIAL_USERS));
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // Sync to local storage (always sync, even when empty)
  useEffect(() => {
    localStorage.setItem('aira_studio_links', JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('aira_studio_users', JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aira_studio_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aira_studio_current_user');
    }
  }, [currentUser]);

  // Keyboard shortcut listener: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Launch link action & increment click counter
  const handleLaunchLink = async (id: string, url: string) => {
    const targetLink = links.find((l) => l.id === id);
    const newClicks = (targetLink?.clicks || 0) + 1;
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, clicks: newClicks } : l))
    );
    await updateLinkInDb(id, { clicks: newClicks });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    const targetLink = links.find((l) => l.id === id);
    const newFav = !targetLink?.isFavorite;
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFavorite: newFav } : l))
    );
    await updateLinkInDb(id, { isFavorite: newFav });
  };

  const isAdmin = currentUser?.role === 'admin';

  // Link CRUD (Khusus Administrator)
  const handleSaveLink = async (
    linkData: Omit<LinkItem, 'id' | 'clicks' | 'isFavorite' | 'createdAt'>,
    existingId?: string
  ) => {
    if (!isAdmin) return;
    if (existingId) {
      setLinks((prev) =>
        prev.map((l) => (l.id === existingId ? { ...l, ...linkData } : l))
      );
      await updateLinkInDb(existingId, linkData);
    } else {
      const created = await insertLinkToDb(linkData);
      setLinks((prev) => [created, ...prev]);
    }
    setEditingLink(null);
  };

  const handleEditLink = (link: LinkItem) => {
    if (!isAdmin) return;
    setEditingLink(link);
    setIsLinkModalOpen(true);
  };

  const handleUpdateLink = async (id: string, updates: Partial<LinkItem>) => {
    if (!isAdmin) return;
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    await updateLinkInDb(id, updates);
  };

  const handleDeleteLink = async (id: string) => {
    if (!isAdmin) return;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await deleteLinkFromDb(id);
  };

  // User CRUD (Khusus Administrator)
  const handleAddUser = async (userData: Omit<UserItem, 'id' | 'joinedDate'>) => {
    if (!isAdmin) return;
    const createdUser = await insertUserToDb(userData);
    setUsers((prev) => {
      const filtered = prev.filter(
        (u) =>
          u.id !== createdUser.id &&
          u.email.toLowerCase() !== createdUser.email.toLowerCase()
      );
      return [createdUser, ...filtered];
    });
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserItem>) => {
    if (!isAdmin) return;
    const normalizedId = ensureValidUuid(id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id || u.id === normalizedId ? { ...u, ...updates, id: normalizedId } : u))
    );
    setCurrentUser((prev) =>
      prev && (prev.id === id || prev.id === normalizedId)
        ? { ...prev, ...updates, id: normalizedId }
        : prev
    );
    await updateUserInDb(id, updates);
  };

  const handleDuplicateLink = async (link: LinkItem) => {
    if (!isAdmin) return;
    const copyData = {
      title: `${link.title} (Salinan)`,
      description: link.description,
      url: link.url,
      category: link.category,
      tag: link.tag,
      thumbnailUrl: link.thumbnailUrl,
      gradientTheme: link.gradientTheme,
      badge: link.badge,
    };
    const created = await insertLinkToDb(copyData);
    setLinks((prev) => [created, ...prev]);
  };

  const handleResetClicks = async (id: string) => {
    if (!isAdmin) return;
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, clicks: 0 } : l))
    );
    await updateLinkInDb(id, { clicks: 0 });
  };

  const handleRestoreDefaultLinks = async () => {
    if (!isAdmin) return;
    setLinks([]);
    localStorage.setItem('aira_studio_links', JSON.stringify([]));
    await deleteAllLinksFromDb();
  };

  const handleRestoreDefaultData = async () => {
    if (!isAdmin) return;
    setUsers(INITIAL_USERS);
    localStorage.setItem('aira_studio_users', JSON.stringify(INITIAL_USERS));
    await seedDefaultDataToSupabase(links, INITIAL_USERS);
  };

  const handleImportLinks = async (importedLinks: LinkItem[]) => {
    if (!isAdmin) return;
    const cleaned = importedLinks.filter((l) => !isTemplateLink(l));
    setLinks(cleaned);
    localStorage.setItem('aira_studio_links', JSON.stringify(cleaned));
    await seedDefaultDataToSupabase(cleaned, users);
  };

  const handleUpdateUserRole = async (id: string, role: UserRole) => {
    if (!isAdmin) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
    await updateUserRoleInDb(id, role);
  };

  const handleToggleUserStatus = async (id: string) => {
    if (!isAdmin) return;
    const user = users.find((u) => u.id === id);
    const newStatus = user?.status === 'active' ? 'suspended' : 'active';
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: newStatus } : u
      )
    );
    await toggleUserStatusInDb(id, newStatus);
  };

  const handleDeleteUser = async (id: string) => {
    if (!isAdmin) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await deleteUserFromDb(id);
  };

  // Auth Handlers (with Supabase authentication & user_profiles sync)
  const handleLogin = async (email: string, role: UserRole, customName?: string) => {
    const user = await authenticateWithDb(email, role, customName);
    setUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (exists) {
        return prev.map((u) => u.email.toLowerCase() === user.email.toLowerCase() ? user : u);
      }
      return [user, ...prev];
    });
    setCurrentUser(user);
    setCurrentTab('all');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLinkModalOpen(false);
    setEditingLink(null);
    setCurrentTab('login');
  };

  const linksCount = {
    all: links.length,
    affiliate: links.filter((l) => l.category === 'affiliate').length,
    animation: links.filter((l) => l.category === 'animation').length,
    story: links.filter((l) => l.category === 'story').length,
    favorites: links.filter((l) => l.isFavorite).length,
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      {/* 1. Auto-Hide Sidebar Menu (Sliding flyout with edge-hover trigger & pin option) */}
      <AutoHideSidebar
        isOpen={isSidebarOpen}
        isPinned={isPinned && !isZenMode}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'admin' && !isAdmin) return;
          setCurrentTab(tab);
        }}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        onTogglePin={() => setIsPinned(!isPinned)}
        onOpenNewLink={() => {
          if (!isAdmin) return;
          setEditingLink(null);
          setIsLinkModalOpen(true);
        }}
        currentUser={currentUser}
        onOpenLogin={() => setCurrentTab('login')}
        linksCount={linksCount}
      />

      {/* 2. Full-Width Expansive Workspace (Ruang Lega 100% Layar saat Auto-Hide) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative transition-all w-full">
        {/* Top Header (Hanya nama workspace di kiri & search) */}
        <TopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Workspace Content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {currentTab === 'login' ? (
            <LoginPage
              currentUser={currentUser}
              users={users}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onNavigateToCatalog={() => setCurrentTab('all')}
              onNavigateToAdmin={() => {
                if (isAdmin) setCurrentTab('admin');
              }}
              onUpdateUser={isAdmin ? handleUpdateUser : undefined}
            />
          ) : currentTab === 'admin' ? (
            isAdmin ? (
              <AdminDashboard
                links={links}
                users={users}
                onOpenNewLink={() => {
                  if (!isAdmin) return;
                  setEditingLink(null);
                  setIsLinkModalOpen(true);
                }}
                onCreateLink={(linkData) => handleSaveLink(linkData)}
                onEditLink={handleEditLink}
                onUpdateLink={handleUpdateLink}
                onDeleteLink={handleDeleteLink}
                onDuplicateLink={handleDuplicateLink}
                onResetClicks={handleResetClicks}
                onRestoreDefaultLinks={handleRestoreDefaultLinks}
                onRestoreDefaultData={handleRestoreDefaultData}
                onImportLinks={handleImportLinks}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onUpdateUserRole={handleUpdateUserRole}
                onToggleUserStatus={handleToggleUserStatus}
                onDeleteUser={handleDeleteUser}
                onLaunchLink={handleLaunchLink}
                onRefreshFromDb={loadDataFromSupabase}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                      <Lock className="w-3 h-3" />
                      <span>Akses Dibatasi</span>
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      Khusus Tingkat Administrator
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Dashboard Admin dan seluruh sistem CRUD (Tambah, Edit, dan Hapus data Link maupun User) hanya dapat diakses oleh akun dengan tingkat <strong>Administrator</strong>. Pengguna selain Administrator hanya dapat melihat dan meluncurkan katalog link.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('all')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Lihat Katalog Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('login')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Ganti Akun Administrator</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <CatalogView
              currentTab={currentTab}
              links={links}
              searchQuery={searchQuery}
              onLaunch={handleLaunchLink}
              onToggleFavorite={handleToggleFavorite}
              onOpenNewLink={() => {
                if (!isAdmin) return;
                setEditingLink(null);
                setIsLinkModalOpen(true);
              }}
              onEditLink={handleEditLink}
              onDeleteLink={handleDeleteLink}
              currentUser={currentUser}
              onSelectCategory={(tab) => setCurrentTab(tab)}
            />
          )}
        </main>
      </div>

      {/* Modal Tambah / Edit Link (Hanya aktif untuk Administrator) */}
      {isAdmin && (
        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setEditingLink(null);
          }}
          onSave={handleSaveLink}
          initialLink={editingLink}
          defaultCategory={
            currentTab === 'affiliate' || currentTab === 'animation' || currentTab === 'story'
              ? (currentTab as ToolCategory)
              : 'affiliate'
          }
        />
      )}
    </div>
  );
}

export default App;
