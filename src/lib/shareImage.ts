/**
 * PAYLAŞIM GÖRSELİ ÜRETİCİ (task #34)
 *
 * NEDEN CANVAS, NEDEN html2canvas DEĞİL:
 *  • html2canvas widget'ın EKRAN GÖRÜNTÜSÜNÜ alır. Takvim widget'ı yatay, beyaz zeminli ve
 *    web arayüzü için tasarlanmış — Instagram story'de (1080×1920 DİKEY) küçücük bir kutu
 *    olarak, bol boşlukla görünür. Kimse öyle bir görseli paylaşmaz.
 *  • Burada story ölçüsünde ÖZEL bir kart çiziyoruz: marka gradyanı, iri seri sayıları,
 *    ay ızgarası, alt bilgi. Paylaşılmaya değer bir görsel çıkıyor.
 *  • Ayrıca ~200KB'lık bir bağımlılık eklemiyoruz ve html2canvas'ın modern CSS'te
 *    (gradyan, gölge, emoji) yaşadığı bilinen sorunlara girmiyoruz.
 *
 * Çıktı: 1080×1920 PNG Blob.
 */

export type PaylasimVerisi = {
  gunlukSeri: number
  haftalikSeri: number
  ayEtiketi: string           // "Ağustos 2026"
  gunSayisi: number           // ayın gün sayısı
  baslangicOfseti: number     // ayın 1'i hangi sütunda (Pazartesi=0)
  aktifGunler: Set<number>    // aktivite olan gün numaraları
  ayAktiviteSayisi: number
  haftaGunleri: string[]      // ["Pzt","Sal",...] — locale'den gelir
  metinler: {
    gunlukSeri: string        // "günlük seri"
    haftalikSeri: string      // "haftalık seri"
    ayOzeti: string           // "bu ay N aktivite"
  }
}

const G = 1080
const Y = 1920
const INDIGO = '#4F46E5'

/** Yuvarlatılmış dikdörtgen — Safari'de roundRect desteklenmeyebiliyor, elle çiziyoruz. */
function yuvarlakDikdortgen(c: CanvasRenderingContext2D, x: number, y: number, g: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + g, y, x + g, y + h, r)
  c.arcTo(x + g, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + g, y, r)
  c.closePath()
}

