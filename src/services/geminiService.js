import { createWorker } from 'tesseract.js'

// Gemini OCR runs through our own serverless function at /api/gemini-ocr so the
// API key stays server-side and never ships to the browser bundle.
const OCR_ENDPOINT = '/api/gemini-ocr'

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

// Repair corrupted NIK digits 6-11 (positions 7-12, 0-indexed 6-11) using the
// birth date that was read from the Tempat/Tgl Lahir field.
// NIK encoding: positions 6-7 = DD (day), 8-9 = MM (month), 10-11 = YY (year)
// Female: day += 40  (so day 23 → 63, day 1 → 41, etc.)
//
// We only repair if:
//   a) ocrNik is 15 or 16 digits (last digit may be a '0' pad), AND
//   b) the OCR-read tanggalLahir is a valid date (YYYY-MM-DD format), AND
//   c) the current NIK date doesn't match — meaning OCR garbled those positions
//
// The first 6 digits (region code) and last 4 digits (sequence) are kept as-is.
// For a 15-digit input, the missing digit is assumed to be in the date area (pos 6-11)
// so we reconstruct all 6 date digits from tanggalLahirISO.
function repairNikFromDate(ocrNik, tanggalLahirISO) {
  if (!ocrNik || ocrNik.length < 15) return ocrNik
  if (!tanggalLahirISO || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahirISO)) return ocrNik

  const [yyyy, mm, dd] = tanggalLahirISO.split('-').map(Number)
  const yy = String(yyyy).slice(-2)
  const month = String(mm).padStart(2, '0')
  const dayMale   = String(dd).padStart(2, '0')
  const dayFemale = String(dd + 40).padStart(2, '0')

  const prefix = ocrNik.slice(0, 6)
  const suffix = ocrNik.length === 16
    ? ocrNik.slice(12)
    : ocrNik.slice(11)

  for (const dayPart of [dayFemale, dayMale]) {
    const dateSeg = `${dayPart}${month}${yy}`
    const candidate = prefix + dateSeg + suffix
    if (candidate.length !== 16) continue
    const decoded = dateFromNIK(candidate)
    if (decoded === tanggalLahirISO) {
      console.log(`[SADEWA OCR] NIK repaired using birth date: ${ocrNik} → ${candidate}`)
      return candidate
    }
  }

  return ocrNik
}

