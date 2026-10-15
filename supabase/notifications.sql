-- ============================================================
-- SADEWA — Notifikasi In-App untuk Warga
-- Jalankan di Supabase SQL Editor (aman diulang — DROP IF EXISTS).
--
-- Konsep:
--   • Tabel `notifications` menyimpan notif per-user.
--   • TRIGGER di `service_requests` otomatis membuat notif setiap kali
--     status pengajuan berubah — ini sumber kebenaran tunggal, jadi
--     notif konsisten entah status diubah admin, kades, atau RPC
--     sign_letter.
--   • RLS: warga hanya bisa melihat & menandai notifnya sendiri.
--   • RPC mark_notification(s)_read dipakai klien untuk menandai dibaca.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. TABEL NOTIFICATIONS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id  UUID        REFERENCES public.service_requests(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL DEFAULT 'status_update',
  title       TEXT        NOT NULL,
  body        TEXT,
  status      TEXT,                       -- status surat saat notif dibuat (untuk warna/ikon)
  read        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_notifications"   ON public.notifications;
DROP POLICY IF EXISTS "owner_update_notifications" ON public.notifications;

-- Warga hanya membaca notifnya sendiri
CREATE POLICY "owner_read_notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Warga hanya boleh menandai (update) notifnya sendiri.
-- INSERT sengaja tidak diberi policy: notif HANYA dibuat oleh trigger
-- SECURITY DEFINER, bukan oleh klien.
CREATE POLICY "owner_update_notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 2. LABEL STATUS → judul/isi notif (konsisten dgn UI warga)
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.notification_copy_for(TEXT);
CREATE OR REPLACE FUNCTION public.notification_copy_for(p_status TEXT)
RETURNS TABLE (title TEXT, body TEXT)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT t.title, t.body FROM (VALUES
    ('pending',      'Permohonan diterima',        'Permohonan surat Anda telah kami terima dan sedang menunggu tinjauan admin.'),
    ('kades_review', 'Menunggu tanda tangan',      'Permohonan Anda telah diteruskan ke Kepala Desa untuk ditandatangani.'),
    ('signed',       'Surat telah ditandatangani', 'Surat Anda sudah ditandatangani Kepala Desa dan sedang difinalisasi admin.'),
    ('approved',     'Permohonan disetujui',       'Permohonan surat Anda telah disetujui.'),
    ('completed',    'Surat Anda sudah siap',      'Surat Anda telah selesai dan siap diunduh. Buka halaman Lacak Permohonan untuk melihatnya.'),
    ('rejected',     'Permohonan ditolak',         'Mohon maaf, permohonan surat Anda ditolak. Periksa catatan dari petugas untuk detailnya.')
  ) AS t(st, title, body)
  WHERE t.st = p_status;
$$;


-- ────────────────────────────────────────────────────────────
-- 3. TRIGGER: buat notif saat status pengajuan berubah
--    - AFTER INSERT  → notif "diterima" (status awal, biasanya pending)
--    - AFTER UPDATE  → notif hanya jika kolom status BENAR berubah
--    Notif hanya dibuat jika pengajuan punya user_id (bukan walk-in anonim).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
BEGIN
  -- Walk-in tanpa akun warga: tidak ada yang perlu dinotifikasi.
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Pada UPDATE, hanya lanjut bila status berubah.
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT title, body INTO v_title, v_body
  FROM public.notification_copy_for(NEW.status);

  -- Status tak dikenal → fallback generik, tetap kirim notif.
  IF v_title IS NULL THEN
    v_title := 'Status permohonan diperbarui';
    v_body  := 'Status permohonan surat Anda telah diperbarui.';
  END IF;

  INSERT INTO public.notifications (user_id, request_id, type, title, body, status)
  VALUES (NEW.user_id, NEW.id, 'status_update', v_title, v_body, NEW.status);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_request_insert ON public.service_requests;
CREATE TRIGGER trg_notify_request_insert
  AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_request_status();

DROP TRIGGER IF EXISTS trg_notify_request_status ON public.service_requests;
CREATE TRIGGER trg_notify_request_status
  AFTER UPDATE OF status ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_request_status();


-- ────────────────────────────────────────────────────────────
-- 4. RPC: tandai notif dibaca (hanya milik si pemanggil)
-- ────────────────────────────────────────────────────────────

-- 4a. Tandai sebagian notif (daftar id) sebagai dibaca.
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
    AND user_id = auth.uid()
    AND read = false;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read(UUID[]) TO authenticated;

-- 4b. Tandai SEMUA notif si pemanggil sebagai dibaca.
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
  WHERE user_id = auth.uid()
    AND read = false;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;


-- ────────────────────────────────────────────────────────────
-- 5. REALTIME (opsional tapi disarankan)
--    Agar klien menerima notif baru tanpa refresh, tambahkan tabel
--    ke publication realtime. Aman jika sudah ada.
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- SELESAI
-- ────────────────────────────────────────────────────────────
