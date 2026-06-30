import { createWorker } from 'tesseract.js'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

// ── Tesseract OCR (primary engine — no API key needed) ────────────────────────

function dateToISO(str) {
  if (!str) return ''
  const m = str.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)
  if (!m) return str
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseKTPText(raw) {
  // Line-by-line approach: more robust against OCR noise on KTP documents
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 2)

  // Find the value after the first colon on a matching label line
  function extractValue(labelPattern) {
    const line = lines.find(l => labelPattern.test(l))
    if (!line) return ''
    const colonIdx = line.indexOf(':')
    return colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : ''
  }

  // NIK: 16 consecutive digits anywhere in the full text
  const fullText = lines.join(' ')
  const nikMatch = fullText.match(/(\d{16})/)
  const nik = nikMatch ? nikMatch[1] : ''

  // Nama: trim trailing OCR noise (e.g. "BAGAS PRATAMA 9" → "BAGAS PRATAMA")
  const namaRaw = extractValue(/^Nama\s*:/i)
  const nama = namaRaw
    .replace(/\s+\d[\d\s]*$/, '')   // remove trailing digits
    .replace(/\s+[a-z]{1,2}$/i, '') // remove trailing stray chars
    .trim()

  // Tempat/Tgl Lahir: "MALANG, 12-01-1999 oe" → split on date
  const ttlRaw = extractValue(/Lahir\s*:/i)
  const dateMatch = ttlRaw.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/)
  const tanggalLahir = dateMatch ? dateToISO(dateMatch[1]) : ''
  const tempatLahir = dateMatch
    ? ttlRaw.slice(0, ttlRaw.indexOf(dateMatch[1])).replace(/[,\s]+$/, '').trim()
    : ttlRaw.trim()

  // Alamat: "DESA WATES : : A ey" → keep only part before double-colon noise
  const alamatRaw = extractValue(/^Alamat\s*:/i)
  const alamat = alamatRaw.split(/\s*:\s*[^a-zA-Z0-9]/)[0].trim()

  const found = [nik, nama, alamat].filter(Boolean).length
  const quality = found >= 2 ? 'good' : found === 1 ? 'blurry' : 'bad'

  console.log(`[SADEWA OCR] Tesseract parsed → quality:${quality} | nik:${nik} | nama:${nama} | ttl:${tempatLahir},${tanggalLahir} | alamat:${alamat}`)
  return { quality, nama, nik, tempatLahir, tanggalLahir, alamat }
}

async function ocrWithTesseract(file) {
  console.log('[SADEWA OCR] Starting Tesseract...')
  const url = URL.createObjectURL(file)
  try {
    const worker = await createWorker('ind+eng', 1, {
      logger: m => { if (m.status === 'recognizing text') console.log('[SADEWA OCR] Progress:', Math.round(m.progress * 100) + '%') },
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-lstm.wasm.js',
    })
    const { data: { text } } = await worker.recognize(url)
    await worker.terminate()
    console.log('[SADEWA OCR] Tesseract raw text:\n', text)
    return parseKTPText(text)
  } catch (err) {
    console.error('[SADEWA OCR] Tesseract failed:', err)
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ── Gemini OCR (secondary — requires working API key) ─────────────────────────

const OCR_PROMPT = `Kamu adalah sistem OCR khusus untuk membaca KTP (Kartu Tanda Penduduk) Indonesia, termasuk KTP asli maupun KTP dummy/template untuk keperluan pengujian sistem.

Tugas kamu: baca gambar KTP dan ekstrak datanya, lalu kembalikan HANYA JSON berikut tanpa penjelasan apapun:
{
  "quality": "good",
  "nama": "nama lengkap sesuai KTP",
  "nik": "16 digit NIK tanpa spasi atau tanda baca",
  "tempat_lahir": "kota/kabupaten tempat lahir",
  "tanggal_lahir": "format DD-MM-YYYY",
  "alamat": "alamat lengkap termasuk RT/RW, Kel/Desa, Kecamatan, Kab/Kota"
}

Aturan nilai "quality":
- "good"   → gambar jelas, semua field bisa dibaca (termasuk KTP dummy/template)
- "blurry" → gambar buram, gelap, atau terpotong sehingga sebagian field tidak terbaca
- "bad"    → bukan dokumen KTP sama sekali atau tidak bisa dibaca

Catatan penting:
- KTP dummy/template untuk pengujian tetap dianggap valid, baca datanya apa adanya
- NIK harus berisi tepat 16 angka, buang semua spasi dan tanda baca
- Jika tanggal lahir tidak dalam format DD-MM-YYYY, konversikan
- Jika field tidak terbaca sama sekali, isi dengan string kosong ""
- Kembalikan HANYA JSON murni, tanpa markdown, tanpa blok kode, tanpa komentar`

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
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

async function ocrWithGemini(file) {
  try {
    const base64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: OCR_PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[SADEWA OCR] Gemini unavailable:', err?.error?.message ?? res.status, '— falling back to Tesseract')
      return null
    }

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

// ── Public OCR entry point ────────────────────────────────────────────────────
// Strategy: Gemini first (if key is valid) → Tesseract.js → null (mock fallback)

export async function ocrDocument(file) {
  // 1. Try Gemini when API key looks configured
  if (API_KEY && API_KEY !== 'your-gemini-api-key-here') {
    const geminiResult = await ocrWithGemini(file)
    if (geminiResult) return geminiResult
  }

  // 2. Tesseract.js — works offline, no API key needed
  return ocrWithTesseract(file)
}

