'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function EmailDogrulaContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Geçersiz doğrulama linki.')
      return
    }

    fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.message) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.error || 'Doğrulama başarısız.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Sunucu hatası. Lütfen tekrar deneyin.')
      })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>
          {status === 'loading' ? 'Doğrulanıyor...' : status === 'success' ? 'Email Doğrulandı!' : 'Doğrulama Başarısız'}
        </h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
        {status !== 'loading' && (
          <Link href="/giris" style={{ display: 'inline-block', padding: '13px 28px', background: '#4F46E5', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Giriş Yap
          </Link>
        )}
      </div>
    </div>
  )
}

export default function EmailDogrulaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>}>
      <EmailDogrulaContent />
    </Suspense>
  )
}
