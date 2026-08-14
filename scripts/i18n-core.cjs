/*
 * i18n TARAYICI ÇEKİRDEĞİ — WEB VE MOBİLDE BİREBİR AYNI DOSYA
 * ============================================================================================
 * Bu dosya iki repoda da AYNI olmalıdır. Aşağıdaki CEKIRDEK_SURUMU damgası bunu zorlar:
 * dosya değişip damga güncellenmezse tarayıcı açılışta hata verir ve CI kırılır.
 *
 * NEDEN BÖYLE: tarayıcının iki kopyası vardı ve bağımsız evrimleşti. Sonuç ölçüldü —
 * kör noktaları TAM TERSTİ: web 'DOLU'/'Kapasite'yi yakalayıp 'Bildirimler'i kaçırıyor,
 * mobil tam tersini yapıyordu. Yani "i18n kapısı" diye iki farklı kapı vardı ve ikisi de
 * diğerinin gördüğünü göremiyordu. Üstelik mobil kopyada satır-sonu yorumu ayıklaması yoktu
 * ve bu yanlış pozitif MOBİL CI'I 11–13 AĞUSTOS ARASI KIRMIZI TUTTU (kimse fark etmedi).
 *
 * PLATFORMA ÖZEL OLAN ŞEY BURADA DEĞİL: hangi klasörlerin taranacağı, hangi dosyaların
 * atlanacağı ve platforma özgü maskeler (React Navigation `name=` gibi) çağıran tarafından
 * `tara(config)` ile verilir. Burada YALNIZ "neyi Türkçe sayarız / neyi metin sayarız"
 * kuralları durur — ve o kurallar iki istemcide farklı OLMAMALIDIR.
 * ============================================================================================
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Bu satır dosyanın geri kalanının SHA-256 ön ekidir. Çekirdeği değiştirdiysen:
//   1) ikiz repodaki kopyayı da güncelle,  2) buradaki damgayı yenile (hata mesajı doğrusunu yazar).
const CEKIRDEK_SURUMU = '53c0969aebb2'

function surumDogrula() {
  const ham = fs.readFileSync(__filename, 'utf8')
  const damgasiz = ham.split('\n').filter(l => !l.includes('const CEKIRDEK_SURUMU =')).join('\n')
  const beklenen = crypto.createHash('sha256').update(damgasiz).digest('hex').slice(0, 12)
  if (CEKIRDEK_SURUMU !== beklenen) {
    console.error(
      `\n❌ i18n çekirdeği değişmiş ama damgası güncellenmemiş.\n` +
      `   Beklenen damga: ${beklenen}\n\n` +
      `   YAPILACAK: bu dosyayı İKİZ REPOYA da kopyala (web ↔ mobil), sonra iki kopyada da\n` +
      `   CEKIRDEK_SURUMU değerini yukarıdaki damgayla değiştir.\n\n` +
      `   Sebep: iki kopya bağımsız evrimleşince kör noktalar ayrıştı ve bir repo'nun CI'ı\n` +
      `   günlerce kırmızı kaldı. Damga, sessiz sürüklenmeyi imkânsız kılar.\n`
    )
    process.exit(1)
  }
}

// ── TÜRKÇE TESPİTİ ───────────────────────────────────────────────────────────────────────────
// Özel karakterler kesin sinyal.
const TR_CHARS = /[ğşıçöüĞŞİÇÖÜ]/

// ASCII Türkçe (özel karakter içermeyen) kelimeler — TAM kelime eşleşmesi.
// Bu liste doğası gereği eksik kalır; yeni sabit metin eklerken t() kullan, buraya güvenme.
const TR_WORDS = new RegExp(
  '\\b(' + [
    've', 'veya', 'ile', 'için', 'icin', 'bir', 'bu', 'şu', 'su', 'daha', 'çok', 'cok',
    'var', 'yok', 'evet', 'hayır', 'hayir', 'tamam', 'iptal', 'kaydet', 'sil', 'ekle',
    'ara', 'bul', 'seç', 'sec', 'gör', 'gor', 'git', 'gel', 'yap', 'et', 'ol',
    'ders', 'dersler', 'salon', 'salonlar', 'hoca', 'hocalar', 'üye', 'uye',
    'giriş', 'giris', 'çıkış', 'cikis', 'kayıt', 'kayit', 'profil', 'ayarlar',
    // 2026-08 denetimi: bunlar listede YOKTU ve Türkçe özel karakter de içermedikleri için
    // üç metin ('DOLU', '← Ana sayfa', '{n} aktivite') tarayıcıdan geçip EN arayüzde Türkçe kaldı.
    'dolu', 'bos', 'sayfa', 'aktivite', 'yer', 'kalan', 'kaldi', 'sonraki', 'onceki',
    'kapasite', 'kontenjan', 'rezervasyon', 'fiyat', 'ucret', 'indirim', 'kupon',
    'davet', 'paylas', 'kopyala', 'katil', 'liste', 'harita', 'kategori', 'sirala',
    'filtre', 'temizle', 'vazgec', 'devam', 'basla', 'yeni', 'eski',
  ].join('|') + ')\\b', 'i'
)

// Türkçe KÖKLER — sondaki \b YOK, böylece ekli hâlleri de yakalar ("Bildirimler", "Gizliliği").
// TR_WORDS tam kelime aradığı için tek başına "Bildirimler"i kaçırıyordu; bu liste o boşluğu kapatır.
// İngilizceyle çakışmayacak, açıkça Türkçe köklerle sınırlı tutuldu.
const TR_STEMS = new RegExp(
  '\\b(' + [
    'bildirim', 'gizlilik', 'gizli', 'destek', 'ayar', 'aktivite', 'etkinlik',
    'davet', 'sporcu', 'rezervasyon', 'eposta', 'hatirlat', 'dogrula', 'yorum',
    'salon', 'egitmen', 'kullanici', 'sikayet', 'degerlendir', 'katil',
    // `favori` İNGİLİZCE "favorite/favorites" ile de eşleşiyordu ve `favoritesError`,
    // `favoriteCount` gibi DEĞİŞKEN ADLARINI "çevrilmemiş Türkçe metin" sanıyordu.
    // Türkçe çekimlerin hiçbiri "favorite" olmaz (favori/favoriler/favoriye/favorilerim),
    // bu yüzden yalnız İngilizce "-te" ekini dışlıyoruz.
    'favori(?!te)',
    'seviye', 'rozet', 'ilce', 'mahalle', 'antren', 'uyelik',
  ].join('|') + ')', 'i'
)

// MARKA ADI ÇEVRİLMEZ. "Şipşakspor" Türkçe özel karakter taşıyor ama bir ÖZEL ADDIR —
// her dilde aynı yazılır. Tarayıcı bunu 7 yerde "çevrilmemiş metin" sanıp gerçek bulguları
// gürültüye boğuyordu. (Telif satırı "© 2026 şipşakspor" da aynı sınıf.)
const MARKA = /^[©\s\d]*şipşakspor[\s\d.,!]*$/i
// ÖZEL ADLAR (şehir/ilçe) her dilde aynı yazılır — çeviri gerektirmez.
// NOT: JS regex'inin `i` bayrağı `İ` (U+0130) → `i` katlamasını YAPMAZ; harf açıkça yazılmalı.
const OZEL_AD = /^[\s,.]*([İIıi]stanbul|[TtŢ]ürkiye|turkiye)[\s,.]*$/i

function isTurkish(s) {
  const trimmed = (s || '').trim()
  // 2 karakter YETER: 've' gibi kısa Türkçe kelimeler de metin olabilir (web kopyası böyleydi;
  // mobil 3 kullanıyordu — birleştirmede DAHA HASSAS olan seçildi).
  if (trimmed.length < 2) return false
  if (MARKA.test(trimmed) || OZEL_AD.test(trimmed)) return false
  if (/^[\d\s.,:%₺$+\-*/()[\]]+$/.test(trimmed)) return false   // saf sayı/noktalama
  if (/^(\.{1,2}\/|@\/|\/)/.test(trimmed)) return false          // import yolu / route (./ ../ @/ /)
  if (/^https?:\/\//.test(trimmed)) return false                 // URL
  // SABİT ADI yalnızca SCREAMING_SNAKE ise atlanır (alt çizgi ŞART).
  // ÖNCEKİ HÂLİ `/^[A-Z_]+$/` idi ve tek kelimelik BÜYÜK HARFLİ ARAYÜZ ETİKETLERİNİ de eliyordu:
  // "DOLU", "YENİ", "İNDİRİM" gibi rozetler taramadan kaçıyordu. (Birleştirme sırasında mobil
  // kopyadan gelen bu kural, web'in yakaladığı bir bulguyu kaybettiriyordu — fixture testi yakaladı.)
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(trimmed)) return false // SABIT_AD (alt çizgili)
  return TR_CHARS.test(trimmed) || TR_WORDS.test(trimmed) || TR_STEMS.test(trimmed)
}

