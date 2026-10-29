-- ========================================================
-- AIRA STUDIO AI - SUPABASE DATABASE SCHEMA
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ========================================================

-- 1. Tabel Links (Katalog Peluncur Tools)
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

-- 2. Tabel User Profiles (Manajemen Akun & Role)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'creator', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    avatar_bg TEXT DEFAULT 'bg-indigo-600',
    joined_date TIMESTAMPTZ DEFAULT now()
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS Links (Akses Publik Read, dan Full Access untuk Pengguna)
CREATE POLICY "Public Read Links" ON public.links
    FOR SELECT USING (true);

CREATE POLICY "Allow All Insert Links" ON public.links
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow All Update Links" ON public.links
    FOR UPDATE USING (true);

CREATE POLICY "Allow All Delete Links" ON public.links
    FOR DELETE USING (true);

-- 5. Kebijakan RLS User Profiles
CREATE POLICY "Public Read Profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow All Insert Profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow All Update Profiles" ON public.user_profiles
    FOR UPDATE USING (true);

CREATE POLICY "Allow All Delete Profiles" ON public.user_profiles
    FOR DELETE USING (true);

-- 6. Data Awal (Seeds) untuk Links
INSERT INTO public.links (title, description, url, category, tag, gradient_theme, clicks, is_favorite)
VALUES
    ('Affiliate UTM & Link Optimizer', 'Generator link pelacak cerdas dengan pemendek URL kustom dan parameter UTM otomatis.', 'https://track.airastudio.internal/affiliate-utm', 'affiliate', 'Pelacak & UTM', 'from-amber-500 to-orange-600', 1420, true),
    ('TikTok Shop Creator Trend Finder', 'Analisis produk viral terlaris dan perkiraan komisi per penjualan untuk kreator.', 'https://tools.airastudio.internal/tiktok-shop-creator', 'affiliate', 'Marketplace', 'from-rose-500 to-pink-600', 2890, true),
    ('DeepMotion AI 3D Rigger & Mocap', 'Ubah rekaman video biasa menjadi data gerak 3D karakter tanpa sensor fisik.', 'https://mocap.airastudio.internal/3d-rigging', 'animation', '3D Mocap', 'from-indigo-600 to-blue-600', 3410, true),
    ('Pika & Runway AI Cinematic Motion Suite', 'Generator klip video resolusi tinggi dari prompt teks dan gambar.', 'https://render.airastudio.internal/cinematic-motion', 'animation', 'AI Video', 'from-purple-600 to-indigo-600', 4120, true),
    ('NovelAI Narrative & Worldbuilder Studio', 'Asisten pembuat alur cerita panjang, ensiklopedia dunia fiksi, dan karakter.', 'https://story.airastudio.internal/worldbuilder', 'story', 'Novel & Fiksi', 'from-teal-600 to-emerald-700', 2340, true),
    ('Screenplay & Skenario Naskah Digital', 'Format standar skenario film/series dengan analisis ketukan emosi dan dialog.', 'https://script.airastudio.internal/skenario-studio', 'story', 'Skenario', 'from-sky-500 to-indigo-600', 1890, true)
ON CONFLICT DO NOTHING;

-- 7. Data Awal (Seeds) untuk User Profiles
INSERT INTO public.user_profiles (email, name, role, status, avatar_bg)
VALUES
    ('admin@airastudio.ai', 'Admin AIRA Studio', 'admin', 'active', 'bg-indigo-600'),
    ('kreator@airastudio.ai', 'Rian Pratama', 'creator', 'active', 'bg-emerald-600'),
    ('member@airastudio.ai', 'Budi Santoso', 'member', 'active', 'bg-amber-600')
ON CONFLICT (email) DO NOTHING;
