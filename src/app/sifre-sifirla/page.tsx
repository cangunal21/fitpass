'use client'

import { useState, Suspense } from 'react'
import { useT } from '@/lib/i18n'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { AlertCircle } from 'lucide-react'

function SifreSifirlaForm() {
  const { t } = useT()
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
      setError(t('register.passwordShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      const res = await api.resetPassword(token, password)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
      }
    } catch {
      setError(t('common.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', backgroundColor: '#fff' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 8 }}>{t('rp.title')}</h1>
        <p style={{ fontSize: 15, color: '#888' }}>{t('rp.sub')}</p>
      </div>

      {success ? (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '20px 24px', fontSize: 15, color: '#166534', lineHeight: 1.6 }}>
          Şifren güncellendi!{' '}
          <Link href="/giris" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
            Giriş yap →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!token && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> Geçersiz sıfırlama linki.
            </div>
          )}
          <div>
            <label style={labelStyle}>{t('rp.newPassword')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{t('register.passwordConfirm')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError('') }}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading || !token} style={{ marginTop: 4, padding: '14px', borderRadius: 12, border: 'none', background: loading || !token ? '#A5B4FC' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading || !token ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading ? t('rp.updating') : t('rp.button')}
          </button>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Link href="/giris" style={{ fontSize: 14, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>← Giriş sayfasına dön</Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default function SifreSifirlaPage() {
  const { t } = useT()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Sol panel */}
      <div style={{ flex: 1, background: 'linear-gradient(145deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Link href="/" style={{ fontSize: 28, fontWeight: 800, color: '#fff', textDecoration: 'none', marginBottom: 48, display: 'block' }}>şipşakspor</Link>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>{t('auth.heroTitle')}</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 320 }}>
          Yoga'dan boksa, halı sahadan pilates'e — İstanbul'un en iyi spor derslerini tek platformda keşfet.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
          {['500+ aktif ders ve etkinlik', '50+ onaylı tesis ve salon', t('auth.feat3')].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</div>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={<div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>{t('common.loading')}</div>}>
        <SifreSifirlaForm />
      </Suspense>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 7 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid #E8E8E8', fontSize: 14, outline: 'none', backgroundColor: '#FAFAFA', color: '#111', boxSizing: 'border-box', transition: 'border-color 0.15s' }