// ── YARDIMCILAR ──────────────────────────────────────────────────────────────────────────────
/**
 * Satır içi yorumları ayıkla — tırnak/şablon içindeki `//` (URL'ler) ve `/*` KORUNUR.
 *
 * İki ayrı boşluk kapatıldı:
 *  1) `// ...` satır sonu yorumu — MOBİL KOPYADA YOKTU; kodun arkasına yazılmış Türkçe
 *     açıklamalar "çevrilmemiş metin" sanılıyor ve CI kırmızı kalıyordu.
 *  2) SATIR ORTASINDAKİ `/* ... *\/` yorumu — blok-yorum tespiti yalnız satır BAŞINDAKİ `/*`
 *     için çalışıyordu. `.catch(() => { /* buton "Katıl" kalır *\/ })` gibi bir satırda
 *     yorumun içindeki tırnaklı Türkçe, gerçek bir string literal sanılıyordu. Yaşandı.
 */
function stripLineComment(line) {
  let q = null // aktif tırnak: ' " `
  let out = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      out += ch
      if (ch === '\\') { out += line[i + 1] ?? ''; i++; continue }
      if (ch === q) q = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; out += ch; continue }
    if (ch === '/' && line[i + 1] === '/') return out          // satır sonu yorumu
    if (ch === '/' && line[i + 1] === '*') {                    // satır içi blok yorumu
      const kapanis = line.indexOf('*/', i + 2)
      if (kapanis === -1) return out                            // satır sonuna kadar yorum
      out += ' '
      i = kapanis + 1
      continue
    }
    out += ch
  }
  return out
}

