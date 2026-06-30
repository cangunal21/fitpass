'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, saveToken, saveUser, saveRefreshToken } from '@/lib/api'
import { AlertCircle, Gift } from 'lucide-react'
import { useT } from '@/lib/i18n'

function KayitForm() {
  const router = useRouter()
  const { t } = useT()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', passwordConfirm: '', referralCode: '' })

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setForm(f => ({ ...f, referralCode: ref.toUpperCase() }))
  }, [searchParams])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<number[]>([])

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    fetch(`${API}/api/public/categories`).then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {})
    fetch(`${API}/api/public/neighborhoods`).then(r => r.json()).then(d => setNeighborhoods(d.neighborhoods || [])).catch(() => {})
  }, [])

  const toggleSport = (name: string) => setSelectedSports(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name])
  const toggleNeighborhood = (id: number) => setSelectedNeighborhoods(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) { setError(t('register.passwordMismatch')); return }
    if (form.password.length < 6) { setError(t('register.passwordShort')); return }

    setLoading(true)
    try {
      const res = await api.register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        referralCode: form.referralCode || undefined,
        preferredSports: selectedSports,
        preferredNeighborhoods: selectedNeighborhoods,
      })

      if (res.error) { setError(res.error); setLoading(false); return }

      saveToken(res.token)
      saveRefreshToken(res.refreshToken)
      saveUser(res.user)
      router.push('/')
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
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>{t('register.heroTitle')}</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 320 }}>
          {t('auth.heroDesc')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
          {[t('register.feat1'), t('register.feat2'), t('register.feat3')].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</div>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ panel */}
      <div className="split-right" style={{ width: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', backgroundColor: '#fff', overflowY: 'auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 8 }}>{t('register.title')}</h1>
          <p style={{ fontSize: 15, color: '#888' }}>{t('register.subtitle2')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* İsim + Kullanıcı adı yan yana */}
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('auth.fullName')}</label>
              <input name="fullName" type="text" placeholder={t('register.fullNamePlaceholder')} value={form.fullName} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('register.usernameLabel')}</label>
              <input name="username" type="text" placeholder="kullaniciadi" value={form.username} onChange={handleChange} required style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('auth.emailLabel')}</label>
            <input name="email" type="email" placeholder="ornek@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('auth.phone')} <span style={{ fontWeight: 400, color: '#bbb' }}>{t('register.optional')}</span></label>
            <input name="phone" type="tel" placeholder="05XX XXX XX XX" value={form.phone} onChange={handleChange} style={inputStyle} />
          </div>

          {/* Şifre yan yana */}
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('auth.password')}</label>
              <input name="password" type="password" placeholder={t('register.passwordPlaceholder')} value={form.password} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('register.passwordConfirm')}</label>
              <input name="passwordConfirm" type="password" placeholder="••••••••" value={form.passwordConfirm} onChange={handleChange} required style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('register.referral')} <span style={{ fontWeight: 400, color: '#bbb' }}>{t('register.optional')}</span></label>
            <div style={{ position: 'relative' }}>
              <Gift size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A5B4FC' }} />
              <input name="referralCode" type="text" placeholder={t('register.referralPlaceholder')} value={form.referralCode} onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))} style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
            {form.referralCode && <p style={{ fontSize: 12, color: '#10B981', marginTop: 5, fontWeight: 600 }}>{t('register.referralBonus')}</p>}
          </div>

          {categories.length > 0 && (
            <div>
              <label style={labelStyle}>{t('register.sportsLabel')} <span style={{ fontWeight: 400, color: '#bbb' }}>{t('register.multiHint')}</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(c => {
                  const on = selectedSports.includes(c.name)
                  return (
                    <button key={c.id} type="button" onClick={() => toggleSport(c.name)} style={{ padding: '7px 14px', borderRadius: 100, border: `1.5px solid ${on ? '#4F46E5' : '#E5E7EB'}`, background: on ? '#EEF2FF' : '#fff', color: on ? '#4F46E5' : '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{c.name}</button>
                  )
                })}
              </div>
            </div>
          )}

          {neighborhoods.length > 0 && (
            <div>
              <label style={labelStyle}>{t('register.neighborhoodsLabel')} <span style={{ fontWeight: 400, color: '#bbb' }}>{t('register.multiHint')}</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 140, overflowY: 'auto' }}>
                {[...neighborhoods].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(n => {
                  const on = selectedNeighborhoods.includes(n.id)
                  return (
                    <button key={n.id} type="button" onClick={() => toggleNeighborhood(n.id)} style={{ padding: '7px 14px', borderRadius: 100, border: `1.5px solid ${on ? '#4F46E5' : '#E5E7EB'}`, background: on ? '#EEF2FF' : '#fff', color: on ? '#4F46E5' : '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{n.name}</button>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: 4, padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#A5B4FC' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading ? t('register.loading') : t('register.button')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 28, borderTop: '1px solid #F0F0F0' }}>
          <p style={{ fontSize: 14, color: '#888' }}>
            {t('register.haveAccount')}{' '}
            <Link href="/giris" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>{t('register.loginLink')}</Link>
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

export default function KayitPage() {
  return (
    <Suspense>
      <KayitForm />
    </Suspense>
  )
}