export async function paylasimGorseliUret(v: PaylasimVerisi): Promise<Blob> {
  const cv = document.createElement('canvas')
  cv.width = G
  cv.height = Y
  const c = cv.getContext('2d')
  if (!c) throw new Error('canvas 2d bağlamı alınamadı')

  // ── Zemin: marka gradyanı (indigo) ────────────────────────────────────────
  const grad = c.createLinearGradient(0, 0, G, Y)
  grad.addColorStop(0, '#4F46E5')
  grad.addColorStop(0.55, '#6366F1')
  grad.addColorStop(1, '#818CF8')
  c.fillStyle = grad
  c.fillRect(0, 0, G, Y)

  // Hafif doku: köşelerde yumuşak ışık
  const isik = c.createRadialGradient(G * 0.8, Y * 0.15, 0, G * 0.8, Y * 0.15, G * 0.9)
  isik.addColorStop(0, 'rgba(255,255,255,0.18)')
  isik.addColorStop(1, 'rgba(255,255,255,0)')
  c.fillStyle = isik
  c.fillRect(0, 0, G, Y)

  const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  c.textAlign = 'center'

  // ── Marka ─────────────────────────────────────────────────────────────────
  c.fillStyle = '#fff'
  c.font = `800 62px ${sans}`
  c.fillText('şipşakspor', G / 2, 190)
  c.font = `500 30px ${sans}`
  c.fillStyle = 'rgba(255,255,255,0.72)'
  c.fillText("İstanbul'un spor platformu", G / 2, 240)

  // ── Seri kartları ─────────────────────────────────────────────────────────
  const kartY = 330
  const kartH = 300
  const bosluk = 40
  const kartG = (G - 120 - bosluk) / 2

  const kartCiz = (x: number, sayi: number, etiket: string) => {
    c.fillStyle = 'rgba(255,255,255,0.14)'
    yuvarlakDikdortgen(c, x, kartY, kartG, kartH, 36)
    c.fill()
    c.fillStyle = '#fff'
    c.font = `800 130px ${sans}`
    c.fillText(String(sayi), x + kartG / 2, kartY + 165)
    c.font = `600 30px ${sans}`
    c.fillStyle = 'rgba(255,255,255,0.85)'
    // Uzun etiketleri iki satıra böl (ör. "haftalık seri")
    const kelimeler = etiket.split(' ')
    if (kelimeler.length > 1 && etiket.length > 12) {
      c.fillText(kelimeler[0], x + kartG / 2, kartY + 218)
      c.fillText(kelimeler.slice(1).join(' '), x + kartG / 2, kartY + 256)
    } else {
      c.fillText(etiket, x + kartG / 2, kartY + 226)
    }
  }
  kartCiz(60, v.gunlukSeri, v.metinler.gunlukSeri)
  kartCiz(60 + kartG + bosluk, v.haftalikSeri, v.metinler.haftalikSeri)

  // ── Takvim ızgarası ───────────────────────────────────────────────────────
  const tvY = 740
  const tvH = 780
  c.fillStyle = 'rgba(255,255,255,0.10)'
  yuvarlakDikdortgen(c, 60, tvY, G - 120, tvH, 40)
  c.fill()

  c.fillStyle = '#fff'
  c.font = `700 44px ${sans}`
  c.fillText(v.ayEtiketi, G / 2, tvY + 80)

  const hucre = (G - 120 - 60) / 7
  const izgaraX = 90
  const basliklarY = tvY + 145

  c.font = `600 24px ${sans}`
  c.fillStyle = 'rgba(255,255,255,0.6)'
  v.haftaGunleri.forEach((g, i) => {
    c.fillText(g.slice(0, 3), izgaraX + hucre * i + hucre / 2, basliklarY)
  })

  const satirY = basliklarY + 55
  const satirH = 92
  for (let gun = 1; gun <= v.gunSayisi; gun++) {
    const idx = v.baslangicOfseti + gun - 1
    const sutun = idx % 7
    const satir = Math.floor(idx / 7)
    const cx = izgaraX + hucre * sutun + hucre / 2
    const cy = satirY + satir * satirH

    const aktif = v.aktifGunler.has(gun)
    if (aktif) {
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(cx, cy, 30, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = INDIGO
      c.font = `800 26px ${sans}`
    } else {
      c.fillStyle = 'rgba(255,255,255,0.34)'
      c.font = `500 26px ${sans}`
    }
    c.fillText(String(gun), cx, cy + 9)
  }

  // ── Ay özeti + alt bilgi ──────────────────────────────────────────────────
  c.fillStyle = 'rgba(255,255,255,0.9)'
  c.font = `600 34px ${sans}`
  c.fillText(v.metinler.ayOzeti, G / 2, tvY + tvH + 90)

  c.fillStyle = 'rgba(255,255,255,0.62)'
  c.font = `500 30px ${sans}`
  c.fillText('sipsakspor.com', G / 2, Y - 90)

  return await new Promise<Blob>((res, rej) => {
    cv.toBlob(b => (b ? res(b) : rej(new Error('görsel üretilemedi'))), 'image/png')
  })
}

/**
 * Görseli paylaş. Sırayla dener:
 *  1) navigator.share({ files }) — mobil: Instagram/WhatsApp story paylaşım sayfası açılır
 *  2) indirme — masaüstünde paylaşım API'si yok; kullanıcı dosyayı alır
 * Dönüş: hangi yolun kullanıldığı (arayüz geri bildirimi için).
 */
export async function gorseliPaylas(blob: Blob, dosyaAdi = 'sipsakspor.png'): Promise<'paylasildi' | 'indirildi' | 'iptal'> {
  const dosya = new File([blob], dosyaAdi, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }

  if (typeof nav.share === 'function' && nav.canShare?.({ files: [dosya] })) {
    try {
      await nav.share({ files: [dosya], title: 'Şipşakspor' })
      return 'paylasildi'
    } catch (e) {
      // AbortError = kullanıcı paylaşım sayfasını kapattı; hata değil.
      if ((e as Error)?.name === 'AbortError') return 'iptal'
      // Diğer hatalarda indirmeye düş.
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = dosyaAdi
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'indirildi'
}
