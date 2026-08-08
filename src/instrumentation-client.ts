// Next.js 16 istemci-tarafı gözlemlenebilirlik kancası (dosya adı sabit: instrumentation-client.ts).
// Uygulama etkileşimli hâle gelmeden ÖNCE çalışır; export gerekmez, kod doğrudan yazılır.
//
// BU DOSYANIN VAR OLMA SEBEBİ: sürüklenme denetimi, hata izlemenin YALNIZ backend'de olduğunu
// buldu — tarayıcıdaki JS hataları (render çökmesi, null deref, başarısız istek işleme) HİÇBİR
// yere raporlanmıyordu. Backend 500'leri görünürken kullanıcının ekranındaki çökme görünmüyordu.
//
// UYKUDA VARSAYILAN: NEXT_PUBLIC_SENTRY_DSN yoksa hiçbir şey yüklenmez → sıfır çalışma-zamanı
// maliyeti, sıfır ağ isteği. Backend'deki desenle aynı: kurulu dursun, anahtar girilince açılsın.
import { scrubEvent } from './lib/sentryScrub'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  // Dinamik import: DSN yokken Sentry paketi client bundle'ına GİRMESİN (sayfa ağırlığı artmasın).
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
        tracesSampleRate: 0,   // performans izleme kapalı
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0, // Session Replay KAPALI: ekran kaydı ağır KVKK yüzeyi açar
        sendDefaultPii: false,
        beforeSend: (event) => scrubEvent(event as Record<string, any>) as typeof event,
        beforeBreadcrumb: (bc) => (bc.category === 'console' ? null : bc),
      })
    })
    .catch(() => {
      // İzleme aracının yüklenememesi uygulamayı ETKİLEMEMELİ — sessizce vazgeç.
    })
}
