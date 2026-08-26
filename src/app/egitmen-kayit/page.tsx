'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react'
import OnayKutulari, { BOS_ONAY, onayGovdesi, type OnayDurumu } from '@/components/OnayKutulari'

/**
 * MEKÂNSIZ (BİREYSEL) EĞİTMEN KAYDI.
 *
 * Bugüne kadar eğitmen YALNIZCA bir salon tarafından davet edilerek var olabiliyordu; kendi
 * kaydolma yolu hiç yoktu. Online ders satacak, salonu olmayan hoca için bu sayfa giriş kapısı.
 *
 * Kayıt SERBEST, yayına çıkmak ADMİN ONAYINA bağlı — salon kaydının (venueRegister) birebir
 * aynası. Onaysız hesap giriş yapabilir (durumunu görür, profilini tamamlar) ama ders açamaz.
 */
export default function EgitmenKayitPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', specialty: '', phone: '', bio: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [onay, setOnay] = useState<OnayDurumu>(BOS_ONAY)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); return }
    // Sunucu da bu kapıyı uyguluyor (fitpass/src/utils/consent.ts); buradaki kontrol anında geri bildirim için.
    if (!onay.sozlesme) { setError('Devam etmek için sözleşmeleri onaylamanız gerekiyor.'); return }
    if (!onay.yasBeyani) { setError('Eğitmen kaydı 18 yaş ve üzeri içindir; devam etmek için yaş beyanını onaylayın.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/instructor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, onaylar: onayGovdesi('egitmen', onay) }),
      })
      const data = await res.json()
      if (data?.error) { setError(data.error); return }
      setDone(true)
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>{ }<img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 30, width: 'auto', display: 'block' }} /></Link>
        <Link href="/egitmen-giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Eğitmen Girişi</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#4F46E5' }}><GraduationCap size={38} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Eğitmen Başvurusu</h1>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.5 }}>Kendi online derslerini aç, öğrencilerinle Şipşakspor üzerinden buluş</p>
          </div>

          {done ? (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '20px', fontSize: 14, color: '#166534', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, marginBottom: 6 }}>
                <CheckCircle2 size={18} /> Başvurun alındı
              </div>
              Ekibimiz başvurunu inceleyecek. Şimdiden giriş yapıp profilini tamamlayabilirsin;
              onaylandığında derslerini ekleyip yayına çıkarabileceksin.
              <div style={{ marginTop: 14 }}>
                <Link href="/egitmen-giris" style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 12, background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Giriş yap
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <input value={form.fullName} onChange={e => { setForm({ ...form, fullName: e.target.value }); setError('') }} placeholder="Ad Soyad" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-posta</label>
                <input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }} placeholder="hoca@email.com" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şifre</label>
                <input type="password" value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }} placeholder="En az 8 karakter" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Branşın</label>
                <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Yoga · Pilates" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefon <span style={{ color: '#bbb', fontWeight: 500 }}>(isteğe bağlı)</span></label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05xx xxx xx xx" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Kendinden kısaca bahset</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Deneyimin, sertifikaların, ders tarzın..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ background: '#EEF2FF', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#4338CA', lineHeight: 1.55 }}>
                Salona bağlı bir eğitmensen buradan kayıt olma — salonun seni eğitmen olarak
                ekleyip davet göndermeli. Bu form, kendi <b>online</b> derslerini satmak isteyen
                bağımsız eğitmenler için.
              </div>

              <OnayKutulari ozne="egitmen" deger={onay} onChange={setOnay} />

              {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
              </button>
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
