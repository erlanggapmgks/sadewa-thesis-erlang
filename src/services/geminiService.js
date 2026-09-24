import { createWorker } from 'tesseract.js'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`

// ── Tesseract OCR (fallback engine — offline, no API key needed) ─────────────

const BULAN_ID = {
  januari:1, februari:2, maret:3, april:4, mei:5, juni:6,
  juli:7, agustus:8, september:9, oktober:10, november:11, desember:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, agu:8, sep:9, okt:10, nov:11, des:12,
}

function dateToISO(str) {
  if (!str) return ''
  // DD-MM-YYYY or DD/MM/YYYY (allow spaces around separator)
  const numMatch = str.match(/(\d{1,2})\s*[-\/]\s*(\d{1,2})\s*[-\/]\s*(\d{4})/)
  if (numMatch) {
    const [, d, mo, y] = numMatch
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // DD MMMM YYYY or DD-MMMM-YYYY (Indonesian month names)
  const nameMatch = str.match(/(\d{1,2})\s*[-\s]\s*([a-zA-Z]{3,})\s*[-\s]\s*(\d{4})/)
  if (nameMatch) {
    const mo = BULAN_ID[nameMatch[2].toLowerCase()]
    if (mo) return `${nameMatch[3]}-${String(mo).padStart(2, '0')}-${nameMatch[1].padStart(2, '0')}`
  }
  return str
}

// Extract birth date encoded in the NIK (digits 7-12: DDMMYY, females: day+40)
function dateFromNIK(nik) {
  if (!nik || nik.length !== 16) return ''
  let day = parseInt(nik.slice(6, 8), 10)
  const month = nik.slice(8, 10)
  const yr = parseInt(nik.slice(10, 12), 10)
  if (day > 40) day -= 40
  const year = yr + (yr <= 30 ? 2000 : 1900)
  return `${year}-${month}-${String(day).padStart(2, '0')}`
}

// Pick the best birth date between an OCR-read date and a NIK-derived date.
// KTP cards also print a signing/issuance date (e.g. "16-07-2021") — OCR can pick
// that up instead of the birth date. Filter it out by checking the year: a valid
// Indonesian birth year on a KTP must be ≥ 1920 and ≤ (current year − 15) because
// the minimum age for a KTP is 17.
function selectBestDate(ocrDate, nikDate) {
  const maxBirthYear = new Date().getFullYear() - 15
  const ocrYear = parseInt((ocrDate || '').split('-')[0], 10)
  const ocrIsPlausible = ocrYear >= 1920 && ocrYear <= maxBirthYear
  if (ocrDate && ocrIsPlausible) return ocrDate
  return nikDate || ocrDate
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
  const KTP_LABEL = /^(NIK|Nama|Tempat|Tgl\.?|Lahir|Jenis|Gol\.|Alam[a-z]{0,3}t?|Agama|Status|Pekerjaan|Kewarganegaraan|Berlaku|PROVINSI|KOTA|KABUPATEN)/i

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

  // NIK: 16 consecutive digits anywhere in the full text.
  // Fallback: grayscale preprocessing can cause Tesseract to insert spaces between
  // digit groups, so also search the NIK label line with all non-digits stripped.
  const fullText = lines.join(' ')
  let nik = (fullText.match(/\b(\d{16})\b/) || [])[1] || ''
  if (!nik) {
    // Tesseract sometimes splits label and value onto separate lines, or inserts
    // spaces between digit groups. Grab the NIK line + the next line, strip all
    // non-digits, and take the first 16 digits found.
    const nikIdx = lines.findIndex(l => /^NIK\b/i.test(l))
    if (nikIdx >= 0) {
      const nikContext = lines.slice(nikIdx, nikIdx + 2).join(' ')
      const digits = nikContext.replace(/\D/g, '')
      if (digits.length >= 16) nik = digits.slice(0, 16)
    }
  }

  // Nama: trim trailing OCR noise (e.g. "BAGAS PRATAMA 9" → "BAGAS PRATAMA")
  const namaRaw = extractMultilineValue(/^Nama\s*:/i)
  const nama = namaRaw
    .replace(/\s+\d[\d\s]*$/, '')            // remove trailing digits
    .replace(/\s+[a-z]{1,2}(?:\s|$)/ig, ' ') // remove stray short tokens
    .replace(/[^a-zA-Z\s'.,-]/g, '')         // keep only name-safe characters
    .trim()

  // Tempat/Tgl Lahir — colon is optional (real KTP OCR sometimes drops it)
  const ttlRaw = extractMultilineValue(/(?:Tempat\s*[\/]?\s*Tgl\.?\s*Lahir|Tempat.*Lahir|Tgl\.?\s*Lahir|Lahir)\s*:?/i)

  // Try numeric date (allow spaces around separators: "10 - 07 - 2004")
  const numDateMatch = ttlRaw.match(/(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{4})/)
  // Try Indonesian month-name date ("10 JULI 2004", "4 Agustus 1995")
  const bulanPattern = Object.keys(BULAN_ID).join('|')
  const nameMonthMatch = ttlRaw.match(new RegExp(`(\\d{1,2}\\s+(?:${bulanPattern})\\s+\\d{4})`, 'i'))

  const dateStr = numDateMatch?.[1] || nameMonthMatch?.[1] || ''

  const tanggalLahirOCR = dateStr ? dateToISO(dateStr) : ''
  const tanggalLahirNIK = nik ? dateFromNIK(nik) : ''
  // Prefer the OCR date when its year is a plausible birth year (filters out the
  // card-signing date that sometimes appears at the bottom of real KTPs).
  // Fall back to NIK-derived date when OCR date is absent or out of range.
  const tanggalLahir = selectBestDate(tanggalLahirOCR, tanggalLahirNIK)

  // tempatLahir can only be split from ttlRaw when the date delimiter is present.
  // Without it we have no safe split point, so return '' to avoid showing OCR garbage.
  const tempatLahir = dateStr
    ? ttlRaw.slice(0, ttlRaw.search(new RegExp(dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).replace(/[,\s]+$/, '').trim()
    : ''

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
    const colonIdx = line.indexOf(':')
    if (colonIdx >= 0) return line.slice(colonIdx + 1).trim()
    // Real KTP OCR often reads ':' as '-'. If the line starts with a label word
    // followed by a dash, treat the dash as the separator.
    const dashMatch = line.match(/^[A-Za-z\/\s.]+?\s*[-–]\s*(.+)$/)
    if (dashMatch) return dashMatch[1].trim()
    return line.trim()
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
  // Use fuzzy matching: real KTP OCR often reads 'm' as 'rn' → "Alarnat"
  const alamatFuzzy = findLineByFuzzyLabel([
    { prefix: 'Alamat', variants: ['alamat', 'alarnat', 'alainat', 'alamet', 'alam'] },
  ])
  const alamatIdx = alamatFuzzy
    ? alamatFuzzy.index
    : lines.findIndex(l => /^Alam[a-z]{0,3}t?\s*:/i.test(l))
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

  console.log(`[SADEWA OCR] KTP parsed → quality:${quality} | nik:${nik} | nama:${nama} | ttl:${tempatLahir},${tanggalLahir} | alamat:${alamat}`)
  return { quality, nama, nik, tempatLahir, tanggalLahir, alamat }
}

// Preprocess image: grayscale + contrast boost so Tesseract reads real KTPs better.
// Real KTPs have coloured backgrounds, holograms, and security patterns that confuse
// Tesseract when the image is sent as-is. Converting to high-contrast greyscale removes
// most of that interference without affecting dummy KTPs.
async function preprocessForOCR(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      // Only upscale truly small images (< 800 px). Large phone photos are already
      // high-res; scaling them up further introduces interpolation blur on digit edges.
      const scale = img.width < 800 ? Math.min(2, 1600 / img.width) : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)

      const id = ctx.getImageData(0, 0, w, h)
      const px = id.data
      for (let i = 0; i < px.length; i += 4) {
        // Convert to grayscale, then apply a hard threshold to separate dark text
        // from the guilloché pattern (≈ 80-140 gray) and blue background (≈ 140+).
        // Text ink on a real KTP is ≈ 0-60 — hard threshold at 80 keeps text black
        // and pushes guilloché + background to white. This differs from the earlier
        // failed contrast-multiplier approach which darkened mid-tones into the text
        // range. Here we lighten them to white instead.
        const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
        px[i] = px[i + 1] = px[i + 2] = v < 80 ? v : 255
      }
      ctx.putImageData(id, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        blob => resolve(new File([blob], 'ktp_proc.png', { type: 'image/png' })),
        'image/png'
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

async function ocrWithTesseract(file) {
  console.log('[SADEWA OCR] Starting Tesseract (offline engine)...')
  const processed = await preprocessForOCR(file)
  const url = URL.createObjectURL(processed)
  try {
    // Use locally bundled assets — zero network requests needed for offline support.
    // Files are served from /public/tesseract/ and /public/tesseract/lang/.
    const base = import.meta.env.BASE_URL ?? '/'
    const worker = await createWorker('ind+eng', 1, {
      logger: m => { if (m.status === 'recognizing text') console.log('[SADEWA OCR] Tesseract progress:', Math.round(m.progress * 100) + '%') },
      workerPath: `${base}tesseract/worker.min.js`,
      langPath:   `${base}tesseract/lang`,
      corePath:   `${base}tesseract/tesseract-core-lstm.wasm.js`,
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

// ── Gemini OCR (primary engine — requires internet + API key) ────────────────

// JSON extraction approach: Gemini is told exactly which field to find for each key.
// More robust than transcription for real KTPs — Gemini doesn't need to read all text
// sequentially (guilloché can interrupt line-by-line reading), it jumps directly to
// each labeled field on the card.
const OCR_PROMPT = `Kamu adalah mesin OCR untuk KTP (Kartu Tanda Penduduk) Indonesia.

