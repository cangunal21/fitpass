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

/** Kullanıcıya gösterilecek saat — HER ZAMAN İstanbul. */
export const trTime = (d: Date | string | number): string =>
  new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: TR_TZ })

/** Kullanıcıya gösterilecek uzun tarih — HER ZAMAN İstanbul. */
export const trDateLong = (d: Date | string | number, locale = 'tr-TR'): string =>
  new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: TR_TZ })
