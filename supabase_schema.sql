-- ========================================================
-- AIRA STUDIO AI - SUPABASE DATABASE & STORAGE SCHEMA
-- Salin dan jalankan skrip ini di SQL Editor dashboard Supabase Anda.
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

-- 3. Berikan Hak Akses Tabel ke Role anon & authenticated
GRANT ALL ON TABLE public.links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated, service_role;

-- 4. Aktifkan Row Level Security (RLS) & Kebijakan Akses Penuh (CRUD)
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Links" ON public.links;
DROP POLICY IF EXISTS "Allow All Insert Links" ON public.links;
DROP POLICY IF EXISTS "Allow All Update Links" ON public.links;
DROP POLICY IF EXISTS "Allow All Delete Links" ON public.links;
DROP POLICY IF EXISTS "Allow All CRUD Links" ON public.links;

CREATE POLICY "Allow All CRUD Links" ON public.links
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All Insert Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All Update Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All Delete Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow All CRUD Profiles" ON public.user_profiles;

CREATE POLICY "Allow All CRUD Profiles" ON public.user_profiles
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 5. Supabase Storage Bucket untuk Upload Thumbnail Link
INSERT INTO storage.buckets (id, name, public)
VALUES ('link-thumbnails', 'link-thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to link-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates and Deletions" ON storage.objects;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'link-thumbnails');

CREATE POLICY "Allow Uploads to link-thumbnails"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'link-thumbnails');

CREATE POLICY "Allow Updates and Deletions"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'link-thumbnails')
WITH CHECK (bucket_id = 'link-thumbnails');

-- 6. Data Awal (Seeds) untuk User Profiles
INSERT INTO public.user_profiles (id, email, name, role, status, avatar_bg)
VALUES
    ('00000000-0000-4000-8000-000000000001', 'admin@airastudio.ai', 'Admin AIRA Studio', 'admin', 'active', 'bg-indigo-600'),
    ('00000000-0000-4000-8000-000000000002', 'rian.creator@airastudio.ai', 'Rian Pratama', 'creator', 'active', 'bg-emerald-600'),
    ('00000000-0000-4000-8000-000000000003', 'siti.story@airastudio.ai', 'Siti Rahmawati', 'creator', 'active', 'bg-purple-600'),
    ('00000000-0000-4000-8000-000000000004', 'budi.affiliate@gmail.com', 'Budi Santoso', 'member', 'active', 'bg-amber-600'),
    ('00000000-0000-4000-8000-000000000005', 'dewi.anim@external.io', 'Dewi Lestari', 'member', 'suspended', 'bg-rose-600')
ON CONFLICT (email) DO NOTHING;
