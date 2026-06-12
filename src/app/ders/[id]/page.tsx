'use client'

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockClasses, mockVenues, mockInstructors } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { getToken, getUser } from '@/lib/api'

export default function DersDetay() {
  const params = useParams()
  const cls = mockClasses.find(c => c.id === Number(params.id)) || mockClasses[0]
  const venue = mockVenues.find(v => v.id === cls.venueId)!
  const instructor = mockInstructors.find(i => i.id === cls.instructorId)
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>← Geri Dön</Link>

          <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ background: cls.color + '18', padding: '28px 28px 24px', borderBottom: '1px solid ' + cls.color + '22' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>{cls.icon}</div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{cls.title}</h1>
                  <Link href={`/venue/${venue.id}`} style={{ fontSize: 15, color: '#FF385C', textDecoration: 'none', fontWeight: 600 }}>{venue.name}</Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {cls.rating}</span>
                    <span style={{ fontSize: 13, color: '#999' }}>({cls.totalReviews} değerlendirme)</span>
                    <span style={{ fontSize: 13, color: '#999' }}>· 📍 {cls.neighborhood}</span>
                  </div>
                </div>
                <div style={{ background: cls.color, color: '#fff', borderRadius: 14, padding: '10px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>₺{cls.basePrice}</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>kişi başı</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 28px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Tarih', value: `📅 ${cls.date}` },
                { label: 'Saat', value: `🕐 ${cls.time}` },
                { label: 'Süre', value: `⏱ ${cls.duration}` },
                { label: 'Kapasite', value: `🪑 ${cls.spots} yer kaldı / ${cls.capacity}` },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: item.label === 'Kapasite' && cls.spots <= 3 ? '#EF4444' : '#1a1a1a' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Ders Hakkında</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{cls.description}</p>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginTop: 20, marginBottom: 12 }}>Dahil Olanlar</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cls.amenities.map((a, i) => (
                <span key={i} style={{ padding: '6px 14px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>✓ {a}</span>
              ))}
            </div>
          </div>

          {instructor && (
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Eğitmen</h2>
              <Link href={`/instructor/${instructor.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: instructor.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{instructor.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#FF385C', marginBottom: 2 }}>{instructor.fullName}</div>
                    <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 6 }}>★ {instructor.avgRating} · {instructor.totalReviews} değerlendirme</div>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{instructor.specialty}</div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{instructor.bio}</p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Salon</h2>
            <Link href={`/venue/${venue.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', backgroundColor: '#f9f9f9', borderRadius: 14, cursor: 'pointer' }}>
                <div style={{ fontSize: 32, width: 52, height: 52, background: venue.color + '20', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{venue.coverEmoji}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FF385C' }}>{venue.name}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>📍 {venue.address}</div>
                  <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>★ {venue.avgRating} · {venue.totalReviews} değerlendirme</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>₺{cls.basePrice}<span style={{ fontSize: 14, fontWeight: 400, color: '#999' }}> / kişi</span></div>
            <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 20 }}>★ {cls.rating} · {cls.totalReviews} değerlendirme</div>
            <div style={{ backgroundColor: '#f9f9f9', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#555' }}>📅 Tarih</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{cls.date}</span>
              </div>
              <div style={{ height: 1, backgroundColor: '#eee', marginBottom: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#555' }}>🕐 Saat</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{cls.time}</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#555' }}>Ders ücreti</span>
                <span style={{ fontSize: 13 }}>₺{cls.basePrice}</span>
              </div>
              <div style={{ height: 1, backgroundColor: '#eee', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Toplam</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>₺{cls.basePrice}</span>
              </div>
            </div>
            <button onClick={() => setShowBooking(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Rezervasyon Yap</button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>🔒 12 saat öncesine kadar %50 iade garantisi</p>
            {cls.spots <= 3 && (
              <div style={{ marginTop: 12, padding: '12px 14px', backgroundColor: '#fff9f0', borderRadius: 12, border: '1px solid #fed7aa' }}>
                <p style={{ fontSize: 12, color: '#92400e', textAlign: 'center' }}>🔥 Son <strong>{cls.spots} yer</strong> kaldı!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBooking && <BookingModal cls={cls} onClose={() => setShowBooking(false)} />}
    </div>
  )
}

function BookingModal({ cls, onClose }: { cls: typeof mockClasses[0], onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    const token = getToken()
    const user = getUser()

    if (!token || !user) {
      setError('Rezervasyon yapmak için giriş yapmalısın.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // MVP: rezervasyonu localStorage'a kaydet (backend session entegrasyonu sonra)
      const booking = {
        id: Date.now(),
        classId: cls.id,
        classTitle: cls.title,
        classIcon: cls.icon,
        date: cls.date,
        time: cls.time,
        price: cls.basePrice,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }
      const existing = JSON.parse(localStorage.getItem('fitpass_bookings') || '[]')
      localStorage.setItem('fitpass_bookings', JSON.stringify([booking, ...existing]))
      setStep(2)
    } catch {
      setError('Bir hata oluştu, tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>×</button>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Rezervasyonu Onayla</h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Ders detaylarını kontrol et</p>
            <div style={{ backgroundColor: '#f9f9f9', borderRadius: 16, padding: '18px', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 32 }}>{cls.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{cls.title}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{cls.date} · {cls.time}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Toplam</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FF385C' }}>₺{cls.basePrice}</span>
              </div>
            </div>
            <div style={{ backgroundColor: '#FFF9F0', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#92400e' }}>
              🔒 12 saat öncesine kadar %50 iade garantisi
            </div>
            {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>⚠️ {error}</div>}
            <button onClick={handleConfirm} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'İşleniyor...' : 'Rezervasyonu Onayla ✓'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Rezervasyon Tamam!</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}><strong>{cls.title}</strong> dersine başarıyla kayıt oldun. Seni bekliyoruz!</p>
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#FF385C', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Harika! 🚀</button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a' }
