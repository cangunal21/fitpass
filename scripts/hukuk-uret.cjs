#!/usr/bin/env node
/*
 * HUKUK METNİ ÜRETİCİSİ — PDF kaynaklarından web sayfası içeriği üretir.
 *
 * NEDEN VAR: hukuk belgeleri ~/sipsakspor_*_src.py içinde HTML olarak duruyor ve oradan PDF
 * basılıyor. Aynı metni web sayfasına ELLE kopyalasaydık iki kopya kaçınılmaz olarak sürüklenirdi:
 * avukat PDF'i günceller, site eski metni göstermeye devam ederdi — ve sitede gösterilen metin
 * kullanıcının kabul ettiği metindir. Bu yüzden site içeriği kaynaktan ÜRETİLİR, elle yazılmaz.
 *
 * Kullanım:  node scripts/hukuk-uret.cjs        (üretir, değişiklik varsa yazar)
 *            node scripts/hukuk-uret.cjs --check (üretilen dosya güncel mi — CI kapısı)
 *
 * ÇIKTI: src/lib/hukuk/belgeler.generated.ts  (elle DÜZENLENMEZ)
 *
 * KAYNAKLAR REPODA DEĞİL: .py üreteçleri ~/ altında duruyor, CI runner'ında yoktur. Bu yüzden
 * --check, hiç kaynak bulamazsa HATA VERMEZ, atlar. Kapının değeri yereldir: metni düzenleyip
 * yeniden üretmeyi unutan kişiyi commit'ten ÖNCE yakalar. CI'da yalnızca "kaynak yok" der.
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

const KAYNAK_DIZIN = os.homedir()
const CIKTI = path.resolve(__dirname, '../src/lib/hukuk/belgeler.generated.ts')

// YAYIN LİSTESİ — burada olmayan belge siteye ÇIKMAZ.
// Kurucu Ortaklık Sözleşmesi ve Avukat İnceleme Notu BİLEREK yok: biri ortaklar arası,
// diğeri iç hukuki değerlendirme. İkisi de kamuya açık olmamalı.
const BELGELER = [
  { slug: 'gizlilik', dosya: 'sipsakspor_gizlilik_src.py', baslik: 'Gizlilik Politikası ve Aydınlatma Metni', kitle: 'herkes' },
  { slug: 'uyelik', dosya: 'sipsakspor_uyelik_src.py', baslik: 'Üyelik Sözleşmesi ve Kullanım Koşulları', kitle: 'uye' },
  { slug: 'mesafeli-satis', dosya: 'sipsakspor_mesafeli_src.py', baslik: 'Mesafeli Satış Sözleşmesi', kitle: 'uye' },
  { slug: 'on-bilgilendirme', dosya: 'sipsakspor_onbilgi_src.py', baslik: 'Ön Bilgilendirme Formu', kitle: 'uye' },
  { slug: 'iptal-iade', dosya: 'sipsakspor_iptal_iade_src.py', baslik: 'İptal ve İade Politikası', kitle: 'uye' },
  { slug: 'cerez', dosya: 'sipsakspor_cerez_src.py', baslik: 'Çerez Politikası', kitle: 'herkes' },
  { slug: 'acik-riza', dosya: 'sipsakspor_acik_riza_src.py', baslik: 'Açık Rıza Beyanı', kitle: 'uye' },
  { slug: 'topluluk-kurallari', dosya: 'sipsakspor_topluluk_src.py', baslik: 'Topluluk Kuralları ve İçerik Politikası', kitle: 'herkes' },
  { slug: 'yorum-politikasi', dosya: 'sipsakspor_yorum_src.py', baslik: 'Yorum ve Değerlendirme Politikası', kitle: 'herkes' },
  { slug: 'puan-odul', dosya: 'sipsakspor_puan_src.py', baslik: 'Puan ve Ödül Programı Kuralları', kitle: 'uye' },
  { slug: 'salon-araciligi', dosya: 'sipsakspor_salon_src.py', baslik: 'Salon Aracılık Sözleşmesi', kitle: 'salon' },
  { slug: 'salon-veri-koruma', dosya: 'sipsakspor_veri_koruma_src.py', baslik: 'Salon Veri Koruma Protokolü', kitle: 'salon' },
  { slug: 'egitmen-aydinlatma', dosya: 'sipsakspor_aydinlatma_src.py', baslik: 'Eğitmen Aydınlatma ve Açık Rıza Metni', kitle: 'egitmen' },
  // ÜÇ PARÇALI: gövde + EK + EK-B. PDF'te de üçü birleştirilerek tek belge üretiliyor
  // (govde_src → ek_src → ek2_src zinciri), sitede de aynı sırada birleştirilir.
  { slug: 'antrenor-sozlesmesi', dosyalar: ['sipsakspor_antrenor_govde_src.py', 'sipsakspor_antrenor_ek_src.py', 'sipsakspor_antrenor_ek2_src.py'], baslik: 'Antrenör Pazaryeri Sözleşmesi', kitle: 'egitmen' },
]

const ikiHane = n => String(n).padStart(2, '0')
const trTarih = d => `${ikiHane(d.getDate())}.${ikiHane(d.getMonth() + 1)}.${d.getFullYear()}`

function govdeCikar(ham, dosya) {
  // Kaynaklar html="""<html><head><style>"""+CSS+"""</style></head><body> ... </body></html>"""
  // kalıbında. Python string mekaniğini ayrıştırmak yerine <body>…</body> arasını alıyoruz:
  // bu, CSS'in nasıl birleştirildiğinden bağımsız çalışır.
  const bas = ham.indexOf('<body>')
  const son = ham.lastIndexOf('</body>')
  if (bas === -1 || son === -1 || son < bas) {
    throw new Error(`${dosya}: <body>…</body> bulunamadı — kaynak yapısı değişmiş olabilir`)
  }
  return ham.slice(bas + '<body>'.length, son).trim()
}

function surumCikar(govde, dosya) {
  // Sürüm etiketi .sub div'inde: "Son güncelleme: [GG.AA.YYYY] · TASLAK 9"
  //
  // BULAMAZSA SESSİZ GEÇMEZ. Bu üreteç .py dosyasının KAYNAK METNİNİ okuyor, çalıştırmıyor;
  // bir kaynak damgayı değişkenden üretmeye kalkarsa (`TASLAK "+VER`) regex eşleşmiyor ve
  // belge sitede SÜRÜMSÜZ görünüyordu. Sürüm, kullanıcının hangi metni kabul ettiğinin
  // kaydıdır (bkz. fitpass/src/utils/consent.ts) — sessizce kaybolamaz.
  const m = govde.match(/TASLAK\s*(\d+)/i)
  if (!m) {
    throw new Error(
      `${dosya}: sürüm etiketi bulunamadı. Belgede "TASLAK N" DÜZ METİN olarak geçmeli — ` +
      `değişkenden üretilirse bu betik göremez (kaynağı çalıştırmıyor, metnini okuyor).`
    )
  }
  return `Taslak ${m[1]}`
}

function uret() {
  const ciktilar = []
  const eksik = []

  for (const b of BELGELER) {
    const dosyalar = b.dosyalar || [b.dosya]
    const yollar = dosyalar.map(d => path.join(KAYNAK_DIZIN, d))
    if (yollar.some(y => !fs.existsSync(y))) {
      eksik.push({ ...b, dosya: dosyalar.filter((_, i) => !fs.existsSync(yollar[i])).join(', ') })
      continue
    }
    const yol = yollar[0]
    const govde = yollar
      .map((y, i) => govdeCikar(fs.readFileSync(y, 'utf8'), dosyalar[i]))
      .join('\n')
    // Yayımlanan metnin GERÇEK bir tarihi olmak zorundadır — sitede gösterilen metin
    // kullanıcının kabul ettiği metindir ve "[GG.AA.YYYY]" bir tarih değildir.
    // Kaynak dosyanın değiştirilme tarihini kullanıyoruz: otomatik ve dürüst.
    const tarih = trTarih(new Date(Math.max(...yollar.map(y => fs.statSync(y).mtime.getTime()))))
    const govdeTarihli = govde.replace(/\[GG\.AA\.YYYY\]/g, tarih)
    // Tabloları kaydırılabilir kutuya al: PDF'te sayfa genişliği sabit, sitede telefon var.
    // Sarmalanmazsa geniş tablo SAYFAYI yatay kaydırtır (gövde metni de bozulur).
    const govdeSon = govdeTarihli.replace(/<table[\s\S]*?<\/table>/g, m => `<div class="tablo-kutu">${m}</div>`)
    ciktilar.push({ ...b, govde: govdeSon, tarih, surum: surumCikar(govde, dosyalar[0]) })
  }

  const satirlar = [
    '// ÜRETİLEN DOSYA — ELLE DÜZENLEMEYİN.',
    '// Kaynak: ~/sipsakspor_*_src.py (PDF üreteçleri). Yeniden üretmek için:',
    '//   npm run hukuk:uret',
    '// Metni değiştirmek isterseniz KAYNAK .py dosyasını düzenleyin; aksi hâlde PDF ile',
    '// sitede gösterilen metin birbirinden ayrışır.',
    '',
    'export type HukukKitle = ' + "'herkes' | 'uye' | 'salon' | 'egitmen'",
    '',
    'export type HukukBelgesi = {',
    '  slug: string',
    '  baslik: string',
    '  kitle: HukukKitle',
    '  surum: string | null',
    '  tarih: string',
    '  govde: string',
    '}',
    '',
    'export const HUKUK_BELGELERI: HukukBelgesi[] = [',
  ]

  for (const c of ciktilar) {
    satirlar.push('  {')
    satirlar.push(`    slug: ${JSON.stringify(c.slug)},`)
    satirlar.push(`    baslik: ${JSON.stringify(c.baslik)},`)
    satirlar.push(`    kitle: ${JSON.stringify(c.kitle)},`)
    satirlar.push(`    surum: ${JSON.stringify(c.surum)},`)
    satirlar.push(`    tarih: ${JSON.stringify(c.tarih)},`)
    satirlar.push(`    govde: ${JSON.stringify(c.govde)},`)
    satirlar.push('  },')
  }

  satirlar.push(']')
  satirlar.push('')
  satirlar.push('export const hukukBul = (slug: string): HukukBelgesi | undefined =>')
  satirlar.push('  HUKUK_BELGELERI.find(b => b.slug === slug)')
  satirlar.push('')

  return { icerik: satirlar.join('\n'), ciktilar, eksik }
}

/**
 * BACKEND SÜRÜM SENKRONU.
 *
 * Onay kaydı, kullanıcının HANGİ SÜRÜMÜ kabul ettiğini yazıyor (fitpass/src/utils/consent.ts →
 * RIZA_BELGELERI). O liste elle güncelleniyordu ve bir yorumla uyarılıyordu — yetmedi: Salon
 * Aracılık Taslak 11'den 12'ye çıktığında backend 11'de kaldı ve kullanıcılar YENİ metni görüp
 * kayda ESKİ sürüm yazılacaktı. Bu, onay kaydının ispat değerini yok eder.
 * Artık uyarı değil KAPI: sürümler ayrışırsa --check kırmızı yanar.
 */
