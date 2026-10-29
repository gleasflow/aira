import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ExternalLink, 
  Image as ImageIcon, 
  Tag, 
  Sparkles, 
  Upload, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Layers,
  RefreshCw,
  Link2
} from 'lucide-react';
import { LinkItem, ToolCategory } from '../types';
import { 
  uploadThumbnailToStorage, 
  isSupabaseConfigured, 
  STORAGE_BUCKET_NAME 
} from '../lib/supabase';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkData: Omit<LinkItem, 'id' | 'clicks' | 'isFavorite' | 'createdAt'>, existingId?: string) => void;
  initialLink?: LinkItem | null;
  defaultCategory?: ToolCategory;
}

const GRADIENT_PRESETS = [
  { label: 'Indigo / Violet', value: 'from-indigo-600 to-violet-600' },
  { label: 'Amber / Orange', value: 'from-amber-500 to-orange-600' },
  { label: 'Teal / Emerald', value: 'from-teal-600 to-emerald-700' },
  { label: 'Rose / Pink', value: 'from-rose-500 to-pink-600' },
  { label: 'Cyan / Blue', value: 'from-cyan-500 to-blue-600' },
  { label: 'Purple / Magenta', value: 'from-purple-600 to-indigo-600' },
];

const CURATED_PRESETS: { label: string; url: string; cat: ToolCategory }[] = [
  {
    label: 'Affiliate Dashboard',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    cat: 'affiliate'
  },
  {
    label: 'E-commerce Trends',
    url: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=800&q=80',
    cat: 'affiliate'
  },
  {
    label: '3D AI Robot Model',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    cat: 'animation'
  },
  {
    label: 'Motion Graphics CGI',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    cat: 'animation'
  },
  {
    label: 'Novel & Storytelling',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    cat: 'story'
  },
  {
    label: 'Fantasy Manuscript',
    url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80',
    cat: 'story'
  }
];

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLink,
  defaultCategory = 'affiliate',
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ToolCategory>(defaultCategory);
  const [tag, setTag] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [gradientTheme, setGradientTheme] = useState(GRADIENT_PRESETS[0].value);
  const [badge, setBadge] = useState('');

  // Thumbnail upload UI states
  const [uploadTab, setUploadTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialLink) {
      setTitle(initialLink.title);
      setUrl(initialLink.url);
      setDescription(initialLink.description);
      setCategory(initialLink.category);
      setTag(initialLink.tag);
      setThumbnailUrl(initialLink.thumbnailUrl || '');
      setGradientTheme(initialLink.gradientTheme || GRADIENT_PRESETS[0].value);
      setBadge(initialLink.badge || '');
      // If has thumbnail, pick upload or url depending on type
      if (initialLink.thumbnailUrl?.startsWith('http')) {
        setUploadTab(initialLink.thumbnailUrl.includes('supabase.co') ? 'upload' : 'url');
      } else {
        setUploadTab('upload');
      }
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setCategory(defaultCategory);
      setTag(defaultCategory === 'affiliate' ? 'Marketing' : defaultCategory === 'animation' ? '3D AI' : 'Skenario');
      setThumbnailUrl('');
      setGradientTheme(GRADIENT_PRESETS[0].value);
      setBadge('');
      setUploadTab('upload');
    }
    setUploadError(null);
    setUploadSuccess(null);
  }, [initialLink, defaultCategory, isOpen]);

  if (!isOpen) return null;

  // Process file upload to Supabase Storage
  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const result = await uploadThumbnailToStorage(file);

      if (result.url) {
        setThumbnailUrl(result.url);
        if (result.isSupabase) {
          setUploadSuccess(`Gambar berhasil diunggah ke Supabase Storage (bucket: ${result.bucketName || STORAGE_BUCKET_NAME})!`);
        } else if (result.error) {
          setUploadError(result.error);
        } else {
          setUploadSuccess('Gambar berhasil dimuat dan disimpan untuk link ini!');
        }
      } else if (result.error) {
        setUploadError(result.error);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses unggahan gambar.');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // reset input so the same file can be re-selected if desired
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveThumbnail = () => {
    setThumbnailUrl('');
    setUploadSuccess(null);
    setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    onSave(
      {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
        tag: tag.trim() || 'General',
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        gradientTheme,
        badge: badge.trim() || undefined,
      },
      initialLink?.id
    );

    onClose();
  };

  const isSupabaseThumbnail = thumbnailUrl.includes('supabase.co') || thumbnailUrl.includes('/storage/v1/object/');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {initialLink ? 'Edit Link Launcher' : 'Tambah Link Launcher Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasikan judul, link, upload thumbnail gambar ke Supabase, dan deskripsi
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with scrollable content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Judul */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Tools / Link Launcher <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: TikTok Shop Creator Trend Finder"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600"
              autoFocus
            />
          </div>

          {/* URL Tujuan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Tautan Tujuan <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/app"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 font-mono"
            />
          </div>

          {/* Kategori & Tag */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Menu <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
              >
                <option value="affiliate">Tools Affiliate</option>
                <option value="animation">Tools Animasi</option>
                <option value="story">Tools Cerita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tag / Sub-Label
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Misal: 3D Mocap, UTM, Novel"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Deskripsi Tools
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan ringkasan fungsi tools, kegunaan, dan manfaatnya bagi pengguna..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
            />
          </div>

          {/* ========================================================= */}
          {/* BAGIAN UPLOAD THUMBNAIL (SUPABASE STORAGE)                 */}
          {/* ========================================================= */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Gambar Thumbnail Link</span>
                <span className="text-[10px] font-normal text-slate-500">(Supabase Storage)</span>
              </label>

              {/* Source Tag Badge */}
              {thumbnailUrl && (
                <div className="flex items-center gap-1">
                  {isSupabaseThumbnail ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Database className="w-3 h-3" />
                      Supabase Storage
                    </span>
                  ) : thumbnailUrl.startsWith('data:image') ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Lokal Data URL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      URL Eksternal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-0.5"
                    title="Hapus gambar thumbnail"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Live Preview Box */}
            <div className="mb-3 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/7] flex items-center justify-center group shadow-xs">
              {thumbnailUrl ? (
                <>
                  <img
                    src={thumbnailUrl}
                    alt="Pratinjau Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-semibold shadow-md hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Ganti Gambar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-md hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className={`w-full h-full bg-gradient-to-tr ${gradientTheme} flex flex-col items-center justify-center text-white p-4 text-center select-none`}>
                  <ImageIcon className="w-8 h-8 opacity-60 mb-1.5" />
                  <p className="text-xs font-bold drop-shadow-xs">Belum ada gambar thumbnail</p>
                  <p className="text-[10px] opacity-80">Banner gradasi bawaan di atas akan digunakan jika tidak mengunggah gambar</p>
                </div>
              )}

              {/* Uploading overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mb-2" />
                  <p className="text-xs font-semibold">Mengunggah gambar ke Supabase...</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Menyimpan ke bucket <code>{STORAGE_BUCKET_NAME}</code></p>
                </div>
              )}
            </div>

            {/* Upload Method Tabs */}
            <div className="flex border-b border-slate-200 mb-3 text-xs">
              <button
                type="button"
                onClick={() => setUploadTab('upload')}
                className={`flex-1 py-1.5 font-semibold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File (Supabase)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('url')}
                className={`flex-1 py-1.5 font-semibold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadTab === 'url'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Input URL Gambar</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('presets')}
                className={`flex-1 py-1.5 font-semibold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadTab === 'presets'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilihan Preset</span>
              </button>
            </div>

            {/* TAB 1: File Upload Drag & Drop */}
            {uploadTab === 'upload' && (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileInputChange}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                />

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Klik untuk memilih file gambar atau seret & jatuhkan di sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mendukung JPG, PNG, WEBP, GIF, atau SVG (Maks. 5MB)
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-medium">
                    <Database className="w-3 h-3" />
                    <span>Disimpan langsung ke Supabase Storage (<code>{STORAGE_BUCKET_NAME}</code>)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Direct URL Input */}
            {uploadTab === 'url' && (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => {
                      setThumbnailUrl(e.target.value);
                      setUploadSuccess(null);
                      setUploadError(null);
                    }}
                    placeholder="https://example.com/gambar-tools.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Masukkan tautan gambar langsung dari internet (Unsplash, Imgur, CDN, dll).
                </p>
              </div>
            )}

            {/* TAB 3: Curated Presets */}
            {uploadTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">
                  Pilih gambar thumbnail berkualitas tinggi siap pakai:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CURATED_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setThumbnailUrl(preset.url);
                        setUploadSuccess(`Preset "${preset.label}" dipilih`);
                        setUploadError(null);
                      }}
                      className={`relative rounded-xl overflow-hidden border text-left p-1.5 transition-all cursor-pointer group ${
                        thumbnailUrl === preset.url
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="aspect-[16/10] rounded-lg overflow-hidden mb-1 bg-slate-100">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-800 block truncate">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Notifications */}
            {uploadSuccess && (
              <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-tight">{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">{uploadError}</span>
              </div>
            )}
          </div>

          {/* Banner Theme & Badge */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Warna Banner Cadangan
              </label>
              <select
                value={gradientTheme}
                onChange={(e) => setGradientTheme(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                {GRADIENT_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badge Khusus (Opsional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Misal: Trending, Populer, Baru"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>{initialLink ? 'Simpan Perubahan' : 'Terbitkan Link'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
