// İSTANBUL SAATİ — TEK KAYNAK.
//
// Neden var: Şipşakspor'daki her ders/seans İstanbul duvar-saatiyle tanımlıdır ve backend
// tarihleri "TR günü" olarak üretir. Tarayıcıda `new Date(...).getDate()` / `toISOString()` /
// `toLocaleDateString()` (timeZone verilmeden) CİHAZIN saat dilimini kullanır:
//   • Kullanıcı yurt dışındaysa ya da cihaz saati yanlışsa gün bir ileri/geri kayar.
//   • Sunucu tarafı render'da (Vercel = UTC) tarih İstanbul'da 00:00–02:59 olan seanslarda
//     bir GÜN geriye kayar — başlık ve OG görselinde yanlış tarih yazar.
// Ölçüldü: salon panelinde seans düzenleme formu tarihi toISOString'den (UTC günü), saati
// toLocaleTimeString'den (cihaz yereli) dolduruyordu; sadece kontenjan değiştirip kaydeden
// salon, gece seansını farkında olmadan bir gün geriye taşıyordu.
//
// Türkiye 2016'dan beri SABİT UTC+3, yaz saati YOK. Ülke yaz saatine dönerse burası değişir.
export const TR_TZ = 'Europe/Istanbul'

/** Bir anın İstanbul'daki takvim günü: 'YYYY-MM-DD' (en-CA bu biçimi verir). */
export const trYmd = (d: Date | string | number): string =>
  new Date(d).toLocaleDateString('en-CA', { timeZone: TR_TZ })

/** İstanbul'da bugünün günü: 'YYYY-MM-DD'. */
export const trToday = (): string => trYmd(new Date())

/** TR duvar-saatinden gerçek an: trInstant('2026-08-03', '19:00') → 16:00Z. */
export const trInstant = (ymd: string, hm = '00:00'): Date => new Date(`${ymd}T${hm}:00+03:00`)

/** 'YYYY-MM-DD' üzerine gün ekler (İstanbul takvimine göre). */
export const trAddDays = (ymd: string, days: number): string =>
  trYmd(new Date(trInstant(ymd, '12:00').getTime() + days * 86400000)) // öğlen: sınır etkilerinden uzak

/** Bir anın İstanbul'daki hafta günü. 0=Pazar … 6=Cumartesi. */
export const trWeekday = (d: Date | string | number): number => {
  const wd = new Date(d).toLocaleDateString('en-US', { timeZone: TR_TZ, weekday: 'short' })
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)
}

/**
 * "Hafta sonu" filtresinin tarih aralığı — İÇİNDE BULUNULAN ya da BİR SONRAKİ hafta sonu.
 *
 * BEDELİ ÖDENMİŞ: web'de `(6 - gun + 7) % 7 || 7` yazıyordu ve `||` sıfırı da yakaladığı için
 * CUMARTESİ GÜNÜ sonuç 7 oluyordu — kullanıcı cumartesi sabahı "Hafta sonu"na bastığında o
 * günün dersleri gizlenip BİR HAFTA SONRASI gösteriliyordu. Mobilde ayrı bir kopya vardı ve
 * o da PAZAR gününü atlıyordu; üstelik hesabı cihaz saat diliminde yapıyordu.
 *
 * Doğru davranış:
 *   Pzt–Cum → gelecek Cmt 00:00 .. Paz sonu
 *   Cmt     → bugün 00:00 .. Paz sonu
 *   Paz     → bugün 00:00 .. bugün sonu   (hafta sonu bitiyor; bugünü gizleme)
 *
 * `bitis` DIŞLAYICIDIR (dateTo): aralığın son gününün ertesi günü 00:00.
 */
export const haftaSonuAraligi = (gun: number, bugunYmd: string): { baslangic: string; bitis: string } => {
  const baslangic = gun === 0 || gun === 6 ? bugunYmd : trAddDays(bugunYmd, (6 - gun) % 7)
  const gunSayisi = gun === 0 ? 1 : 2
  return { baslangic, bitis: trAddDays(baslangic, gunSayisi) }
}

// ─────────────────────────────────────────────────────────────────────────────
// GÖSTERİM YARDIMCILARI — ders/seans/slot saatleri EKRANDA da İstanbul olmalı.
//
// Yukarıdaki fonksiyonlar filtreleme/hesaplama için kullanılıyordu, ama sayfalardaki
// GÖSTERİM çağrıları ham `toLocaleTimeString(locale, {...})` ile yazılmış ve timeZone
// verilmemişti → saat CİHAZIN diliminde basılıyordu. Toronto'daki (UTC-4) bir kullanıcı
// İstanbul'da 19:00 olan dersi "12:00" görüyordu; İstanbul'da 00:00–02:59 başlayan
// seanslarda ayrıca TARİH bir gün geriye kayıyordu. Filtre TR gününe göre çalıştığı için
// liste doğru, saat yanlış oluyordu — yani hata sessizdi.
//
// Bundan sonra tarih/saat gösteren HER yer bu fonksiyonları kullanmalı; ham toLocale*
// çağrısı yazma.
// ─────────────────────────────────────────────────────────────────────────────

/** Kullanıcıya gösterilecek saat — HER ZAMAN İstanbul. (ör. "19:00" / "07:00 PM") */
export const trTime = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: TR_TZ })

/** Uzun tarih — "12 Ağustos 2026" / "August 12, 2026" */
export const trDateLong = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: TR_TZ })

/** Haftagünlü tam tarih — "12 Ağustos 2026 Çarşamba" / "Wednesday, August 12, 2026" */
export const trDateFull = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: TR_TZ })

/** Kısa tarih — "12 Ağustos" / "August 12" */
export const trDateShort = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: TR_TZ })

/** Sayısal tarih — "12.08.2026" / "8/12/2026" */
export const trDateNumeric = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleDateString(locale, { timeZone: TR_TZ })

/** Kısa tarih + saat — "12 Ağu 19:00" / "Aug 12 07:00 PM" */
export const trDateTimeShort = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TR_TZ })
