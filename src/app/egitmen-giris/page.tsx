'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, AlertCircle } from 'lucide-react'

export default function EgitmenGirisPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'giris' | 'sifre'>('giris')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/instructor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      localStorage.setItem('fitpass_instructor_token', data.token)
      localStorage.setItem('fitpass_instructor', JSON.stringify(data.instructor))
      router.push('/egitmen-portal')
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch(`${API_URL}/api/instructor/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotSent(true)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 30, width: 'auto', display: 'block' }} /></Link>
        <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Kullanıcı Girişi</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#4F46E5' }}><GraduationCap size={38} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Eğitmen Girişi</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Puanlarını gör, yorumlara yanıt ver</p>
          </div>

          {tab === 'sifre' ? (
            <div>
              <button onClick={() => { setTab('giris'); setForgotSent(false); setError('') }} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Geri Dön</button>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Şifremi Unuttum</h2>
              {forgotSent ? (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px', fontSize: 14, color: '#166534', lineHeight: 1.6 }}>
                  Kayıtlıysa e-posta adresine şifre sıfırlama bağlantısı gönderildi. Gelen kutunu kontrol et.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Salonunun eğitmen olarak eklediği e-posta adresini gir.</p>
                  <div>
                    <label style={labelStyle}>E-posta</label>
                    <input type="email" placeholder="hoca@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required style={inputStyle} />
                  </div>
                  {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
                  <button type="submit" disabled={loading} style={btnStyle(loading)}>
                    {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>E-posta</label>
                <input name="email" type="email" placeholder="hoca@email.com" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şifre</label>
                <input name="password" type="password" placeholder="Şifreniz" value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }} required style={inputStyle} />
              </div>
              {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
              <button type="button" onClick={() => { setTab('sifre'); setError('') }} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>
                Şifremi Unuttum
              </button>
              <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 1.5, marginTop: 4 }}>
                Henüz girişin yok mu? Salonun seni eğitmen olarak ekleyip davet göndermeli.
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
const btnStyle = (loading: boolean): React.CSSProperties => ({ marginTop: 6, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' })
