'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, User, Building2, Ticket, Clock, BadgeCheck } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'venues' | 'venue-images' | 'reports' | 'users' | 'bookings' | 'coupons' | 'categories' | 'instructors' | 'complaints'>('venues')
  const [pendingImages, setPendingImages] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [venues, setVenues] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [complaints, setComplaints] = useState<any[]>([])
  const [newCat, setNewCat] = useState({ name: '', colorHex: '#4F46E5', iconUrl: '' })
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [editCat, setEditCat] = useState({ name: '', colorHex: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    // Şifreyi backend'e gönder, doğrulama orada yapılır
    const res = await fetch(`${API_URL}/api/admin/stats`, {
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': password }
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      setLoginError('Hatalı şifre!')
    }
  }

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'x-admin-secret': password })

  useEffect(() => {
    if (!authed) return
    fetch(`${API_URL}/api/admin/stats`, { headers: getHeaders() }).then(r => r.json()).then(d => setStats(d.stats))
    fetch(`${API_URL}/api/admin/venues`, { headers: getHeaders() }).then(r => r.json()).then(d => setVenues(d.venues || []))
  }, [authed])

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/admin/users`, { headers: getHeaders() })
    const data = await res.json()
    setUsers(data.users || [])
  }

  const fetchBookings = async () => {
    const res = await fetch(`${API_URL}/api/admin/bookings`, { headers: getHeaders() })
    const data = await res.json()
    setBookings(data.bookings || [])
  }

  const fetchCoupons = async () => {
    const res = await fetch(`${API_URL}/api/admin/coupons`, { headers: getHeaders() })
    const data = await res.json()
    setCoupons(data.coupons || [])
  }

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/api/admin/categories`, { headers: getHeaders() })
    const data = await res.json()
    setCategories(data.categories || [])
  }

  const fetchPendingImages = async () => {
    const res = await fetch(`${API_URL}/api/admin/venue-images/pending`, { headers: getHeaders() })
    const data = await res.json()
    setPendingImages(data.venues || [])
  }

  const handleReviewImages = async (venueId: number, approve: boolean) => {
    const res = await fetch(`${API_URL}/api/admin/venue-images/${venueId}/review`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ approve }),
    })
    if (res.ok) {
      setPendingImages(prev => prev.filter(v => v.id !== venueId))
    } else {
      alert('İşlem başarısız.')
    }
  }

  const fetchReports = async () => {
    const res = await fetch(`${API_URL}/api/admin/reports`, { headers: getHeaders() })
    const data = await res.json()
    setReports(data.reports || [])
  }

  const handleResolveReport = async (reportId: number, action: 'remove_avatar' | 'ban' | 'dismiss') => {
    const res = await fetch(`${API_URL}/api/admin/reports/${reportId}/resolve`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      fetchReports()
    } else {
      alert('İşlem başarısız.')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCat.name.trim()) return
    const res = await fetch(`${API_URL}/api/admin/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: newCat.name.trim(), colorHex: newCat.colorHex || null, iconUrl: newCat.iconUrl || null }),
    })
    const data = await res.json()
    if (data.category) {
      setCategories(prev => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCat({ name: '', colorHex: '#4F46E5', iconUrl: '' })
    } else {
      alert(data.error || 'Hata oluştu.')
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return
    await fetch(`${API_URL}/api/admin/categories/${id}`, { method: 'DELETE', headers: getHeaders() })
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const handleEditCategory = (c: any) => {
    setEditingCatId(c.id)
    setEditCat({ name: c.name, colorHex: c.colorHex || '#4F46E5' })
  }

  const handleUpdateCategory = async (id: number) => {
    if (!editCat.name.trim()) return
    const res = await fetch(`${API_URL}/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name: editCat.name.trim(), colorHex: editCat.colorHex }),
    })
    const data = await res.json()
    if (data.category) {
      setCategories(prev => prev.map(c => c.id === id ? data.category : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingCatId(null)
    } else {
      alert(data.error || 'Hata oluştu.')
    }
  }

  const handleTab = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'users') fetchUsers()
    if (tab === 'bookings') fetchBookings()
    if (tab === 'coupons') fetchCoupons()
    if (tab === 'categories') fetchCategories()
    if (tab === 'venue-images') fetchPendingImages()
    if (tab === 'reports') fetchReports()
    if (tab === 'instructors') fetchInstructors()
    if (tab === 'complaints') fetchComplaints()
  }

  const handleApprove = async (id: number, approve: boolean) => {
    await fetch(`${API_URL}/api/admin/venues/${id}/approve`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ approve }),
    })
    setVenues(prev => prev.map(v => v.id === id ? { ...v, isApproved: approve } : v))
  }

  const handleSuspend = async (id: number, suspend: boolean) => {
    await fetch(`${API_URL}/api/admin/venues/${id}/suspend`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ suspend }),
    })
    setVenues(prev => prev.map(v => v.id === id ? { ...v, isSuspended: suspend } : v))
  }

  const handleDeleteVenue = async (id: number, name: string) => {
    if (!confirm(`"${name}" salonunu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return
    await fetch(`${API_URL}/api/admin/venues/${id}`, { method: 'DELETE', headers: getHeaders() })
    setVenues(prev => prev.filter(v => v.id !== id))
  }

  const handleBanUser = async (id: number, ban: boolean) => {
    await fetch(`${API_URL}/api/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ ban }),
    })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: ban } : u))
  }

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return
    await fetch(`${API_URL}/api/admin/coupons/${id}`, { method: 'DELETE', headers: getHeaders() })
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  const fetchInstructors = async () => {
    const res = await fetch(`${API_URL}/api/admin/instructors`, { headers: getHeaders() })
    const data = await res.json()
    setInstructors(data.instructors || [])
  }

  const handleVerifyInstructor = async (id: number, verified: boolean) => {
    await fetch(`${API_URL}/api/admin/instructors/${id}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ verified }),
    })
    setInstructors(prev => prev.map(i => i.id === id ? { ...i, verified } : i))
  }

  const fetchComplaints = async () => {
    const res = await fetch(`${API_URL}/api/admin/complaints`, { headers: getHeaders() })
    const data = await res.json()
    setComplaints(data.complaints || [])
  }

  const handleResolveComplaint = async (id: number) => {
    await fetch(`${API_URL}/api/admin/complaints/${id}/resolve`, { method: 'PUT', headers: getHeaders() })
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c))
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Lock size={36} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>Admin Paneli</h1>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input type="password" placeholder="Admin şifresi" value={password} onChange={e => { setPassword(e.target.value); setLoginError('') }} style={inputStyle} />
            {loginError && <div style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{loginError}</div>}
            <button type="submit" style={{ padding: '14px', borderRadius: 14, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Giriş</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 30, width: 'auto', display: 'block' }} /></Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={16} /> Admin Paneli</span>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* İstatistikler */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Kullanıcılar', value: stats.userCount, icon: <User size={28} />, color: '#8B5CF6' },
              { label: 'Salonlar', value: stats.venueCount, icon: <Building2 size={28} />, color: '#3B82F6' },
              { label: 'Rezervasyonlar', value: stats.bookingCount, icon: <Ticket size={28} />, color: '#10B981' },
              { label: 'Onay Bekleyen', value: stats.pendingVenues, icon: <Clock size={28} />, color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {([
            { key: 'stats', label: 'İstatistikler' },
            { key: 'venues', label: 'Salonlar' },
            { key: 'venue-images', label: 'Resim Onayı' },
            { key: 'reports', label: 'Şikayetler' },
            { key: 'users', label: 'Kullanıcılar' },
            { key: 'bookings', label: 'Rezervasyonlar' },
            { key: 'coupons', label: 'Kuponlar' },
            { key: 'categories', label: 'Kategoriler' },
            { key: 'instructors', label: 'Hocalar' },
            { key: 'complaints', label: 'Mesajlar' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => handleTab(tab.key)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#1a1a1a' : '#888', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* İSTATİSTİKLER */}
        {activeTab === 'stats' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Kullanıcılar', value: stats.userCount, icon: <User size={28} />, color: '#8B5CF6' },
              { label: 'Salonlar', value: stats.venueCount, icon: <Building2 size={28} />, color: '#3B82F6' },
              { label: 'Rezervasyonlar', value: stats.bookingCount, icon: <Ticket size={28} />, color: '#10B981' },
              { label: 'Onay Bekleyen', value: stats.pendingVenues, icon: <Clock size={28} />, color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* SALONLAR */}
        {activeTab === 'venues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {venues.map(v => (
              <div key={v.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{v.email} · {v.phone}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{v.address} · {v._count?.classes || 0} ders</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{new Date(v.createdAt).toLocaleDateString('tr-TR')} tarihinde başvurdu</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: v.isSuspended ? '#FEF2F2' : v.isApproved ? '#F0FDF4' : '#FEF9C3', color: v.isSuspended ? '#DC2626' : v.isApproved ? '#16a34a' : '#92400e' }}>
                    {v.isSuspended ? 'Donduruldu' : v.isApproved ? '✓ Onaylı' : 'Bekliyor'}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {!v.isApproved && (
                      <button onClick={() => handleApprove(v.id, true)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Onayla</button>
                    )}
                    {v.isApproved && (
                      <button onClick={() => handleApprove(v.id, false)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Onayı Kaldır</button>
                    )}
                    {!v.isSuspended ? (
                      <button onClick={() => handleSuspend(v.id, true)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Dondur</button>
                    ) : (
                      <button onClick={() => handleSuspend(v.id, false)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Aktif Et</button>
                    )}
                    <button onClick={() => handleDeleteVenue(v.id, v.name)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SALON RESİM ONAYI */}
        {activeTab === 'venue-images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingImages.length === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Onay bekleyen salon resmi yok.
              </div>
            )}
            {pendingImages.map(v => {
              const pendImgs: string[] = Array.isArray(v.pendingImages) ? v.pendingImages : []
              return (
                <div key={v.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{v.name}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleReviewImages(v.id, true)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✓ Onayla & Yayınla</button>
                      <button onClick={() => handleReviewImages(v.id, false)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✕ Reddet</button>
                    </div>
                  </div>
                  {v.pendingCoverImageUrl && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Kapak (onay bekliyor)</div>
                      <img src={v.pendingCoverImageUrl} alt="kapak" style={{ width: '100%', maxWidth: 400, height: 160, objectFit: 'cover', borderRadius: 12 }} />
                    </div>
                  )}
                  {pendImgs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Galeri ({pendImgs.length} resim, onay bekliyor)</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {pendImgs.map((url, i) => (
                          <img key={i} src={url} alt={`resim ${i + 1}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 10 }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ŞİKAYETLER */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.length === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Açık şikayet yok.
              </div>
            )}
            {reports.map(r => (
              <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {r.reportedUser?.avatarUrl ? (
                    <img src={r.reportedUser.avatarUrl} alt="avatar" style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 28, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#4F46E5' }}>{r.reportedUser?.fullName?.[0] || '?'}</div>
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                      {r.reportedUser?.fullName} <span style={{ color: '#888', fontWeight: 400 }}>@{r.reportedUser?.username}</span>
                      {r.reportedUser?.banned && <span style={{ marginLeft: 8, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>(banlı)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>Şikayet eden: @{r.reporter?.username} · {new Date(r.createdAt).toLocaleDateString('tr-TR')}</div>
                    {r.reason && <div style={{ fontSize: 12, color: '#555', marginTop: 4, fontStyle: 'italic' }}>"{r.reason}"</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleResolveReport(r.id, 'remove_avatar')} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fotoğrafı Kaldır</button>
                  <button onClick={() => handleResolveReport(r.id, 'ban')} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Kullanıcıyı Banla</button>
                  <button onClick={() => handleResolveReport(r.id, 'dismiss')} style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: '#E5E7EB', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Yoksay</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KULLANICILAR */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map(u => (
              <div key={u.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{u.fullName}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>@{u.username} · {u.email}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{new Date(u.createdAt).toLocaleDateString('tr-TR')} tarihinde katıldı</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6' }}>{u._count?.bookings || 0} rezervasyon</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{u.totalLessonsCompleted || 0} ders tamamlandı</div>
                  {!u.banned ? (
                    <button onClick={() => handleBanUser(u.id, true)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Banla</button>
                  ) : (
                    <button onClick={() => handleBanUser(u.id, false)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Ban Kaldır</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KUPONLAR */}
        {activeTab === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {coupons.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>Kupon bulunamadı.</div>}
            {coupons.map(c => (
              <div key={c.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{c.code}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{c.venue?.name} · {c.discountType === 'percent' ? `%${c.discountValue}` : `₺${c.discountValue}`} indirim</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    {c.usedCount}/{c.maxUses || '∞'} kullanım
                    {c.expiresAt ? ` · ${new Date(c.expiresAt).toLocaleDateString('tr-TR')} bitiş` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: c.isActive ? '#F0FDF4' : '#FEF2F2', color: c.isActive ? '#16a34a' : '#DC2626' }}>
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <button onClick={() => handleDeleteCoupon(c.id)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KATEGORİLER */}
        {activeTab === 'categories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Yeni kategori formu */}
            <form onSubmit={handleAddCategory} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2, minWidth: 160 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Kategori Adı</label>
                <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} placeholder="örn. Yelken / Yatçılık" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Renk</label>
                <input type="color" value={newCat.colorHex} onChange={e => setNewCat(p => ({ ...p, colorHex: e.target.value }))} style={{ width: 48, height: 42, borderRadius: 10, border: '1.5px solid #e5e5e5', cursor: 'pointer', padding: 2 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2, minWidth: 160 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>İkon URL (opsiyonel)</label>
                <input value={newCat.iconUrl} onChange={e => setNewCat(p => ({ ...p, iconUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
              </div>
              <button type="submit" style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Ekle</button>
            </form>

            {/* Mevcut kategoriler */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>Kategori yükleniyor...</div>}
              {categories.map(c => (
                <div key={c.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  {editingCatId === c.id ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                        <input type="color" value={editCat.colorHex} onChange={e => setEditCat(p => ({ ...p, colorHex: e.target.value }))} style={{ width: 42, height: 38, borderRadius: 8, border: '1.5px solid #e5e5e5', cursor: 'pointer', padding: 2 }} />
                        <input value={editCat.name} onChange={e => setEditCat(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: 140, padding: '8px 12px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleUpdateCategory(c.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
                        <button onClick={() => setEditingCatId(null)} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e5e5', background: '#fff', color: '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 6, backgroundColor: c.colorHex || '#ccc' }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{c.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEditCategory(c)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Düzenle</button>
                        <button onClick={() => handleDeleteCategory(c.id, c.name)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sil</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REZERVASYONLAR */}
        {activeTab === 'bookings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map(b => (
              <div key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{b.user?.fullName}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{b.session?.class?.title} · {b.session?.class?.venue?.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{new Date(b.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>₺{b.finalAmount}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: b.status === 'confirmed' ? '#10B981' : '#EF4444' }}>
                    {b.status === 'confirmed' ? '✓ Onaylı' : '✗ İptal'}
                  </div>
                  {b.status === 'cancelled' && b.notes?.includes('iade') && (
                    <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
                      {b.notes.split('İptal: ')[1] || 'İptal'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HOCALAR */}
        {activeTab === 'instructors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {instructors.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>Hoca yok.</div>}
            {instructors.map(inst => (
              <div key={inst.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {inst.fullName}
                    {inst.verified && <BadgeCheck size={16} color="#2563EB" />}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{inst.specialty || '—'} · {inst.venue?.name || 'Salon yok'}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{inst._count?.classes || 0} ders · ⭐ {(inst.avgRating ?? 0).toFixed(1)} ({inst.totalReviews || 0})</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {inst.verified ? (
                    <>
                      <span style={{ fontSize: 12, backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>Doğrulanmış</span>
                      <button onClick={() => handleVerifyInstructor(inst.id, false)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Doğrulamayı Kaldır</button>
                    </>
                  ) : (
                    <button onClick={() => handleVerifyInstructor(inst.id, true)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Doğrula</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MESAJLAR (iletişim/şikayet formu) */}
        {activeTab === 'complaints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {complaints.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>Mesaj yok.</div>}
            {complaints.map(c => (
              <div key={c.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', opacity: c.status === 'resolved' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{c.subject}</div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.name} · {c.email} · {new Date(c.createdAt).toLocaleString('tr-TR')}</div>
                    <div style={{ fontSize: 14, color: '#444', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.message}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {c.status === 'resolved' ? (
                      <span style={{ fontSize: 12, backgroundColor: '#F0FDF4', color: '#16a34a', padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>Çözüldü</span>
                    ) : (
                      <button onClick={() => handleResolveComplaint(c.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Çözüldü işaretle</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
