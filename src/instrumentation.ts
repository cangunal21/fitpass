// Next.js 16 sunucu-tarafı gözlemlenebilirlik kancası (dosya adı sabit: instrumentation.ts).
// `register()` sunucu örneği açılırken BİR KEZ çalışır; `onRequestError` sunucu hatalarını yakalar.
//
// UYKUDA VARSAYILAN: SENTRY_DSN yoksa Sentry init edilmez → tamamen no-op. Backend'deki
// (src/utils/sentry.ts) davranışın AYNISI: paket kurulu ve bağlı dursun, anahtar girilince açılsın.
import type { Instrumentation } from 'next'
import { scrubEvent } from './lib/sentryScrub'

export async function register() {
  if (!process.env.SENTRY_DSN) {
    console.log('[sentry/web] SENTRY_DSN tanımlı değil — sunucu tarafı hata izleme kapalı')
    return
  }
  const Sentry = await import('@sentry/nextjs')
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
    tracesSampleRate: 0,        // performans izleme kapalı — şu an sadece HATA görmek istiyoruz
    sendDefaultPii: false,      // KVKK: IP/çerez/başlık/gövde otomatik gönderilmesin
    beforeSend: (event) => scrubEvent(event as Record<string, any>) as typeof event,
    beforeBreadcrumb: (bc) => {
      // Konsol breadcrumb'ları serbest metin taşır (çoğu zaman kullanıcı verisi) → hiç alma.
      if (bc.category === 'console') return null
      return bc
    },
  })
}

// Sunucu tarafında (RSC/route handler) yakalanan hatalar. DSN yoksa import edilmez → no-op.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!process.env.SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
