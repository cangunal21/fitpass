'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockVenues, mockClasses, mockInstructors } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { MapPin, Calendar, User, Star, Clock, Timer, Flame } from 'lucide-react'
import { SportIconBox } from '@/lib/sportIcons'

export default function VenuePage() {
  const params = useParams()
  const venue = mockVenues.find(v => v.id === Number(params.id)) || mockVenues[0]
  const classes = mockClasses.filter(c => c.venueId === venue.id)
  const instructors = mockInstructors.filter(i => venue.instructorIds.includes(i.id))
  const [activeTab, setActiveTab] = useState<'dersler' | 'hocalar' | 'yorumlar'>('dersler')

  const mockReviews = [
    { id: 1, rating: 5, comment: 'Muhteşem bir mekan, hocaları çok profesyonel.', date: '3 gün önce' },
    { id: 2, rating: 5, comment: 'Temizlik ve konfor açısından İstanbul\'un en iyisi.', date: '1 hafta önce' },
    { id: 3, rating: 4, comment: 'Dersler çok kaliteli, fiyatlar biraz yüksek ama değer.', date: '2 hafta önce' },
  ]

  const tabs: { key: 'dersler' | 'hocalar' | 'yorumlar'; label: ReactNode; count: number }[] = [
    { key: 'dersler', label: <><Calendar size={15} style={{ marginRight: 6 }} />Dersler</>, count: classes.length },
    { key: 'hocalar', label: <><User size={15} style={{ marginRight: 6 }} />Hocalar</>, count: instructors.length },
    { key: 'yorumlar', label: <><Star size={15} style={{ marginRight: 6 }} />Yorumlar</>, count: venue.totalReviews },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 28 }}>
          ← Tüm dersler
        </Link>

        {/* Hero kartı */}
        <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0', marginBottom: 20 }}>
          <div style={{ background: `linear-gradient(135deg, ${venue.color} 0%, ${venue.color}88 100%)`, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SportIconBox name={venue.coverEmoji} bgColor="rgba(255,255,255,0.2)" iconColor="#fff" boxSize={100} borderRadius={28} size={52} />
          </div>

          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{venue.name}</h1>
                  {venue.isVerified && (
                    <span style={{ fontSize: 12, backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>✓ Onaylı</span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 10, fontWeight: 500 }}>{venue.category}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {venue.avgRating}</span>
                  <span style={{ fontSize: 13, color: '#999' }}>({venue.totalReviews} değerlendirme)</span>
                  <span style={{ fontSize: 13, color: '#bbb' }}>·</span>
                  <span style={{ fontSize: 13, color: '#888', display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {venue.neighborhood}</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginTop: 20, maxWidth: 680 }}>{venue.description}</p>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {venue.amenities.map((a, i) => (
                <span key={i} style={{ padding: '7px 16px', backgroundColor: '#F5F5F5', color: '#555', borderRadius: 100, fontSize: 13, fontWeight: 500 }}>✓ {a}</span>
              ))}
            </div>

            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', backgroundColor: '#FAFAFA', borderRadius: 12, fontSize: 13, color: '#666', border: '1px solid #F0F0F0' }}>
              <MapPin size={14} /> {venue.address}
            </div>
          </div>

          {/* Stats satırı */}
          <div style={{ borderTop: '1px solid #F5F5F5', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Aktif Ders', value: classes.length, icon: <Calendar size={20} /> },
              { label: 'Eğitmen', value: instructors.length, icon: <User size={20} /> },
              { label: 'Değerlendirme', value: venue.totalReviews, icon: <Star size={20} /> },
            ].map((s, i) => (
              <div key={i} style={{ padding: '18px 12px', textAlign: 'center', borderRight: i < 2 ? '1px solid #F5F5F5' : 'none' }}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '4px', border: '1px solid #F0F0F0', display: 'inline-flex', gap: 2, marginBottom: 20 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#4F46E5' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#fff' : '#888', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {tab.label}
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Dersler */}
        {activeTab === 'dersler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classes.length === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Calendar size={40} /></div>
                <p style={{ color: '#999', fontSize: 15 }}>Bu salonda henüz ders yok.</p>
              </div>
            )}
            {classes.map(cls => (
              <Link key={cls.id} href={`/ders/${cls.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ backgroundColor: '#fff', borderRadius: 18, padding: '20px 24px', border: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E0E0E0'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#F0F0F0'; el.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <SportIconBox name={cls.icon} bgColor={cls.color + '18'} iconColor={cls.color} boxSize={54} borderRadius={16} size={24} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>{cls.title}</div>
                      <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {cls.time} · <Timer size={13} /> {cls.duration}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4 }}>₺{cls.basePrice}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: cls.spots <= 3 ? '#EF4444' : '#10B981', backgroundColor: cls.spots <= 3 ? '#FEF2F2' : '#F0FDF4', padding: '3px 10px', borderRadius: 100 }}>
                      {cls.spots <= 3 ? <><Flame size={12} /> Son {cls.spots} yer</> : `${cls.spots} yer kaldı`}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Hocalar */}
        {activeTab === 'hocalar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {instructors.length === 0 && (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0', gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><User size={40} /></div>
                <p style={{ color: '#999', fontSize: 15 }}>Bu salonda kayıtlı hoca yok.</p>
              </div>
            )}
            {instructors.map(instructor => (
              <div
                key={instructor.id}
                style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #F0F0F0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E0E0E0'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#F0F0F0'; el.style.boxShadow = 'none' }}
              >
                <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}><SportIconBox name={instructor.icon} bgColor={instructor.color + '30'} iconColor={instructor.color} boxSize={72} borderRadius={36} size={32} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 }}>{instructor.fullName}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', padding: '3px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 10 }}>{instructor.specialty}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>★ {instructor.avgRating}</span>
                  <span style={{ fontSize: 13, color: '#bbb' }}>·</span>
                  <span style={{ fontSize: 13, color: '#999' }}>{instructor.totalReviews} yorum</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Yorumlar */}
        {activeTab === 'yorumlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', border: '1px solid #F0F0F0', display: 'flex', gap: 32, alignItems: 'center' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#111', lineHeight: 1 }}>{venue.avgRating}</div>
                <div style={{ color: '#F59E0B', fontSize: 18, margin: '8px 0 4px' }}>★★★★★</div>
                <div style={{ fontSize: 12, color: '#999' }}>{venue.totalReviews} değerlendirme</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#888', width: 12, textAlign: 'right' }}>{star}</span>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 100 }}>
                      <div style={{ height: '100%', backgroundColor: '#F59E0B', borderRadius: 100, width: star === 5 ? '75%' : star === 4 ? '18%' : '5%', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {mockReviews.map(r => (
              <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '22px 28px', border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E530, #6366F120)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Anonim Kullanıcı</div>
                      <div style={{ fontSize: 12, color: '#bbb', marginTop: 1 }}>{r.date}</div>
                    </div>
                  </div>
                  <div style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700 }}>{'★'.repeat(r.rating)}</div>
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
