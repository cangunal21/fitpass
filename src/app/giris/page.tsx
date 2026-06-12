'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, saveToken, saveUser } from '@/lib/api'

export default function GirisPage() {
  const router = useRouter()
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
      router.push('/')
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar dene.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#FF385C', letterSpacing: -0.5, textDecoration: 'none' }}>fitpass</Link>
        <Link href="/kayit" style={{ padding: '8px 18px', borderRadius: 24, border: 'none', background: '#FF385C', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Kayıt Ol</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Tekrar Hoşgeldin</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Hesabına giriş yap, derslerini bul</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>E-posta</label>
              <input name="email" type="email" placeholder="ornek@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Şifre</label>
              <input name="password" type="password" placeholder="Şifren" value={form.password} onChange={handleChange} required style={inputStyle} />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: '#FF385C', cursor: 'pointer', fontWeight: 600 }}>Şifremi Unuttum</span>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ marginTop: 6, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#888' }}>
            Hesabın yok mu?{' '}
            <Link href="/kayit" style={{ color: '#FF385C', fontWeight: 600, textDecoration: 'none' }}>Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a' }
