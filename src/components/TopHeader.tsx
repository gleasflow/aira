import React from 'react';
import { Search } from 'lucide-react';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20 gap-4">
      {/* Left: Hanya nama workspace */}
      <div className="flex items-center gap-3">
        <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          AIRA Studio AI
        </span>
      </div>

      {/* Middle: Kolom Pencarian (Bukan tombol) */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari link tools, nama software, deskripsi..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:bg-white transition-all"
          />
        </div>
      </div>
    </header>
  );
};