Lihat gambar KTP dan ekstrak data berikut. Kembalikan HANYA JSON di bawah ini, tanpa penjelasan, tanpa markdown:
{
  "quality": "good",
  "nama": "teks tepat setelah label Nama :",
  "nik": "16 angka tepat setelah label NIK : (hapus semua spasi)",
  "tempat_lahir": "nama kota sebelum koma pada baris Tempat/Tgl Lahir",
  "tanggal_lahir": "tanggal lahir format DD-MM-YYYY dari baris yang sama",
  "alamat": "RT xxx RW xxx, Kel/Desa, Kecamatan, Kabupaten/Kota"
}

Aturan quality: "good" = semua field terbaca, "blurry" = sebagian terbaca, "bad" = bukan KTP.

Panduan penting:
- Kartu memiliki pola guilloche (tulisan "KARTU TANDA PENDUDUK" berulang diagonal) — ABAIKAN, fokus pada teks label dan nilainya
- Pojok kanan bawah ada tanggal penerbitan dan tanda tangan — ABAIKAN, bukan tanggal lahir
- NIK tepat 16 digit — baca satu per satu dengan teliti
- Baris Tempat/Tgl Lahir berisi KOTA lalu TANGGAL dipisah koma: pisahkan ke dua field yang berbeda
- Field alamat: susun PERSIS dengan format "RT xxx RW xxx, Kel/Desa, Kecamatan, Kabupaten/Kota"
  → RT dan RW: ambil angka dari baris RT/RW, tulis "RT 002 RW 002" (3 digit, pisah spasi)
  → Kel/Desa: nama dari baris Kel/Desa
  → Kecamatan: nama dari baris Kecamatan
  → Kabupaten/Kota: dari header atas kartu (baris KABUPATEN ... atau KOTA ...)
  → Contoh hasil: "RT 002 RW 002, WATES, TANJUNGANOM, NGANJUK"
  → JANGAN sertakan teks dari baris Alamat (nama jalan/no rumah) — cukup RT/RW + Kel/Desa + Kecamatan + Kabupaten