function backendSurumFarki(ciktilar) {
  const yol = path.join(KAYNAK_DIZIN, 'fitpass/src/utils/consent.ts')
  if (!fs.existsSync(yol)) return null // backend bu makinede yok (CI) → atla
  const kaynak = fs.readFileSync(yol, 'utf8')
  const farklar = []
  for (const c of ciktilar) {
    // RIZA_BELGELERI içindeki `slug: { surum: 'Taslak N'` kalıbı (tırnaklı ya da tırnaksız anahtar)
    const re = new RegExp(`['"]?${c.slug.replace(/[-]/g, '\\-')}['"]?\\s*:\\s*\\{[^}]*?surum:\\s*['"]([^'"]+)['"]`)
    const m = kaynak.match(re)
    if (!m) continue // o belge onay listesinde yok — normal (her belge onaylanmıyor)
    if (m[1] !== c.surum) farklar.push({ slug: c.slug, web: c.surum, backend: m[1] })
  }
  return farklar
}

const { icerik, ciktilar, eksik } = uret()
const kontrol = process.argv.includes('--check')

fs.mkdirSync(path.dirname(CIKTI), { recursive: true })
const mevcut = fs.existsSync(CIKTI) ? fs.readFileSync(CIKTI, 'utf8') : null

if (kontrol) {
  if (!ciktilar.length) {
    console.log('⏭️  Hukuk kaynakları bu makinede yok (CI) — kontrol atlandı.')
    process.exit(0)
  }
  if (mevcut !== icerik) {
    console.error('\n❌ src/lib/hukuk/belgeler.generated.ts GÜNCEL DEĞİL.')
    console.error('   Hukuk kaynağı değişmiş ama üretilen dosya yenilenmemiş.')
    console.error('   Çalıştırın:  npm run hukuk:uret\n')
    process.exit(1)
  }
  const farklar = backendSurumFarki(ciktilar)
  if (farklar && farklar.length) {
    console.error('\n❌ BACKEND ONAY SÜRÜMLERİ AYRIŞMIŞ.')
    console.error('   Kullanıcı yeni metni görüp kayda ESKİ sürüm yazılır — onay kaydının')
    console.error('   ispat değeri yok olur. fitpass/src/utils/consent.ts → RIZA_BELGELERI:')
    for (const f of farklar) console.error(`   ${f.slug.padEnd(22)} site: ${f.web}   backend: ${f.backend}`)
    process.exit(1)
  }
  console.log(`✅ Hukuk metinleri güncel — ${ciktilar.length} belge.`)
} else {
  fs.writeFileSync(CIKTI, icerik)
  console.log(`✅ ${ciktilar.length} belge üretildi → src/lib/hukuk/belgeler.generated.ts`)
  for (const c of ciktilar) {
    console.log(`   ${c.slug.padEnd(22)} ${String(c.surum || '—').padEnd(11)} ${c.tarih}  ${(c.govde.length / 1024).toFixed(1)} KB`)
  }
}

const surumFarklari = backendSurumFarki(ciktilar)
if (surumFarklari && surumFarklari.length) {
  console.log('\n⚠️  BACKEND ONAY SÜRÜMLERİ AYRIŞMIŞ — fitpass/src/utils/consent.ts güncellenmeli:')
  for (const f of surumFarklari) console.log(`   ${f.slug.padEnd(22)} site: ${f.web}   backend: ${f.backend}`)
}

if (eksik.length) {
  console.log(`\n⚠️  ${eksik.length} belgenin kaynağı YOK, siteye çıkmayacak:`)
  for (const e of eksik) console.log(`   ${e.slug.padEnd(22)} ← ~/${e.dosya}`)
  console.log('   (Kaynak üretilince bu betiği yeniden çalıştırın.)')
}
