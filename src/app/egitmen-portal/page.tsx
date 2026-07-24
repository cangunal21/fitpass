'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Star, LogOut, MessageSquare, Trash2, QrCode, CalendarDays, User as UserIcon, Plus, CheckCircle2, XCircle } from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'

type Tab = 'profil' | 'dersler' | 'checkin' | 'yorumlar'

export default function EgitmenPortalPage() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('fitpass_instructor_token') : null
  const authHeaders = { Authorization: `Bearer ${token}` }
  const jsonAuth = { 'Content-Type': 'application/json', ...authHeaders }

  const [tab, setTab] = useState<Tab>('profil')
  const [me, setMe] = useState<any>(null)
  const [agg, setAgg] = useState({ avgRating: 0, totalReviews: 0 })
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Profil düzenleme
  const [pName, setPName] = useState('')
  const [pSpecs, setPSpecs] = useState<string[]>([])
  const [pBio, setPBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Dersler
  const [classes, setClasses] = useState<any[]>([])
  const [classForm, setClassForm] = useState({ title: '', category: '', basePrice: '', duration: '60', capacity: '' })
  const [classMsg, setClassMsg] = useState('')
  const [sessionForm, setSessionForm] = useState<{ classId: number; date: string; time: string; capacity: string } | null>(null)

  // Check-in
  const [checkinCode, setCheckinCode] = useState('')
  const [checkinResult, setCheckinResult] = useState<any>(null)
  const [checkinBusy, setCheckinBusy] = useState(false)

  // Yorumlar
  const [reviews, setReviews] = useState<any[]>([])
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})
  const [replyVis, setReplyVis] = useState<Record<number, 'public' | 'private'>>({})
  const [replyLoading, setReplyLoading] = useState<number | null>(null)

  const loadReviews = useCallback(async () => {
    const r = await fetch(`${API_URL}/api/instructor/reviews`, { headers: authHeaders }).then(x => x.json()).catch(() => null)
    if (r && !r.error) { setReviews(Array.isArray(r.reviews) ? r.reviews : []); setAgg({ avgRating: r.avgRating ?? 0, totalReviews: r.totalReviews ?? 0 }) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token])

  const loadClasses = useCallback(async () => {
    const r = await fetch(`${API_URL}/api/instructor/classes`, { headers: authHeaders }).then(x => x.json()).catch(() => null)
    if (r && !r.error) setClasses(Array.isArray(r.classes) ? r.classes : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token])

  const applyMe = (inst: any) => {
    setMe(inst)
    setPName(inst.fullName || '')
    setPSpecs(inst.specialty ? String(inst.specialty).split(' · ').map((s: string) => s.trim()).filter(Boolean) : [])
    setPBio(inst.bio || '')
  }

  useEffect(() => {
    if (!token) { router.push('/egitmen-giris'); return }
    ;(async () => {
      const r = await fetch(`${API_URL}/api/instructor/me`, { headers: authHeaders }).then(x => x.json()).catch(() => null)
      if (!r || r.error || !r.instructor) { localStorage.removeItem('fitpass_instructor_token'); router.push('/egitmen-giris'); return }
      applyMe(r.instructor)
      fetch(`${API_URL}/api/public/categories`).then(x => x.json()).then(d => { if (Array.isArray(d?.categories)) setCategories(d.categories.map((c: any) => c.name)) }).catch(() => {})
      await Promise.all([loadReviews(), loadClasses()])
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = () => { localStorage.removeItem('fitpass_instructor_token'); localStorage.removeItem('fitpass_instructor'); router.push('/egitmen-giris') }
  const toggleSpec = (s: string) => setPSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const putMe = async (body: any) => fetch(`${API_URL}/api/instructor/me`, { method: 'PUT', headers: jsonAuth, body: JSON.stringify(body) }).then(x => x.json())

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg('')
    const res = await putMe({ fullName: pName, specialty: pSpecs.join(' · '), bio: pBio })
    setSavingProfile(false)
    if (res.error) { setProfileMsg(res.error); return }
    applyMe(res.instructor); setProfileMsg('Profil kaydedildi ✓')
    setTimeout(() => setProfileMsg(''), 2500)
  }

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault(); setClassMsg('')
    if (!classForm.category) { setClassMsg('Branş seçin.'); return }
    const res = await fetch(`${API_URL}/api/instructor/classes`, { method: 'POST', headers: jsonAuth, body: JSON.stringify(classForm) }).then(x => x.json())
    if (res.error) { setClassMsg(res.error); return }
    setClassForm({ title: '', category: '', basePrice: '', duration: '60', capacity: '' })
    setClassMsg('Ders eklendi ✓'); loadClasses()
    setTimeout(() => setClassMsg(''), 2500)
  }

  const addSession = async () => {
    if (!sessionForm) return
    const { classId, date, time, capacity } = sessionForm
    const res = await fetch(`${API_URL}/api/instructor/classes/${classId}/sessions`, { method: 'POST', headers: jsonAuth, body: JSON.stringify({ date, time, capacity }) }).then(x => x.json())
    if (res.error) { alert(res.error); return }
    setSessionForm(null); loadClasses()
  }

  const doCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkinCode.trim()) return
    setCheckinBusy(true); setCheckinResult(null)
    const res = await fetch(`${API_URL}/api/instructor/checkin`, { method: 'POST', headers: jsonAuth, body: JSON.stringify({ code: checkinCode.trim() }) }).then(x => x.json())
    setCheckinBusy(false); setCheckinResult(res)
    if (res.success || res.alreadyCheckedIn) setCheckinCode('')
  }

  const handleReply = async (id: number) => {
    const reply = (replyTexts[id] || '').trim(); if (!reply) return
    setReplyLoading(id)
    const res = await fetch(`${API_URL}/api/instructor/reviews/${id}/reply`, { method: 'PUT', headers: jsonAuth, body: JSON.stringify({ reply, visibility: replyVis[id] || 'public' }) }).then(x => x.json()).catch(() => ({ error: 'Bağlantı hatası.' }))
    setReplyLoading(null)
    if (res.error) { alert(res.error); return }
    setReplyTexts(p => ({ ...p, [id]: '' })); loadReviews()
  }
  const handleDeleteReply = async (id: number) => {
    setReplyLoading(id)
    await fetch(`${API_URL}/api/instructor/reviews/${id}/reply`, { method: 'DELETE', headers: authHeaders }).catch(() => {})
    setReplyLoading(null); loadReviews()
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Yükleniyor…</div>

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profil', label: 'Profil', icon: <UserIcon size={16} /> },
    { key: 'dersler', label: 'Derslerim', icon: <CalendarDays size={16} /> },
    { key: 'checkin', label: 'Check-in', icon: <QrCode size={16} /> },
    { key: 'yorumlar', label: 'Yorumlar', icon: <MessageSquare size={16} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4F46E5' }}>
          <GraduationCap size={24} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>Eğitmen Portalı</span>
        </div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 24, border: '1px solid #eee', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer' }}><LogOut size={15} /> Çıkış</button>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === t.key ? '#4F46E5' : '#fff', color: tab === t.key ? '#fff' : '#555', boxShadow: tab === t.key ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ---- PROFİL ---- */}
        {tab === 'profil' && (
          <div style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
              <AvatarUpload currentUrl={me?.avatarUrl} name={me?.fullName || '?'} size={72} editable onUpload={async (url) => { const r = await putMe({ avatarUrl: url }); if (!r.error) setMe((m: any) => ({ ...m, avatarUrl: url })) }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#999' }}>{me?.venue?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Star size={15} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{agg.avgRating || '—'}</span>
                  <span style={{ fontSize: 13, color: '#999' }}>· {agg.totalReviews} yorum</span>
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Fotoğrafına tıklayıp değiştirebilirsin</div>
              </div>
            </div>

            <label style={lbl}>Ad Soyad</label>
            <input value={pName} onChange={e => setPName(e.target.value)} style={inp} />

            <label style={{ ...lbl, marginTop: 16 }}>Uzmanlık (branşlar)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {categories.map(sp => (
                <button key={sp} type="button" onClick={() => toggleSpec(sp)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: pSpecs.includes(sp) ? '#4F46E5' : '#f0f0f0', color: pSpecs.includes(sp) ? '#fff' : '#555' }}>{sp}</button>
              ))}
            </div>

            <label style={{ ...lbl, marginTop: 16 }}>Hakkında (bio)</label>
            <textarea value={pBio} onChange={e => setPBio(e.target.value)} rows={3} placeholder="Kendini kısaca tanıt…" style={{ ...inp, resize: 'vertical' }} />

            {profileMsg && <div style={{ marginTop: 12, fontSize: 13, color: profileMsg.includes('✓') ? '#16a34a' : '#DC2626', fontWeight: 600 }}>{profileMsg}</div>}
            <button onClick={saveProfile} disabled={savingProfile} style={{ ...primaryBtn, marginTop: 16 }}>{savingProfile ? 'Kaydediliyor…' : 'Profili Kaydet'}</button>
          </div>
        )}

        {/* ---- DERSLERİM ---- */}
        {tab === 'dersler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <form onSubmit={addClass} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 14 }}>Yeni Ders Ekle</div>
              <label style={lbl}>Ders Adı</label>
              <input value={classForm.title} onChange={e => setClassForm({ ...classForm, title: e.target.value })} placeholder="Sabah Yogası" required style={inp} />
              <label style={{ ...lbl, marginTop: 12 }}>Branş</label>
              <select value={classForm.category} onChange={e => setClassForm({ ...classForm, category: e.target.value })} required style={inp}>
                <option value="">Branş seçin</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1 }}><label style={lbl}>Fiyat (₺)</label><input type="number" value={classForm.basePrice} onChange={e => setClassForm({ ...classForm, basePrice: e.target.value })} required style={inp} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>Süre (dk)</label><input type="number" value={classForm.duration} onChange={e => setClassForm({ ...classForm, duration: e.target.value })} required style={inp} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>Kapasite</label><input type="number" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: e.target.value })} required style={inp} /></div>
              </div>
              {classMsg && <div style={{ marginTop: 12, fontSize: 13, color: classMsg.includes('✓') ? '#16a34a' : '#DC2626', fontWeight: 600 }}>{classMsg}</div>}
              <button type="submit" style={{ ...primaryBtn, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={16} /> Ders Ekle</button>
            </form>

            {classes.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 30, textAlign: 'center', color: '#aaa', fontSize: 14 }}>Henüz dersin yok. Yukarıdan ekleyebilirsin.</div>
            ) : classes.map((c: any) => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{c.category} · ₺{c.basePrice} · {c.durationMinutes}dk · {c.capacity} kişi</div>
                  </div>
                  <button onClick={() => setSessionForm({ classId: c.id, date: '', time: '', capacity: String(c.capacity) })} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Seans</button>
                </div>
                {(c.sessions || []).length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.sessions.map((s: any) => (
                      <span key={s.id} style={{ fontSize: 12, background: '#f5f5f7', borderRadius: 8, padding: '4px 10px', color: '#555' }}>
                        {new Date(s.startsAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {s.availableSpots} yer
                      </span>
                    ))}
                  </div>
                )}
                {sessionForm && sessionForm.classId === c.id && (
                  <div style={{ marginTop: 12, background: '#FAFAFF', borderRadius: 12, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div><label style={lbl}>Tarih</label><input type="date" value={sessionForm.date} onChange={e => setSessionForm(sf => sf ? { ...sf, date: e.target.value } : sf)} style={{ ...inp, width: 150 }} /></div>
                    <div><label style={lbl}>Saat</label><input type="time" value={sessionForm.time} onChange={e => setSessionForm(sf => sf ? { ...sf, time: e.target.value } : sf)} style={{ ...inp, width: 110 }} /></div>
                    <div><label style={lbl}>Kapasite</label><input type="number" value={sessionForm.capacity} onChange={e => setSessionForm(sf => sf ? { ...sf, capacity: e.target.value } : sf)} style={{ ...inp, width: 90 }} /></div>
                    <button onClick={addSession} style={{ ...primaryBtn, width: 'auto', padding: '10px 18px' }}>Ekle</button>
                    <button onClick={() => setSessionForm(null)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #eee', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Vazgeç</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ---- CHECK-IN ---- */}
        {tab === 'checkin' && (
          <div style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><QrCode size={20} color="#4F46E5" /><span style={{ fontSize: 16, fontWeight: 800 }}>Öğrenci Check-in</span></div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Öğrencinin uygulamadaki 8 haneli check-in kodunu gir. Yalnızca kendi derslerindeki öğrencileri onaylayabilirsin.</p>
            <form onSubmit={doCheckin} style={{ display: 'flex', gap: 8 }}>
              <input value={checkinCode} onChange={e => setCheckinCode(e.target.value.toUpperCase())} placeholder="ÖRN: A1B2C3D4" maxLength={12} style={{ ...inp, flex: 1, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }} />
              <button type="submit" disabled={checkinBusy} style={{ ...primaryBtn, width: 'auto', padding: '12px 24px' }}>{checkinBusy ? '...' : 'Onayla'}</button>
            </form>
            {checkinResult && (
              <div style={{ marginTop: 16, borderRadius: 12, padding: '14px 18px', background: checkinResult.error ? '#FEF2F2' : checkinResult.alreadyCheckedIn ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${checkinResult.error ? '#FECACA' : checkinResult.alreadyCheckedIn ? '#FDE68A' : '#BBF7D0'}` }}>
                {checkinResult.error ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626', fontWeight: 600, fontSize: 14 }}><XCircle size={18} /> {checkinResult.error}</div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: checkinResult.alreadyCheckedIn ? '#B45309' : '#16a34a', fontWeight: 700, fontSize: 14, marginBottom: 6 }}><CheckCircle2 size={18} /> {checkinResult.alreadyCheckedIn ? 'Zaten check-in yapılmış' : 'Check-in başarılı!'}</div>
                    <div style={{ fontSize: 14, color: '#444' }}>{checkinResult.booking?.user?.fullName} · {checkinResult.booking?.classTitle}{checkinResult.booking?.groupSize > 1 ? ` · ${checkinResult.booking.groupSize} kişi` : ''}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- YORUMLAR ---- */}
        {tab === 'yorumlar' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} /> Yorumlarım ({agg.totalReviews})</h2>
              <button onClick={loadReviews} style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid #eee', background: '#fff', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer' }}>Yenile</button>
            </div>
            {reviews.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 36, textAlign: 'center', color: '#aaa', fontSize: 14 }}>Henüz yorum yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviews.map((r: any) => (
                  <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>{r.isAnonymous ? '?' : (r.reviewer?.fullName?.[0] || '?')}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{r.isAnonymous ? 'Anonim' : (r.reviewer?.fullName || 'Kullanıcı')}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 1 }}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={15} color="#F59E0B" fill={n <= r.rating ? '#F59E0B' : 'none'} />)}</div>
                    </div>
                    {r.comment && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                    {r.venueReply ? (
                      <div style={{ marginTop: 12, background: '#F5F3FF', borderRadius: 12, padding: '12px 16px', borderLeft: '3px solid #4F46E5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>Yanıtın {r.replyVisibility === 'private' ? '· 🔒 özel (yalnız kullanıcı görür)' : '· herkese açık'}</span>
                          <button onClick={() => handleDeleteReply(r.id)} disabled={replyLoading === r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Trash2 size={13} /> Yanıtı Sil</button>
                        </div>
                        <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{r.venueReply}</p>
                      </div>
                    ) : (
                      <div style={{ marginTop: 12 }}>
                        <textarea value={replyTexts[r.id] || ''} onChange={e => setReplyTexts(p => ({ ...p, [r.id]: e.target.value }))} placeholder="Yanıtını yaz…" rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', backgroundColor: '#fafafa' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 10, flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', cursor: 'pointer' }}>
                            <input type="checkbox" checked={(replyVis[r.id] || 'public') === 'private'} onChange={e => setReplyVis(p => ({ ...p, [r.id]: e.target.checked ? 'private' : 'public' }))} /> Özel yanıt (yalnız yorumu yazan görür)
                          </label>
                          <button onClick={() => handleReply(r.id)} disabled={replyLoading === r.id || !(replyTexts[r.id] || '').trim()} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: (replyTexts[r.id] || '').trim() ? '#4F46E5' : '#ccc', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{replyLoading === r.id ? '...' : 'Yanıtla'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
const primaryBtn: React.CSSProperties = { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
