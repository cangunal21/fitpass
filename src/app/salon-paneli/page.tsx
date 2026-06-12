'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function SalonPaneliPage() {
  const router = useRouter()
  const [venue, setVenue] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dersler' | 'rezervasyonlar' | 'ders-ekle'>('dersler')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [classForm, setClassForm] = useState({ title: '', category: '', basePrice: '', duration: '', capacity: '', description: '' })
  const [classError, setClassError] = useState('')
  const [classSuccess, setClassSuccess] = useState('')
  const [sessionForms, setSessionForms] = useState<Record<number, { date: string; time: string; capacity: string }>>({})
  const [sessionSuccess, setSessionSuccess] = useState<Record<number, string>>({})

  useEffect(() => {
    const token = localStorage.getItem('fitpass_venue_token')
    if (!token) { router.push('/salon-giris'); return }
    fetchVenue(token)
  }, [])

  const fetchVenue = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/venue/me`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.error) { router.push('/salon-giris'); return }
      setVenue(data.venue)
    } catch {
      router.push('/salon-giris')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/bookings`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setBookings(data.bookings || [])
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'rezervasyonlar') fetchBookings()
  }

  const handleLogout = () => {
    localStorage.removeItem('fitpass_venue_token')
    localStorage.removeItem('fitpass_venue')
    router.push('/salon-giris')
  }

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setClassError(''); setClassSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(classForm),
    })
    const data = await res.json()
    if (data.error) { setClassError(data.error); return }
    setClassSuccess('Ders başarıyla eklendi!')
    setClassForm({ title: '', category: '', basePrice: '', duration: '', capacity: '', description: '' })
    fetchVenue(token)
    setTimeout(() => setActiveTab('dersler'), 1500)
  }

  const handleAddSession = async (classId: number) => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const form = sessionForms[classId]
    if (!form?.date || !form?.time || !form?.capacity) return
    const res = await fetch(`${API_URL}/api/venue/classes/${classId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!data.error) {
      setSessionSuccess({ ...sessionSuccess, [classId]: 'Seans eklendi!' })
      setSessionForms({ ...sessionForms, [classId]: { date: '', time: '', capacity: '' } })
      fetchVenue(token)
      setTimeout(() => setSessionSuccess(prev => ({ ...prev, [classId]: '' })), 2000)
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#888' }}>Yükleniyor...</div>

  const categories = ['Yoga', 'Pilates', 'Boks', 'Padel', 'Halı Saha', 'Basketbol', 'HIIT', 'Dans', 'Yüzme', 'Crossfit', 'Diğer']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#FF385C', letterSpacing: -0.5, textDecoration: 'none' }}>fitpass</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>🏢 {venue?.name}</span>
          {!venue?.isApproved && <span style={{ fontSize: 12, backgroundColor: '#FEF9C3', color: '#92400e', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>⏳ Onay Bekliyor</span>}
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #eee', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>Çıkış</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {!venue?.isApproved && (
          <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 16, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#92400e' }}>
            ⏳ <strong>Salonunuz onay bekliyor.</strong> Onaylandıktan sonra dersleriniz yayınlanacak. Onay süreci genellikle 1-2 iş günü sürmektedir.
          </div>
        )}

        {/* İstatistikler */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Toplam Ders', value: venue?.classes?.length || 0, icon: '📚', color: '#8B5CF6' },
            { label: 'Toplam Seans', value: venue?.classes?.reduce((acc: number, c: any) => acc + (c.sessions?.length || 0), 0) || 0, icon: '📅', color: '#3B82F6' },
            { label: 'Aktif Dersler', value: venue?.classes?.filter((c: any) => c.isActive).length || 0, icon: '✅', color: '#10B981' },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {([
            { key: 'dersler', label: '📚 Derslerim' },
            { key: 'ders-ekle', label: '➕ Ders Ekle' },
            { key: 'rezervasyonlar', label: '🎟️ Rezervasyonlar' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#1a1a1a' : '#888', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* DERSLER */}
        {activeTab === 'dersler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(!venue?.classes || venue.classes.length === 0) ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Henüz ders eklemediniz</div>
                <button onClick={() => setActiveTab('ders-ekle')} style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: '#FF385C', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>➕ İlk Dersi Ekle</button>
              </div>
            ) : venue.classes.map((cls: any) => (
              <div key={cls.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{cls.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 12, backgroundColor: '#f0f0f0', padding: '3px 10px', borderRadius: 20, color: '#555' }}>{cls.category}</span>
                      <span style={{ fontSize: 12, backgroundColor: cls.isActive ? '#F0FDF4' : '#FEF2F2', padding: '3px 10px', borderRadius: 20, color: cls.isActive ? '#16a34a' : '#DC2626', fontWeight: 600 }}>{cls.isActive ? '● Aktif' : '● Pasif'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FF385C' }}>₺{cls.basePrice}</div>
                </div>

                <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                  {cls.sessions?.length || 0} seans · {cls.sessions?.reduce((acc: number, s: any) => acc + (s._count?.bookings || 0), 0) || 0} rezervasyon
                </div>

                {/* Seans Ekle */}
                <div style={{ backgroundColor: '#f9f9f9', borderRadius: 14, padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12 }}>➕ Yeni Seans Ekle</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Tarih</label>
                      <input type="date" value={sessionForms[cls.id]?.date || ''} onChange={e => setSessionForms({ ...sessionForms, [cls.id]: { ...sessionForms[cls.id], date: e.target.value } })} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Saat</label>
                      <input type="time" value={sessionForms[cls.id]?.time || ''} onChange={e => setSessionForms({ ...sessionForms, [cls.id]: { ...sessionForms[cls.id], time: e.target.value } })} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Kapasite</label>
                      <input type="number" placeholder="15" value={sessionForms[cls.id]?.capacity || ''} onChange={e => setSessionForms({ ...sessionForms, [cls.id]: { ...sessionForms[cls.id], capacity: e.target.value } })} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                    <button onClick={() => handleAddSession(cls.id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#FF385C', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Ekle</button>
                  </div>
                  {sessionSuccess[cls.id] && <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 8 }}>✓ {sessionSuccess[cls.id]}</div>}
                </div>

                {/* Seanslar */}
                {cls.sessions && cls.sessions.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>MEVCUT SEANSLAR</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {cls.sessions.map((s: any) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: 10, fontSize: 13 }}>
                          <span>📅 {new Date(s.date).toLocaleDateString('tr-TR')} · 🕐 {s.time}</span>
                          <span style={{ color: '#888' }}>{s._count?.bookings || 0}/{s.capacity} kişi</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DERS EKLE */}
        {activeTab === 'ders-ekle' && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 24 }}>Yeni Ders Ekle</h2>
            <form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Ders Adı</label>
                  <input name="title" type="text" placeholder="Vinyasa Flow Yoga" value={classForm.title} onChange={e => setClassForm({ ...classForm, title: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kategori</label>
                  <select name="category" value={classForm.category} onChange={e => setClassForm({ ...classForm, category: e.target.value })} required style={inputStyle}>
                    <option value="">Seçin</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fiyat (₺)</label>
                  <input name="basePrice" type="number" placeholder="350" value={classForm.basePrice} onChange={e => setClassForm({ ...classForm, basePrice: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Süre (dakika)</label>
                  <input name="duration" type="number" placeholder="60" value={classForm.duration} onChange={e => setClassForm({ ...classForm, duration: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kapasite (kişi)</label>
                  <input name="capacity" type="number" placeholder="15" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: e.target.value })} required style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Açıklama (opsiyonel)</label>
                <textarea name="description" placeholder="Ders hakkında kısa açıklama..." value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              {classError && <div style={errorStyle}>⚠️ {classError}</div>}
              {classSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {classSuccess}</div>}
              <button type="submit" style={{ padding: '14px', borderRadius: 14, border: 'none', background: '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Dersi Ekle</button>
            </form>
          </div>
        )}

        {/* REZERVASYONLAR */}
        {activeTab === 'rezervasyonlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎟️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Henüz rezervasyon yok</div>
              </div>
            ) : bookings.map((b: any) => (
              <div key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{b.user?.fullName}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{b.classSession?.class?.title} · {new Date(b.classSession?.date).toLocaleDateString('tr-TR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF385C' }}>₺{b.totalPrice}</div>
                  <div style={{ fontSize: 11, color: b.status === 'confirmed' ? '#10B981' : '#EF4444', fontWeight: 600 }}>{b.status === 'confirmed' ? '✓ Onaylı' : '✗ İptal'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
const errorStyle: React.CSSProperties = { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }
