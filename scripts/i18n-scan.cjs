#!/usr/bin/env node
/*
 * i18n kapsama tarayıcısı — çevrilmemiş (t() ile sarılmamış) Türkçe metinleri bulur.
 *
 * Kök sorun: i18n elle yapılıyor; sarılmayan her string sessizce Türkçe kalıyor.
 * Bu script bir güvenlik ağıdır: src/app + src/components içindeki tüm .tsx dosyalarını
 * tarar, t()/çeviri-helper'larıyla sarılmış kısımları çıkarır, geriye kalan
 *   (a) JSX metin düğümlerinde   >Türkçe<
 *   (b) string literal'lerinde   'Türkçe' / "Türkçe"
 * Türkçe ifadeleri raporlar. Sıfır bulgu = tam kapsama.
 *
 * Kullanım:  node scripts/i18n-scan.cjs        (bulgu varsa exit 1)
 * Veri/legacy Türkçe içeren dosyalar (i18n sözlüğü, mock veri) hariç tutulur.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['src/app', 'src/components']
// Bu dosyalar meşru biçimde Türkçe içerir (sözlük / mock veri / bu script).
const SKIP_FILES = new Set(['i18n.tsx', 'mockData.ts'])
// layout.tsx = SEO metadata (SSR, ayrı konu); admin + salon-* = dahili/B2B panel (kasıtlı Türkçe)
const SKIP_FILE_RE = /(^|\/)(layout|sitemap|robots)\.tsx?$/
const SKIP_DIR_RE = /(^|\/)(admin|salon-[a-z-]+)\//   // admin + salon-giris/salon-paneli/... : Türkçe-only
// Marka adı çevrilmez
const BRAND_RE = /^(©\s*\d{4}\s*)?[\s•·|—-]*şip[şs]akspor[\s•·|—-]*$/i

const TR_CHARS = /[ğĞşŞıİçÇöÖüÜ]/
// Özel karakter içermeyen ama Türkçe olduğu kesin kelimeler (false-negative azaltır)
const TR_WORDS = new RegExp(
  '\\b(' + [
    've', 'ile', 'icin', 'bir', 'bu', 'daha', 'tum', 'tumu', 'ders', 'dersler',
    'salon', 'salonlar', 'yorum', 'yorumlar', 'geri', 'don', 'yok', 'var',
    'gun', 'kisi', 'ara', 'hata', 'iptal', 'onayla', 'sec', 'secenek', 'favori',
    'ekle', 'cikar', 'takip', 'bekle', 'gonder', 'kaydet', 'duzenle', 'sil',
    'kapat', 'goster', 'gizle', 'tarih', 'saat', 'sure', 'adres', 'telefon',
    'sifre', 'giris', 'cikis', 'kayit', 'hesap', 'profil', 'bildirim', 'mesaj',
    'arkadas', 'takipci', 'puan', 'seri', 'rozet', 'seviye', 'toplam', 'hafta',
    'bugun', 'yarin', 'hos', 'geldin', 'lutfen', 'evet', 'hayir', 'tesekkur',
  ].join('|') + ')\\b', 'i'
)

function isTurkish(text) {
  const trimmed = text.trim()
  if (trimmed.length < 2) return false
  if (!/[A-Za-zĞğŞşİıÇçÖöÜü]/.test(trimmed)) return false // harf yoksa atla (sayı/emoji/ikon)
  if (trimmed.startsWith('/')) return false                // route/path (/giris, /kayit ...)
  if (BRAND_RE.test(trimmed)) return false                 // marka adı
  return TR_CHARS.test(trimmed) || TR_WORDS.test(trimmed)
}

// Bir satırdaki "güvenli" (zaten çevrili/teknik) parçaları maskele ki geriye sadece şüpheli kalsın
function maskSafe(line) {
  let s = line
  // lang === 'en'|'tr' ? 'A' : 'B'  → her iki dal zaten elde ele alınmış
  s = s.replace(/lang\s*===\s*['"](?:en|tr)['"]\s*\?\s*(['"])(?:\\.|(?!\1).)*\1\s*:\s*(['"])(?:\\.|(?!\2).)*\2/g, ' __L__ ')
  // t('...') / t("...") / t(`...`)  → çağrı içeriği çevrilidir
  s = s.replace(/\bt\(\s*(['"`])(?:\\.|(?!\1).)*\1\s*\)/g, ' __T__ ')
  // çeviri helper çağrıları (içlerindeki literal değil değişken çevirir)
  s = s.replace(/\b(translate[A-Za-z]+|localizeText)\([^)]*\)/g, ' __H__ ')
  // string metot argümanları veri-ayrıştırmadır, gösterim değil: .split('İptal: '), .includes('...') ...
  s = s.replace(/\.(split|includes|startsWith|endsWith|indexOf|replace|replaceAll)\(\s*(['"])(?:\\.|(?!\2).)*\2/g, '.$1( __A__ ')
  // import/export yolları, className, href, src, key, id, name="x" gibi teknik attribute literali değil — yine de
  // sadece Türkçe içerenleri yakalayacağımız için teknik İngilizce stringler zaten elenir.
  return s
}

const findings = []

function scanFile(abs, rel) {
  const src = fs.readFileSync(abs, 'utf8')
  const lines = src.split('\n')
  let inBlockComment = false
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    // yorum satırları / dev log'ları kullanıcıya gitmez
    if (inBlockComment) { if (trimmed.includes('*/')) inBlockComment = false; continue }
    if (trimmed.startsWith('/*')) { if (!trimmed.includes('*/')) inBlockComment = true; continue }
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
    if (/\bconsole\.(log|warn|error|info)\b/.test(raw)) continue

    const line = maskSafe(raw)

    // (a) JSX metin düğümleri:  >  metin  <
    for (const m of line.matchAll(/>([^<>{}]+)</g)) {
      if (isTurkish(m[1])) findings.push({ rel, line: i + 1, kind: 'JSX', text: m[1].trim() })
    }
    // Kenar JSX metinleri kod-noktalama içermez (TS generic'leri <T>('x') vb. elemek için)
    const isProse = (txt) => isTurkish(txt) && !/[()[\]'"=;|`]/.test(txt)
    // (a1) metin satır SONUNDA:  <Icon /> Türkçe   (kapanış etiketi sonraki satırda)
    for (const m of line.matchAll(/>([^<>{}]+?)\s*$/g)) {
      if (isProse(m[1])) findings.push({ rel, line: i + 1, kind: 'JSX', text: m[1].trim() })
    }
    // (a1b) metin satır BAŞINDA:  Türkçe </tag>   (açılış etiketi önceki satırda)
    for (const m of line.matchAll(/^\s*([^<>{}]+?)\s*</g)) {
      if (isProse(m[1])) findings.push({ rel, line: i + 1, kind: 'JSX', text: m[1].trim() })
    }
    // (a2) Çok satırlı JSX metni: açılış/kapanış etiketi başka satırda olunca metin tek başına bir satırda kalır
    //      (örn.  <p>\n  Türkçe metin\n</p>) — bu satırlarda <>{} ve tırnak yoktur.
    {
      // basit {ifade}'leri ({' '}, {name} vb.) çıkar — metin yanlarında olabilir
      const bare = raw.replace(/\{[^{}]*\}/g, '').trim()
      if (bare && !/[<>=`'"]/.test(bare) && !/^[0-9.,%₺$+\-*/ ]+$/.test(bare) && isTurkish(bare)) {
        findings.push({ rel, line: i + 1, kind: 'JSX', text: bare })
      }
    }
    // (b) string literal'ler:  '...' / "..."  (maskelemeden sonra kalanlar şüpheli)
    const strs = line.matchAll(/(['"])((?:\\.|(?!\1).)*?)\1/g)
    for (const m of strs) {
      if (!isTurkish(m[2])) continue
      // obje anahtarı mı?  'Halı Saha': 'football'  → anahtar veridir, gösterim değil
      const after = line.slice(m.index + m[0].length)
      if (/^\s*:/.test(after)) continue
      // tek-kelime, tamamı küçük harf token → büyük olasılıkla state/id ('hesap','dersler','salon')
      if (/^[a-z0-9ğşıçöü_-]+$/.test(m[2].trim())) continue
      findings.push({ rel, line: i + 1, kind: 'STR', text: m[2].trim() })
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) { walk(abs); continue }
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue
    if (SKIP_FILES.has(entry.name)) continue
    const rel = path.relative(ROOT, abs)
    if (SKIP_FILE_RE.test(rel) || SKIP_DIR_RE.test(rel)) continue
    scanFile(abs, rel)
  }
}

for (const d of SCAN_DIRS) walk(path.join(ROOT, d))

// --- Anahtar paritesi: TR'de olup EN'de olmayan (veya tersi) bir anahtar varsa t() sessizce Türkçe'ye düşer ---
function checkKeyParity() {
  const dictFile = path.join(ROOT, 'src/lib/i18n.tsx')
  const src = fs.readFileSync(dictFile, 'utf8')
  const trStart = src.indexOf('tr: {')
  const enStart = src.indexOf('en: {')
  if (trStart < 0 || enStart < 0) return []
  const trBlock = src.slice(trStart, enStart)
  const enBlock = src.slice(enStart)
  // Sadece noktalı i18n anahtarları (a.b) — yardımcı haritalar ('Basketbol' vb.) hariç
  const keysOf = (b) => new Set([...b.matchAll(/^\s*'([a-z][\w]*\.[\w.]+)'\s*:/gm)].map(m => m[1]))
  const tr = keysOf(trBlock), en = keysOf(enBlock)
  const issues = []
  for (const k of tr) if (!en.has(k)) issues.push(`EN eksik: '${k}'`)
  for (const k of en) if (!tr.has(k)) issues.push(`TR eksik: '${k}'`)
  return issues
}
const parity = checkKeyParity()

// Tekrarları kaldır (aynı dosya+satır+metin birden çok desenle yakalanmış olabilir)
const seen = new Set()
const unique = findings.filter(f => { const k = `${f.rel}:${f.line}:${f.text}`; if (seen.has(k)) return false; seen.add(k); return true })

// Raporla
const byFile = {}
for (const f of unique) (byFile[f.rel] ||= []).push(f)
const files = Object.keys(byFile).sort()
let total = 0
for (const file of files) {
  console.log(`\n${file}`)
  for (const f of byFile[file]) {
    console.log(`  ${String(f.line).padStart(4)}  [${f.kind}]  ${f.text.slice(0, 90)}`)
    total++
  }
}
if (parity.length) {
  console.log('\nAnahtar paritesi (TR/EN sözlüğü tutarsız → t() Türkçe\'ye düşer):')
  for (const p of parity) console.log('  ' + p)
}
if (total === 0 && parity.length === 0) {
  console.log('✅ i18n taraması temiz — çevrilmemiş Türkçe metin yok, TR/EN anahtarları tutarlı.')
  process.exit(0)
}
console.log(`\n⚠️  ${total} olası çevrilmemiş metin (${files.length} dosya) + ${parity.length} anahtar paritesi sorunu.`)
process.exit(1)
