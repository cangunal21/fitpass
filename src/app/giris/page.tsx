'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, saveToken, saveUser } from '@/lib/api'
import { AlertCircle } from 'lucide-react'
import { useT } from '@/lib/i18n'

function GirisForm() {
  const router = useRouter()
  const { t } = useT()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.login({ email: form.email, password: form.password })
      if (res.error) { setError(res.error); setLoading(false); return }
      saveToken(res.token)
      saveUser(res.user)
      const redirect = searchParams.get('redirect')
      router.push(redirect || '/')
    } catch {
      setError(t('common.connectionError'))
      setLoading(false)
    }
  }

  return (
    <div className="split-layout" style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Sol panel */}
      <div className="split-left" style={{ flex: 1, background: 'linear-gradient(145deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Link href="/" style={{ display: 'block', marginBottom: 48 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/sipsakspor-logo-beyaz.svg" alt="Şipşakspor" style={{ height: 40, width: 'auto', display: 'block' }} /></Link>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>{t('auth.heroTitle')}</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 320 }}>
          {t('auth.heroDesc')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
          {[t('auth.feat1'), t('auth.feat2'), t('auth.feat3')].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</div>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ panel */}
      <div className="split-right" style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', backgroundColor: '#fff' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 8 }}>{t('login.title')}</h1>
          <p style={{ fontSize: 15, color: '#888' }}>{t('login.subtitle2')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('auth.emailLabel')}</label>
            <input name="email" type="email" placeholder="ornek@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('auth.password')}</label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required style={inputStyle} />
            <div style={{ textAlign: 'right', marginTop: 4 }}>
              <Link href="/sifremi-unuttum" style={{ fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500 }}>
                {t('login.forgot')}
              </Link>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: 4, padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#A5B4FC' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading ? t('login.loading') : t('login.button')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 28, borderTop: '1px solid #F0F0F0' }}>
          <p style={{ fontSize: 14, color: '#888' }}>
            {t('login.noAccount')}{' '}
            <Link href="/kayit" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>{t('login.registerLink')}</Link>
          </p>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/salon-giris" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', fontWeight: 500 }}>
            {t('login.venueOwner')}
          </Link>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 7 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid #E8E8E8', fontSize: 14, outline: 'none', backgroundColor: '#FAFAFA', color: '#111', boxSizing: 'border-box', transition: 'border-color 0.15s' }

export default function GirisPage() {
  return <Suspense><GirisForm /></Suspense>
}
