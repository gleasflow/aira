import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Pin, 
  PinOff, 
  ArrowRight, 
  LayoutGrid, 
  TrendingUp, 
  Film, 
  BookOpen, 
  Bookmark, 
  ShieldCheck, 
  User, 
  Plus, 
  Sparkles,
  ChevronRight,
  Menu
} from 'lucide-react';
import { MainNavigationId, UserItem } from '../types';

interface AutoHideSidebarProps {
  isOpen: boolean;
  isPinned: boolean;
  currentTab: MainNavigationId;
  onSelectTab: (tab: MainNavigationId) => void;
  onOpen: () => void;
  onClose: () => void;
  onTogglePin: () => void;
  onOpenNewLink: () => void;
  currentUser: UserItem | null;
  onOpenLogin: () => void;
  linksCount: { all: number; affiliate: number; animation: number; story: number; favorites: number };
}

interface MenuItemDef {
  id: MainNavigationId;
  label: string;
  icon: React.FC<{ className?: string }>;
  count?: number;
}

interface MenuSectionDef {
  heading: string;
  items: MenuItemDef[];
}

export const AutoHideSidebar: React.FC<AutoHideSidebarProps> = ({
  isOpen,
  isPinned,
  currentTab,
  onSelectTab,
  onOpen,
  onClose,
  onTogglePin,
  onOpenNewLink,
  currentUser,
  onOpenLogin,
  linksCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle auto-hide on mouse leave
  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    onOpen();
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    // Graceful 300ms delay so brief cursor exit doesn't abruptly hide menu
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 300);
  };

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPinned) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPinned, onClose]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const menuSections: MenuSectionDef[] = [
    {
      heading: 'Katalog Peluncur Tools',
      items: [
        { id: 'all', label: 'Semua Tools & Link', icon: LayoutGrid, count: linksCount.all },
      ],
    },
    {
      heading: 'Kategori Khusus AI',
      items: [
        { id: 'affiliate', label: 'Tools Affiliate', icon: TrendingUp, count: linksCount.affiliate },
        { id: 'animation', label: 'Tools Animasi', icon: Film, count: linksCount.animation },
        { id: 'story', label: 'Tools Cerita', icon: BookOpen, count: linksCount.story },
      ],
    },
    {
      heading: 'Manajemen & Sistem',
      items: [
        { id: 'admin', label: 'Dashboard Admin', icon: ShieldCheck },
        { id: 'login', label: currentUser ? 'Profil & Akun' : 'Masuk / Login Page', icon: User },
      ],
    },
  ];

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* 1. Left Edge Hover Detection Zone */}
      {!isPinned && (
        <div
          onMouseEnter={handleMouseEnter}
          className="fixed left-0 top-0 bottom-0 w-4 z-40 cursor-pointer"
          title="Arahkan ke sini untuk membuka menu"
        />
      )}

      {/* 2. Floating Edge Notch / Tab on Left Center */}
      {!isPinned && !isOpen && (
        <button
          onClick={onOpen}
          onMouseEnter={handleMouseEnter}
          title="Buka Menu"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-white/90 backdrop-blur-md border border-slate-200 border-l-0 rounded-r-2xl py-3 px-2 shadow-md hover:shadow-lg text-slate-500 hover:text-indigo-600 hover:bg-white hover:px-2.5 transition-all cursor-pointer flex flex-col items-center gap-1.5 group select-none"
        >
          <Menu className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 transition-colors" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 [writing-mode:vertical-rl] rotate-180">
            Menu
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
        </button>
      )}

      {/* 3. Subtle Backdrop Overlay when floating and opened */}
      {!isPinned && isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* 4. Sliding Sidebar Menu Container */}
      <aside
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${
          isPinned
            ? 'relative w-72 h-screen border-r border-slate-200 bg-white shrink-0 z-40 shadow-xs'
            : `fixed left-0 top-0 bottom-0 w-72 bg-white/98 backdrop-blur-2xl border-r border-slate-200 shadow-2xl z-50 transition-transform duration-300 ease-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
              }`
        } flex flex-col select-none overflow-hidden`}
        aria-label="Sidebar Menu"
      >
        {/* Top Header of Sidebar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                AIRA Studio AI
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Pin Sidebar Toggle */}
              <button
                onClick={onTogglePin}
                title={isPinned ? 'Lepas Sematan Sidebar' : 'Sematkan Sidebar'}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  isPinned
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              {!isPinned && (
                <button
                  onClick={onClose}
                  title="Sembunyikan Menu"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Search */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Menu Items List (Tanpa keterangan tambahan) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
                {section.heading}
              </span>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (!isPinned) {
                        onClose();
                      }
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between group border ${
                      isActive
                        ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-indigo-950' : 'text-slate-800'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {item.count !== undefined ? (
                      <span className="font-mono text-[11px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
                        {item.count}
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex flex-col gap-2">
          <button
            onClick={() => {
              onOpenNewLink();
              if (!isPinned) onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Link Baru</span>
          </button>

          {/* User Account info in footer */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => {
                onOpenLogin();
                if (!isPinned) onClose();
              }}
              className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="font-semibold text-xs truncate max-w-[180px]">
                {currentUser ? currentUser.name : 'Masuk Akun'}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
