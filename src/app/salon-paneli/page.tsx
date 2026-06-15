'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Clock, BookOpen, Calendar, Ticket, AlertCircle, User, Check } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function SalonPaneliPage() {
  const router = useRouter()
  const [venue, setVenue] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dersler' | 'hocalar' | 'rezervasyonlar' | 'ders-ekle'>('dersler')
  const [bookings, setBookings] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [classForm, setClassForm] = useState({ title: '', category: '', basePrice: '', duration: '', capacity: '', description: '', instructorId: '' })
  const [classError, setClassError] = useState('')
  const [classSuccess, setClassSuccess] = useState('')
  const [sessionForms, setSessionForms] = useState<Record<number, { date: string; time: string; capacity: string }>>({})
  const [sessionSuccess, setSessionSuccess] = useState<Record<number, string>>({})
  const [instructorForm, setInstructorForm] = useState({ fullName: '', specialty: '', bio: '', avatarUrl: '', phone: '', email: '' })
  const [instructorError, setInstructorError] = useState('')
  const [instructorSuccess, setInstructorSuccess] = useState('')

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

  const fetchInstructors = async () => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/instructors`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setInstructors(data.instructors || [])
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'rezervasyonlar') fetchBookings()
    if (tab === 'hocalar' || tab === 'ders-ekle') fetchInstructors()
  }

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    setInstructorError(''); setInstructorSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/instructors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(instructorForm),
    })
    const data = await res.json()
    if (data.error) { setInstructorError(data.error); return }
    setInstructorSuccess('Hoca başarıyla eklendi!')
    setInstructorForm({ fullName: '', specialty: '', bio: '', avatarUrl: '', phone: '', email: '' })
    fetchInstructors()
    setTimeout(() => setInstructorSuccess(''), 2000)
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
    setClassForm({ title: '', category: '', basePrice: '', duration: '', capacity: '', description: '', instructorId: '' })
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
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5', letterSpacing: -0.5, textDecoration: 'none' }}>şipşakspor</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={16} /> {venue?.name}</span>
          {!venue?.isApproved && <span style={{ fontSize: 12, backgroundColor: '#FEF9C3', color: '#92400e', padding: '4px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> Onay Bekliyor</span>}
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #eee', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>Çıkış</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {!venue?.isApproved && (
          <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 16, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#92400e' }}>
            <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /><strong>Salonunuz onay bekliyor.</strong> Onaylandıktan sonra dersleriniz yayınlanacak. Onay süreci genellikle 1-2 iş günü sürmektedir.
          </div>
        )}

        {/* İstatistikler */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Toplam Ders', value: venue?.classes?.length || 0, icon: <BookOpen size={28} />, color: '#8B5CF6' },
            { label: 'Toplam Seans', value: venue?.classes?.reduce((acc: number, c: any) => acc + (c.sessions?.length || 0), 0) || 0, icon: <Calendar size={28} />, color: '#3B82F6' },
            { label: 'Aktif Dersler', value: venue?.classes?.filter((c: any) => c.isActive).length || 0, icon: <Check size={28} />, color: '#10B981' },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {([
            { key: 'dersler', label: 'Derslerim' },
            { key: 'hocalar', label: 'Hocalarım' },
            { key: 'ders-ekle', label: '+ Ders Ekle' },
            { key: 'rezervasyonlar', label: 'Rezervasyonlar' },
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
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><BookOpen size={48} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Henüz ders eklemediniz</div>
                <button onClick={() => setActiveTab('ders-ekle')} style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ İlk Dersi Ekle</button>
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
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>₺{cls.basePrice}</div>
                </div>

                <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                  {cls.sessions?.length || 0} seans · {cls.sessions?.reduce((acc: number, s: any) => acc + (s._count?.bookings || 0), 0) || 0} rezervasyon
                </div>

                {/* Seans Ekle */}
                <div style={{ backgroundColor: '#f9f9f9', borderRadius: 14, padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12 }}>+ Yeni Seans Ekle</div>
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
                    <button onClick={() => handleAddSession(cls.id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Ekle</button>
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> {new Date(s.startsAt).toLocaleDateString('tr-TR')} · <Clock size={13} /> {new Date(s.startsAt).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}</span>
                          <span style={{ color: '#888' }}>{s._count?.bookings || 0}/{s.availableSpots} kişi</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* HOCALAR */}
        {activeTab === 'hocalar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Hoca listesi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Mevcut Hocalar</h3>
              {instructors.length === 0 ? (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><User size={36} /></div>
                  <div style={{ fontSize: 14, color: '#888' }}>Henüz hoca eklenmedi</div>
                </div>
              ) : instructors.map((inst: any) => (
                <div key={inst.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FFF0F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {inst.avatarUrl ? <img src={inst.avatarUrl} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : <User size={22} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{inst.fullName}</div>
                    <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>{inst.specialty}</div>
                    {inst.bio && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{inst.bio}</div>}
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{inst._count?.classes || 0} ders</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hoca ekle formu */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Yeni Hoca Ekle</h3>
              <form onSubmit={handleAddInstructor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Ad Soyad *</label>
                  <input type="text" placeholder="Ayşe Kaya" value={instructorForm.fullName} onChange={e => setInstructorForm({ ...instructorForm, fullName: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Uzmanlık Alanı *</label>
                  <input type="text" placeholder="Yoga, Pilates..." value={instructorForm.specialty} onChange={e => setInstructorForm({ ...instructorForm, specialty: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea placeholder="Hoca hakkında kısa bilgi..." value={instructorForm.bio} onChange={e => setInstructorForm({ ...instructorForm, bio: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Telefon</label>
                  <input type="tel" placeholder="05XX XXX XX XX" value={instructorForm.phone} onChange={e => setInstructorForm({ ...instructorForm, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-posta</label>
                  <input type="email" placeholder="hoca@email.com" value={instructorForm.email} onChange={e => setInstructorForm({ ...instructorForm, email: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fotoğraf URL (opsiyonel)</label>
                  <input type="url" placeholder="https://..." value={instructorForm.avatarUrl} onChange={e => setInstructorForm({ ...instructorForm, avatarUrl: e.target.value })} style={inputStyle} />
                </div>
                {instructorError && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {instructorError}</div>}
                {instructorSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {instructorSuccess}</div>}
                <button type="submit" style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Hoca Ekle</button>
              </form>
            </div>
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
                <div>
                  <label style={labelStyle}>Hoca (opsiyonel)</label>
                  <select value={classForm.instructorId} onChange={e => setClassForm({ ...classForm, instructorId: e.target.value })} style={inputStyle}>
                    <option value="">Hoca seçin</option>
                    {instructors.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>{inst.fullName} — {inst.specialty}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Açıklama (opsiyonel)</label>
                <textarea name="description" placeholder="Ders hakkında kısa açıklama..." value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              {classError && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {classError}</div>}
              {classSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {classSuccess}</div>}
              <button type="submit" style={{ padding: '14px', borderRadius: 14, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Dersi Ekle</button>
            </form>
          </div>
        )}

        {/* REZERVASYONLAR */}
        {activeTab === 'rezervasyonlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Ticket size={48} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Henüz rezervasyon yok</div>
              </div>
            ) : bookings.map((b: any) => (
              <div key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{b.user?.fullName}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{b.session?.class?.title} · {b.session?.startsAt ? new Date(b.session.startsAt).toLocaleDateString('tr-TR') : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>₺{b.totalPrice}</div>
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
