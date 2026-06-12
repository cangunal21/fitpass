'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockUsers } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { getUser } from '@/lib/api'

export default function ProfilPage() {
  const params = useParams()
  const user = mockUsers.find(u => u.username === params.username) || mockUsers[0]
  const friends = mockUsers.filter(u => u.id !== user.id).slice(0, 4)
  const [activeTab, setActiveTab] = useState<'aktivite' | 'rezervasyonlar' | 'arkadaşlar' | 'istatistik'>('aktivite')
  const [isFollowing, setIsFollowing] = useState(false)
  const [myBookings, setMyBookings] = useState<any[]>([])
  const loggedInUser = getUser()
  const isOwnProfile = loggedInUser?.username === params.username

  useEffect(() => {
    if (isOwnProfile) {
      const saved = JSON.parse(localStorage.getItem('fitpass_bookings') || '[]')
      setMyBookings(saved)
    }
  }, [])

  const tiers = [
    { name: 'Acemi', min: 1 }, { name: 'Aday', min: 10 }, { name: 'Sporcu', min: 35 }, { name: 'Atlet', min: 70 }, { name: 'Şampiyon', min: 120 },
  ]
  const currentIndex = tiers.findIndex(t => t.name === user.tier.name)
  const next = tiers[currentIndex + 1]
  const progressPercent = next ? Math.min(100, ((user.stats.totalLessons - tiers[currentIndex].min) / (next.min - tiers[currentIndex].min)) * 100) : 100

  const recentActivity = [
    { id: 1, description: `${user.topSports[0]?.name} dersini tamamladı`, icon: user.topSports[0]?.icon || '🏃', time: '2 saat önce', type: 'booking' },
    { id: 2, description: 'Halı Saha maçına katıldı', icon: '⚽', time: 'Dün', type: 'dropin' },
    { id: 3, description: 'Disiplinli rozetini kazandı', icon: '💪', time: '3 gün önce', type: 'badge' },
    { id: 4, description: `${user.topSports[1]?.name || 'HIIT'} dersini tamamladı`, icon: user.topSports[1]?.icon || '🔥', time: '4 gün önce', type: 'booking' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 20 }}>← Geri Dön</Link>

        {/* Profil kartı */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ height: 100, background: `linear-gradient(135deg, ${user.tier.color} 0%, ${user.tier.color}88 100%)` }} />
          <div style={{ padding: '0 28px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ marginTop: -36, width: 72, height: 72, borderRadius: '50%', backgroundColor: '#f0f0f0', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>👤</div>
              <button onClick={() => setIsFollowing(!isFollowing)} style={{ padding: '9px 22px', borderRadius: 24, border: isFollowing ? '1.5px solid #ddd' : 'none', background: isFollowing ? '#fff' : '#FF385C', color: isFollowing ? '#555' : '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                {isFollowing ? '✓ Takip Ediliyor' : '+ Takip Et'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{user.fullName}</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: user.tier.color, backgroundColor: user.tier.color + '18', padding: '3px 12px', borderRadius: 20 }}>{user.tier.icon} {user.tier.name}</span>
            </div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>@{user.username}</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>📍 {user.neighborhood}, İstanbul</div>

            {next && (
              <div style={{ backgroundColor: '#f9f9f9', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{user.tier.icon} {user.tier.name}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{next.min - user.stats.totalLessons} ders kaldı → <strong>{next.name}</strong></span>
                </div>
                <div style={{ height: 6, backgroundColor: '#eee', borderRadius: 3 }}>
                  <div style={{ height: '100%', backgroundColor: user.tier.color, borderRadius: 3, width: `${progressPercent}%` }} />
                </div>
              </div>
            )}

            {user.tier.discountPercent > 0 && (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 10, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>🎁 {user.tier.name} avantajı: %{user.tier.discountPercent} indirim</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #f5f5f5', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Toplam Ders', value: user.stats.totalLessons, icon: '📚' },
              { label: 'Bu Ay', value: user.stats.thisMonth, icon: '📅' },
              { label: 'İstanbul', value: `#${user.leaderboard.istanbul}`, icon: '🏙️' },
              { label: user.neighborhood, value: `#${user.leaderboard.neighborhood}`, icon: '📍' },
            ].map((stat, i) => (
              <div key={i} style={{ padding: '16px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sporlar + rozetler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>🏅 Ana Sporlar</h3>
            {user.topSports.map((sport, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: sport.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{sport.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{sport.name}</span>
                    <span style={{ fontSize: 12, color: '#999' }}>{sport.count} ders</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: '#f0f0f0', borderRadius: 2 }}>
                    <div style={{ height: '100%', backgroundColor: sport.color, borderRadius: 2, width: `${(sport.count / user.topSports[0].count) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>🎖️ Rozetler</h3>
            {user.badges.length === 0 && <div style={{ color: '#999', fontSize: 13 }}>Henüz rozet kazanılmadı.</div>}
            {user.badges.map((badge, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', backgroundColor: badge.color + '10', borderRadius: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 22 }}>{badge.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{badge.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {([
            { key: 'aktivite', label: '📋 Aktivite' },
            ...(isOwnProfile ? [{ key: 'rezervasyonlar', label: '🎟️ Rezervasyonlar' }] : []),
            { key: 'arkadaşlar', label: '👥 Arkadaşlar' },
            { key: 'istatistik', label: '📊 İstatistik' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#1a1a1a' : '#888', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'aktivite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivity.map(act => (
              <div key={act.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, backgroundColor: act.type === 'booking' ? '#F0FDF4' : act.type === 'dropin' ? '#EFF6FF' : '#FEF9C3' }}>{act.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{act.description}</div>
                </div>
                <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{act.time}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rezervasyonlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myBookings.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎟️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Henüz rezervasyonun yok</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Dersler sayfasından ders bul ve rezervasyon yap</div>
                <Link href="/" style={{ padding: '12px 24px', borderRadius: 14, background: '#FF385C', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Ders Bul</Link>
              </div>
            ) : (
              myBookings.map((b: any) => (
                <div key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF0F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{b.classIcon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{b.classTitle}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{b.date} · {b.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FF385C' }}>₺{b.price}</div>
                    <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: 8 }}>✓ Onaylı</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'arkadaşlar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {friends.map(friend => (
              <Link key={friend.id} href={`/profil/${friend.username}`} style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                >
                  <div style={{ width: 54, height: 54, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 10px' }}>👤</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{friend.fullName}</div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>@{friend.username}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: friend.tier.color, backgroundColor: friend.tier.color + '15', padding: '3px 12px', borderRadius: 12, display: 'inline-block', marginBottom: 6 }}>{friend.tier.icon} {friend.tier.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Ana spor: {friend.topSports[0]?.name}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'istatistik' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: 'Toplam Ders', value: user.stats.totalLessons, icon: '📚', color: '#8B5CF6' },
              { label: 'Bu Ay', value: user.stats.thisMonth, icon: '📅', color: '#3B82F6' },
              { label: 'Seri (gün)', value: user.stats.streak, icon: '🔥', color: '#EF4444' },
              { label: 'İptal Yok', value: user.stats.noCancel, icon: '💪', color: '#10B981' },
              { label: 'Aynı Salon', value: user.stats.sameVenue, icon: '❤️', color: '#EC4899' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
