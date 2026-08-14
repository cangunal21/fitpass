#!/usr/bin/env node
/*
 * i18n kapsama tarayıcısı — WEB sarmalayıcısı.
 *
 * KURALLAR BURADA DEĞİL: "neyi Türkçe sayarız / neyi metin sayarız" mantığı `i18n-core.cjs`
 * içinde ve o dosya MOBİL REPOYLA BİREBİR AYNI. Burada yalnızca PLATFORMA ÖZEL yapılandırma
 * durur: hangi klasörler taranır, hangi yüzeyler bilerek Türkçe kalır.
 *
 * NEDEN AYRILDI: tarayıcının iki kopyası bağımsız evrimleşmişti ve kör noktaları TAM TERSTİ —
 * web 'DOLU'/'Kapasite'yi yakalayıp 'Bildirimler'i kaçırıyor, mobil tam tersini yapıyordu.
 * Yani "i18n kapısı" diye iki farklı kapı vardı. Çekirdek tek olunca bu imkânsız hâle geliyor.
 *
 * Kullanım:  node scripts/i18n-scan.cjs        (bulgu varsa exit 1)
 */
const path = require('path')
const { tara, anahtarParitesi } = require('./i18n-core.cjs')

const ROOT = path.resolve(__dirname, '..')

const bulgular = tara({
  root: ROOT,
  scanDirs: ['src/app', 'src/components'],
  // Bu dosyalar meşru biçimde Türkçe içerir (sözlük / mock veri).
  skipFiles: new Set(['i18n.tsx', 'mockData.ts']),
  // global-error.tsx = i18n context'ine erişemez (Next tasarımı) → kasıtlı iki dilli statik metin
  skipFileRe: /(^|\/)(layout|sitemap|robots|global-error)\.tsx?$/,
  // admin + salon-* + egitmen-* : B2B/dahili yüzeyler, bilerek Türkçe-only.
  // Eklenmezse tarayıcı 71 sahte uyarı üretiyor ve kapı sürekli kırmızı kalıp GERÇEK
  // çeviri eksiklerini gizliyordu (uyarı körlüğü).
  skipDirRe: /(^|\/)(admin|salon-[a-z-]+|egitmen-[a-z-]+)\//,
})

// TR/EN anahtar paritesi
const parite = anahtarParitesi(path.join(ROOT, 'src/lib/i18n.tsx'))

let cikis = 0
if (bulgular.length) {
  const dosyaBasina = new Map()
  for (const b of bulgular) {
    if (!dosyaBasina.has(b.rel)) dosyaBasina.set(b.rel, [])
    dosyaBasina.get(b.rel).push(b)
  }
  for (const [rel, list] of dosyaBasina) {
    console.log(`\n${rel}`)
    for (const b of list) console.log(`  ${String(b.line).padStart(4)}  [${b.kind}]  ${b.text.slice(0, 100)}`)
  }
  cikis = 1
}
if (parite.eksikEn.length || parite.eksikTr.length) {
  if (parite.eksikEn.length) console.log(`\nEN'de EKSİK anahtarlar (${parite.eksikEn.length}): ${parite.eksikEn.join(', ')}`)
  if (parite.eksikTr.length) console.log(`\nTR'de EKSİK anahtarlar (${parite.eksikTr.length}): ${parite.eksikTr.join(', ')}`)
  cikis = 1
}

if (cikis) {
  console.log(`\n⚠️  ${bulgular.length} olası çevrilmemiş metin (${new Set(bulgular.map(b => b.rel)).size} dosya) + ${parite.eksikEn.length + parite.eksikTr.length} anahtar paritesi sorunu.`)
} else {
  console.log('\n✅ i18n taraması temiz — çevrilmemiş Türkçe metin yok, TR/EN anahtarları tutarlı.')
}
process.exit(cikis)
