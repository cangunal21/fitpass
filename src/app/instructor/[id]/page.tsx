'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { MapPin, Calendar, Star, User, ChevronLeft } from 'lucide-react'
import { SportIconBox, getIconKeyForCategory, getColorForCategory } from '@/lib/sportIcons'
import { getInitialsAvatar } from '@/lib/cloudinary'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function InstructorPage() {
  const { t } = useT()
  const params = useParams()
  const id = params.id as string
  const [instructor, setInstructor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/public/instructors/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.instructor) setInstructor(d.instructor)
        else setNotFound(true)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {[100, 200, 160].map((w, i) => (
          <div key={i} style={{ height: w, backgroundColor: '#eee', borderRadius: 16, marginBottom: 16, animation: 'shimmer 1.5s infinite', background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%' }} />
        ))}
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{t('inst.notFound')}</h1>
        <Link href="/" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>{t('inst.backHome')}</Link>
      </div>
    </div>
  )

  const initials = getInitialsAvatar(instructor.fullName)
  const classes = instructor.classes || []
  const reviews = instructor.reviews || []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <Link href={instructor.venue ? `/venue/${instructor.venue.id}` : '/'} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 20 }}>
          <ChevronLeft size={16} /> Geri Dön
        </Link>

        {/* Profil kartı */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ height: 100, background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }} />
          <div style={{ padding: '0 28px 28px' }}>
            <div style={{ marginTop: -40, marginBottom: 16 }}>
              {instructor.avatarUrl ? (
                <img src={instructor.avatarUrl} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} alt="" />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: initials.color + '22', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: initials.color, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {initials.initials}
                </div>
              )}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{instructor.fullName}</h1>
            {instructor.specialty && (
              <div style={{ fontSize: 14, color: '#6366F1', fontWeight: 600, marginBottom: 8 }}>{instructor.specialty}</div>
            )}
            {(instructor.avgRating > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>★ {instructor.avgRating?.toFixed(1)}</span>
                <span style={{ fontSize: 13, color: '#999' }}>({instructor.totalReviews} değerlendirme)</span>
              </div>
            )}
            {instructor.bio && (
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>{instructor.bio}</p>
            )}

            {/* Salon linki */}
            {instructor.venue && (
              <Link href={`/venue/${instructor.venue.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: 14, cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏋️</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>{instructor.venue.name}</div>
                    {instructor.venue.neighborhood && (
                      <div style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {instructor.venue.neighborhood.name}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Verdiği dersler */}
        {classes.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={17} /> Verdiği Dersler
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classes.map((cls: any) => {
                const icon = getIconKeyForCategory(cls.sportCategory?.name || '')
                const color = cls.sportCategory?.colorHex || getColorForCategory(cls.sportCategory?.name || '')
                const nextSession = cls.sessions?.[0]
                return (
                  <Link key={cls.id} href={nextSession ? `/ders/${nextSession.id}` : '#'} style={{ textDecoration: 'none' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <SportIconBox name={icon} bgColor={color + '18'} iconColor={color} boxSize={46} borderRadius={12} size={20} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{cls.title}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{cls.sportCategory?.name} · {cls.durationMinutes} dk</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>₺{cls.basePrice}</div>
                        {nextSession && (
                          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                            {nextSession.availableSpots} yer var
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Yorumlar */}
        {reviews.length > 0 && (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={17} /> Değerlendirmeler
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((r: any) => (
                <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{r.user?.fullName || 'Kullanıcı'}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR')}</div>
                      </div>
                    </div>
                    <div style={{ color: '#F59E0B' }}>{'★'.repeat(r.rating)}</div>
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