- Jika field tidak terbaca, isi string kosong ""`

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy
  const m = ddmmyyyy.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return ddmmyyyy
}

// Normalize RT/RW fragment in an alamat string to "RT 002 RW 002" format.
// Handles variations: "002/002", "002 / 002", "RT002/RW002", "RT 002/RW 002"
function normalizeRtRw(alamat) {
  if (!alamat) return ''
  return alamat.replace(
    /\bRT\s*(\d{1,3})\s*[\/-]?\s*RW\s*(\d{1,3})\b|\b(\d{1,3})\s*\/\s*(\d{1,3})\b/gi,
    (_, rt1, rw1, rt2, rw2) => {
      const rt = (rt1 ?? rt2 ?? '0').padStart(3, '0')
      const rw = (rw1 ?? rw2 ?? '0').padStart(3, '0')
      return `RT ${rt} RW ${rw}`
    }
  )
}

async function ocrWithGemini(file) {
  try {
    // Send the ORIGINAL image — Gemini is a colour vision model that reads colour
    // images natively. Greyscale preprocessing would remove the contrast cues that
    // help the model distinguish dark text from the blue KTP background.
    const base64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: OCR_PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
          // Force valid JSON output — prevents gemini-3.6-flash from returning
          // conversational text ("...Matches") instead of the requested JSON structure.
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
          // Disable thinking mode — thinking tokens consume the output budget and
          // can cause JSON responses to be truncated mid-value on gemini-3.6-flash.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[SADEWA OCR] Gemini unavailable:', err?.error?.message ?? res.status, '— falling back to Tesseract')
      return null
    }

    const data = await res.json()
    const finishReason = data.candidates?.[0]?.finishReason
    // Join all parts — newer Gemini models may split response across multiple parts
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const text = parts.map(p => p.text ?? '').join('')

    console.log('[SADEWA OCR] Gemini finishReason:', finishReason, '| parts:', parts.length, '| tokens used:', data.usageMetadata?.totalTokenCount)

    if (!text) {
      console.warn('[SADEWA OCR] Gemini empty response')
      return null
    }

    console.log('[SADEWA OCR] Gemini raw response:', text)
    const parsed = parseOcrJson(text)
    if (!parsed) {
      console.warn('[SADEWA OCR] Gemini JSON parse failed — raw text was above ^')
      return null
    }

    console.log('[SADEWA OCR] Gemini JSON result:', parsed)

    const cleanNIK = (parsed.nik ?? '').replace(/\D/g, '')

    // Split combined TTL field if Gemini puts both city and date into tanggal_lahir
    let rawTempat = (parsed.tempat_lahir ?? '').trim()
    let rawTanggal = (parsed.tanggal_lahir ?? '').trim()
    if (!rawTempat && rawTanggal && !/^\d/.test(rawTanggal)) {
      const commaIdx = rawTanggal.indexOf(',')
      if (commaIdx > 0) {
        rawTempat  = rawTanggal.slice(0, commaIdx).trim()
        rawTanggal = rawTanggal.slice(commaIdx + 1).trim()
      }
    }

    const ocrDate = tanggalToISO(rawTanggal)
    const nikDate = cleanNIK.length === 16 ? dateFromNIK(cleanNIK) : ''
    return {
      quality:      parsed.quality ?? 'good',
      nama:         (parsed.nama ?? '').trim(),
      nik:          cleanNIK,
      tempatLahir:  rawTempat,
      tanggalLahir: selectBestDate(ocrDate, nikDate),
      alamat:       normalizeRtRw((parsed.alamat ?? '').trim()),
    }
  } catch {
    return null
  }
}

// ── Online/offline detection ──────────────────────────────────────────────────
// navigator.onLine is a fast hint. For a real connectivity check we also do a
// lightweight HEAD probe against the Gemini endpoint domain so that a captive-
// portal or DNS failure is caught before we try to call Gemini.
async function isOnline() {
  if (!navigator.onLine) return false
  try {
    // Probe with a tiny no-CORS request; if it resolves we have real internet.
    await fetch('https://generativelanguage.googleapis.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    return true
  } catch {
    return false
  }
}

// ── Public OCR entry point ────────────────────────────────────────────────────
// Strategy:
//   Online  → Gemini Flash (primary)  — fast, high accuracy, requires internet
//   Offline → Tesseract.js (fallback) — fully local, no internet needed
//
// Returns the OCR result object with an added `engine` field:
//   { engine: 'gemini' | 'tesseract', quality, nama, nik, tempatLahir, tanggalLahir, alamat }

export async function ocrDocument(file) {
  const online = await isOnline()
  const hasKey = API_KEY && API_KEY !== 'your-gemini-api-key-here'

  // 1. Gemini Flash — only when we have connectivity AND an API key.
  if (online && hasKey) {
    const geminiResult = await ocrWithGemini(file)
    if (geminiResult && geminiResult.quality !== 'bad') {
      console.log('[SADEWA OCR] Engine: Gemini — quality:', geminiResult.quality)
      return { ...geminiResult, engine: 'gemini' }
    }
    if (geminiResult?.quality === 'bad') {
      console.log('[SADEWA OCR] Gemini quality=bad → falling back to Tesseract')
    } else {
      console.log('[SADEWA OCR] Gemini call failed → falling back to Tesseract')
    }
  } else {
    console.log(`[SADEWA OCR] Offline mode — skipping Gemini (online:${online}, hasKey:${hasKey})`)
  }

  // 2. Tesseract.js — offline fallback, all assets served locally.
  const tessResult = await ocrWithTesseract(file)
  if (tessResult) return { ...tessResult, engine: 'tesseract' }
  return null
}

// ── Utility: check current connectivity (used by UI to show offline banner) ──
export { isOnline }

