'use client'

import { useState, useEffect } from 'react'
import { useT, localizeText } from '@/lib/i18n'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { mockDropInSlots, mockVenues } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { Calendar, Clock, Timer, MapPin, User, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react'
import { SportIconBox } from '@/lib/sportIcons'
import { api, getToken, getUser } from '@/lib/api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiSlot(slot: any) {
  return {
    id: slot.id,
    title: slot.title || slot.sportCategory?.name || 'Drop-in',
    color: slot.sportCategory?.colorHex || '#4F46E5',
    icon: slot.sportCategory?.iconUrl || 'hiit',
    format: slot.format || 'Maç',
    neighborhood: slot.venue?.neighborhood?.name || '',
    date: new Date(slot.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
    time: new Date(slot.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    endsAt: new Date(slot.endsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    duration: slot.durationMinutes ? `${slot.durationMinutes} dk` : '',
    pricePerPerson: slot.pricePerPerson,
    totalPrice: slot.totalPrice || slot.pricePerPerson,
    currentPlayers: slot.currentPlayers,
    totalPlayers: slot.totalPlayers,
    status: slot.status,
    venueId: slot.venue?.id,
    venueName: slot.venue?.name || '',
    venueAddress: slot.venue?.address || '',
    participantCount: slot.participants?.length || slot.currentPlayers,
    participants: (slot.participants || []).map((p: any) => ({
      id: p.id,
      team: p.team,
      username: p.user?.username || null,
      fullName: p.user?.fullName || null,
      avatarUrl: p.user?.avatarUrl || null,
    })),
    isReal: true,
  }
}

export default function DropInPage() {
  const { t, lang } = useT()
  const params = useParams()
  const router = useRouter()
  const [slot, setSlot] = useState<ReturnType<typeof mapApiSlot> | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    async function fetchSlot() {
      const id = Number(params.id)
      try {
        const result = await api.getDropInSlotById(id)
        if (result?.slot) {
          setSlot(mapApiSlot(result.slot))
          return
        }
      } catch {
        // fall through to mock
      }
      // fallback mock
      const mockSlot = mockDropInSlots.find(s => s.id === id) || mockDropInSlots[0]
      const mockVenue = mockVenues.find(v => v.id === mockSlot.venueId)
      setSlot({
        id: mockSlot.id,
        title: mockSlot.title,
        color: mockSlot.color,
        icon: mockSlot.icon,
        format: mockSlot.format,
        neighborhood: mockSlot.neighborhood,
        date: mockSlot.date,
        time: mockSlot.time,
        endsAt: mockSlot.endsAt,
        duration: mockSlot.duration,
        pricePerPerson: mockSlot.pricePerPerson,
        totalPrice: mockSlot.totalPrice,
        currentPlayers: mockSlot.currentPlayers,
        totalPlayers: mockSlot.totalPlayers,
        status: 'open',
        venueId: mockSlot.venueId,
        venueName: mockVenue?.name || '',
        venueAddress: mockVenue?.address || '',
        participantCount: mockSlot.currentPlayers,
        participants: [
          ...(mockSlot.teams?.A || []),
          ...(mockSlot.teams?.B || []),
        ].map((u: any) => ({ id: u.id, team: null, username: u.username, fullName: u.username, avatarUrl: null })),
        isReal: false,
      })
    }
    fetchSlot().finally(() => setLoading(false))
  }, [params.id])

  const handleJoin = async () => {
    if (!slot) return
    const token = getToken()
    const user = getUser()
    if (!token || !user) {
      router.push('/giris?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setJoining(true)
    setJoinError('')
    try {
      const res = await api.joinDropIn(token, slot.id)
      if (res?.error) {
        setJoinError(res.error)
      } else {
        setJoined(true)
        setSlot(s => s ? { ...s, currentPlayers: s.currentPlayers + 1, participantCount: s.participantCount + 1 } : s)
      }
    } catch {
      setJoinError(t('common.error'))
    } finally {
      setJoining(false)
    }
  }

  if (loading || !slot) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
        <Navbar />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ background: '#F0F0F0', borderRadius: 20, height: 300 }} />
        </div>
      </div>
    )
  }

  const percentage = Math.min(100, (slot.currentPlayers / slot.totalPlayers) * 100)
  const isFull = slot.currentPlayers >= slot.totalPlayers || slot.status !== 'open'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>{t('dropin.back')}</Link>

          <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ background: `linear-gradient(135deg, ${slot.color} 0%, ${slot.color}cc 100%)`, padding: '28px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, marginBottom: 12, display: 'inline-block' }}>DROP-IN · {slot.format}</span>
                  <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{lang === 'en' && (slot as any).titleEn ? (slot as any).titleEn : slot.title}</h1>
                  <span style={{ fontSize: 14, opacity: 0.9, color: '#fff' }}>{slot.venueName}{slot.neighborhood ? ` · ${slot.neighborhood}` : ''}</span>
                </div>
                <SportIconBox name={slot.icon} bgColor="rgba(255,255,255,0.2)" iconColor="#fff" boxSize={72} borderRadius={20} size={36} />
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, opacity: 0.85 }}>{t('dropin.occupancy')}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{slot.currentPlayers}/{slot.totalPlayers} {t('dropin.players')}</span>
                </div>
                <div style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
                  <div style={{ height: '100%', backgroundColor: '#fff', borderRadius: 4, width: `${percentage}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  {isFull ? t('dropin.slotFull') : t('dropin.spotsLeftMsg').replace('{n}', String(slot.totalPlayers - slot.currentPlayers))}
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: t('cls.date'), value: localizeText(slot.date, lang), icon: <Calendar size={14} /> },
                { label: t('cls.time'), value: `${localizeText(slot.time, lang)}${slot.endsAt ? ` - ${slot.endsAt}` : ''}`, icon: <Clock size={14} /> },
                { label: t('cls.duration'), value: localizeText(slot.duration, lang), icon: <Timer size={14} /> },
                { label: t('dropin.perPerson'), value: `₺${slot.pricePerPerson}`, icon: null },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: i === 3 ? slot.color : '#1a1a1a', display: 'flex', alignItems: 'center', gap: 4 }}>{item.icon}{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Katılımcılar */}
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('dropin.participants')} ({slot.participantCount}/{slot.totalPlayers})</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {(slot.participants || []).map((p: any) => {
                const initials = (p.fullName || p.username || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0891B2', '#EC4899']
                const bg = colors[(p.username || '').charCodeAt(0) % colors.length] || '#4F46E5'
                const card = (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: p.username ? 'pointer' : 'default' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: p.avatarUrl ? 'transparent' : bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${slot.color}30` }}>
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{initials}</span>
                      }
                    </div>
                    <span style={{ fontSize: 11, color: '#888', fontWeight: 500, maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      @{p.username || '?'}
                    </span>
                  </div>
                )
                return p.username ? (
                  <Link key={p.id} href={`/profil/${p.username}`} style={{ textDecoration: 'none' }}>{card}</Link>
                ) : (
                  <div key={p.id}>{card}</div>
                )
              })}
              {Array.from({ length: Math.max(0, slot.totalPlayers - slot.participantCount) }).map((_, i) => (
                <div key={`empty-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ddd' }}>
                    <span style={{ fontSize: 18, color: '#ccc' }}>+</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#ddd' }}>{t('dropin.free')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Salon */}
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{t('dropin.court')}</h2>
            {slot.venueId ? (
              <Link href={`/venue/${slot.venueId}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', backgroundColor: '#f9f9f9', borderRadius: 14, cursor: 'pointer' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: slot.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SportIconBox name={slot.icon} bgColor={slot.color + '20'} iconColor={slot.color} boxSize={52} borderRadius={14} size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>{slot.venueName}</div>
                    {slot.venueAddress && <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {slot.venueAddress}</div>}
                  </div>
                </div>
              </Link>
            ) : (
              <div style={{ padding: '14px', backgroundColor: '#f9f9f9', borderRadius: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>{slot.venueName}</div>
                {slot.venueAddress && <div style={{ fontSize: 13, color: '#888', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {slot.venueAddress}</div>}
              </div>
            )}
            <div style={{ marginTop: 14, padding: '12px 14px', backgroundColor: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> {t('dropin.organizedBy1')}<strong>{slot.venueName}</strong>{t('dropin.organizedBy2')}</p>
            </div>
          </div>
        </div>

        {/* Sağ panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>₺{slot.pricePerPerson}<span style={{ fontSize: 14, fontWeight: 400, color: '#999' }}> {t('card.perPerson')}</span></div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>{t('dropin.totalSplit').replace('{total}', String(slot.totalPrice)).replace('{n}', String(slot.totalPlayers))}</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#555' }}>{t('dropin.occupancy')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: isFull ? '#EF4444' : slot.color }}>{slot.currentPlayers}/{slot.totalPlayers}</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ height: '100%', backgroundColor: isFull ? '#EF4444' : slot.color, borderRadius: 4, width: `${percentage}%`, transition: 'width 0.3s' }} />
              </div>
            </div>

            {joinError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /> {joinError}
              </div>
            )}

            {joined ? (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 14, padding: '16px', textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#16A34A' }}>{t('dropin.joinedTitle')}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{t('dropin.joinedSub')}</div>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isFull || joining}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: isFull ? '#D1D5DB' : joining ? slot.color + '99' : slot.color, color: isFull ? '#9CA3AF' : '#fff', fontSize: 15, fontWeight: 700, cursor: isFull || joining ? 'not-allowed' : 'pointer', marginBottom: 12 }}
              >
                {joining ? t('dropin.joining') : isFull ? t('dropin.joinFull') : t('dropin.join')}
              </button>
            )}

            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><CreditCard size={14} />{t('dropin.payWhenFull')}</p>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ShieldCheck size={14} />{t('dropin.refundGuarantee')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
