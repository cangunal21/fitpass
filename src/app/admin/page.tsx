'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, User, Building2, Ticket, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'venues' | 'users' | 'bookings' | 'coupons'>('venues')
  const [stats, setStats] = useState<any>(null)
  const [venues, setVenues] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])

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

  const handleTab = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'users') fetchUsers()
    if (tab === 'bookings') fetchBookings()
    if (tab === 'coupons') fetchCoupons()
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
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5', letterSpacing: -0.5, textDecoration: 'none' }}>şipşakspor</Link>
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
            { key: 'users', label: 'Kullanıcılar' },
            { key: 'bookings', label: 'Rezervasyonlar' },
            { key: 'coupons', label: 'Kuponlar' },
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
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
