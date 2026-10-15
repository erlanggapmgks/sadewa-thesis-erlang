-- ============================================================
-- SADEWA — Notifikasi In-App untuk Admin & Kepala Desa
-- Jalankan SETELAH supabase/notifications.sql.
-- Aman diulang (CREATE OR REPLACE / IF EXISTS).
--
-- Perbedaan dengan notif warga:
--   • Notif warga ditujukan ke 1 orang (user_id pemilik surat).
--   • Notif staff ditujukan ke SEBUAH PERAN (semua admin / semua kades),
--     karena yang perlu bertindak adalah siapa pun yang memegang peran itu.
--
-- Mekanisme:
--   • Kolom baru `target_role` di tabel notifications.
--       - user_id terisi, target_role NULL  → notif personal (warga).
--       - user_id NULL, target_role terisi  → notif peran (admin/kades).
--   • Trigger yang sama (notify_on_request_status) diperluas agar, selain
--     notif ke warga, juga membuat notif peran saat progress surat berubah:
--       - status 'pending'      → notif ke admin  (pengajuan baru masuk)
--       - status 'kades_review' → notif ke kades  (perlu tanda tangan)
--       - status 'signed'       → notif ke admin  (perlu finalisasi)
--   • RLS & RPC diperbarui agar staff bisa membaca & menandai notif perannya.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. KOLOM target_role + relaksasi NOT NULL pada user_id
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_role TEXT
    CHECK (target_role IS NULL OR target_role IN ('admin', 'kepala_desa'));

-- Notif peran tidak punya user_id, jadi kolom ini harus boleh NULL.
ALTER TABLE public.notifications
  ALTER COLUMN user_id DROP NOT NULL;

-- Tiap notif harus menyasar SALAH SATU: user tertentu ATAU sebuah peran.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_target_chk;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_target_chk
    CHECK (user_id IS NOT NULL OR target_role IS NOT NULL);

CREATE INDEX IF NOT EXISTS notifications_role_created_idx
  ON public.notifications (target_role, created_at DESC)
  WHERE target_role IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- 2. RLS: staff membaca & menandai notif PERAN mereka
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "staff_read_role_notifications"   ON public.notifications;
DROP POLICY IF EXISTS "staff_update_role_notifications" ON public.notifications;

-- Admin/kades membaca notif yang menyasar perannya.
CREATE POLICY "staff_read_role_notifications" ON public.notifications
  FOR SELECT USING (
    target_role IS NOT NULL
    AND target_role = public.get_my_role()
  );

-- Admin/kades menandai (update) notif perannya sebagai dibaca.
CREATE POLICY "staff_update_role_notifications" ON public.notifications
  FOR UPDATE USING (
    target_role IS NOT NULL
    AND target_role = public.get_my_role()
  )
  WITH CHECK (
    target_role IS NOT NULL
    AND target_role = public.get_my_role()
  );


-- ────────────────────────────────────────────────────────────
-- 3. Teks notif untuk STAFF (judul/isi per status)
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.staff_notification_copy_for(TEXT);
CREATE OR REPLACE FUNCTION public.staff_notification_copy_for(p_status TEXT)
RETURNS TABLE (target_role TEXT, title TEXT, body TEXT)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT t.target_role, t.title, t.body FROM (VALUES
    ('pending',      'admin',       'Pengajuan surat baru',       'Ada pengajuan surat baru yang menunggu untuk ditinjau.'),
    ('kades_review', 'kepala_desa', 'Surat menunggu tanda tangan', 'Ada surat yang diteruskan dan menunggu tanda tangan Anda.'),
    ('signed',       'admin',       'Surat telah ditandatangani', 'Surat sudah ditandatangani Kepala Desa dan siap difinalisasi.')
  ) AS t(st, target_role, title, body)
  WHERE t.st = p_status;
$$;


-- ────────────────────────────────────────────────────────────
-- 4. TRIGGER diperluas: notif warga (seperti sebelumnya) + notif peran
--    Menggantikan versi di notifications.sql (tetap kompatibel).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title       TEXT;
  v_body        TEXT;
  v_role        TEXT;
  v_role_title  TEXT;
  v_role_body   TEXT;
BEGIN
  -- Pada UPDATE, hanya lanjut bila status BENAR berubah.
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- ── (a) Notif personal untuk WARGA pemilik surat ────────────────────────────
  IF NEW.user_id IS NOT NULL THEN
    SELECT title, body INTO v_title, v_body
    FROM public.notification_copy_for(NEW.status);

    IF v_title IS NULL THEN
      v_title := 'Status permohonan diperbarui';
      v_body  := 'Status permohonan surat Anda telah diperbarui.';
    END IF;

    INSERT INTO public.notifications (user_id, request_id, type, title, body, status)
    VALUES (NEW.user_id, NEW.id, 'status_update', v_title, v_body, NEW.status);
  END IF;

  -- ── (b) Notif untuk PERAN staff yang perlu bertindak ────────────────────────
  SELECT target_role, title, body
    INTO v_role, v_role_title, v_role_body
  FROM public.staff_notification_copy_for(NEW.status);

  IF v_role IS NOT NULL THEN
    INSERT INTO public.notifications (target_role, request_id, type, title, body, status)
    VALUES (v_role, NEW.id, 'staff_task', v_role_title, v_role_body, NEW.status);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger INSERT & UPDATE sudah dibuat di notifications.sql; fungsi di atas
-- menggantikan isinya sehingga keduanya langsung memakai logika baru.


-- ────────────────────────────────────────────────────────────
-- 5. RPC mark-read diperbarui agar mencakup notif PERAN
--    (warga: user_id = auth.uid; staff: target_role = get_my_role)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_notifications_read(ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = ANY(ids)
    AND read = false
    AND (
      user_id = auth.uid()
      OR target_role = public.get_my_role()
    );
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read(UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE read = false
    AND (
      user_id = auth.uid()
      OR target_role = public.get_my_role()
    );
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- ────────────────────────────────────────────────────────────
-- SELESAI
-- ────────────────────────────────────────────────────────────
