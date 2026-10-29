import React, { useState, useMemo } from 'react';
import {
  User,
  Lock,
  Mail,
  LogIn,
  LogOut,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  AlertCircle,
  Check,
  RefreshCw,
  Edit3,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import { UserItem, UserRole } from '../types';

interface LoginPageProps {
  currentUser: UserItem | null;
  users?: UserItem[];
  onLogin: (email: string, role: UserRole, name?: string) => Promise<void> | void;
  onLogout: () => void;
  onNavigateToCatalog: () => void;
  onNavigateToAdmin?: () => void;
  onUpdateUser?: (id: string, updates: Partial<UserItem>) => Promise<void> | void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  users = [],
  onLogin,
  onLogout,
  onNavigateToCatalog,
  onNavigateToAdmin,
  onUpdateUser,
}) => {
  // Auth Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showForgotHelper, setShowForgotHelper] = useState(false);

  // Profile Edit States (when logged in)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Detect if typed email matches an existing registered user
  const matchedRegisteredUser = useMemo(() => {
    const clean = email.trim().toLowerCase();
    if (!clean) return null;
    return users.find((u) => u.email.toLowerCase() === clean) || null;
  }, [email, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMessage('Kata sandi minimal terdiri dari 4 karakter.');
      return;
    }

    if (authMode === 'register' && !fullName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi untuk pendaftaran akun baru.');
      return;
    }

    // Check if existing user is suspended
    if (matchedRegisteredUser && matchedRegisteredUser.status === 'suspended') {
      setErrorMessage(
        `Akun ${matchedRegisteredUser.email} sedang ditangguhkan (Nonaktif). Hubungi Administrator untuk mengaktifkan kembali.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const targetRole: UserRole = matchedRegisteredUser
        ? matchedRegisteredUser.role
        : cleanEmail === 'admin@airastudio.ai'
        ? 'admin'
        : 'member';
      const targetName = authMode === 'register' ? fullName.trim() : matchedRegisteredUser?.name;

      await onLogin(cleanEmail, targetRole, targetName);
      setIsSwitchingAccount(false);
      setPassword('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memverifikasi sesi akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin' || !onUpdateUser || !editName.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateUser(currentUser.id, { name: editName.trim() });
      setIsEditingProfile(false);
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showActiveSessionView = Boolean(currentUser && !isSwitchingAccount);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="min-h-full w-full max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden p-6 sm:p-10">
          {showActiveSessionView && currentUser ? (
            /* ==========================================
               ACTIVE USER SESSION & PROFILE MANAGEMENT
               ========================================== */
            <div className="w-full space-y-6">
                {/* Top Status Bar */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Sesi Autentikasi Aktif
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                      Profil Pengguna
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Terverifikasi</span>
                  </span>
                </div>

                {profileSavedToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Perubahan profil pengguna berhasil disimpan.</span>
                  </div>
                )}

                {/* User Identity Card */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl ${
                          currentUser.avatarBg || 'bg-indigo-600'
                        } text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0`}
                      >
                        {currentUser.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {currentUser.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {onUpdateUser && currentUser.role === 'admin' && !isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(currentUser.name);
                          setIsEditingProfile(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer self-start sm:self-center shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ubah Nama</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Edit Name Form (Khusus Administrator) */}
                  {isEditingProfile && currentUser.role === 'admin' && (
                    <form
                      onSubmit={handleSaveProfile}
                      className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5"
                    >
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Nama Lengkap Pengguna
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                          placeholder="Nama lengkap..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[11px] text-slate-400 block">Tingkatan Akses</span>
                      <span
                        className={`font-semibold mt-0.5 block ${
                          currentUser.role === 'admin' ? 'text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        {currentUser.role === 'admin'
                          ? 'Administrator (Akses CRUD)'
                          : 'Pengguna (Hanya Melihat)'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[11px] text-slate-400 block">Status Akun</span>
                      <span className="font-semibold text-emerald-600 mt-0.5 block">
                        Aktif ({currentUser.status})
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                      <span className="text-[11px] text-slate-400 block">Terdaftar Sejak</span>
                      <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                        {currentUser.joinedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Workspace Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToCatalog}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Buka Katalog Workspace</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>

                  {currentUser.role === 'admin' && onNavigateToAdmin && (
                    <button
                      type="button"
                      onClick={onNavigateToAdmin}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Buka Dashboard Admin</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </button>
                  )}
                </div>

                {/* Account Switcher & Logout Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setIsSwitchingAccount(true);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti ke Akun Lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Sesi (Logout)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ==========================================
                 SIGN IN & REGISTRATION FORM VIEW
                 ========================================== */
              <div className="max-w-md mx-auto w-full">
                {/* Top Header & Back to Active Session if Switching */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {authMode === 'signin' ? 'Masuk ke Akun Anda' : 'Registrasi Akun Baru'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {authMode === 'signin'
                        ? 'Masukkan kredensial email terdaftar untuk mengakses workspace.'
                        : 'Buat profil pengguna baru yang tersinkronisasi dengan database.'}
                    </p>
                  </div>

                  {currentUser && isSwitchingAccount && (
                    <button
                      type="button"
                      onClick={() => setIsSwitchingAccount(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shrink-0"
                    >
                      Kembali ke Profil
                    </button>
                  )}
                </div>

                {/* Mode Switcher Tabs (Masuk vs Daftar) */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      authMode === 'signin'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk Akun</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftar Akun Baru</span>
                  </button>
                </div>

                {/* Error / Info Alerts */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>
                )}

                {infoMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{infoMessage}</span>
                  </div>
                )}

                {/* Main Credentials Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/15 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Alamat Email
                      </label>
                      {matchedRegisteredUser && authMode === 'signin' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Check className="w-3 h-3" />
                          <span>Terdaftar ({matchedRegisteredUser.name})</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="nama@airastudio.ai"
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Kata Sandi
                      </label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setShowForgotHelper(!showForgotHelper)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          Lupa kata sandi?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {showForgotHelper && authMode === 'signin' && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          Gunakan kata sandi akun workspace Anda (minimal 4 karakter) atau hubungi Administrator untuk mengatur ulang kredensial.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Remember Session Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-600">
                        Simpan sesi masuk di perangkat ini
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-sm shadow-indigo-600/20 transition-all cursor-pointer mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi Akses...</span>
                      </>
                    ) : authMode === 'signin' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Masuk ke Workspace</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Daftarkan & Masuk Workspace</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
