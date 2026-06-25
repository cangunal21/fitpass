'use client' // Error boundary'ler Client Component olmalı

// Kök layout'ta (en üst seviye) hata olursa devreye girer; root layout'u DEĞİŞTİRİR,
// bu yüzden kendi <html>/<body>'sini içermeli ve i18n context'ine erişemez (statik metin).
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>Bir şeyler ters gitti</h2>
          <p style={{ fontSize: 15, color: '#666', marginBottom: 24, maxWidth: 420 }}>
            Beklenmedik bir hata oluştu. Lütfen tekrar dene.
            <br />
            <span style={{ color: '#999' }}>An unexpected error occurred. Please try again.</span>
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{ backgroundColor: '#4F46E5', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
          >
            Tekrar dene / Try again
          </button>
        </div>
      </body>
    </html>
  )
}
