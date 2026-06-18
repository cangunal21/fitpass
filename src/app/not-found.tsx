'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#4F46E5', lineHeight: 1, marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Sayfa Bulunamadı</h1>
        <p style={{ fontSize: 16, color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        </p>
        <Link href="/" style={{ display: 'inline-block', padding: '14px 32px', background: '#4F46E5', color: '#fff', borderRadius: 14, textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
