'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockVenues, mockClasses, mockInstructors } from '@/lib/mockData'

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#FF385C', letterSpacing: -0.5, textDecoration: 'none' }}>fitpass</Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Giriş Yap</Link>
          <Link href="/kayit" style={{ padding: '8px 18px', borderRadius: 24, border: 'none', background: '#FF385C', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Kayıt Ol</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 20 }}>← Geri Dön</Link>

        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ background: `linear-gradient(135deg, ${venue.color} 0%, ${venue.color}88 100%)`, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 72 }}>{venue.coverEmoji}</div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>{venue.name}</h1>
                  {venue.isVerified && <span style={{ fontSize: 12, backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>✓ Onaylı</span>}
                </div>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{venue.category}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {venue.avgRating}</span>
                  <span style={{ fontSize: 13, color: '#999' }}>({venue.totalReviews} değerlendirme)</span>
                  <span style={{ fontSize: 13, color: '#999' }}>· 📍 {venue.neighborhood}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginTop: 16 }}>{venue.description}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {venue.amenities.map((a, i) => <span key={i} style={{ padding: '6px 14px', backgroundColor: '#f5f5f5', color: '#555', borderRadius: 20, fontSize: 13 }}>✓ {a}</span>)}
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#fafafa', borderRadius: 12, fontSize: 13, color: '#666' }}>📍 {venue.address}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {(['dersler', 'hocalar', 'yorumlar'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: activeTab === tab ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab ? '#1a1a1a' : '#888', boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab === 'dersler' ? '📅 Dersler' : tab === 'hocalar' ? '👤 Hocalar' : '⭐ Yorumlar'}
            </button>
          ))}
        </div>

        {activeTab === 'dersler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classes.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Bu salonda henüz ders yok.</div>}
            {classes.map(cls => (
              <Link key={cls.id} href={`/ders/${cls.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 32, width: 52, height: 52, background: cls.color + '18', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cls.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{cls.title}</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{cls.time} · {cls.duration}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>₺{cls.basePrice}</div>
                    <div style={{ fontSize: 12, color: cls.spots <= 3 ? '#EF4444' : '#10B981', fontWeight: 600 }}>{cls.spots} yer kaldı</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'hocalar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {instructors.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Bu salonda kayıtlı hoca yok.</div>}
            {instructors.map(instructor => (
              <Link key={instructor.id} href={`/instructor/${instructor.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', textAlign: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
                >
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: instructor.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 14px' }}>{instructor.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FF385C', marginBottom: 4 }}>{instructor.fullName}</div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>{instructor.specialty}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>★ {instructor.avgRating}</span>
                    <span style={{ fontSize: 13, color: '#999' }}>{instructor.totalReviews} yorum</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'yorumlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#1a1a1a' }}>{venue.avgRating}</div>
                <div style={{ color: '#F59E0B', fontSize: 20 }}>★★★★★</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{venue.totalReviews} değerlendirme</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#666', width: 8 }}>{star}</span>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#f0f0f0', borderRadius: 3 }}>
                      <div style={{ height: '100%', backgroundColor: '#F59E0B', borderRadius: 3, width: star === 5 ? '75%' : star === 4 ? '18%' : '5%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {mockReviews.map(r => (
              <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Anonim Kullanıcı</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{r.date}</div>
                    </div>
                  </div>
                  <div style={{ color: '#F59E0B', fontSize: 14 }}>{'★'.repeat(r.rating)}</div>
                </div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
