'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, saveToken, saveUser } from '@/lib/api'

export default function KayitPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', password: '', passwordConfirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) { setError('Şifreler eşleşmiyor.'); return }
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }

    setLoading(true)
    try {
      const res = await api.register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      })

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
        <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Giriş Yap</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 460, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏃</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Fitpass'e Katıl</h1>
            <p style={{ fontSize: 14, color: '#888' }}>İstanbul'un en iyi sporlarına tek platformdan eriş</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Ad Soyad', name: 'fullName', type: 'text', placeholder: 'Adın Soyadın' },
              { label: 'Kullanıcı Adı', name: 'username', type: 'text', placeholder: 'kullaniciadi' },
              { label: 'E-posta', name: 'email', type: 'email', placeholder: 'ornek@email.com' },
              { label: 'Telefon', name: 'phone', type: 'tel', placeholder: '05XX XXX XX XX' },
              { label: 'Şifre', name: 'password', type: 'password', placeholder: 'En az 6 karakter' },
              { label: 'Şifre Tekrar', name: 'passwordConfirm', type: 'password', placeholder: 'Şifreni tekrar gir' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>{field.label}</label>
                <input name={field.name} type={field.type} placeholder={field.placeholder} value={form[field.name as keyof typeof form]} onChange={handleChange} required={field.name !== 'phone'} style={inputStyle} />
              </div>
            ))}

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ marginTop: 6, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#888' }}>
            Zaten hesabın var mı?{' '}
            <Link href="/giris" style={{ color: '#FF385C', fontWeight: 600, textDecoration: 'none' }}>Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a' }
