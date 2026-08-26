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
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 1)

  // Find the index of the line matching labelPattern
  function findLabelIndex(labelPattern) {
    return lines.findIndex(l => labelPattern.test(l))
  }

  // Extract the value on the same line after the first colon, plus any
  // continuation lines that follow (do not start with a known KTP label).
  // This handles multi-line Alamat that Tesseract wraps onto the next line(s).
  // Labels that mark the START of a new KTP field (used by extractMultilineValue
  // to know when to stop collecting continuation lines).
  // NOTE: RT/RW, Kel/Desa, Kecamatan are intentionally NOT here — they are part
  // of the address block and handled separately by the address assembler below.
  const KTP_LABEL = /^(NIK|Nama|Tempat|Tgl\.?|Lahir|Jenis|Gol\.|Alamat|Agama|Status|Pekerjaan|Kewarganegaraan|Berlaku|PROVINSI|KOTA|KABUPATEN)/i

  function extractMultilineValue(labelPattern) {
    const idx = findLabelIndex(labelPattern)
    if (idx < 0) return ''

    const firstLine = lines[idx]
    const colonIdx = firstLine.indexOf(':')
    let value = colonIdx >= 0 ? firstLine.slice(colonIdx + 1).trim() : ''

    // Collect continuation lines until the next KTP field label
    for (let i = idx + 1; i < lines.length; i++) {
      const next = lines[i]
      if (KTP_LABEL.test(next)) break          // next field starts → stop
      if (next.length < 2) break                // empty line → stop
      if (/^\d{16}$/.test(next)) break          // looks like a NIK row → stop
      value = (value + ' ' + next).trim()
    }
    return value
  }

  // NIK: 16 consecutive digits anywhere in the full text
  const fullText = lines.join(' ')
  const nikMatch = fullText.match(/\b(\d{16})\b/)
  const nik = nikMatch ? nikMatch[1] : ''

  // Nama: trim trailing OCR noise (e.g. "BAGAS PRATAMA 9" → "BAGAS PRATAMA")
  const namaRaw = extractMultilineValue(/^Nama\s*:/i)
  const nama = namaRaw
    .replace(/\s+\d[\d\s]*$/, '')            // remove trailing digits
    .replace(/\s+[a-z]{1,2}(?:\s|$)/ig, ' ') // remove stray short tokens
    .replace(/[^a-zA-Z\s'.,-]/g, '')         // keep only name-safe characters
    .trim()

  // Tempat/Tgl Lahir: "MALANG, 12-01-1999 oe" → split on date pattern
  const ttlRaw = extractMultilineValue(/(?:Tempat.*Lahir|Tgl.*Lahir|Lahir)\s*:/i)
  const dateMatch = ttlRaw.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/)
  const tanggalLahir = dateMatch ? dateToISO(dateMatch[1]) : ''
  const tempatLahir = dateMatch
    ? ttlRaw.slice(0, ttlRaw.indexOf(dateMatch[1])).replace(/[,\s]+$/, '').trim()
    : ttlRaw.trim()

  // ── Alamat: KTP splits the address across several dedicated label rows ──────
  // Layout on a real/dummy KTP:
  //   Alamat  : Jl. Wates Raya No. 5          ← street name (may continue)
  //   RT/RW   : 002/003
  //   Kel/Desa: Wates
  //   Kecamatan: Tanjunganom
  //   Agama   : Islam                          ← address section ends here
  //
  // We gather every address-related segment and stitch them together.

  function extractAfterColon(line) {
    const idx = line.indexOf(':')
    return idx >= 0 ? line.slice(idx + 1).trim() : line.trim()
  }

  // Clean a single address segment:
  //  - remove characters that never appear in Indonesian addresses
  //  - strip trailing OCR noise tokens (short junk words, lone digits, stray letters)
  //    BUT protect house-number patterns like "NO. 130", "No 20A", "Nomor 5" etc.
  function cleanSegment(s) {
    if (!s) return ''
    // Step 0: If the segment is PURELY digits (1-5 chars), it's probably a wrapped
    // house number line (e.g. OCR put "130" on its own line). Keep it as-is.
    if (/^\d{1,5}$/.test(s.trim())) return s.trim()

    // Step 1: Protect house-number patterns by temporarily replacing them
    // with a safe placeholder so the trailing-noise regex won't touch them.
    const HOUSE_MARKER = '__SADEWA_HOUSE__'
    const housePattern = /\b(?:No|Nomor|NOMOR|no|nomor|NO)\s*\.?\s*(\d+[A-Za-z]?)\b/g
    const savedNumbers = []
    const protectedStr = s.replace(housePattern, (match) => {
      savedNumbers.push(match)
      return `${HOUSE_MARKER}_${savedNumbers.length - 1}__`
    })

    const cleaned = protectedStr
      .replace(/\s*:\s*/g, ' ')                // stray colon artifacts
      .replace(/[^a-zA-Z0-9\s/.,'_-]/g, ' ')  // keep address-safe chars only (added _ for marker)
      .replace(/\s{2,}/g, ' ')
      .trim()
      // Strip trailing noise: isolated short tokens (1-2 chars) or lone numbers
      // that don't look like RT/RW digits or house numbers.
      // e.g. "DESA WATES WW i" → "DESA WATES", "TANJUNGANOM on 4" → "TANJUNGANOM"
      .replace(/(\s+[a-zA-Z]{1,2})+\s*$/g, '')   // trailing stray short words
      .replace(/(\s+\d{1,3})+\s*$/g, '')          // trailing lone numbers (1-3 digit only)
      .trim()

    // Step 3: Restore the protected house-number patterns
    return cleaned.replace(new RegExp(`${HOUSE_MARKER}_(\\d+)__`, 'g'), (_, idx) => {
      return savedNumbers[parseInt(idx, 10)] || ''
    }).trim()
  }

  // For RT/RW: extract only the digit pair, ignore any surrounding noise
  function extractRtRw(line) {
    const raw = extractAfterColon(line)
    // Match the first occurrence of digits/digits — the actual RT/RW value
    const match = raw.match(/(\d{1,3})\s*\/\s*(\d{1,3})/)
    if (match) return `RT ${match[1].padStart(3, '0')}/RW ${match[2].padStart(3, '0')}`
    return cleanSegment(raw)
  }

  // For place names (Kel/Desa, Kecamatan, Kabupaten): keep only the first
  // "word run" that looks like a place name — uppercase/title-case letters,
  // stopping at the first clearly-noise token.
  // IMPORTANT: BLACKLIST common KTP label words — NEVER treat "Kecamatan",
  // "Desa", "Kabupaten" etc as if they were the actual place name!
  const KTP_LABEL_BLACKLIST = new Set([
    'rt','rw','rtrw','kel','keldesa','kelurahan','desa','kec','kecamatan',
    'kecmal','kecomatan','kecmatan','kecamtan','kab','kabupaten','kabpaten','kabupeten',
    'kota','prov','provinsi','agama','status','perkawinan','pekerjaan',
    'kewarganegaraan','berlaku','hingga','golong','darah','jenis','kelamin',
    'nik','nama','tempat','lahir','tgl','tanggal','alamat','ktp','nikah',
    'kawin','bkn','wn','wni','wna','islam','kristen','katolik','hindu','budha','konghucu'
  ])

  function extractPlaceName(line) {
    const raw = cleanSegment(extractAfterColon(line))
    const tokens = raw.split(/\s+/)
    const placeTokens = []
    for (const t of tokens) {
      const tl = t.toLowerCase()
      // Hard rule: skip any token that is a known KTP label word
      if (KTP_LABEL_BLACKLIST.has(tl)) {
        // If we already collected real place tokens, stop here (label usually comes before place name —
        // but if it comes after, stopping keeps the real place only).
        if (placeTokens.length > 0) break
        continue
      }
      // Accept tokens that are mostly letters, length ≥ 3, hyphens allowed (e.g. "Pulo-Kerto")
      if (/^[a-zA-Z][a-zA-Z-]{2,}$/.test(t)) {
        placeTokens.push(t)
      } else if (/^\d+$/.test(t) && placeTokens.length === 0) {
        // Leading digits before any word — skip
        continue
      } else if (/^[a-zA-Z]{1,2}$/.test(t) && placeTokens.length > 0 &&
                 /^(DI|KE|SRI|KU|DU|WE|WO|MA|MO|TO|TE|BO|BE|GO|GE|LO|LE)$/i.test(t)) {
        // Common 2-char Indonesian place name particles (e.g. "DI" in "DI Yogyakarta")
        placeTokens.push(t)
      } else {
        if (placeTokens.length > 0) break
      }
    }
    return placeTokens.length > 0 ? placeTokens.join(' ') : raw
  }

  // Helper: extract place name from a labeled line.
  // If the labeled line yielded only empty/label (OCR split label↔value across 2 lines),
  // try the NEXT line as long as it's not another KTP label.
  function extractPlaceFromLabeledLine(lineIdx) {
    if (lineIdx < 0 || lineIdx >= lines.length) return ''
    const fromLabel = extractPlaceName(lines[lineIdx])
    // If we got a non-empty and non-label-like value, use it
    const fromLabelClean = (fromLabel || '').trim()
    if (fromLabelClean && !KTP_LABEL_BLACKLIST.has(fromLabelClean.toLowerCase())) {
      return fromLabelClean
    }
    // Empty or just label — try the NEXT line (common when OCR splits rows)
    const nextIdx = lineIdx + 1
    if (nextIdx < lines.length) {
      const nextLine = lines[nextIdx]
      const nextStripped = nextLine.toLowerCase().replace(/[\s:.-]/g, '')
      // Only use next line if it's NOT the start of another KTP label field
      if (!nextStripped.match(/^(agama|status|perkawinan|pekerjaan|kewarganegaraan|berlaku|hingga|golong|jenis|kelamin|nik|nama|tempat|lahir|tgl|tanggal|kab|kota|prov|kec|kel|desa|rt|rw)/)) {
        const fromNext = extractPlaceName(nextLine)
        if (fromNext && fromNext.trim() && !KTP_LABEL_BLACKLIST.has(fromNext.trim().toLowerCase())) {
          return fromNext.trim()
        }
      }
    }
    // Fallback: return the labeled value even if empty; caller decides
    return fromLabelClean
  }

  // Fuzzy label search — tolerant of common OCR typos:
  //   Kecamatan → Kecamalan, Kecomatan, Kecamatan. (dot), Kec. (short), Kec : (spaces)
  function findLineByFuzzyLabel(labels, minConfidence = 0.6) {
    // labels is array: [{ prefix: 'Kecamatan', variants: ['kec','kecam','kecamatan','kecmal','kecomatan'] }]
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().replace(/[\s:.-]/g, '')
      for (const def of labels) {
        for (const v of def.variants) {
          if (line.startsWith(v) || line.includes(v + ':')) {
            return { index: i, line: lines[i], label: def.prefix }
          }
        }
      }
    }
    return null
  }

  // 1. Street line — first line of the Alamat field
  const alamatIdx = lines.findIndex(l => /^Alamat\s*:/i.test(l))
  const addressParts = []

  if (alamatIdx >= 0) {
    const streetValue = extractAfterColon(lines[alamatIdx])
    if (streetValue) addressParts.push(cleanSegment(streetValue))

    // Collect any continuation lines that are NOT a known label
    // (handles street names that wrap onto the next line)
    // NOTE: Use fuzzy label detection for Kecamatan, Kel/Desa etc to avoid
    // treating a typoed-label line as street continuation.
    function isAddressBreakLine(l) {
      const stripped = l.toLowerCase().replace(/[\s:.-]/g, '')
      return stripped.match(/^(rt|rtrw|kel|keldesa|kelurahan|desa|kec|kecmal|kecomatan|kecamatan|agama|status|pekerjaan|kewarganegaraan|berlaku|golong|jeniskelamin|nik|nama|tempat|tgl|lahir)/)
    }

    for (let i = alamatIdx + 1; i < lines.length; i++) {
      if (isAddressBreakLine(lines[i])) break
      if (lines[i].length < 2) break
      addressParts.push(cleanSegment(lines[i]))
    }
  }

  // 2. RT/RW line — e.g. "RT/RW : 002/003"
  const rtRwLine = lines.find(l => /^RT[\s/]?RW\s*:/i.test(l) || /^RT\s*\/\s*RW\s*:/i.test(l))
  if (rtRwLine) {
    const rtRwVal = extractRtRw(rtRwLine)
    if (rtRwVal) addressParts.push(rtRwVal)
  }

  // 3. Kel/Desa — e.g. "Kel/Desa : Wates"  (use fuzzy for Desa/Kel prefix)
  const kelDesaMatch = findLineByFuzzyLabel([
    { prefix: 'Kel/Desa', variants: ['kel','keldesa','desa','kelurahan','keldes'] },
  ])
  const kelDesaLine = kelDesaMatch ? kelDesaMatch.line : null
  let kelDesaIdx = kelDesaMatch ? kelDesaMatch.index : -1
  if (!kelDesaLine) {
    const fallback = lines.find(l => /^Kel[\s/]?Desa\s*:/i.test(l) || /^Desa\s*:/i.test(l) || /^Kelurahan\s*:/i.test(l))
    if (fallback) {
      kelDesaIdx = lines.indexOf(fallback)
    }
  }
  if (kelDesaIdx >= 0) {
    const kelVal = extractPlaceFromLabeledLine(kelDesaIdx)
    if (kelVal) addressParts.push(kelVal)
  } else if (kelDesaLine) {
    const kelVal = extractPlaceName(kelDesaLine)
    if (kelVal) addressParts.push(kelVal)
  }

  // 4. Kecamatan — use fuzzy label search, with positional fallback
  //    Common OCR fails: "Kecamalan", "Kecomatan", "Kecamatan." (dot), "Kec :", or NO LABEL AT ALL
  //    (Kecamatan name sits right between Kel/Desa line and Agama/Kab line)
  let kecamatanName = ''
  const kecMatch = findLineByFuzzyLabel([
    { prefix: 'Kecamatan', variants: ['kec','kecam','kecamatan','kecmal','kecomatan','kecmatan','kecamtan'] },
  ])
  let kecIdx = kecMatch ? kecMatch.index : lines.findIndex(l => /^Kecamatan\s*:/i.test(l))

  if (kecIdx >= 0) {
    // Use helper — if label line has no value (e.g. line is ONLY "Kecamatan"), try line[idx+1]
    kecamatanName = extractPlaceFromLabeledLine(kecIdx)
    // Final safety: if what we got is STILL just a label word (e.g. blacklisted), clear it and go to fallback
    if (kecamatanName && KTP_LABEL_BLACKLIST.has(kecamatanName.toLowerCase())) {
      kecamatanName = ''
    }
  }

  // If label search or line+1 didn't yield a real kecamatan name → positional fallback
  if (!kecamatanName) {
    const startIdx = kelDesaIdx >= 0 ? kelDesaIdx + 1
                   : rtRwLine ? lines.indexOf(rtRwLine) + 1
                   : -1
    if (startIdx >= 0) {
      const END_MARK = /^(Agama|Status|Pekerjaan|Kewarganegaraan|Berlaku|Kabupaten|Kota|Kab\.?|PROVINSI|Provinsi|Jenis|Gol\.?|NIK|Nama|Tempat|Lahir|Tgl\.?)/i
      for (let i = startIdx; i < lines.length; i++) {
        if (END_MARK.test(lines[i])) break
        if (lines[i].length < 2) continue
        // Skip pure RT/RW patterns (already handled)
        if (/^\d{1,3}\s*\/\s*\d{1,3}$/.test(lines[i].trim())) continue
        const cand = extractPlaceName(lines[i])
        if (cand && !KTP_LABEL_BLACKLIST.has(cand.toLowerCase()) && !/^(RT|RW|Alamat)$/i.test(cand)) {
          kecamatanName = cand
          kecIdx = i
          break
        }
      }
    }
  }
  if (kecamatanName) addressParts.push(kecamatanName)

  // 5. Kabupaten/Kota — sometimes printed as a standalone line below Kecamatan
  const kabMatch = findLineByFuzzyLabel([
    { prefix: 'Kabupaten', variants: ['kab','kabupaten','kabpaten','kabupeten','kota'] },
  ])
  let kabIdx = -1
  if (kabMatch) kabIdx = kabMatch.index
  let kabLine = kabMatch ? kabMatch.line : null
  if (!kabLine) {
    kabLine = lines.find(l => /^(Kabupaten|Kota|Kab\.?)\s*[:.]?\s*/i.test(l))
    if (kabLine) kabIdx = lines.indexOf(kabLine)
  }
  if (kabIdx >= 0) {
    const kabVal = extractPlaceFromLabeledLine(kabIdx)
    if (kabVal) addressParts.push(kabVal)
  } else if (kabLine) {
    const kabVal = extractPlaceName(kabLine)
    if (kabVal) addressParts.push(kabVal)
  }

  const alamat = addressParts.filter(Boolean).join(', ')

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

