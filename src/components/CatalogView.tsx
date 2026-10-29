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
  links,
  searchQuery,
  onLaunch,
  onToggleFavorite,
  onOpenNewLink,
  onEditLink,
  onDeleteLink,
  currentUser,
  onSelectCategory,
}) => {
  // Filter based on tab
  let categoryFiltered = links;
  if (currentTab === 'affiliate') {
    categoryFiltered = links.filter((l) => l.category === 'affiliate');
  } else if (currentTab === 'animation') {
    categoryFiltered = links.filter((l) => l.category === 'animation');
  } else if (currentTab === 'story') {
    categoryFiltered = links.filter((l) => l.category === 'story');
  } else if (currentTab === 'favorites') {
    categoryFiltered = links.filter((l) => l.isFavorite);
  }

  // Filter based on search query
  const displayLinks = categoryFiltered.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'affiliate':
        return {
          title: 'Tools Affiliate AI & E-Commerce',
          desc: 'Kumpulan software cerdas pelacak komisi, pemendek link UTM, analitik konversi, dan automasi affiliate marketplace.',
          icon: TrendingUp,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
        };
      case 'animation':
        return {
          title: 'Tools Animasi & Motion AI',
          desc: 'Generator video sinematik, penangkap gerak 3D tanpa sensor, storyboard otomatis, dan sinkronisasi bibir karakter.',
          icon: Film,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        };
      case 'story':
        return {
          title: 'Tools Cerita & Naskah Kreatif AI',
          desc: 'Asisten penulisan novel fiksi, ensiklopedia dunia fantasi, format naskah skenario perfilman, dan laboratorium dialog persona.',
          icon: BookOpen,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        };
      case 'favorites':
        return {
          title: 'Link Peluncur Tersimpan',
          desc: 'Koleksi tools pilihan yang telah Anda tandai sebagai favorit untuk akses cepat sehari-hari.',
          icon: Bookmark,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
        };
      case 'all':
      default:
        return {
          title: 'Katalog Peluncur Tools Studio AI',
          desc: 'Eksplorasi seluruh peluncur software kecerdasan buatan terverifikasi untuk produktivitas kreator konten digital.',
          icon: Sparkles,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 lg:p-8 space-y-6 bg-slate-50">
      {/* Category Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-xl border ${headerInfo.color}`}>
              <IconComponent className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kategori Terpilih
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>

          <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
            {headerInfo.desc}
          </p>
        </div>

        {/* Category Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all' as MainNavigationId, label: 'Semua' },
            { id: 'affiliate' as MainNavigationId, label: 'Affiliate' },
            { id: 'animation' as MainNavigationId, label: 'Animasi' },
            { id: 'story' as MainNavigationId, label: 'Cerita' },
            { id: 'favorites' as MainNavigationId, label: 'Favorit' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

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
