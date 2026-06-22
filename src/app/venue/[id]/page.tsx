'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { mockVenues, mockClasses, mockInstructors } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { MapPin, Calendar, User, Star, Clock, Timer, Flame, Bookmark } from 'lucide-react'
import { SportIconBox } from '@/lib/sportIcons'
import { api } from '@/lib/api'
import { SkeletonVenuePage } from '@/components/Skeleton'

export default function VenuePage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [venue, setVenue] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dersler' | 'hocalar' | 'yorumlar'>('dersler')
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', isAnonymous: true })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [userBookings, setUserBookings] = useState<any[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    api.getVenueById(id).then((data: any) => {
      if (data?.venue) {
        setVenue(data.venue)
      } else {
        // fall back to mock
        const mock = mockVenues.find(v => v.id === id) || mockVenues[0]
        setVenue({ _isMock: true, ...mock })
      }
    }).catch(() => {
      const mock = mockVenues.find(v => v.id === id) || mockVenues[0]
      setVenue({ _isMock: true, ...mock })
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!venue?.id || venue._isMock) return
    const token = localStorage.getItem('fitpass_token')
    if (!token) return
    fetch(`${API_URL}/api/favorites/status/${venue.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setIsFavorite(d.isFavorite || false))
  }, [venue])

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('fitpass_token')
    if (!token) { router.push(`/giris?redirect=/venue/${id}`); return }
    setFavLoading(true)
    const method = isFavorite ? 'DELETE' : 'POST'
    const res = await fetch(`${API_URL}/api/favorites/${venue.id}`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setIsFavorite(!isFavorite)
    setFavLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'yorumlar' && venue?.id && !venue._isMock) {
      setReviewsLoading(true)
      fetch(`${API_URL}/api/reviews/venue/${venue.id}`)
        .then(r => r.json())
        .then(d => setReviews(d.reviews || []))
        .finally(() => setReviewsLoading(false))

      const token = localStorage.getItem('fitpass_token')
      if (token) {
        fetch(`${API_URL}/api/auth/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
          const venueBookings = (d.bookings || []).filter((b: any) =>
            b.session?.class?.venueId === venue.id && b.status === 'confirmed'
          )
          setUserBookings(venueBookings)
        })
      }
    }
  }, [activeTab, venue])

  const handleSubmitReview = async (bookingId: number) => {
    setReviewSubmitting(true)
    setReviewError('')
    const token = localStorage.getItem('fitpass_token')
    if (!token) { setReviewError('Giriş yapmanız gerekiyor.'); setReviewSubmitting(false); return }

    const res = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bookingId, ...reviewForm })
    })
    const data = await res.json()
    setReviewSubmitting(false)
    if (data.error) { setReviewError(data.error); return }
    setReviewSuccess('Yorumunuz eklendi!')
    setShowReviewForm(false)
    fetch(`${API_URL}/api/reviews/venue/${venue.id}`)
      .then(r => r.json())
      .then(d => {
        const updatedReviews = d.reviews || []
        setReviews(updatedReviews)
        // Update local avgRating
        if (updatedReviews.length > 0) {
          const avg = updatedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / updatedReviews.length
          setVenue((prev: any) => prev ? { ...prev, avgRating: Math.round(avg * 10) / 10, totalReviews: updatedReviews.length } : prev)
        }
      })
  }

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Navbar />
        <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
          <SkeletonVenuePage />
        </div>
      </div>
    )
  }

  if (!venue) return null

  // Derived values — handle both real and mock shapes
  const isMock = venue._isMock
  const name = venue.name
  const address = venue.address
  const avgRating = venue.avgRating ?? 0
  const totalReviews = venue.totalReviews ?? 0
  const neighborhoodName = isMock ? venue.neighborhood : (venue.neighborhood?.name ?? '')
  const isVerified = isMock ? venue.isVerified : (venue.isApproved ?? false)
  const description = venue.description ?? ''
  const amenities: string[] = isMock ? (venue.amenities ?? []) : []

  // Real data arrays
  const classes: any[] = isMock ? mockClasses.filter((c: any) => c.venueId === (mockVenues.find(v => v.id === id) || mockVenues[0]).id) : (venue.classes ?? [])
  const instructors: any[] = isMock
    ? mockInstructors.filter((i: any) => (mockVenues.find(v => v.id === id) || mockVenues[0]).instructorIds?.includes(i.id))
    : (venue.instructors ?? [])
  const sportCategories: any[] = isMock ? [] : (venue.sportCategories ?? [])

  // Hero color — use first sport category color or fallback
  const heroColor = isMock
    ? venue.color
    : (sportCategories[0]?.sportCategory?.colorHex ? `#${sportCategories[0].sportCategory.colorHex}` : '#4F46E5')
  const heroIcon = isMock
    ? venue.coverEmoji
    : (sportCategories[0]?.sportCategory?.iconUrl ?? 'strength')

  const tabs: { key: 'dersler' | 'hocalar' | 'yorumlar'; label: ReactNode; count: number }[] = [
    { key: 'dersler', label: <><Calendar size={15} style={{ marginRight: 6 }} />Dersler</>, count: classes.length },
    { key: 'hocalar', label: <><User size={15} style={{ marginRight: 6 }} />Hocalar</>, count: instructors.length },
    { key: 'yorumlar', label: <><Star size={15} style={{ marginRight: 6 }} />Yorumlar</>, count: totalReviews },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 28 }}>
          ← Tüm dersler
        </Link>

        {/* Hero kartı */}
        <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0', marginBottom: 20 }}>
          {/* Fotoğraf Galerisi */}
          {(() => {
            const rawImgs: string[] = !venue._isMock && Array.isArray(venue.images)
              ? venue.images
              : (!venue._isMock && typeof venue.images === 'string' ? JSON.parse(venue.images || '[]') : [])
            const allImgs: string[] = venue.coverImageUrl
              ? [venue.coverImageUrl, ...rawImgs.filter((u: string) => u !== venue.coverImageUrl)]
              : rawImgs
            const mainImg = activeImage ?? (allImgs[0] ?? null)
            const thumbs = allImgs.slice(0, 5)

            return (
              <div>
                {/* Ana görsel */}
                <div style={{
                  height: 260,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: mainImg
                    ? `url(${mainImg}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${heroColor} 0%, ${heroColor}88 100%)`
                }}>
                  {!mainImg && <SportIconBox name={heroIcon} bgColor="rgba(255,255,255,0.2)" iconColor="#fff" boxSize={100} borderRadius={28} size={52} />}
                  {/* Görsel sayısı rozeti */}
                  {allImgs.length > 1 && (
                    <div style={{
                      position: 'absolute', bottom: 12, right: 14,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      fontSize: 12, fontWeight: 700, borderRadius: 100,
                      padding: '4px 10px', backdropFilter: 'blur(4px)'
                    }}>
                      {allImgs.indexOf(mainImg!) + 1} / {allImgs.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail şeridi */}
                {thumbs.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, padding: '10px 16px', backgroundColor: '#F9F9F9', borderBottom: '1px solid #F0F0F0', overflowX: 'auto' }}>
                    {thumbs.map((img, i) => {
                      const isActive = (mainImg === img) || (mainImg === null && i === 0)
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveImage(img)}
                          style={{
                            flexShrink: 0,
                            width: 72,
                            height: 52,
                            borderRadius: 10,
                            overflow: 'hidden',
                            padding: 0,
                            border: isActive ? '2.5px solid #4F46E5' : '2.5px solid transparent',
                            cursor: 'pointer',
                            background: 'none',
                            outline: 'none',
                            opacity: isActive ? 1 : 0.72,
                            transition: 'border-color 0.15s, opacity 0.15s'
                          }}
                        >
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{name}</h1>
                  {isVerified && (
                    <span style={{ fontSize: 12, backgroundColor: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>✓ Onaylı</span>
                  )}
                </div>
                {isMock && <p style={{ fontSize: 14, color: '#888', marginBottom: 10, fontWeight: 500 }}>{venue.category}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {venue.avgRating ?? avgRating}</span>
                  <span style={{ fontSize: 13, color: '#999' }}>({venue.totalReviews ?? totalReviews} değerlendirme)</span>
                  {neighborhoodName && (
                    <>
                      <span style={{ fontSize: 13, color: '#bbb' }}>·</span>
                      <span style={{ fontSize: 13, color: '#888', display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {neighborhoodName}</span>
                    </>
                  )}
                </div>
              </div>
              {!isMock && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 12,
                    border: isFavorite ? 'none' : '1.5px solid #e5e5e5',
                    background: isFavorite ? '#FEF2F2' : '#fff',
                    color: isFavorite ? '#DC2626' : '#666',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Bookmark size={15} color={isFavorite ? '#DC2626' : '#666'} fill={isFavorite ? '#DC2626' : 'none'} />
                  {isFavorite ? 'Favoride' : 'Favoriye Ekle'}
                </button>
              )}
            </div>

            {description && (
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginTop: 20, maxWidth: 680 }}>{description}</p>
            )}

            {/* Sport pills from real data */}
            {sportCategories.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sportCategories.map((sc: any, i: number) => {
                  const cat = sc.sportCategory
                  const color = cat?.colorHex ? `#${cat.colorHex}` : '#4F46E5'
                  return (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: color + '15', color: color, borderRadius: 100, fontSize: 13, fontWeight: 600 }}>
                      <SportIconBox name={cat?.iconUrl ?? 'strength'} bgColor="transparent" iconColor={color} boxSize={18} borderRadius={4} size={14} />
                      {cat?.name}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Amenities for mock */}
            {amenities.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {amenities.map((a, i) => (
                  <span key={i} style={{ padding: '7px 16px', backgroundColor: '#F5F5F5', color: '#555', borderRadius: 100, fontSize: 13, fontWeight: 500 }}>✓ {a}</span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', backgroundColor: '#FAFAFA', borderRadius: 12, fontSize: 13, color: '#666', border: '1px solid #F0F0F0' }}>
              <MapPin size={14} /> {address}
            </div>
          </div>


          {/* Stats satırı */}
          <div style={{ borderTop: '1px solid #F5F5F5', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Aktif Ders', value: classes.length, icon: <Calendar size={20} /> },
              { label: 'Eğitmen', value: instructors.length, icon: <User size={20} /> },
              { label: 'Değerlendirme', value: totalReviews, icon: <Star size={20} /> },
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
        <div className="profile-tabs" style={{ backgroundColor: '#fff', borderRadius: 16, padding: '4px', border: '1px solid #F0F0F0', display: 'inline-flex', gap: 2, marginBottom: 20 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="profile-tab-item"
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
            {isMock ? (
              // Mock class cards
              classes.map((cls: any) => (
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
              ))
            ) : (
              // Real class cards
              classes.map((cls: any) => {
                const cat = cls.sportCategory
                const color = cat?.colorHex ? `#${cat.colorHex}` : '#4F46E5'
                const iconName = cat?.iconUrl ?? 'strength'
                const nextSession = cls.sessions?.[0]
                const nextSessionDate = nextSession?.startsAt ? new Date(nextSession.startsAt) : null
                const nextSessionStr = nextSessionDate
                  ? nextSessionDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' ' + nextSessionDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                  : null
                const availableSpots = nextSession?.availableSpots ?? null

                return (
                  <div
                    key={cls.id}
                    style={{ backgroundColor: '#fff', borderRadius: 18, padding: '20px 24px', border: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default', transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E0E0E0'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#F0F0F0'; el.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <SportIconBox name={iconName} bgColor={color + '18'} iconColor={color} boxSize={54} borderRadius={16} size={24} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>{cls.title}</div>
                        <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Timer size={13} /> {cls.durationMinutes} dk
                          {cls.instructor && <><span style={{ color: '#ccc' }}>·</span><User size={13} /> {cls.instructor.fullName}</>}
                        </div>
                        {nextSessionStr && (
                          <div style={{ fontSize: 12, color: '#4F46E5', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> Sonraki: {nextSessionStr}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4 }}>₺{cls.basePrice}</div>
                      {availableSpots !== null && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: availableSpots <= 3 ? '#EF4444' : '#10B981', backgroundColor: availableSpots <= 3 ? '#FEF2F2' : '#F0FDF4', padding: '3px 10px', borderRadius: 100 }}>
                          {availableSpots <= 3 ? <><Flame size={12} /> Son {availableSpots} yer</> : `${availableSpots} yer kaldı`}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
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
            {isMock ? (
              instructors.map((instructor: any) => (
                <Link key={instructor.id} href={`/instructor/${instructor.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
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
                </Link>
              ))
            ) : (
              instructors.map((instructor: any) => (
                <Link key={instructor.id} href={`/instructor/${instructor.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #F0F0F0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E0E0E0'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#F0F0F0'; el.style.boxShadow = 'none' }}
                  >
                    {instructor.avatarUrl ? (
                      <img src={instructor.avatarUrl} style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover', margin: '0 auto 16px', display: 'block' }} alt="" />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><User size={32} color="#4F46E5" /></div>
                    )}
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 }}>{instructor.fullName}</div>
                    {instructor.specialty && <div style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', padding: '3px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 10 }}>{instructor.specialty}</div>}
                    {instructor.bio && <div style={{ fontSize: 13, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>{instructor.bio}</div>}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                      {instructor.avgRating != null && <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>★ {instructor.avgRating}</span>}
                      {instructor.totalReviews != null && <><span style={{ fontSize: 13, color: '#bbb' }}>·</span><span style={{ fontSize: 13, color: '#999' }}>{instructor.totalReviews} yorum</span></>}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Yorumlar */}
        {activeTab === 'yorumlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Rating summary */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', border: '1px solid #F0F0F0', display: 'flex', gap: 32, alignItems: 'center' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#111', lineHeight: 1 }}>{avgRating}</div>
                <div style={{ color: '#F59E0B', fontSize: 18, margin: '8px 0 4px' }}>★★★★★</div>
                <div style={{ fontSize: 12, color: '#999' }}>{totalReviews} değerlendirme</div>
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

            {/* Review form trigger */}
            {!venue._isMock && userBookings.length > 0 && !reviewSuccess && (
              <div style={{ backgroundColor: '#EEF2FF', borderRadius: 16, padding: '16px 20px' }}>
                {!showReviewForm ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#4F46E5', fontWeight: 600 }}>Bu salona katıldınız — yorum bırakın!</span>
                    <button onClick={() => setShowReviewForm(true)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Yorum Yaz</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>Puanınız</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setReviewForm(f => ({...f, rating: n}))} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: reviewForm.rating >= n ? '#F59E0B' : '#e5e5e5', fontSize: 18, cursor: 'pointer' }}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Yorumunuz (opsiyonel)</div>
                      <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))} placeholder="Deneyiminizi paylaşın..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666', cursor: 'pointer' }}>
                      <input type="checkbox" checked={reviewForm.isAnonymous} onChange={e => setReviewForm(f => ({...f, isAnonymous: e.target.checked}))} />
                      Anonim olarak paylaş
                    </label>
                    {reviewError && <div style={{ color: '#DC2626', fontSize: 13 }}>{reviewError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setShowReviewForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #eee', background: '#fff', fontSize: 13, cursor: 'pointer' }}>İptal</button>
                      <button onClick={() => handleSubmitReview(userBookings[0].id)} disabled={reviewSubmitting} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        {reviewSubmitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {reviewSuccess && (
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#16a34a', fontWeight: 600 }}>✓ {reviewSuccess}</div>
            )}

            {/* Real reviews */}
            {!venue._isMock && (
              reviewsLoading ? (
                <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>Yorumlar yükleniyor...</div>
              ) : reviews.length === 0 ? (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '32px', textAlign: 'center', color: '#aaa', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  Henüz yorum yok. İlk yorumu siz yazın!
                </div>
              ) : reviews.map((r: any) => (
                <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#4F46E5' }}>
                        {r.isAnonymous ? '?' : (r.reviewer?.fullName?.[0] || '?')}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                          {r.isAnonymous ? 'Anonim Kullanıcı' : (r.reviewer?.fullName || 'Kullanıcı')}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ fontSize: 16, color: n <= r.rating ? '#F59E0B' : '#e5e5e5' }}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                  {r.venueReply && (
                    <div style={{ marginTop: 14, backgroundColor: '#F5F3FF', borderRadius: 12, padding: '12px 16px', borderLeft: '3px solid #4F46E5' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', marginBottom: 6 }}>Salon Yanıtı</div>
                      <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{r.venueReply}</p>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Mock reviews fallback */}
            {venue._isMock && [
              { id: 1, rating: 5, comment: 'Muhteşem bir mekan, hocaları çok profesyonel.', date: '3 gün önce' },
              { id: 2, rating: 5, comment: 'Temizlik ve konfor açısından İstanbul\'un en iyisi.', date: '1 hafta önce' },
              { id: 3, rating: 4, comment: 'Dersler çok kaliteli, fiyatlar biraz yüksek ama değer.', date: '2 hafta önce' },
            ].map(r => (
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
