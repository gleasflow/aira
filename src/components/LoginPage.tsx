import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  LogIn, 
  LogOut, 
  Sparkles, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { UserItem, UserRole } from '../types';

interface LoginPageProps {
  currentUser: UserItem | null;
  onLogin: (email: string, role: UserRole) => void;
  onLogout: () => void;
  onNavigateToCatalog: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onNavigateToCatalog,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onLogin(email.trim(), role);
  };

  const handleQuickLogin = (quickRole: UserRole, quickEmail: string) => {
    onLogin(quickEmail, quickRole);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
      <div className="w-full max-w-md">
        {currentUser ? (
          /* Profile & Logged in State */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md shadow-indigo-600/20">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentUser.role === 'admin' ? 'Administrator' : 'Kreator Terdaftar'}</span>
            </span>

            <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Status Akun:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif & Terverifikasi</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Izin Akses:</span>
                <span className="font-semibold text-slate-800">
                  {currentUser.role === 'admin' ? 'Manajemen Penuh (Link & User)' : 'Peluncur Katalog'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bergabung Sejak:</span>
                <span className="font-mono text-slate-700">{currentUser.joinedDate}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={onNavigateToCatalog}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>Buka Katalog Tools</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Keluar Akun (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Masuk ke Studio</h2>
                <p className="text-xs text-slate-500">AIRA Studio AI — Akses Katalog & Manajemen</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@airastudio.ai"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran Akses Masuk
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  <option value="admin">Administrator (Akses Dashboard Penuh)</option>
                  <option value="creator">Kreator (Akses Tambah Tools)</option>
                  <option value="member">Pengguna Umum / Member</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </button>
            </form>

            {/* Quick Demo Shortcuts */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
                Atau Masuk Cepat (Akses Demo)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin@airastudio.ai')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Akun Admin</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kelola link & user</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('member', 'kreator@airastudio.ai')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Akun Member</span>
                  <span className="text-[10px] text-slate-400 font-normal">Peluncur katalog</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
