'use client' // Error boundary'ler Client Component olmalı

import { useEffect } from 'react'
import { useT } from '@/lib/i18n'

// Sayfa render'ında beklenmedik bir hata olursa beyaz ekran yerine bunu gösterir.
// (Backend global error handler + mobil ErrorBoundary'nin web karşılığı.)
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const { t } = useT()

  useEffect(() => {
    console.error('Sayfa hatası:', error)
  }, [error])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>{t('errorBoundary.title')}</h2>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 24, maxWidth: 420 }}>{t('errorBoundary.sub')}</p>
      <button
        onClick={() => unstable_retry()}
        style={{ backgroundColor: '#4F46E5', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >
        {t('errorBoundary.retry')}
      </button>
    </div>
  )
}
