'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SalonGirisPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'giris' | 'kayit'>('giris')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/venue/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      localStorage.setItem('fitpass_venue_token', data.token)
      localStorage.setItem('fitpass_venue', JSON.stringify(data.venue))
      router.push('/salon-paneli')
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/venue/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address, description: form.description }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      localStorage.setItem('fitpass_venue_token', data.token)
      localStorage.setItem('fitpass_venue', JSON.stringify(data.venue))
      router.push('/salon-paneli')
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#FF385C', letterSpacing: -0.5, textDecoration: 'none' }}>fitpass</Link>
        <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Kullanıcı Girişi</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 460, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏢</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Salon Paneli</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Salonunuzu yönetin, derslerinizi ekleyin</p>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#f5f5f5', borderRadius: 14, padding: 4, marginBottom: 28 }}>
            {(['giris', 'kayit'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: tab === t ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: tab === t ? '#1a1a1a' : '#888', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {t === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>

          {tab === 'giris' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>E-posta</label>
                <input name="email" type="email" placeholder="salon@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şifre</label>
                <input name="password" type="password" placeholder="Şifreniz" value={form.password} onChange={handleChange} required style={inputStyle} />
              </div>
              {error && <div style={errorStyle}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Salon Adı</label>
                <input name="name" type="text" placeholder="Salon Adınız" value={form.name} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-posta</label>
                <input name="email" type="email" placeholder="salon@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefon</label>
                <input name="phone" type="tel" placeholder="05XX XXX XX XX" value={form.phone} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Adres</label>
                <input name="address" type="text" placeholder="Salon adresi" value={form.address} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şifre</label>
                <input name="password" type="password" placeholder="En az 6 karakter" value={form.password} onChange={handleChange} required style={inputStyle} />
              </div>
              {error && <div style={errorStyle}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Kaydediliyor...' : 'Başvuru Gönder'}
              </button>
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
                Başvurunuz incelendikten sonra onaylanacak ve panel erişiminiz aktif edilecektir.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
const errorStyle: React.CSSProperties = { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }
const btnStyle = (loading: boolean): React.CSSProperties => ({ marginTop: 6, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' })