/** Çeviri helper'ları ve teknik dizgiler maskelenir → geriye YALNIZ şüpheli metin kalır. */
function maskCommon(s) {
  s = s.replace(/\bt\(\s*(['"])(?:\\.|(?!\1).)*\1\s*\)/g, ' __T__ ')          // t('x')
  s = s.replace(/\btSync\(\s*(['"])(?:\\.|(?!\1).)*\1/g, ' __T__ ')            // tSync('x'
  s = s.replace(/\btranslate[A-Za-z]*\([^)]*\)/g, ' __T__ ')                   // translateX(...)
  s = s.replace(/\bimport\s+[^\n]*from\s*(['"])(?:\\.|(?!\1).)*\1/g, ' __I__ ') // import ... from 'x'
  s = s.replace(/\brequire\(\s*(['"])(?:\\.|(?!\1).)*\1\s*\)/g, ' __I__ ')      // require('x')
  s = s.replace(/\bconsole\.[a-z]+\([^)]*\)/g, ' __C__ ')                       // console.log(...)
  // `name: 'Sporcu'` — VERİ KİMLİĞİ (tier/kategori adı), gösterim değil; arayüzde
  // translateTier/translateCategory ile çevriliyor. Bu maske mobil kopyada vardı, webde yoktu.
  s = s.replace(/\bname:\s*(['"])(?:\\.|(?!\1).)*\1/g, ' name:__N__ ')
  // AYRIŞTIRMA BELİRTECİ: `.split('İptal: ')`, `.startsWith('...')` gibi çağrıların argümanı
  // GÖSTERİM metni değil, VERİ üzerinde eşleşme yapılan bir belirteçtir.
  // (Yan not: backend'in `notes` alanına Türkçe önek yazıp istemcinin onu ayrıştırması kırılgan
  //  bir sözleşmedir — önek değişirse arayüz sessizce boş kalır. Ayrı bir iş.)
  s = s.replace(/\.(split|includes|startsWith|endsWith|indexOf|lastIndexOf)\(\s*(['"])(?:\\.|(?!\2).)*\2/g, '.$1( __D__ ')
  // İKİ DİLLİ TERNARY: `lang === 'en' ? 'Requested' : 'İstek gönderildi'` — bu metin ÇEVRİLMİŞ,
  // yalnızca t() yerine satır içi yazılmış. Tarayıcı Türkçe dalını "çevrilmemiş" sanıyordu.
  s = s.replace(/\blang\s*===\s*(['"])en\1\s*\?[^:]*:\s*(['"])(?:\\.|(?!\2).)*\2/g, ' __T__ ')
  return s
}

// ── TARAMA ───────────────────────────────────────────────────────────────────────────────────
/**
 * @param {object} cfg
 * @param {string}   cfg.root            repo kökü
 * @param {string[]} cfg.scanDirs        taranacak klasörler (platforma özel)
 * @param {Set}      cfg.skipFiles       dosya ADIYLA atlananlar (platforma özel)
 * @param {RegExp}   cfg.skipFileRe      yol/ad deseniyle atlananlar (platforma özel)
 * @param {RegExp}   cfg.skipDirRe       klasör deseniyle atlananlar (platforma özel)
 * @param {(s:string)=>string} [cfg.mask] platforma özel EK maskeleme (React Navigation vb.)
 * @param {(s:string)=>boolean} [cfg.skipString] platforma özel string atlama kuralı
 */
function tara(cfg) {
  surumDogrula()
  const findings = []
  const maskSafe = (s) => (cfg.mask ? cfg.mask(maskCommon(s)) : maskCommon(s))

  function scanFile(abs, rel) {
    const lines = fs.readFileSync(abs, 'utf8').split('\n')
    let inBlockComment = false
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i]
      const trimmed = raw.trim()
      if (inBlockComment) { if (trimmed.includes('*/')) inBlockComment = false; continue }
      // `/*` ve JSX yorumu `{/*` — ikisi de kullanıcıya render EDİLMEZ.
      if (trimmed.startsWith('/*') || trimmed.startsWith('{/*')) {
        if (!trimmed.includes('*/')) inBlockComment = true
        continue
      }
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
      if (/\bconsole\.(log|warn|error|info)\b/.test(raw)) continue

      const raw2 = stripLineComment(raw)
      const line = maskSafe(raw2)

      // (a) JSX metin düğümleri:  > metin <
      for (const m of line.matchAll(/>([^<]*)</g)) {
        const txt = m[1].replace(/\{[^{}]*\}/g, '').trim()
        // Karşılaştırma operatörü JSX etiketi DEĞİLDİR: `gun >= 1 && gun <= n` bu desene takılıyor
        // ve aradaki "= 1 && gun" metin sanılıyordu. Tek `&` bilerek dışlanmıyor (Şartlar & Koşullar).
        if (/[=;]|&&|\|\||__[TIC]__/.test(txt)) continue
        if (isTurkish(txt)) findings.push({ rel, line: i + 1, kind: 'JSX', text: txt })
      }
      // Kenar JSX metinleri kod-noktalama içermez (TS generic'lerini elemek için)
      const isProse = (txt) => isTurkish(txt) && !/[()[\]'"=;|`]/.test(txt) && !/__[TIC]__/.test(txt)
      // (a1) satır SONUNDA metin:  <Icon /> Türkçe
      for (const m of line.matchAll(/>([^<>{}]+?)\s*$/g)) {
        if (isProse(m[1])) findings.push({ rel, line: i + 1, kind: 'JSX', text: m[1].trim() })
      }
      // (a1b) satır BAŞINDA metin:  Türkçe </tag>
      for (const m of line.matchAll(/^\s*([^<>{}]+?)\s*</g)) {
        if (isProse(m[1])) findings.push({ rel, line: i + 1, kind: 'JSX', text: m[1].trim() })
      }
      // (a2) tek başına duran çok satırlı JSX metni
      {
        const bare = raw2.replace(/\{[^{}]*\}/g, '').trim()
        // KOD NOKTALAMASI DIŞLANIR — proje TÜRKÇE DEĞİŞKEN ADI kullanıyor (gun, kalan, hata…),
        // `}, [kalan])` gibi satırlar metin sanılıyordu. Normal parantez BİLEREK dışlanmıyor
        // ("Ders (60 dk)" gerçek bir metindir).
        // Maskeleme kalıntısı (__T__ / __I__ / __C__) içeren satır KOD'dur: çeviri helper'ı
        // zaten oradaydı, geriye kalan yalnızca değişken adları.
        if (/__[TIC]__/.test(bare)) continue
        const kodNoktalama = /[<>=`'"{}[\];&|]/.test(bare) || /=>/.test(bare)
        if (bare && !/^[\w$]+\s*:/.test(bare) && !kodNoktalama && !/^[0-9.,%₺$+\-*/ ]+$/.test(bare) && isTurkish(bare)) {
          findings.push({ rel, line: i + 1, kind: 'JSX', text: bare })
        }
      }
      // (b) string literal'ler
      for (const m of line.matchAll(/(['"])((?:\\.|(?!\1).)*?)\1/g)) {
        const val = m[2].trim()
        if (!isTurkish(val)) continue
        const after = line.slice(m.index + m[0].length)
        if (/^\s*:/.test(after)) continue                          // obje ANAHTARI → veri
        if (/^[a-z0-9ğşıçöü_-]+$/.test(val)) continue              // tek-kelime küçük harf → state/id
        if (/^[\w-]+\/[\w/:.-]+$/.test(val)) continue              // route/derin bağlantı yolu
        if (cfg.skipString && cfg.skipString(val)) continue
        findings.push({ rel, line: i + 1, kind: 'STR', text: val })
      }
    }
  }

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) { walk(abs); continue }
      if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue
      if (cfg.skipFiles.has(entry.name)) continue
      const rel = path.relative(cfg.root, abs)
      if (cfg.skipFileRe.test(rel) || cfg.skipDirRe.test(rel)) continue
      scanFile(abs, rel)
    }
  }

  for (const d of cfg.scanDirs) {
    const abs = path.join(cfg.root, d)
    if (fs.existsSync(abs)) walk(abs)
  }
  return findings
}

/** TR/EN sözlük anahtar paritesi — iki dilde de aynı anahtarlar olmalı. */
function anahtarParitesi(i18nPath) {
  const src = fs.readFileSync(i18nPath, 'utf8')
  const bloklar = [...src.matchAll(/(tr|en)\s*:\s*\{/g)]
  if (bloklar.length < 2) return { tr: [], en: [], eksikEn: [], eksikTr: [] }
  const kesit = (baslangic) => {
    let derinlik = 0, i = baslangic
    for (; i < src.length; i++) {
      if (src[i] === '{') derinlik++
      else if (src[i] === '}') { derinlik--; if (derinlik === 0) break }
    }
    return src.slice(baslangic, i)
  }
  const anahtar = (blok) => new Set([...blok.matchAll(/^\s*'([a-zA-Z0-9_.]+)':/gm)].map(m => m[1]))
  const tr = anahtar(kesit(bloklar[0].index + bloklar[0][0].length - 1))
  const en = anahtar(kesit(bloklar[1].index + bloklar[1][0].length - 1))
  return {
    tr: [...tr], en: [...en],
    eksikEn: [...tr].filter(k => !en.has(k)),
    eksikTr: [...en].filter(k => !tr.has(k)),
  }
}

module.exports = { tara, anahtarParitesi, isTurkish, stripLineComment, CEKIRDEK_SURUMU }
