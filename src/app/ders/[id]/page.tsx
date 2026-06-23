'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { mockClasses, mockVenues, mockInstructors } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { api, getToken, getUser } from '@/lib/api'
import { MapPin, Calendar, Clock, Timer, Users, User, ShieldCheck, Flame, AlertCircle, X } from 'lucide-react'
import { SportIconBox } from '@/lib/sportIcons'

const categoryColorMap: Record<string, string> = {
  'Yoga': '#C4A882', 'Pilates': '#C9849A', 'Boks': '#DC2626',
  'Padel': '#EAB308', 'Halı Saha': '#16A34A', 'Basketbol': '#C2501F',
  'HIIT': '#F97316', 'Dans': '#9333EA', 'Yüzme': '#0891B2', 'Crossfit': '#4B5563',
}

const categoryIconMap: Record<string, string> = {
  'Yoga': 'yoga', 'Pilates': 'pilates', 'Boks': 'boxing',
  'HIIT': 'hiit', 'Halı Saha': 'football', 'Basketbol': 'basketball',
  'Padel': 'padel', 'Dans': 'dance', 'Yüzme': 'swimming', 'Crossfit': 'strength',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSessionToDisplay(session: any) {
  return {
    id: session.id,
    title: session.title,
    venueId: session.venueId,
    venue: session.venueName,
    venueAddress: session.venueAddress || '',
    neighborhood: session.neighborhood,
    category: session.category,
    icon: categoryIconMap[session.category] || 'hiit',
    color: session.categoryColor || categoryColorMap[session.category] || '#4F46E5',
    basePrice: session.basePrice,
    spots: session.availableSpots,
    rating: session.rating || 4.5,
    totalReviews: session.totalReviews || 0,
    time: new Date(session.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    date: new Date(session.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
    duration: `${session.durationMinutes} dk`,
    sessionId: session.id,
    instructorName: session.instructorName || '',
    instructorId: session.instructorId,
    // fields not available from API — provide defaults so card still renders
    description: '',
    amenities: [] as string[],
    isRealSession: true,
  }
}

type DisplayClass = ReturnType<typeof mapSessionToDisplay> | (typeof mockClasses[0] & { sessionId?: number; isRealSession?: boolean })

export default function DersDetay() {
  const params = useParams()
  const [cls, setCls] = useState<DisplayClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      const id = Number(params.id)
      try {
        const result = await api.getSessionById(id)
        if (result?.session) {
          setCls(mapSessionToDisplay(result.session))
          return
        }
      } catch {
        // fall through to mock
      }
      // fallback to mock
      const mock = mockClasses.find(c => c.id === id) || mockClasses[0]
      setCls({ ...mock, isRealSession: false })
      setLoading(false)
    }
    fetchSession().finally(() => setLoading(false))
  }, [params.id])

  if (loading || !cls) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[{ h: 300 }, { h: 160 }, { h: 200 }].map((b, i) => (
            <div key={i} style={{ background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', borderRadius: 24, height: b.h }} />
          ))}
        </div>
      </div>
    )
  }

  const isReal = (cls as { isRealSession?: boolean }).isRealSession

  // For mock data, find venue and instructor from mock arrays
  const venue = !isReal ? mockVenues.find(v => v.id === cls.venueId) || mockVenues[0] : null
  const instructor = !isReal ? mockInstructors.find(i => i.id === (cls as typeof mockClasses[0]).instructorId) : null

  // For real session — instructor name inline, venue info from session
  const venueName = isReal ? (cls as ReturnType<typeof mapSessionToDisplay>).venue : venue?.name || ''
  const venueAddress = isReal ? (cls as ReturnType<typeof mapSessionToDisplay>).venueAddress : venue?.address || ''
  const venueId = cls.venueId

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 28 }}>
          ← Tüm dersler
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          {/* Sol kolon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hero kart */}
            <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
              <div style={{ background: `linear-gradient(135deg, ${cls.color}20 0%, ${cls.color}08 100%)`, padding: '36px 32px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 14 }}><SportIconBox name={cls.icon} bgColor={cls.color + '20'} iconColor={cls.color} boxSize={64} borderRadius={18} size={30} /></div>
                    <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111', marginBottom: 6, letterSpacing: -0.5 }}>{cls.title}</h1>
                    {venueId ? (
                      <Link href={`/venue/${venueId}`} style={{ fontSize: 15, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>{venueName}</Link>
                    ) : (
                      <span style={{ fontSize: 15, color: '#4F46E5', fontWeight: 600 }}>{venueName}</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                      <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {cls.rating}</span>
                      <span style={{ fontSize: 13, color: '#999' }}>({cls.totalReviews} değerlendirme)</span>
                      <span style={{ fontSize: 13, color: '#bbb' }}>·</span>
                      <span style={{ fontSize: 13, color: '#888', display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {cls.neighborhood}</span>
                    </div>
                  </div>
                  <div style={{ background: cls.color, color: '#fff', borderRadius: 16, padding: '14px 20px', textAlign: 'center', flexShrink: 0, marginLeft: 20 }}>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>₺{cls.basePrice}</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>kişi başı</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, borderTop: '1px solid #F5F5F5' }}>
                {[
                  { icon: <Calendar size={18} />, label: 'Tarih', value: cls.date },
                  { icon: <Clock size={18} />, label: 'Saat', value: cls.time },
                  { icon: <Timer size={18} />, label: 'Süre', value: cls.duration },
                  { icon: <Users size={18} />, label: 'Kontenjan', value: `${cls.spots} yer kaldı` },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px 14px', backgroundColor: '#FAFAFA', borderRadius: 12 }}>
                    <div style={{ marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: i === 3 && cls.spots <= 3 ? '#EF4444' : '#111' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Açıklama */}
            {'description' in cls && (cls as typeof mockClasses[0]).description && (
              <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: '28px 32px', border: '1px solid #F0F0F0' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 14 }}>Ders Hakkında</h2>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8 }}>{(cls as typeof mockClasses[0]).description}</p>

                {'amenities' in cls && Array.isArray((cls as typeof mockClasses[0]).amenities) && (cls as typeof mockClasses[0]).amenities.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginTop: 24, marginBottom: 14 }}>Dahil Olanlar</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(cls as typeof mockClasses[0]).amenities.map((a, i) => (
                        <span key={i} style={{ padding: '7px 16px', backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: 100, fontSize: 13, fontWeight: 500 }}>✓ {a}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Eğitmen */}
            {instructor && (
              <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: '28px 32px', border: '1px solid #F0F0F0' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 20 }}>Eğitmen</h2>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <SportIconBox name={instructor.icon} bgColor={instructor.color + '30'} iconColor={instructor.color} boxSize={64} borderRadius={32} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 4 }}>{instructor.fullName}</div>
                    <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 6 }}>★ {instructor.avgRating} · {instructor.totalReviews} değerlendirme</div>
                    <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', padding: '3px 10px', borderRadius: 20, marginBottom: 10 }}>{instructor.specialty}</div>
                    <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{instructor.bio}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Real session instructor (inline) */}
            {isReal && (cls as ReturnType<typeof mapSessionToDisplay>).instructorName && (
              <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: '28px 32px', border: '1px solid #F0F0F0' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>Eğitmen</h2>
                {(cls as ReturnType<typeof mapSessionToDisplay>).instructorId ? (
                  <Link href={`/instructor/${(cls as ReturnType<typeof mapSessionToDisplay>).instructorId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: '#FAFAFA', borderRadius: 14, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FAFAFA'}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="#4F46E5" />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#4F46E5' }}>{(cls as ReturnType<typeof mapSessionToDisplay>).instructorName}</div>
                    </div>
                  </Link>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{(cls as ReturnType<typeof mapSessionToDisplay>).instructorName}</div>
                )}
              </div>
            )}

            {/* Salon */}
            <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: '28px 32px', border: '1px solid #F0F0F0' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>Salon</h2>
              {venue ? (
                <Link href={`/venue/${venue.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', backgroundColor: '#FAFAFA', borderRadius: 16, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F5F5F5'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FAFAFA'}
                  >
                    <SportIconBox name={venue.coverEmoji} bgColor={venue.color + '20'} iconColor={venue.color} boxSize={56} borderRadius={16} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#4F46E5' }}>{venue.name}</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {venue.address}</div>
                      <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginTop: 4 }}>★ {venue.avgRating} · {venue.totalReviews} değerlendirme</div>
                    </div>
                    <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  </div>
                </Link>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#FAFAFA', borderRadius: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#4F46E5' }}>{venueName}</div>
                  {venueAddress && <div style={{ fontSize: 13, color: '#888', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {venueAddress}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Sağ sticky panel */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: '28px', border: '1px solid #F0F0F0', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>₺{cls.basePrice}</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: '#999', marginLeft: 4 }}> / kişi</span>
                <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, marginTop: 4 }}>★ {cls.rating} · {cls.totalReviews} değerlendirme</div>
              </div>

              <div style={{ backgroundColor: '#FAFAFA', borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: '1px solid #F0F0F0' }}>
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#666', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={16} /> Tarih</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{cls.date}</span>
                </div>
                <div style={{ height: 1, backgroundColor: '#F0F0F0' }} />
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#666', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={16} /> Saat</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{cls.time}</span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: '#555' }}>Ders ücreti</span>
                  <span style={{ fontSize: 14, color: '#111' }}>₺{cls.basePrice}</span>
                </div>
                <div style={{ height: 1, backgroundColor: '#F0F0F0', margin: '14px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Toplam</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>₺{cls.basePrice}</span>
                </div>
              </div>

              <button
                onClick={() => { if (cls.spots > 0) setShowBooking(true) }}
                disabled={cls.spots === 0}
                style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: cls.spots === 0 ? '#D1D5DB' : '#4F46E5', color: cls.spots === 0 ? '#9CA3AF' : '#fff', fontSize: 15, fontWeight: 700, cursor: cls.spots === 0 ? 'not-allowed' : 'pointer', marginBottom: 14, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (cls.spots > 0) (e.currentTarget as HTMLButtonElement).style.background = '#4338CA' }}
                onMouseLeave={e => { if (cls.spots > 0) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5' }}
              >
                {cls.spots === 0 ? 'Seans Dolu' : 'Rezervasyon Yap'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ShieldCheck size={14} /> 12 saat öncesine kadar ücretsiz iptal</p>

              {cls.spots <= 3 && (
                <div style={{ marginTop: 14, padding: '12px 14px', backgroundColor: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA' }}>
                  <p style={{ fontSize: 12, color: '#92400E', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Flame size={12} /> Son <strong>{cls.spots} yer</strong> kaldı!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBooking && <BookingModal cls={cls} onClose={() => setShowBooking(false)} />}
    </div>
  )
}

function BookingModal({ cls, onClose }: { cls: DisplayClass, onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [cashbackEarned, setCashbackEarned] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [groupSize, setGroupSize] = useState(1)
  const [tagInputs, setTagInputs] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<Record<number, any[]>>({})
  const [tagFocus, setTagFocus] = useState<number | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState<{ checking: boolean; valid?: boolean; discountType?: string; discountValue?: number; error?: string }>({ checking: false })

  const sessionId = (cls as { sessionId?: number }).sessionId
  const venueId = (cls as { venueId?: number }).venueId

  const handleCheckCoupon = async () => {
    const code = couponCode.trim()
    if (!code || !venueId) return
    setCouponStatus({ checking: true })
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/public/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, venueId }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setCouponStatus({ checking: false, valid: false, error: data?.error || 'Geçersiz kupon kodu.' })
      } else {
        setCouponStatus({ checking: false, valid: true, discountType: data.coupon.discountType, discountValue: data.coupon.discountValue })
      }
    } catch {
      setCouponStatus({ checking: false, valid: false, error: 'Bir hata oluştu, tekrar dene.' })
    }
  }

  const totalBeforeDiscount = (cls.basePrice || 0) * groupSize
  const couponDiscountAmount = couponStatus.valid
    ? (couponStatus.discountType === 'percent' ? totalBeforeDiscount * ((couponStatus.discountValue || 0) / 100) : Math.min(couponStatus.discountValue || 0, totalBeforeDiscount))
    : 0
  const totalAfterDiscount = Math.max(0, totalBeforeDiscount - couponDiscountAmount)

  const searchUsers = async (idx: number, q: string) => {
    const clean = q.replace(/^@/, '').trim()
    if (clean.length < 2) { setTagSuggestions(s => ({ ...s, [idx]: [] })); return }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/public/users-search?q=${encodeURIComponent(clean)}`)
    const data = await res.json()
    setTagSuggestions(s => ({ ...s, [idx]: data.users || [] }))
  }

  const handleConfirm = async () => {
    const token = getToken()
    const user = getUser()

    if (!token || !user) {
      router.push('/giris?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    setLoading(true)
    setError('')

    try {
      if (sessionId) {
        // Real API booking
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId, bookingType: 'class', groupSize, taggedUsernames: tagInputs.filter(Boolean), couponCode: couponStatus.valid ? couponCode.trim() : undefined }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || data?.message || 'Bir hata oluştu, tekrar dene.')
          return
        }
        setCashbackEarned(data?.booking?.cashbackEarned || 0)
      } else {
        // Mock fallback — save to localStorage
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
      }
      setStep(2)
    } catch {
      setError('Bir hata oluştu, tekrar dene.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, padding: '32px', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#F5F5F5', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><X size={18} /></button>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 6 }}>Rezervasyonu Onayla</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Ders detaylarını kontrol et ve onayla</p>

            <div style={{ backgroundColor: '#FAFAFA', borderRadius: 18, padding: '20px', marginBottom: 20, border: '1px solid #F0F0F0' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <SportIconBox name={cls.icon} bgColor={cls.color + '20'} iconColor={cls.color} boxSize={56} borderRadius={14} size={26} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{cls.title}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{cls.date} · {cls.time}</div>
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: '#EBEBEB', marginBottom: 14 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: groupSize > 1 ? 12 : 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Kişi Sayısı</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => { setGroupSize(g => Math.max(1, g - 1)); setTagInputs(t => t.slice(0, groupSize - 2)) }} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111', minWidth: 20, textAlign: 'center' }}>{groupSize}</span>
                  <button onClick={() => setGroupSize(g => Math.min(10, g + 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
              {groupSize > 1 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Birlikte gelecek kişileri etiketle (opsiyonel)</div>
                  {Array.from({ length: groupSize - 1 }).map((_, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder={`@kullanıcıadı ${idx + 2}`}
                        value={tagInputs[idx] || ''}
                        onChange={e => {
                          const val = e.target.value
                          setTagInputs(t => { const n = [...t]; n[idx] = val; return n })
                          searchUsers(idx, val)
                        }}
                        onFocus={() => setTagFocus(idx)}
                        onBlur={() => setTimeout(() => setTagFocus(null), 150)}
                        style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                      />
                      {tagFocus === idx && (tagSuggestions[idx] || []).length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                          {(tagSuggestions[idx] || []).map((u: any) => (
                            <button
                              key={u.username}
                              onMouseDown={() => {
                                setTagInputs(t => { const n = [...t]; n[idx] = '@' + u.username; return n })
                                setTagSuggestions(s => ({ ...s, [idx]: [] }))
                              }}
                              style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
                            >
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4F46E5', flexShrink: 0 }}>
                                {u.fullName?.[0] || '?'}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{u.fullName}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>@{u.username}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ height: 1, backgroundColor: '#EBEBEB', marginBottom: 14 }} />

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Kupon kodu (opsiyonel)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="KUPON10"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus({ checking: false }) }}
                    style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={handleCheckCoupon}
                    disabled={!couponCode.trim() || couponStatus.checking}
                    style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#EEF2FF', color: '#4F46E5', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {couponStatus.checking ? '...' : 'Uygula'}
                  </button>
                </div>
                {couponStatus.valid && (
                  <div style={{ fontSize: 12, color: '#15803D', marginTop: 6, fontWeight: 600 }}>
                    ✓ Kupon uygulandı: {couponStatus.discountType === 'percent' ? `%${couponStatus.discountValue}` : `₺${couponStatus.discountValue}`} indirim
                  </div>
                )}
                {couponStatus.valid === false && (
                  <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6, fontWeight: 600 }}>{couponStatus.error}</div>
                )}
              </div>

              <div style={{ height: 1, backgroundColor: '#EBEBEB', marginBottom: 14 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Toplam</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>
                  ₺{totalAfterDiscount}
                  {groupSize > 1 && <span style={{ fontSize: 13, fontWeight: 500, color: '#888', marginLeft: 6 }}>({groupSize} × ₺{cls.basePrice})</span>}
                  {couponDiscountAmount > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: '#aaa', marginLeft: 6, textDecoration: 'line-through' }}>₺{totalBeforeDiscount}</span>}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFF7ED', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={14} /> 12 saat öncesine kadar ücretsiz iptal
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: loading ? '#A5B4FC' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'İşleniyor...' : 'Rezervasyonu Onayla →'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 10 }}>Rezervasyon Tamam!</h2>
            <p style={{ fontSize: 15, color: '#666', marginBottom: cashbackEarned > 0 ? 16 : 28, lineHeight: 1.7 }}>
              <strong>{cls.title}</strong> dersine başarıyla kayıt oldun.<br />Seni bekliyoruz!
            </p>
            {cashbackEarned > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '14px 16px', marginBottom: 24, color: '#15803D', fontSize: 14, fontWeight: 600 }}>
                🎁 ₺{cashbackEarned} cashback kazandın! Kredine eklendi, bir sonraki rezervasyonunda kullanabilirsin.
              </div>
            )}
            <button onClick={onClose} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Harika! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
