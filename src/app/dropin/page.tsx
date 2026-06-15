'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { SportIconBox } from '@/lib/sportIcons'
import { api, getToken } from '@/lib/api'
import { mockDropInSlots } from '@/lib/mockData'

const SPORT_ICON_MAP: Record<string, string> = {
  'Basketbol': 'basketball',
  'Padel': 'padel',
  'Halı Saha': 'football',
}

const SPORT_COLOR_MAP: Record<string, string> = {
  'Basketbol': '#C2501F',
  'Padel': '#EAB308',
  'Halı Saha': '#16A34A',
}

export default function DropInListPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joinStatus, setJoinStatus] = useState<Record<number, { loading: boolean; success?: string; error?: string }>>({})

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    try {
      const data = await api.getDropInSlots()
      if (data.slots && data.slots.length > 0) {
        setSlots(data.slots)
      } else {
        // Fall back to mock data
        setSlots(mockDropInSlots.map((s: any) => ({
          id: s.id,
          title: s.title,
          format: s.format,
          startsAt: new Date().toISOString(),
          currentPlayers: s.currentPlayers,
          totalPlayers: s.totalPlayers,
          pricePerPerson: s.pricePerPerson,
          status: 'open',
          venue: { id: s.venueId, name: 'Demo Salon', address: s.neighborhood },
          sportCategory: { name: s.category, colorHex: s.color },
          _mock: true,
        })))
      }
    } catch {
      setSlots(mockDropInSlots.map((s: any) => ({
        id: s.id,
        title: s.title,
        format: s.format,
        startsAt: new Date().toISOString(),
        currentPlayers: s.currentPlayers,
        totalPlayers: s.totalPlayers,
        pricePerPerson: s.pricePerPerson,
        status: 'open',
        venue: { id: s.venueId, name: 'Demo Salon', address: s.neighborhood },
        sportCategory: { name: s.category, colorHex: s.color },
        _mock: true,
      })))
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (slotId: number, isMock: boolean) => {
    if (isMock) return
    const token = getToken()
    if (!token) {
      router.push('/giris')
      return
    }
    setJoinStatus(prev => ({ ...prev, [slotId]: { loading: true } }))
    try {
      const data = await api.joinDropIn(token, slotId)
      if (data.error) {
        setJoinStatus(prev => ({ ...prev, [slotId]: { loading: false, error: data.error } }))
      } else {
        setJoinStatus(prev => ({ ...prev, [slotId]: { loading: false, success: "Drop-in'e katıldınız!" } }))
        fetchSlots()
      }
    } catch {
      setJoinStatus(prev => ({ ...prev, [slotId]: { loading: false, error: 'Bir hata oluştu.' } }))
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Drop-In Maçlar</h1>
          <p style={{ fontSize: 15, color: '#666' }}>Basketbol, Padel ve Halı Saha — takım bul, hemen katıl!</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: 15 }}>Yükleniyor...</div>
        ) : slots.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '60px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Açık maç yok</div>
            <div style={{ fontSize: 14, color: '#888' }}>Yakında yeni maçlar eklenecek!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {slots.map((slot: any) => {
              const sportName = slot.sportCategory?.name || ''
              const icon = SPORT_ICON_MAP[sportName] || 'football'
              const color = slot.sportCategory?.colorHex || SPORT_COLOR_MAP[sportName] || '#4F46E5'
              const percentage = slot.totalPlayers > 0 ? (slot.currentPlayers / slot.totalPlayers) * 100 : 0
              const status = joinStatus[slot.id]
              const startsAt = new Date(slot.startsAt)

              return (
                <div key={slot.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '0', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Color header bar */}
                  <div style={{ height: 5, backgroundColor: color }} />
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <SportIconBox name={icon} bgColor={color + '18'} iconColor={color} boxSize={52} borderRadius={14} size={26} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{slot.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888' }}>
                            <MapPin size={13} /> {slot.venue?.name} · {slot.venue?.address}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: color }}>₺{slot.pricePerPerson}<span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>/kişi</span></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 20, marginBottom: 14, fontSize: 13, color: '#555' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {startsAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {startsAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> {slot.currentPlayers}/{slot.totalPlayers} oyuncu</span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ height: 6, backgroundColor: '#f0f0f0', borderRadius: 3 }}>
                        <div style={{ height: '100%', backgroundColor: color, borderRadius: 3, width: `${percentage}%`, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{slot.totalPlayers - slot.currentPlayers} yer kaldı</div>
                    </div>

                    {status?.success && (
                      <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 10 }}>✓ {status.success}</div>
                    )}
                    {status?.error && (
                      <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 10 }}>{status.error}</div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <Link href={`/dropin/${slot.id}`} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #e5e5e5', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#333', textAlign: 'center', textDecoration: 'none' }}>
                        Detay
                      </Link>
                      <button
                        onClick={() => handleJoin(slot.id, !!slot._mock)}
                        disabled={status?.loading || !!status?.success || slot.currentPlayers >= slot.totalPlayers}
                        style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: (status?.success || slot.currentPlayers >= slot.totalPlayers) ? '#ddd' : color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: (status?.success || slot.currentPlayers >= slot.totalPlayers) ? 'not-allowed' : 'pointer' }}
                      >
                        {status?.loading ? 'Katılıyor...' : status?.success ? 'Katıldınız!' : slot.currentPlayers >= slot.totalPlayers ? 'Dolu' : 'Katıl'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
