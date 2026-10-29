import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Bookmark, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Film, 
  BookOpen,
  MousePointerClick,
  Sparkles
} from 'lucide-react';
import { LinkItem, UserItem } from '../types';

interface LinkCardProps {
  link: LinkItem;
  onLaunch: (id: string, url: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit?: (link: LinkItem) => void;
  onDelete?: (id: string) => void;
  currentUser: UserItem | null;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onLaunch,
  onToggleFavorite,
  onEdit,
  onDelete,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [link.thumbnailUrl]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = () => {
    switch (link?.category) {
      case 'affiliate':
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      case 'animation':
        return <Film className="w-4 h-4 text-indigo-600" />;
      case 'story':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoryLabel = () => {
    switch (link?.category) {
      case 'affiliate':
        return 'Tools Affiliate';
      case 'animation':
        return 'Tools Animasi';
      case 'story':
        return 'Tools Cerita';
      default:
        return 'Tools AI';
    }
  };

  const gradient = link?.gradientTheme || 'from-indigo-600 to-violet-600';
  const clicksCount = typeof link?.clicks === 'number' ? link.clicks : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Thumbnail Area */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          {link?.thumbnailUrl && !imgError ? (
            <img
              src={link.thumbnailUrl}
              alt={link.title || 'Tool'}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            /* Styled CSS/SVG Fallback Artwork Banner */
            <div className={`w-full h-full bg-gradient-to-tr ${gradient} p-5 flex flex-col justify-between relative select-none`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                  {link?.tag || 'Tools'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  {getCategoryIcon()}
                </div>
              </div>

              <div>
                <p className="text-white/80 text-[10px] uppercase font-semibold tracking-wider">
                  AIRA Launcher
                </p>
                <h4 className="text-white text-base font-bold line-clamp-1 drop-shadow-xs">
                  {link?.title || 'Tool Launcher'}
                </h4>
              </div>
            </div>
          )}

          {/* Top badges over thumbnail */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {link?.badge && (
              <span className="text-[10px] font-bold text-white bg-indigo-600/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs">
                {link.badge}
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(link.id);
              }}
              title={link?.isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                link?.isFavorite
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'bg-white/80 text-slate-700 hover:bg-white hover:text-amber-500'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${link?.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Content & Keterangan */}
        <div className="p-5">
          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-indigo-700 flex items-center gap-1">
              {getCategoryIcon()}
              <span>{getCategoryLabel()}</span>
            </span>

            <span className="font-mono tabular-nums text-slate-500 flex items-center gap-1 text-[11px]">
              <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
              <span>{clicksCount.toLocaleString()} klik</span>
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-base leading-snug mb-1.5 group-hover:text-indigo-700 transition-colors">
            {link?.title || 'Tool'}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {link?.description || ''}
          </p>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Copy link */}
          <button
            onClick={handleCopy}
            title="Salin Link URL"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
          </button>

          {/* Admin Edit/Delete */}
          {currentUser?.role === 'admin' && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(link)}
                  title="Edit Link (Admin)"
                  className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(link.id)}
                  title="Hapus Link (Admin)"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Primary Launch Button */}
        <button
          onClick={() => onLaunch(link.id, link.url)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>Luncurkan</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
