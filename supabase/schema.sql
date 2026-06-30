-- ============================================================
-- SADEWA — Supabase Database Schema
-- Sistem Administrasi Desa Wates, Kulon Progo
-- (Aman dijalankan berulang kali — semua DROP IF EXISTS)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 0. HELPER FUNCTION
--    get_my_role() membaca role tanpa memicu RLS (SECURITY DEFINER)
--    sehingga policy admin tidak menyebabkan infinite recursion.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT '',
  email       TEXT,
  nik         TEXT        CHECK (nik IS NULL OR length(nik) = 16),
  role        TEXT        NOT NULL DEFAULT 'citizen'
                          CHECK (role IN ('citizen', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citizen_read_own_profile"    ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles"     ON public.profiles;
DROP POLICY IF EXISTS "citizen_update_own_profile"  ON public.profiles;
DROP POLICY IF EXISTS "admin_update_any_profile"    ON public.profiles;

-- Warga membaca profilnya sendiri
CREATE POLICY "citizen_read_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin membaca semua profil — pakai get_my_role() bukan subquery ke profiles
CREATE POLICY "admin_read_all_profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'admin');

-- Warga mengubah profilnya sendiri
CREATE POLICY "citizen_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin mengubah profil siapapun
CREATE POLICY "admin_update_any_profile" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- 2. TRIGGER: auto-create profile saat user mendaftar
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, nik, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'nik',
    'citizen'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 3. SERVICE_REQUESTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.service_requests (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_type            TEXT        NOT NULL
                          CHECK (service_type IN ('domisili','pengantar','sktm','usaha','kelahiran','kematian')),
  status                  TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected','completed')),
  purpose                 TEXT,
  ktp_url                 TEXT,
  kk_url                  TEXT,
  ai_reading_status       TEXT        DEFAULT 'pending'
                          CHECK (ai_reading_status IN ('pending','success','warning','error')),
  document_quality_status TEXT,
  admin_notes             TEXT,
  reviewed_by             UUID        REFERENCES public.profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citizen_read_own_requests"  ON public.service_requests;
DROP POLICY IF EXISTS "citizen_insert_own_request" ON public.service_requests;
DROP POLICY IF EXISTS "admin_read_all_requests"    ON public.service_requests;
DROP POLICY IF EXISTS "admin_update_requests"      ON public.service_requests;

CREATE POLICY "citizen_read_own_requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "citizen_insert_own_request" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_read_all_requests" ON public.service_requests
  FOR SELECT USING (public.get_my_role() = 'admin');

CREATE POLICY "admin_update_requests" ON public.service_requests
  FOR UPDATE USING (public.get_my_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- 4. EXTRACTED_DOCUMENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.extracted_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  full_name   TEXT,
  nik         TEXT,
  birth_date  TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.extracted_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citizen_read_own_extracted"     ON public.extracted_documents;
DROP POLICY IF EXISTS "authenticated_insert_extracted" ON public.extracted_documents;
DROP POLICY IF EXISTS "admin_read_all_extracted"       ON public.extracted_documents;

CREATE POLICY "citizen_read_own_extracted" ON public.extracted_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = extracted_documents.request_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated_insert_extracted" ON public.extracted_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_read_all_extracted" ON public.extracted_documents
  FOR SELECT USING (public.get_my_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- SELESAI
-- ────────────────────────────────────────────────────────────
