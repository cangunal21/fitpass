'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, AlertCircle } from 'lucide-react'


export default function SalonGirisPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'giris' | 'kayit' | 'sifre'>('giris')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', description: '', neighborhoodId: '' })
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [sportOptions, setSportOptions] = useState<string[]>([])
  const [instructor, setInstructor] = useState({ fullName: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  // İlçe listesini çek (salon kayıt formundaki dropdown için)
  useEffect(() => {
    fetch(`${API_URL}/api/public/neighborhoods`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.neighborhoods)) setNeighborhoods(d.neighborhoods) })
      .catch(() => {})
    // Spor branşları DB kategorilerinden (hardcoded liste yerine — hep senkron)
    fetch(`${API_URL}/api/public/categories`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.categories)) setSportOptions(d.categories.map((c: any) => c.name)) })
      .catch(() => {})
  }, [API_URL])

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

  const toggleSport = (sport: string) => {
    setSelectedSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport])
    setError('')
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch(`${API_URL}/api/venue/forgot-password`, {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSports.length === 0) { setError('En az bir spor branşı seçmelisiniz.'); return }
    if (!form.neighborhoodId) { setError('Lütfen salonun bulunduğu ilçeyi seçin.'); return }
    setLoading(true)
    try {
      const body: any = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, address: form.address, description: form.description,
        neighborhoodId: parseInt(form.neighborhoodId), cityId: 1,
        sportCategories: selectedSports,
      }
      if (instructor.fullName.trim()) {
        body.instructor = { fullName: instructor.fullName, email: instructor.email, phone: instructor.phone }
      }
      const res = await fetch(`${API_URL}/api/venue/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 30, width: 'auto', display: 'block' }} /></Link>
        <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Kullanıcı Girişi</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 460, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Building2 size={36} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Salon Paneli</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Salonunuzu yönetin, derslerinizi ekleyin</p>
          </div>

          {tab !== 'sifre' && (
            <div style={{ display: 'flex', backgroundColor: '#f5f5f5', borderRadius: 14, padding: 4, marginBottom: 28 }}>
              {(['giris', 'kayit'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError('') }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: tab === t ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: tab === t ? '#1a1a1a' : '#888', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                  {t === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
                </button>
              ))}
            </div>
          )}

          {tab === 'sifre' ? (
            <div>
              <button onClick={() => { setTab('giris'); setForgotSent(false); setError('') }} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← Geri Dön</button>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Şifremi Unuttum</h2>
              {forgotSent ? (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px', fontSize: 14, color: '#166534', lineHeight: 1.6 }}>
                  Email adresinize şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Kayıtlı email adresinizi girin, şifre sıfırlama bağlantısı gönderelim.</p>
                  <div>
                    <label style={labelStyle}>E-posta</label>
                    <input type="email" placeholder="salon@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required style={inputStyle} />
                  </div>
                  {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
                  <button type="submit" disabled={loading} style={btnStyle(loading)}>
                    {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                  </button>
                </form>
              )}
            </div>
          ) : tab === 'giris' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>E-posta</label>
                <input name="email" type="email" placeholder="salon@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şifre</label>
                <input name="password" type="password" placeholder="Şifreniz" value={form.password} onChange={handleChange} required style={inputStyle} />
              </div>
              {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
              <button type="button" onClick={() => { setTab('sifre'); setError('') }} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>
                Şifremi Unuttum
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
                <label style={labelStyle}>İlçe <span style={{ color: '#DC2626' }}>*</span></label>
                <select name="neighborhoodId" value={form.neighborhoodId} onChange={handleChange} required style={inputStyle}>
                  <option value="">İlçe seçin</option>
                  {[...neighborhoods].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>Kullanıcılar bu ilçeyle arama yapınca salonunuz çıkar.</p>
              </div>
              <div>
                <label style={labelStyle}>Şifre</label>
                <input name="password" type="password" placeholder="En az 6 karakter" value={form.password} onChange={handleChange} required style={inputStyle} />
              </div>

              {/* Spor Branşları */}
              <div>
                <label style={labelStyle}>Spor Branşları <span style={{ color: '#DC2626' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {sportOptions.map(sport => (
                    <button key={sport} type="button" onClick={() => toggleSport(sport)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, backgroundColor: selectedSports.includes(sport) ? '#4F46E5' : '#f0f0f0', color: selectedSports.includes(sport) ? '#fff' : '#555', transition: 'all 0.15s' }}>
                      {sport}
                    </button>
                  ))}
                </div>
                {selectedSports.length === 0 && <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>En az bir branş seçmelisiniz</p>}
              </div>

              {/* İlk Hoca */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#999', whiteSpace: 'nowrap' }}>İlk Hocanızı Ekleyin (opsiyonel)</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Ad Soyad</label>
                    <input type="text" placeholder="Hoca adı soyadı" value={instructor.fullName} onChange={e => setInstructor({ ...instructor, fullName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>E-posta</label>
                    <input type="email" placeholder="hoca@email.com" value={instructor.email} onChange={e => setInstructor({ ...instructor, email: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefon</label>
                    <input type="tel" placeholder="05XX XXX XX XX" value={instructor.phone} onChange={e => setInstructor({ ...instructor, phone: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
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
const btnStyle = (loading: boolean): React.CSSProperties => ({ marginTop: 6, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' })