// Repair NIK region code (first 6 digits) using kabupaten/kota name from KTP header.
// OCR sometimes misreads digits in the region code (e.g. 8→4, 1→l, etc.).
// We ONLY repair if the OCR prefix differs from the known code by at most 2 digits —
// this prevents overwriting a genuinely different region code (e.g. KTP from another
// province) with a false match from the header text.
function repairNikRegionCode(ocrNik, kabupatenName) {
  if (!ocrNik || ocrNik.length !== 16) return ocrNik
  if (!kabupatenName) return ocrNik
  const key = kabupatenName.toUpperCase().trim()
  const knownCode = KODE_WILAYAH[key]
  if (!knownCode) return ocrNik
  if (ocrNik.startsWith(knownCode)) return ocrNik  // already correct

  // Count how many digits differ between OCR prefix and known code
  const ocrPrefix = ocrNik.slice(0, 6)
  let diffCount = 0
  for (let i = 0; i < 6; i++) {
    if (ocrPrefix[i] !== knownCode[i]) diffCount++
  }
  // Only repair if exactly 1 digit is wrong (single OCR misread, e.g. 8→4).
  // 2+ digit differences likely indicate a legitimately different sub-district code,
  // not an OCR error — don't overwrite those.
  if (diffCount !== 1) return ocrNik

  const repaired = knownCode + ocrNik.slice(6)
  console.log(`[SADEWA OCR] NIK region code repaired (${kabupatenName}, ${diffCount} digit diff): ${ocrNik} → ${repaired}`)
  return repaired
}
// Used to cross-validate and correct OCR errors in the region-code part of a NIK.
// Keyed by kabupaten/kota name (uppercase, stripped of "KABUPATEN"/"KOTA" prefix).
const KODE_WILAYAH = {
  // Jawa Timur — Kabupaten
  'NGANJUK':     '351811', // Kab. Nganjuk
  'PACITAN':     '350111', 'PONOROGO':   '350211', 'TRENGGALEK':  '350311',
  'TULUNGAGUNG': '350411', 'BLITAR':     '350511', 'KEDIRI':      '350611',
  'MALANG':      '350711', 'LUMAJANG':   '350811', 'JEMBER':      '350911',
  'BANYUWANGI':  '351011', 'BONDOWOSO':  '351111', 'SITUBONDO':   '351211',
  'PROBOLINGGO': '351311', 'PASURUAN':   '351411', 'SIDOARJO':    '351511',
  'MOJOKERTO':   '351611', 'JOMBANG':    '351711', 'MADIUN':      '351911',
  'MAGETAN':     '352011', 'NGAWI':      '352111', 'BOJONEGORO':  '352211',
  'TUBAN':       '352311', 'LAMONGAN':   '352411', 'GRESIK':      '352511',
  'BANGKALAN':   '352611', 'SAMPANG':    '352711', 'PAMEKASAN':   '352811',
  'SUMENEP':     '352911',
  // Kota
  'KEDIRI KOTA':     '357111', 'BLITAR KOTA':    '357211', 'MALANG KOTA':   '357311',
  'PROBOLINGGO KOTA':'357411', 'PASURUAN KOTA':  '357511', 'MOJOKERTO KOTA':'357611',
  'MADIUN KOTA':     '357711', 'SURABAYA':       '357811', 'BATU':          '357911',
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

  // Labels that mark the START of a new KTP field — used to know when to stop
  // collecting continuation lines.
  // NOTE: RT/RW, Kel/Desa, Kecamatan are intentionally NOT here — they are part
  // of the address block and handled separately.
  const KTP_LABEL = /^(NIK|Nama|Tempat|Tgl\.?|Lahir|Jenis|Gol\.|Alam[a-z]{0,3}t?|Agama|Status|Pekerjaan|Kewarganegaraan|Berlaku|PROVINSI|KOTA|KABUPATEN)/i

  // Extract value from a labeled line robustly.
  // Handles every separator variant seen in real KTP OCR output:
  //   ':'  → "Nama : HARTINI"                (normal)
  //   '-'  → "Nama - HARTINI"                (OCR misreads ':' as '-')
  //   '|'  → "Nama | HARTINI"                (OCR misreads ':' as '|')
  //   '.'  → "Nama . HARTINI"                (OCR misreads ':' as '.')
  //   glued→ "TempatTglLahir NGANJUK ..."    (label and value on same line, no separator)
  //   none → label-only line, value on next line
  function extractValueFromLine(line, nextLine = '', labelPattern = null) {
    // Try colon first (most common)
    const colonIdx = line.indexOf(':')
    if (colonIdx >= 0) {
      const after = line.slice(colonIdx + 1).trim()
      if (after) return { value: after, consumedNext: false }
    }
    // Try any single separator char [ - | . ] that appears after label words
    // but only when preceded by whitespace (avoids matching dots inside "Tgl.")
    const sepMatch = line.match(/^([A-Za-z\/\s]{3,}?)\s+[-|.–]\s+(.+)$/)
    if (sepMatch && sepMatch[2].trim()) {
      return { value: sepMatch[2].trim(), consumedNext: false }
    }
    // Glued label+value (no separator, no space between label end and value):
    // e.g. "Tempatfigilahir NGANJUK 10072004"
    // Strip the matched label prefix from the line start and take the rest.
    if (labelPattern) {
      const stripped = line.replace(labelPattern, '').replace(/^[\s:.\-|]+/, '').trim()
      if (stripped.length > 1) return { value: stripped, consumedNext: false }
    }
    // Label-only line (no separator at all) → value is on the next line
    if (nextLine && !KTP_LABEL.test(nextLine) && nextLine.length > 1) {
      return { value: nextLine.trim(), consumedNext: true }
    }
    return { value: '', consumedNext: false }
  }

  function extractMultilineValue(labelPattern) {
    const idx = findLabelIndex(labelPattern)
    if (idx < 0) return ''

    const { value: firstValue, consumedNext } = extractValueFromLine(
      lines[idx],
      lines[idx + 1] ?? '',
      labelPattern    // pass pattern so glued label+value can be split
    )
    let value = firstValue
    const startIdx = consumedNext ? idx + 2 : idx + 1

    // Collect continuation lines until the next KTP field label
    for (let i = startIdx; i < lines.length; i++) {
      let next = lines[i]
      if (KTP_LABEL.test(next)) break          // next field starts → stop
      if (next.length < 2) break                // empty line → stop
      if (/^\d{16}$/.test(next)) break          // looks like a NIK row → stop
      // Strip leading OCR noise punctuation (e.g. "- PAMUNGKAS" → "PAMUNGKAS")
      next = next.replace(/^[\s\-–~_|.]+/, '').trim()
      if (next.length < 2) continue             // skip if nothing left after strip
      // For TTL field: stop collecting once we already have a date — extra lines
      // after the date are noise (e.g. ".. Kecamatan -TANJUNGANOM")
      if (/^\d{4}-\d{2}-\d{2}$/.test(value) || value.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/)) break
      value = (value + ' ' + next).trim()
    }
    return value
  }

  // NIK: 16-digit number on the NIK line.
  //
  // OCR mixes letters into the NIK digit string (e.g. "351811kL306710002 R 5").
  // Strategy:
  //   1. Find the longest consecutive digit-run of exactly 16 in the NIK value
  //      (avoids picking up noise digits that appear after the NIK on the same line)
  //   2. If no clean 16-run: take only the first whitespace-separated token,
  //      apply conservative OCR letter→digit substitutions, strip remaining non-digits.
  //      If we get 15 digits (1 letter was in the middle), the missing digit is
  //      in the date-encoding area (pos 6-11) and will be fixed by repairNikFromDate.
  //   3. Fallback: first \b\d{16}\b anywhere in full text

  let nik = ''
  const nikLineIdx = lines.findIndex(l => /^NIK\b/i.test(l))
  if (nikLineIdx >= 0) {
    const nikLine = lines[nikLineIdx]
    const { value: nikVal } = extractValueFromLine(nikLine, lines[nikLineIdx + 1] ?? '')
    const nikContext = nikVal || lines.slice(nikLineIdx, nikLineIdx + 2).join(' ')

    // Step 1: look for an unbroken 16-digit run in the first whitespace token
    const firstToken = nikContext.trim().split(/\s+/)[0]
    const exactMatch = firstToken.match(/\d{16}/)
    if (exactMatch) {
      nik = exactMatch[0]
    } else {
      // Step 1b: NIK may have a space inserted by OCR (e.g. "351811100704 0002").
      // Strip all spaces from the full nikContext up to the first non-digit/non-space
      // noise token, then try for 16 consecutive digits.
      const nikContextNoSpace = nikContext
        .replace(/^([:\s]*)/, '')   // strip leading colon/space (after separator)
        .split(/\s+/)               // split tokens
        .filter(t => /^[\d\D]*$/.test(t))
        // take tokens from start until we hit a clearly non-NIK token (letters only)
        .reduce((acc, t) => {
          if (acc.done) return acc
          const stripped = t.replace(/\D/g, '')
          if (acc.digits.length + stripped.length <= 16 + 2) {
            return { digits: acc.digits + stripped, done: false }
          }
          return { ...acc, done: true }
        }, { digits: '', done: false }).digits

      if (nikContextNoSpace.length >= 15 && nikContextNoSpace.length <= 17) {
        const spaceFixed = nikContextNoSpace.slice(0, 16)
        if (spaceFixed.length === 16) {
          nik = spaceFixed
        } else if (spaceFixed.length === 15) {
          nik = spaceFixed
        }
      } else {
        // Step 2: apply conservative OCR letter→digit substitutions on first token only.
        const conservative = firstToken
          .replace(/[oO]/g, '0')
          .replace(/[lI]/g, '1')
          .replace(/[zZ]/g, '2')
          .replace(/[sS]/g, '5')
          .replace(/[bB]/g, '8')
          .replace(/[gG]/g, '6')
        const tokenDigits = conservative.replace(/\D/g, '')

        if (tokenDigits.length === 16) {
          nik = tokenDigits
        } else if (tokenDigits.length === 15) {
          nik = tokenDigits
        } else if (tokenDigits.length > 16) {
          const runs = conservative.match(/\d+/g) || []
          const longest = runs.reduce((a, b) => a.length >= b.length ? a : b, '')
          if (longest.length >= 15) nik = longest.slice(0, 16)
        }
      }
      // < 15 digits → too corrupted, leave empty, fulltext fallback below
    }
  }
  if (!nik) {
    // Fallback: first exact 16-digit run anywhere in full text
    const fullText = lines.join(' ')
    nik = (fullText.match(/\b(\d{16})\b/) || [])[1] || ''
  }

  // Nama: trim trailing OCR noise (e.g. "BAGAS PRATAMA 9" → "BAGAS PRATAMA")
  // Pattern is tolerant: matches "Nama :" / "Nama ." / "Nama -" / plain "Nama"
  const namaRaw = extractMultilineValue(/^Nama\b/i)

  // Helper: detect if a name string has concatenated words (no spaces between all-caps words).
  // If so, try to insert spaces at plausible word boundaries.
  // Indonesian names tend to be 3-10 chars per word. We use a simple greedy split
  // that tries chunk sizes 4-9 left-to-right so common names split naturally:
  //   "ERLANGGADWIANANDA" → try 8="ERLANGGA", rest="DWIANANDA"(9) → try 4="DWIN" no...
  // Actually we just detect the glueing and let the form field show it for manual edit,
  // but we DO properly split "- PAMUNGKAS" continuation and strip noise tokens.
  // Split a run of glued all-caps Indonesian name words.
  // e.g. "ERLANGGADWIANANDA" → "ERLANGGA DWI ANANDA"
  //
  // Strategy: match known Indonesian name prefixes/words left-to-right.
  // This is more reliable than pure DP because DP has no linguistic knowledge.
  // We use a small but high-coverage list of common Indonesian name morphemes.
  function splitGluedName(str) {
    // Common Indonesian name morphemes sorted longest-first for greedy matching.
    // Covers the most frequent name components seen in Indonesian KTP.
    const NAME_DICT = [
      // 9-char
      'PAMUNGKAS','PRASETYO','NUGROHO','SOEKARNO','WAHYUDI',
      // 8-char
      'ERLANGGA','PRASASTA','PRIYANKA','MAHARANI','RAHMAWATI','SANTOSO',
      // 7-char
      'BINTANG','SAPUTRA','PRABOWO','KUSUMA','WARDANA','HIDAYAT',
      // 6-char
      'ANANDA','CAHAYA','SATRIA','RAHAYU','SUSILO','WIBOWO','WIJAYA',
      'IRAWAN','GUNAWAN','SULISTYO','RAHMAN',
      // 5-char
      'PUTRA','PUTRI','SURYA','RIZKY','PRIMA','ARIEF','YUSUF','FAJAR',
      'INDRA','WAHYU','AGUNG','BAGUS','BAGAS','AHMAD','HASAN',
      // 4-char
      'DIAN','BUDI','YOGI','ANDI','RUDI','SARI','DEWI','HENDRA',
      'MAYA','DENI','REZA','YOGA','RIAN','NISA',
      // 3-char
      'DWI','TRI','AYU','EKA','IDA','IRA','SRI','ADI','NUR',
    ].sort((a, b) => b.length - a.length)

    return str.replace(/[A-Z]{11,}/g, (run) => {
      let remaining = run
      const words = []
      while (remaining.length > 0) {
        let matched = false
        for (const word of NAME_DICT) {
          if (remaining.startsWith(word)) {
            const rest = remaining.length - word.length
            if (rest === 0 || rest >= 3) {
              words.push(word)
              remaining = remaining.slice(word.length)
              matched = true
              break
            }
          }
        }
        if (!matched) {
          if (remaining.length <= 10) { words.push(remaining); break }
          // No dict match on a long run — split in half as fallback
          const chunkLen = Math.ceil(remaining.length / 2)
          words.push(remaining.slice(0, chunkLen))
          remaining = remaining.slice(chunkLen)
        }
      }
      return words.length > 1 ? words.join(' ') : run
    })
  }

  const nama = splitGluedName(namaRaw)
    .replace(/!/g, 'I')                      // OCR reads 'I' as '!' in all-caps names
    .replace(/\s+\d[\d\s]*$/, '')            // remove trailing digits
    .replace(/^[\s\-–~_|.=]+/, '')           // strip leading noise
    // Remove short lowercase noise tokens from anywhere in the name
    // e.g. "ERLANGGA DWI ANANDA wy PAMUNGKAS" → "ERLANGGA DWI ANANDA PAMUNGKAS"
    .replace(/\s+[a-z]{1,3}(\s|$)/g, ' ')
    .replace(/(^|\s)[a-z]{1}(\s|$)/ig, ' ')  // remove lone single-char noise tokens
    .replace(/[^a-zA-Z\s'.,-]/g, '')         // keep only name-safe characters
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Tempat/Tgl Lahir — colon is optional, separator may also be '-' or '|'
  // Also handles OCR typos where words are glued: "Tempatfigilahir", "Tempat/TglLahir"
  const ttlRaw = extractMultilineValue(/^Tempat/i)
    // Clean glued label residue: "figilahir NGANJUK..." → "NGANJUK..."
    // "TgiLahir NGANJUK" → "NGANJUK" — strip any word(s) before first ALL-CAPS city name
    // Strategy: remove everything before the first token that starts with uppercase
    // and is followed by a comma or date (the actual value pattern)
    .replace(/^[A-Za-z\/]+\s*/g, (m) => {
      // Only strip if the match looks like leftover label text (mix of cases, no space = glued)
      // e.g. "TgiLahir " → strip, "NGANJUK, " → keep
      if (/^[A-Z]{2,}$/.test(m.trim())) return m  // all-caps → it's the city name, keep
      return ''  // mixed case label residue → strip
    })
    // Strip trailing noise after date — e.g. "NGANJUK 10072004 po" → keep up to date
    .replace(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{8})\s+\S.*$/, (m) => m.split(/\s+/)[0])

  // Try numeric date (allow spaces around separators: "10 - 07 - 2004")
  const numDateMatch = ttlRaw.match(/(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{4})/)
  // Try date with no separator at all: "10072004" (Tesseract drops dashes sometimes)
  const noSepDateMatch = !numDateMatch && ttlRaw.match(/\b(\d{8})\b/)
  // Try Indonesian month-name date ("10 JULI 2004", "4 Agustus 1995")
  const bulanPattern = Object.keys(BULAN_ID).join('|')
  const nameMonthMatch = ttlRaw.match(new RegExp(`(\\d{1,2}\\s+(?:${bulanPattern})\\s+\\d{4})`, 'i'))

  let dateStr = numDateMatch?.[1] || nameMonthMatch?.[1] || ''

  // Handle no-separator 8-digit date: "10072004" → "10-07-2004"
  if (!dateStr && noSepDateMatch) {
    const raw8 = noSepDateMatch[1]
    dateStr = `${raw8.slice(0,2)}-${raw8.slice(2,4)}-${raw8.slice(4,8)}`
  }

  const tanggalLahirOCR = dateStr ? dateToISO(dateStr) : ''
  const tanggalLahirNIK = nik ? dateFromNIK(nik) : ''
  // Prefer the OCR date when its year is a plausible birth year (filters out the
  // card-signing date that sometimes appears at the bottom of real KTPs).
  // Fall back to NIK-derived date when OCR date is absent or out of range.
  const tanggalLahir = selectBestDate(tanggalLahirOCR, tanggalLahirNIK)

  // NIK cross-validation & repair: a valid NIK encodes the birth date at positions 7-12.
  // If the NIK-derived date doesn't match the OCR date, the NIK has OCR errors.
  // We attempt to repair digits 7-12 using the known birth date from Tempat/Tgl Lahir.
  // This recovers cases where OCR garbles the date-encoding part of the NIK
  // (e.g. Tesseract reads "kL" instead of "63" for a female born on the 23rd: 23+40=63).
  if (nik && nik.length >= 15 && tanggalLahirOCR) {
    if (dateFromNIK(nik.length === 15 ? nik + '0' : nik) !== tanggalLahirOCR) {
      nik = repairNikFromDate(nik, tanggalLahirOCR)
    }
  }

  // NIK region code repair: cross-validate prefix with Kabupaten/Kota from header.
  // Extracts "NGANJUK" from "KABUPATEN NGANJUK" (or "| KABUPATEN NGANJUK") and
  // looks up the known 6-digit region code to fix OCR errors in the prefix.
  if (nik && nik.length === 16) {
    const kabHeaderLine = lines.find(l => /^[^a-zA-Z]*(KABUPATEN|KOTA)\s+\w+/i.test(l))
    if (kabHeaderLine) {
      const kabName = kabHeaderLine
        .replace(/^[^a-zA-Z]*/, '')
        .replace(/^(KABUPATEN|KOTA)\s+/i, '')
        .trim().split(/\s+/)[0]
      if (kabName) nik = repairNikRegionCode(nik, kabName)
    }
  }

  // tempatLahir: everything before the date string in ttlRaw.
  // Handles separators: comma, space, or comma+space between city and date.
  // e.g. "NGANJUK, 23-06-1971" → "NGANJUK"
  //      "NGANJUK 23-06-1971"  → "NGANJUK"  (comma missed by OCR)
  let tempatLahir = ''
  if (dateStr) {
    const escapedDate = dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const beforeDate = ttlRaw.slice(0, ttlRaw.search(new RegExp(escapedDate)))
    tempatLahir = beforeDate
      .replace(/[,\s]+$/, '')   // strip trailing comma/spaces
      .replace(/[^a-zA-Z\s'-]/g, ' ') // keep only place-name chars
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

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
    // Strip leading non-letter noise first (e.g. "..— ", "| ", "~~ ")
    const cleanLine = line.replace(/^[^a-zA-Z]+/, '')
    const colonIdx = cleanLine.indexOf(':')
    if (colonIdx >= 0) return cleanLine.slice(colonIdx + 1).trim()
    // Real KTP OCR often reads ':' as '-' or '|'. If the line starts with a label word
    // followed by a dash or pipe, treat it as the separator.
    const dashMatch = cleanLine.match(/^[A-Za-z\/\s.]+?\s*[-–|]\s*(.+)$/)
    if (dashMatch) return dashMatch[1].trim()
    return cleanLine.trim()
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
  // NOTE: "desa" is intentionally in the blacklist so it is skipped when it
  // appears as a LABEL (e.g. the "Kel/Desa" row label), but for the Alamat
  // street line we use cleanSegment (not extractPlaceName) so this blacklist
  // does not affect street values like "DESA WATES".
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

  // Fuzzy label search — tolerant of common OCR typos and leading noise chars.
  //   Kecamatan → Kecamalan, Kecomatan, "..— Kecamatan", "Kec.", "Kec :"
  function findLineByFuzzyLabel(labels) {
    for (let i = 0; i < lines.length; i++) {
      // Strip ALL non-letter chars from the start (handles "..— ", "| ", "~~ " prefixes)
      // then remove internal spaces/separators for variant matching
      const line = lines[i].toLowerCase()
        .replace(/^[^a-z]+/, '')       // strip leading non-letter chars
        .replace(/[\s:.\-|~]/g, '')    // strip separators throughout
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
  // Use fuzzy matching: real KTP OCR often reads 'm' as 'rn' → "Alarnat",
  // or truncates to "Alana", "Alam", etc.
  const alamatFuzzy = findLineByFuzzyLabel([
    { prefix: 'Alamat', variants: ['alamat', 'alarnat', 'alainat', 'alamet', 'alana', 'alan', 'alam'] },
  ])
  const alamatIdx = alamatFuzzy
    ? alamatFuzzy.index
    : lines.findIndex(l => /^Alam[a-z]{0,3}t?\s*[:.|-]?/i.test(l))
  const addressParts = []

  if (alamatIdx >= 0) {
    const streetValue = extractAfterColon(lines[alamatIdx])
    if (streetValue) addressParts.push(cleanSegment(streetValue))

    // Collect any continuation lines that are NOT a known label
    // (handles street names that wrap onto the next line)
    // NOTE: Use fuzzy label detection for Kecamatan, Kel/Desa etc to avoid
    // treating a typoed-label line as street continuation.
    // IMPORTANT: "desa" as a break-line marker must only match when it appears
    // as a standalone LABEL (e.g. "Desa : Wates"), NOT as part of the street
    // value itself (e.g. "DESA WATES" is a street name, not a label).
    function isAddressBreakLine(l) {
      const stripped = l.toLowerCase().replace(/[\s:.-]/g, '')
      // "desa" only breaks if it's followed by a colon pattern (label), not
      // a standalone street word like "DESA WATES" (no colon on that line)
      if (/^desa/.test(stripped) && l.includes(':')) return true
      // RT/RW variants (including OCR misreads like "HRW", "RTRW", "RTW")
      if (/^(rt|hrw|rtrw|rtw)/.test(stripped)) return true
      return stripped.match(/^(kel|keldesa|kellesa|kelurahan|kec|kecmal|kecomatan|kecamatan|agama|status|pekerjaan|kewarganegaraan|berlaku|golong|jeniskelamin|nik|nama|tempat|tgl|lahir)/)
    }

    for (let i = alamatIdx + 1; i < lines.length; i++) {
      if (isAddressBreakLine(lines[i])) break
      if (lines[i].length < 2) break
      addressParts.push(cleanSegment(lines[i]))
    }
  }

  // 2. RT/RW line — e.g. "RT/RW : 002/002" or "HRW 002/002" (OCR misread)
  // Also handles: "RTRW", "RTW", "R T/RW" etc.
  const rtRwLine = lines.find(l => {
    const s = l.toLowerCase().replace(/[\s.:]/g, '')
    return s.startsWith('rt') || s.startsWith('hrw') || s.startsWith('rtrw') || s.startsWith('rtw')
  })
  if (rtRwLine) {
    const rtRwVal = extractRtRw(rtRwLine)
    if (rtRwVal) addressParts.push(rtRwVal)
  }

  // 3. Kel/Desa — e.g. "Kel/Desa : Wates" or "Kellesa : WATES" (OCR typo)
  const kelDesaMatch = findLineByFuzzyLabel([
    { prefix: 'Kel/Desa', variants: ['kel','keldesa','kellesa','desa','kelurahan','keldes','keldosa'] },
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

  // Fallback: jika alamat kosong (Tesseract tidak detect baris Alamat/RT/RW/Kel),
  // bangun alamat minimal dari komponen yang sempat terbaca: Kecamatan + Kabupaten header.
  let alamatFinal = alamat
  if (!alamatFinal) {
    const fallbackParts = []
    if (kecamatanName) fallbackParts.push(kecamatanName)
    // Ambil nama Kabupaten/Kota dari baris header atas KTP.
    // Strip leading non-letter noise ("| KABUPATEN NGANJUK" → "KABUPATEN NGANJUK")
    const kabHeader = lines.find(l => /^[^a-zA-Z]*(KABUPATEN|KOTA)\s+\w+/i.test(l))
    if (kabHeader) {
      const kabName = kabHeader
        .replace(/^[^a-zA-Z]*/, '')               // strip leading noise chars
        .replace(/^(KABUPATEN|KOTA)\s+/i, '')      // strip label
        .trim().split(/\s+/)[0]
      if (kabName) fallbackParts.push(kabName)
    }
    if (fallbackParts.length > 0) alamatFinal = fallbackParts.join(', ')
  }

  const found = [nik, nama, alamatFinal].filter(Boolean).length
  const quality = found >= 2 ? 'good' : found === 1 ? 'blurry' : 'bad'

  console.log(`[SADEWA OCR] KTP parsed → quality:${quality} | nik:${nik} | nama:${nama} | ttl:${tempatLahir},${tanggalLahir} | alamat:${alamatFinal}`)
  return { quality, nama, nik, tempatLahir, tanggalLahir, alamat: alamatFinal }
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
        // from the guilloché pattern and blue background.
        // Text ink on a real KTP is typically ≈ 0-100 (can be slightly grey due to
        // printing/scanning). Threshold at 120 keeps text dark and pushes the guilloché
        // pattern + blue background to white.
        const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
        px[i] = px[i + 1] = px[i + 2] = v < 120 ? v : 255
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
      // Our bundled .traineddata files are NOT gzipped. Without this, Tesseract.js
      // defaults to appending ".gz" to the filename and requests ind.traineddata.gz,
      // which doesn't exist on the server (404). Setting gzip:false makes it request
      // the plain ind.traineddata / eng.traineddata that we actually ship.
      gzip: false,
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

// ── Gemini OCR (primary engine — requires internet) ─────────────────────────
// The prompt and Gemini request config now live in the serverless function
// (api/gemini-ocr.js). This client only sends the image and parses the result.

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

// Max time to wait for the Gemini proxy before giving up and falling back to
// Tesseract. Covers the "internet lemot" case: a slow connection would otherwise
// make the user wait indefinitely. 20s is enough for Gemini to finish on a normal-
// to-slow link, but short enough to fall back promptly when the network is stuck.
const GEMINI_TIMEOUT_MS = 20000

async function ocrWithGemini(file) {
  try {
    // Send the ORIGINAL image — Gemini is a colour vision model that reads colour
    // images natively. Greyscale preprocessing would remove the contrast cues that
    // help the model distinguish dark text from the blue KTP background.
    const base64 = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    // Call our own serverless function instead of Google directly. The function
    // holds the API key and forwards the request to Gemini server-side.
    // AbortSignal.timeout aborts the request after GEMINI_TIMEOUT_MS so a slow or
    // stuck connection falls back to Tesseract instead of hanging.
    const res = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[SADEWA OCR] Gemini proxy unavailable:', err?.error ?? res.status, '— falling back to Tesseract')
      return null
    }

    // The serverless function returns { text } — the model's raw JSON string.
    const { text } = await res.json()

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
  } catch (err) {
    // AbortSignal.timeout throws a TimeoutError; a dropped connection throws a
    // generic network error. Either way we return null and fall back to Tesseract.
    if (err?.name === 'TimeoutError') {
      console.warn(`[SADEWA OCR] Gemini timed out after ${GEMINI_TIMEOUT_MS / 1000}s — falling back to Tesseract`)
    } else {
      console.warn('[SADEWA OCR] Gemini request failed:', err?.message ?? err, '— falling back to Tesseract')
    }
    return null
  }
}

// ── Online/offline detection ──────────────────────────────────────────────────
// navigator.onLine tells us whether the browser has a network connection. That's
// enough to decide whether to attempt the Gemini proxy (/api/gemini-ocr).
// We intentionally do NOT ping Google's domain here — the browser no longer talks
// to Google directly, and such a ping produces a noisy 404 in the console.
// If the proxy turns out to be unreachable (offline mid-request, no key configured
// on the server), ocrWithGemini returns null and we fall back to Tesseract.
async function isOnline() {
  return navigator.onLine
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

  // 1. Gemini Flash (via /api/gemini-ocr) — only when we have connectivity.
  // If the serverless proxy has no key configured, it returns an error and we
  // fall back to Tesseract below.
  if (online) {
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
    console.log('[SADEWA OCR] Offline mode — skipping Gemini, using Tesseract')
  }

  // 2. Tesseract.js — offline fallback, all assets served locally.
  const tessResult = await ocrWithTesseract(file)
  if (tessResult) return { ...tessResult, engine: 'tesseract' }
  return null
}

// ── Utility: check current connectivity (used by UI to show offline banner) ──
export { isOnline }

