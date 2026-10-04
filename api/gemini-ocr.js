// Vercel Serverless Function — proxy OCR requests to Google Gemini.
//
// WHY THIS EXISTS:
// The Gemini API key must NEVER ship to the browser. A key with the VITE_ prefix
// gets inlined into the frontend bundle and is visible to anyone who opens
// DevTools. This function keeps the key server-side: the browser calls THIS
// endpoint (/api/gemini-ocr), and only the server talks to Google with the key.
//
// Set the key in Vercel → Settings → Environment Variables as:  GEMINI_API_KEY
// (no VITE_ prefix — that keeps it server-only).

const OCR_PROMPT = `Kamu adalah mesin OCR untuk KTP (Kartu Tanda Penduduk) Indonesia.

Lihat gambar KTP dan ekstrak data berikut. Kembalikan HANYA JSON di bawah ini, tanpa penjelasan, tanpa markdown:
{
  "quality": "good",
  "nama": "teks tepat setelah label Nama :",
  "nik": "16 angka tepat setelah label NIK : (hapus semua spasi)",
  "tempat_lahir": "nama kota sebelum koma pada baris Tempat/Tgl Lahir",
  "tanggal_lahir": "tanggal lahir format DD-MM-YYYY dari baris yang sama",
  "alamat": "nama jalan/dusun (baris Alamat), RT xxx RW xxx, Kel/Desa, Kecamatan, Kabupaten/Kota"
}

Aturan quality: "good" = semua field terbaca, "blurry" = sebagian terbaca, "bad" = bukan KTP.

Panduan penting:
- Kartu memiliki pola guilloche (tulisan "KARTU TANDA PENDUDUK" berulang diagonal) — ABAIKAN, fokus pada teks label dan nilainya
- Pojok kanan bawah ada tanggal penerbitan dan tanda tangan — ABAIKAN, bukan tanggal lahir
- NIK tepat 16 digit — baca satu per satu dengan teliti
- Baris Tempat/Tgl Lahir berisi KOTA lalu TANGGAL dipisah koma: pisahkan ke dua field yang berbeda
- Field alamat: susun SEMUA komponen dengan format lengkap berikut:
  → Jalan/Dusun: teks dari baris Alamat (misal "DESA WATES", "JL. MERDEKA NO. 5", "DSUN KRAJAN")
  → RT dan RW: ambil angka dari baris RT/RW, tulis "RT 002 RW 002" (3 digit, pisah spasi)
  → Kel/Desa: nama dari baris Kel/Desa
  → Kecamatan: nama dari baris Kecamatan
  → Kabupaten/Kota: dari header atas kartu (baris KABUPATEN ... atau KOTA ...)
  → Contoh hasil: "DESA WATES, RT 002 RW 002, WATES, TANJUNGANOM, NGANJUK"
  → Contoh hasil lain: "JL. MERDEKA NO. 5, RT 001 RW 003, KARANGREJO, TULUNGAGUNG, TULUNGAGUNG"
  → Jika baris Alamat kosong atau tidak terbaca, mulai dari RT/RW
- Jika field tidak terbaca, isi string kosong ""`

const MODEL = 'gemini-3.6-flash'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[api/gemini-ocr] GEMINI_API_KEY is not set')
    return res.status(500).json({ error: 'OCR service not configured' })
  }

  // Vercel parses JSON bodies automatically, but guard against string bodies too.
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const { imageBase64, mimeType } = body ?? {}
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' })
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

  try {
    const googleRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: OCR_PROMPT },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              quality:       { type: 'STRING' },
              nama:          { type: 'STRING' },
              nik:           { type: 'STRING' },
              tempat_lahir:  { type: 'STRING' },
              tanggal_lahir: { type: 'STRING' },
              alamat:        { type: 'STRING' },
            },
            required: ['quality', 'nama', 'nik', 'tempat_lahir', 'tanggal_lahir', 'alamat'],
          },
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })

    if (!googleRes.ok) {
      const errBody = await googleRes.json().catch(() => ({}))
      // Do not leak the upstream error verbatim to the client; log it server-side.
      console.warn('[api/gemini-ocr] Gemini error:', errBody?.error?.message ?? googleRes.status)
      return res.status(502).json({ error: 'Gemini request failed' })
    }

    const data = await googleRes.json()
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const text = parts.map(p => p.text ?? '').join('')

    if (!text) {
      return res.status(502).json({ error: 'Gemini empty response' })
    }

    // Return just the model's JSON text; the client parses + post-processes it
    // exactly as before (NIK repair, date selection, RT/RW normalisation).
    return res.status(200).json({ text })
  } catch (err) {
    console.error('[api/gemini-ocr] Unexpected error:', err?.message ?? err)
    return res.status(500).json({ error: 'OCR request failed' })
  }
}
