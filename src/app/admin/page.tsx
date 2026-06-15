'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, User, Building2, Ticket, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const ADMIN_SECRET = 'fitpass-admin-2024'

const headers = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET }

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'venues' | 'users' | 'bookings'>('stats')
  const [stats, setStats] = useState<any>(null)
  const [venues, setVenues] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'fitpass-admin-2024') setAuthed(true)
    else alert('Hatalı şifre!')
  }

  useEffect(() => {
    if (!authed) return
    fetch(`${API_URL}/api/admin/stats`, { headers }).then(r => r.json()).then(d => setStats(d.stats))
    fetch(`${API_URL}/api/admin/venues`, { headers }).then(r => r.json()).then(d => setVenues(d.venues || []))
  }, [authed])

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/admin/users`, { headers })
    const data = await res.json()
    setUsers(data.users || [])
  }

  const fetchBookings = async () => {
    const res = await fetch(`${API_URL}/api/admin/bookings`, { headers })
    const data = await res.json()
    setBookings(data.bookings || [])
  }

  const handleTab = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'users') fetchUsers()
    if (tab === 'bookings') fetchBookings()
  }

  const handleApprove = async (id: number, approve: boolean) => {
    await fetch(`${API_URL}/api/admin/venues/${id}/approve`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ approve }),
    })
    setVenues(prev => prev.map(v => v.id === id ? { ...v, isApproved: approve } : v))
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
            <input type="password" placeholder="Admin şifresi" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
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
            { key: 'venues', label: 'Salonlar' },
            { key: 'users', label: 'Kullanıcılar' },
            { key: 'bookings', label: 'Rezervasyonlar' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => handleTab(tab.key)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#1a1a1a' : '#888', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

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
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: v.isApproved ? '#F0FDF4' : '#FEF9C3', color: v.isApproved ? '#16a34a' : '#92400e' }}>
                    {v.isApproved ? '✓ Onaylı' : 'Bekliyor'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!v.isApproved && (
                      <button onClick={() => handleApprove(v.id, true)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Onayla</button>
                    )}
                    {v.isApproved && (
                      <button onClick={() => handleApprove(v.id, false)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>İptal Et</button>
                    )}
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6' }}>{u._count?.bookings || 0} rezervasyon</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{u.totalLessonsCompleted || 0} ders tamamlandı</div>
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
                  <div style={{ fontSize: 12, color: '#888' }}>{b.classSession?.class?.title} · {b.classSession?.class?.venue?.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{new Date(b.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>₺{b.totalPrice}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: b.status === 'confirmed' ? '#10B981' : '#EF4444' }}>
                    {b.status === 'confirmed' ? '✓ Onaylı' : '✗ İptal'}
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
