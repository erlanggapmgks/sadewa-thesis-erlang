# SADEWA — Sistem Administrasi Desa Wates

Proyek tesis: "Rancang Bangun Sistem Smart Government Berbasis Kecerdasan Buatan untuk Otomatisasi Layanan Administrasi di Desa Wates."

**Stack:** React 19 · Vite · Tailwind CSS v4 · Supabase (Auth + PostgreSQL + Storage) · Google Gemini

---

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Tanpa file `.env`, aplikasi berjalan dalam **mode demo** — tidak perlu koneksi internet atau database.

**Akun demo:**

| Role   | Email            | Password   |
|--------|------------------|------------|
| Warga  | warga@demo.id    | demo1234   |
| Admin  | admin@demo.id    | demo1234   |

---

## Menghubungkan Supabase (database nyata)

### Langkah 1 — Buat project Supabase

1. Buka [supabase.com](https://supabase.com) → New Project
2. Catat **Project URL** dan **Anon Key** dari menu **Settings → API**

### Langkah 2 — Setup database

1. Buka **SQL Editor** di Supabase → New Query
2. Paste isi file `supabase/schema.sql` → klik **Run**
3. Semua tabel, RLS policy, dan trigger akan dibuat otomatis

### Langkah 3 — Buat bucket Storage

1. Buka menu **Storage** → **New Bucket**
2. Nama bucket: `documents`
3. Centang **Public bucket** → Save

### Langkah 4 — Konfigurasi `.env`

Salin `.env.example` menjadi `.env`, lalu isi dengan nilai dari Supabase:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_GEMINI_API_KEY=AIza...          # opsional — untuk fitur AI
```

### Langkah 5 — Buat akun admin pertama

1. Daftar melalui halaman `/register` menggunakan email admin
2. Buka **SQL Editor** Supabase, jalankan:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'email-admin-anda@contoh.com';
```

### Langkah 6 — (Opsional) Matikan konfirmasi email

Untuk pengujian: **Authentication → Settings → Email Confirmations → Off**
Aktifkan kembali sebelum deploy ke produksi.

---

## Struktur proyek

```
src/
  components/     # Komponen yang dipakai di banyak halaman
    citizen/        ChatAssistant (asisten AI floating)
    landing/        HeroSection, StatsSection, ServicesSection, ...
    layout/         Navbar, Footer
  context/        AuthContext — state user & role global
  data/           newsData.js — artikel berita statis
  hooks/          (hook kustom)
  layouts/        CitizenLayout, AdminLayout, AuthLayout
  pages/
    admin/          Dashboard, ManageRequests, RequestDetail,
                    ReportingPage, CitizensPage, ManageUsersPage,
                    SettingsPage, LetterPrintPage
    auth/           LoginPage, RegisterPage
    citizen/        DashboardPage, RequestDocumentPage,
                    TrackRequestPage, ProfilePage
    LandingPage, VillageProfilePage, BeritaPage,
    BeritaDetailPage, ContactPage, NotFoundPage
  routes/         routes.js (semua path), index.jsx (router), ProtectedRoute
  services/       supabase.js, authService.js, documentService.js
  utils/          constants.js, formatDate.js
supabase/
  schema.sql      SQL schema lengkap (jalankan sekali di Supabase)
```

---

## Layanan yang didukung

| Kode         | Jenis Surat                        | Estimasi |
|--------------|------------------------------------|----------|
| `domisili`   | Surat Keterangan Domisili          | 2–3 hari |
| `pengantar`  | Surat Pengantar                    | 1–2 hari |
| `sktm`       | Surat Keterangan Tidak Mampu       | 2–3 hari |
| `usaha`      | Surat Keterangan Usaha             | 3–5 hari |
| `kelahiran`  | Surat Keterangan Kelahiran         | 1–2 hari |
| `kematian`   | Surat Keterangan Kematian          | 1–2 hari |

---

## Status permohonan

`pending` → `approved` → `completed`  
atau  
`pending` → `rejected`
