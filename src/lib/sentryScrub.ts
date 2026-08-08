// KVKK/GİZLİLİK: Sentry bir VERİ İŞLEYEN'dir. Hata gövdesine kişisel veri sızarsa bu, gizlilik
// metninde beyan edilmemiş bir YURT DIŞI AKTARIM olur. Backend'deki src/utils/sentry.ts ile AYNI
// maskeleme kuralları — iki taraf ayrışırsa web'den sızan veri backend'de engellenmiş olanı boşa
// çıkarır, o yüzden desenler bilinçli olarak birebir kopyalanmıştır.
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const PHONE_RE = /(?:\+90|0)?\s?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g
const TCKN_RE = /\b[1-9]\d{10}\b/g
const IBAN_RE = /\bTR\d{2}\s?(?:\d{4}\s?){5}\d{2}\b/gi
const JWT_RE = /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g
const BEARER_RE = /Bearer\s+[\w.-]+/gi
// Opak hex token'lar: parola-sıfırlama (64 hex), verify (64), refresh (96 → artık hash'li). 24+ hex
// güvenli eşik (checkInCode 8 hex → yanlış-pozitif riski nedeniyle dahil edilmedi).
const HEXTOKEN_RE = /\b[0-9a-f]{24,}\b/gi

export function scrub(s: string): string {
  return s
    .replace(EMAIL_RE, '[email]')
    .replace(IBAN_RE, '[iban]')
    .replace(JWT_RE, '[jwt]')
    .replace(BEARER_RE, 'Bearer [token]')
    .replace(HEXTOKEN_RE, '[token]')
    .replace(TCKN_RE, '[tckn]')
    .replace(PHONE_RE, '[phone]')
}

// Sentry olayını yerinde temizler: mesaj, exception değerleri, breadcrumb'lar ve URL'ler.
// `request` gövdesi/çerezleri zaten gönderilmiyor (sendDefaultPii: false), burada metin taraması yapılır.
export function scrubEvent(event: Record<string, any>): Record<string, any> {
  try {
    if (typeof event.message === 'string') event.message = scrub(event.message)

    for (const ex of event.exception?.values ?? []) {
      if (typeof ex.value === 'string') ex.value = scrub(ex.value)
    }

    for (const b of event.breadcrumbs ?? []) {
      if (typeof b.message === 'string') b.message = scrub(b.message)
      // Breadcrumb'ların en sık PII taşıyan yeri: fetch/xhr izlerindeki URL (query string).
      if (b.data && typeof b.data.url === 'string') b.data.url = scrub(b.data.url)
    }

    // Sayfa URL'i query string taşıyabilir (?token=..., ?email=...)
    if (event.request && typeof event.request.url === 'string') event.request.url = scrub(event.request.url)

    // Kullanıcı kimliği: id yeterli; e-posta/kullanıcı adı/IP GÖNDERİLMEZ.
    if (event.user) event.user = { id: event.user.id }
  } catch {
    // Maskeleme kendisi patlarsa olayı DÜŞÜR — maskelenmemiş veri göndermektense hiç göndermemek yeğdir.
    return { ...event, message: '[scrub failed]', exception: undefined, breadcrumbs: undefined }
  }
  return event
}
