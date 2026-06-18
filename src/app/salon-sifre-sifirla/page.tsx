'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Building2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function SalonSifreSifirlaForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/venue/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5', letterSpacing: -0.5, textDecoration: 'none' }}>şipşakspor</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Building2 size={36} color="#4F46E5" /></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Yeni Şifre Belirle</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Salon paneliniz için yeni şifrenizi oluşturun</p>
          </div>

          {success ? (
            <div>
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '20px', fontSize: 14, color: '#166534', lineHeight: 1.6, marginBottom: 20 }}>
                Şifreniz başarıyla güncellendi!
              </div>
              <Link href="/salon-giris" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 14, background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Giriş Yap →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!token && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> Geçersiz sıfırlama linki.
                </div>
              )}
              <div>
                <label style={labelStyle}>Yeni Şifre</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setError('') }} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şifre Tekrar</label>
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }} required style={inputStyle} />
              </div>
              {error && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <button type="submit" disabled={loading || !token} style={{ marginTop: 4, padding: '14px', borderRadius: 14, border: 'none', background: loading || !token ? '#A5B4FC' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading || !token ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Link href="/salon-giris" style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>← Giriş sayfasına dön</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SalonSifreSifirlaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>}>
      <SalonSifreSifirlaForm />
    </Suspense>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
