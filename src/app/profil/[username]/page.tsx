'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockUsers } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { getUser } from '@/lib/api'
import type { ReactNode } from 'react'
import { User, Users, Ticket, Award, ClipboardList, BarChart2, BookOpen, Calendar, Flame, Dumbbell, Heart, Building, MapPin, Gift, Medal, Check, X } from 'lucide-react'
import { SportIcon, SportIconBox } from '@/lib/sportIcons'

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
    { id: 1, description: `${user.topSports[0]?.name} dersini tamamladı`, icon: user.topSports[0]?.icon || 'strength', time: '2 saat önce', type: 'booking' },
    { id: 2, description: 'Halı Saha maçına katıldı', icon: 'football', time: 'Dün', type: 'dropin' },
    { id: 3, description: 'Disiplinli rozetini kazandı', icon: 'strength', time: '3 gün önce', type: 'badge' },
    { id: 4, description: `${user.topSports[1]?.name || 'HIIT'} dersini tamamladı`, icon: user.topSports[1]?.icon || 'hiit', time: '4 gün önce', type: 'booking' },
  ]

  const tabs: { key: string; label: ReactNode }[] = [
    { key: 'aktivite', label: <><ClipboardList size={15} style={{ marginRight: 5 }} />Aktivite</> },
    ...(isOwnProfile ? [{ key: 'rezervasyonlar', label: <><Ticket size={15} style={{ marginRight: 5 }} />Rezervasyonlar</> }] : []),
    { key: 'arkadaşlar', label: <><Users size={15} style={{ marginRight: 5 }} />Arkadaşlar</> },
    { key: 'istatistik', label: <><BarChart2 size={15} style={{ marginRight: 5 }} />İstatistik</> },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 28 }}>
          ← Ana sayfa
        </Link>

        {/* Profil kartı */}
        <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0', marginBottom: 20 }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${user.tier.color} 0%, ${user.tier.color}80 100%)` }} />

          <div style={{ padding: '0 32px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div style={{ marginTop: -40, width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #F5F5F5, #EBEBEB)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}><User size={36} /></div>
              {!isOwnProfile && (
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  style={{ padding: '10px 24px', borderRadius: 100, border: isFollowing ? '1.5px solid #EBEBEB' : 'none', background: isFollowing ? '#fff' : '#4F46E5', color: isFollowing ? '#555' : '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16 }}
                >
                  {isFollowing ? '✓ Takip Ediliyor' : '+ Takip Et'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{user.fullName}</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: user.tier.color, backgroundColor: user.tier.color + '18', padding: '4px 12px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><SportIcon name={user.tier.icon} size={12} color={user.tier.color} /> {user.tier.name}</span>
            </div>
            <div style={{ fontSize: 14, color: '#aaa', marginBottom: 4 }}>@{user.username}</div>
            <div style={{ fontSize: 13, color: '#bbb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {user.neighborhood}, İstanbul</div>

            {next && (
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: 14, padding: '14px 18px', marginBottom: 16, border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#555', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><SportIcon name={user.tier.icon} size={13} color={user.tier.color} /> {user.tier.name}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{next.min - user.stats.totalLessons} ders daha → <strong style={{ color: '#111' }}>{next.name}</strong></span>
                </div>
                <div style={{ height: 6, backgroundColor: '#EBEBEB', borderRadius: 100 }}>
                  <div style={{ height: '100%', backgroundColor: user.tier.color, borderRadius: 100, width: `${progressPercent}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {user.tier.discountPercent > 0 && (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Gift size={16} /> {user.tier.name} avantajı: %{user.tier.discountPercent} indirim</span>
              </div>
            )}
          </div>

          {/* İstatistik satırı */}
          <div style={{ borderTop: '1px solid #F5F5F5', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Toplam Ders', value: user.stats.totalLessons, icon: <BookOpen size={20} /> },
              { label: 'Bu Ay', value: user.stats.thisMonth, icon: <Calendar size={20} /> },
              { label: 'İstanbul Sırası', value: `#${user.leaderboard.istanbul}`, icon: <Building size={20} /> },
              { label: user.neighborhood, value: `#${user.leaderboard.neighborhood}`, icon: <MapPin size={20} /> },
            ].map((stat, i) => (
              <div key={i} style={{ padding: '18px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid #F5F5F5' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sporlar + Rozetler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '22px 24px', border: '1px solid #F0F0F0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Medal size={16} /> Ana Sporlar</h3>
            {user.topSports.map((sport, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <SportIconBox name={sport.icon} bgColor={sport.color + '20'} iconColor={sport.color} boxSize={38} borderRadius={12} size={18} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{sport.name}</span>
                    <span style={{ fontSize: 12, color: '#999' }}>{sport.count} ders</span>
                  </div>
                  <div style={{ height: 5, backgroundColor: '#F0F0F0', borderRadius: 100 }}>
                    <div style={{ height: '100%', backgroundColor: sport.color, borderRadius: 100, width: `${(sport.count / user.topSports[0].count) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '22px 24px', border: '1px solid #F0F0F0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Award size={16} /> Rozetler</h3>
            {user.badges.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>Henüz rozet kazanılmadı.</div>}
            {user.badges.map((badge, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: badge.color + '10', borderRadius: 12, marginBottom: 8 }}>
                <SportIcon name={badge.icon} size={20} color={badge.color} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{badge.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '4px', border: '1px solid #F0F0F0', display: 'inline-flex', gap: 2, marginBottom: 20 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#4F46E5' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#fff' : '#888', transition: 'all 0.15s' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aktivite */}
        {activeTab === 'aktivite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivity.map(act => (
              <div key={act.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                <SportIconBox name={act.icon} bgColor={act.type === 'booking' ? '#F0FDF4' : act.type === 'dropin' ? '#EFF6FF' : '#FEF9C3'} iconColor={act.type === 'booking' ? '#16A34A' : act.type === 'dropin' ? '#3B82F6' : '#CA8A04'} boxSize={46} borderRadius={14} size={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{act.description}</div>
                </div>
                <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{act.time}</div>
              </div>
            ))}
          </div>
        )}

        {/* Rezervasyonlar */}
        {activeTab === 'rezervasyonlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myBookings.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Ticket size={52} /></div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Henüz rezervasyonun yok</div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Dersler sayfasından ders bul ve rezervasyon yap</div>
                <Link href="/" style={{ padding: '12px 28px', borderRadius: 14, background: '#4F46E5', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Ders Bul</Link>
              </div>
            ) : (
              myBookings.map((b: any) => (
                <div key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: b.status === 'cancelled' ? '#F5F5F5' : '#FFF0F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: b.status === 'cancelled' ? 0.4 : 1, flexShrink: 0 }}>{b.classIcon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: b.status === 'cancelled' ? '#bbb' : '#111', textDecoration: b.status === 'cancelled' ? 'line-through' : 'none', marginBottom: 3 }}>{b.classTitle}</div>
                    <div style={{ fontSize: 13, color: '#aaa' }}>{b.date} · {b.time}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: b.status === 'cancelled' ? '#bbb' : '#4F46E5' }}>₺{b.price}</div>
                    {b.status === 'cancelled' ? (
                      <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, backgroundColor: '#FEF2F2', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> İptal edildi</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Onaylı</span>
                        <button
                          onClick={() => {
                            const updated = myBookings.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x)
                            setMyBookings(updated)
                            localStorage.setItem('fitpass_bookings', JSON.stringify(updated))
                          }}
                          style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, background: 'none', border: '1px solid #FECACA', borderRadius: 100, padding: '3px 10px', cursor: 'pointer' }}
                        >
                          İptal Et
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Arkadaşlar */}
        {activeTab === 'arkadaşlar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {friends.map(friend => (
              <Link key={friend.id} href={`/profil/${friend.username}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ backgroundColor: '#fff', borderRadius: 20, padding: '22px', border: '1px solid #F0F0F0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E0E0E0'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#F0F0F0'; el.style.boxShadow = 'none' }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><User size={26} /></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 }}>{friend.fullName}</div>
                  <div style={{ fontSize: 12, color: '#bbb', marginBottom: 10 }}>@{friend.username}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: friend.tier.color, backgroundColor: friend.tier.color + '15', padding: '4px 12px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><SportIcon name={friend.tier.icon} size={12} color={friend.tier.color} /> {friend.tier.name}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Ana spor: {friend.topSports[0]?.name}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* İstatistik */}
        {activeTab === 'istatistik' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Toplam Ders', value: user.stats.totalLessons, icon: <BookOpen size={32} />, color: '#8B5CF6' },
              { label: 'Bu Ay', value: user.stats.thisMonth, icon: <Calendar size={32} />, color: '#3B82F6' },
              { label: 'Günlük Seri', value: user.stats.streak, icon: <Flame size={32} />, color: '#EF4444' },
              { label: 'İptal Yok', value: user.stats.noCancel, icon: <Dumbbell size={32} />, color: '#10B981' },
              { label: 'Favori Salon', value: user.stats.sameVenue, icon: <Heart size={32} />, color: '#EC4899' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 20px', border: '1px solid #F0F0F0', textAlign: 'center' }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
