'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockInstructors, mockVenues, mockClasses } from '@/lib/mockData'

export default function InstructorPage() {
  const params = useParams()
  const instructor = mockInstructors.find(i => i.id === Number(params.id)) || mockInstructors[0]
  const venue = mockVenues.find(v => v.id === instructor.venueId)!
  const classes = mockClasses.filter(c => c.instructorId === instructor.id)

  const mockReviews = [
    { id: 1, rating: 5, comment: 'Çok ilgili ve profesyonel bir hoca. Kesinlikle tavsiye ederim!', date: '2 gün önce' },
    { id: 2, rating: 5, comment: 'Her dersi çok verimli ve eğlenceli geçiyor.', date: '1 hafta önce' },
    { id: 3, rating: 4, comment: 'Teknik bilgisi çok iyi, motivasyon konusunda da çok başarılı.', date: '2 hafta önce' },
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

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 20 }}>← Geri Dön</Link>

        {/* Profil */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ height: 100, background: `linear-gradient(135deg, ${instructor.color} 0%, ${instructor.color}88 100%)` }} />
          <div style={{ padding: '0 28px 28px' }}>
            <div style={{ marginTop: -40, width: 80, height: 80, borderRadius: '50%', background: instructor.color + '20', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{instructor.icon}</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{instructor.fullName}</h1>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{instructor.specialty}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {instructor.avgRating}</span>
              <span style={{ fontSize: 13, color: '#999' }}>({instructor.totalReviews} değerlendirme)</span>
            </div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>{instructor.bio}</p>
            <Link href={`/venue/${venue.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: 14, cursor: 'pointer' }}>
                <div style={{ fontSize: 24 }}>{venue.coverEmoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF385C' }}>{venue.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>📍 {venue.neighborhood}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Dersler */}
        {classes.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>📅 Verdiği Dersler</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classes.map(cls => (
                <Link key={cls.id} href={`/ders/${cls.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 28, width: 48, height: 48, background: cls.color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cls.icon}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{cls.title}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{cls.time} · {cls.duration}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>₺{cls.basePrice}</div>
                      <div style={{ fontSize: 12, color: cls.spots <= 3 ? '#EF4444' : '#10B981', fontWeight: 600 }}>{cls.spots} yer kaldı</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Yorumlar */}
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>⭐ Değerlendirmeler</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mockReviews.map(r => (
            <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Anonim Kullanıcı</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{r.date}</div>
                  </div>
                </div>
                <div style={{ color: '#F59E0B' }}>{'★'.repeat(r.rating)}</div>
              </div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
