import React from 'react';
import { 
  TrendingUp, 
  Film, 
  BookOpen, 
  Bookmark, 
  Plus, 
  Search, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { LinkItem, MainNavigationId, ToolCategory, UserItem } from '../types';
import { LinkCard } from './LinkCard';

interface CatalogViewProps {
  currentTab: MainNavigationId;
  links: LinkItem[];
  searchQuery: string;
  onLaunch: (id: string, url: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenNewLink: () => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (id: string) => void;
  currentUser: UserItem | null;
  onSelectCategory: (tab: MainNavigationId) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  currentTab,
  links = [],
  searchQuery,
  onLaunch,
  onToggleFavorite,
  onOpenNewLink,
  onEditLink,
  onDeleteLink,
  currentUser,
  onSelectCategory,
}) => {
  // Defensive links array
  const safeLinks = Array.isArray(links) ? links : [];

  // Filter based on tab
  let categoryFiltered = safeLinks;
  if (currentTab === 'affiliate') {
    categoryFiltered = safeLinks.filter((l) => l?.category === 'affiliate');
  } else if (currentTab === 'animation') {
    categoryFiltered = safeLinks.filter((l) => l?.category === 'animation');
  } else if (currentTab === 'story') {
    categoryFiltered = safeLinks.filter((l) => l?.category === 'story');
  } else if (currentTab === 'favorites') {
    categoryFiltered = safeLinks.filter((l) => Boolean(l?.isFavorite));
  }

  // Filter based on search query (completely null-safe)
  const q = (searchQuery || '').trim().toLowerCase();
  const displayLinks = categoryFiltered.filter((l) => {
    if (!l) return false;
    return (
      !q ||
      (l.title || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.tag || '').toLowerCase().includes(q) ||
      (l.url || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 pb-20">
      {/* Grid of Link Cards */}
      {displayLinks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-16 px-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak ada link ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `Pencarian "${searchQuery}" tidak membuahkan hasil di kategori ini.`
              : 'Belum ada link yang ditambahkan untuk kategori ini.'}
          </p>
          <button
            onClick={onOpenNewLink}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Link Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {displayLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onLaunch={onLaunch}
              onToggleFavorite={onToggleFavorite}
              onEdit={onEditLink}
              onDelete={onDeleteLink}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};
