const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

// ── OCR ───────────────────────────────────────────────────────────────────────

const OCR_PROMPT = `Kamu adalah sistem OCR khusus untuk membaca KTP (Kartu Tanda Penduduk) Indonesia.

Baca gambar yang diberikan dan kembalikan HANYA JSON berikut tanpa penjelasan apapun:
{
  "quality": "good",
  "nama": "nama lengkap sesuai KTP",
  "nik": "16 digit NIK tanpa spasi atau tanda baca",
  "tempat_lahir": "kota/kabupaten tempat lahir",
  "tanggal_lahir": "format DD-MM-YYYY",
  "alamat": "alamat lengkap termasuk RT/RW, Kel/Desa, Kecamatan, Kab/Kota"
}

Aturan nilai "quality":
- "good"   → gambar jelas, semua field bisa dibaca
- "blurry" → gambar buram/gelap, sebagian field bisa dibaca
- "bad"    → bukan KTP atau tidak bisa dibaca sama sekali

Jika field tidak bisa dibaca isi dengan string kosong "".
Kembalikan HANYA JSON, tanpa markdown, tanpa kode blok, tanpa penjelasan.`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseOcrJson(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function tanggalToISO(ddmmyyyy) {
  if (!ddmmyyyy) return ''
  const [d, m, y] = ddmmyyyy.split('-')
  if (!d || !m || !y) return ddmmyyyy
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

export async function ocrDocument(file) {
  if (!API_KEY || API_KEY === 'your-gemini-api-key-here') {
    return null
  }

  try {
    const base64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: OCR_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const parsed = parseOcrJson(text)
    if (!parsed) return null

    return {
      quality: parsed.quality ?? 'good',
      nama: parsed.nama ?? '',
      nik: (parsed.nik ?? '').replace(/\D/g, ''),
      tempatLahir: parsed.tempat_lahir ?? '',
      tanggalLahir: tanggalToISO(parsed.tanggal_lahir),
      alamat: parsed.alamat ?? '',
    }
  } catch {
    return null
  }
}

const SYSTEM_PROMPT = `Anda adalah SADEWA Assistant, asisten virtual resmi layanan administrasi Desa Wates, Kabupaten Kulon Progo, Yogyakarta.

Tugas Anda adalah membantu warga dengan pertanyaan seputar layanan administrasi desa. Jawab dengan ramah, singkat, dan menggunakan Bahasa Indonesia yang mudah dipahami.

LAYANAN YANG TERSEDIA:

1. Surat Keterangan Domisili (estimasi 2–3 hari kerja)
   Persyaratan: KTP dan KK asli
   Kegunaan: Bukti tempat tinggal resmi untuk melamar kerja, membuka rekening bank, mendaftar sekolah, dll.

2. Surat Pengantar (estimasi 1–2 hari kerja)
   Persyaratan: KTP dan KK asli
   Kegunaan: Pengantar untuk keperluan umum ke instansi lain

3. Surat Keterangan Tidak Mampu / SKTM (estimasi 2–3 hari kerja)
   Persyaratan: KTP, KK asli, surat keterangan RT/RW
   Kegunaan: Pengajuan beasiswa, keringanan biaya pengobatan, bantuan sosial

4. Surat Keterangan Usaha (estimasi 3–5 hari kerja)
   Persyaratan: KTP, KK asli, foto tempat usaha
   Kegunaan: Legalitas usaha mikro/kecil, pengajuan KUR

5. Surat Keterangan Kelahiran (estimasi 1–2 hari kerja)
   Persyaratan: KTP orang tua, KK, surat keterangan dari bidan/dokter/rumah sakit
   Kegunaan: Pendaftaran akta kelahiran di Dinas Dukcapil

6. Surat Keterangan Kematian (estimasi 1–2 hari kerja)
   Persyaratan: KTP almarhum/almarhumah, KK, surat keterangan medis
   Kegunaan: Pengurusan administrasi kepergian

INFORMASI UMUM:
- Jam pelayanan: Senin–Jumat, 08.00–15.00 WIB
- Balai Desa Wates, Jl. Stasiun No. 5, Wates, Kulon Progo
- Cara mengajukan online: Login → Permohonan Baru → Pilih layanan → Unggah KTP & KK → Konfirmasi data AI → Kirim
- Status permohonan dapat dipantau di menu "Lacak Permohonan"

ATURAN PENTING:
- HANYA jawab pertanyaan yang berkaitan dengan layanan administrasi Desa Wates
- Jika ada pertanyaan di luar topik tersebut (politik, hiburan, hal pribadi, dll.), tolak dengan sopan: "Maaf, saya hanya bisa membantu seputar layanan administrasi Desa Wates."
- Jangan pernah memberikan informasi yang tidak ada dalam panduan ini
- Jawaban maksimal 3–4 kalimat, to the point`

// Demo responses for when no API key is configured
const DEMO_RESPONSES = [
  'Untuk mengajukan surat secara online, silakan klik menu **Permohonan Baru**, pilih jenis layanan, lalu unggah foto KTP dan KK Anda. Sistem AI kami akan membaca dokumen secara otomatis.',
  'Persyaratan umum pengajuan surat adalah **KTP dan KK asli** dalam kondisi jelas dan tidak buram. Beberapa layanan memerlukan dokumen tambahan.',
  'Estimasi waktu pengerjaan bervariasi: Surat Pengantar 1–2 hari, Surat Domisili 2–3 hari, dan Surat Keterangan Usaha 3–5 hari kerja.',
  'Status permohonan Anda dapat dipantau di menu **Lacak Permohonan**. Anda akan mendapatkan notifikasi ketika status berubah.',
  'Jam pelayanan Balai Desa Wates adalah **Senin–Jumat, 08.00–15.00 WIB**. Untuk layanan online, Anda bisa mengajukan kapan saja.',
]

let demoIndex = 0

export async function sendMessage(conversationHistory) {
  if (!API_KEY || API_KEY === 'your-gemini-api-key-here') {
    await new Promise(r => setTimeout(r, 900))
    const reply = DEMO_RESPONSES[demoIndex % DEMO_RESPONSES.length]
    demoIndex++
    return { ok: true, text: reply }
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        })),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { ok: false, text: 'Maaf, terjadi kesalahan. Coba lagi.' }
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Maaf, tidak ada respons.'
    return { ok: true, text }
  } catch {
    return { ok: false, text: 'Maaf, tidak dapat terhubung. Periksa koneksi internet Anda.' }
  }
}
