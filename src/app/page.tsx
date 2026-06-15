'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { mockClasses, mockDropInSlots } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { api } from '@/lib/api'
import { Search, LayoutGrid, Map, Flame, Clock, Timer } from 'lucide-react'
import { SportIcon, SportIconBox } from '@/lib/sportIcons'

const categories = [
  { id: 1, name: 'Yoga', icon: 'yoga', color: '#C4A882' },
  { id: 2, name: 'Pilates', icon: 'pilates', color: '#C9849A' },
  { id: 3, name: 'Boks', icon: 'boxing', color: '#DC2626' },
  { id: 4, name: 'Padel', icon: 'padel', color: '#EAB308' },
  { id: 5, name: 'Halı Saha', icon: 'football', color: '#16A34A' },
  { id: 6, name: 'Basketbol', icon: 'basketball', color: '#C2501F' },
  { id: 7, name: 'HIIT', icon: 'hiit', color: '#F97316' },
  { id: 8, name: 'Dans', icon: 'dance', color: '#9333EA' },
  { id: 9, name: 'Yüzme', icon: 'swimming', color: '#0891B2' },
  { id: 10, name: 'Crossfit', icon: 'strength', color: '#4B5563' },
]

const categoryIconMap: Record<string, string> = {
  'Yoga': 'yoga', 'Pilates': 'pilates', 'Boks': 'boxing',
  'HIIT': 'hiit', 'Halı Saha': 'football', 'Basketbol': 'basketball',
  'Padel': 'padel', 'Dans': 'dance', 'Yüzme': 'swimming', 'Crossfit': 'strength',
}

const categoryColorMap: Record<string, string> = {
  'Yoga': '#C4A882', 'Pilates': '#C9849A', 'Boks': '#DC2626',
  'Padel': '#EAB308', 'Halı Saha': '#16A34A', 'Basketbol': '#C2501F',
  'HIIT': '#F97316', 'Dans': '#9333EA', 'Yüzme': '#0891B2', 'Crossfit': '#4B5563',
}

function getCategoryIcon(name: string): string {
  return categoryIconMap[name] || 'hiit'
}

function getCategoryColor(name: string): string {
  return categoryColorMap[name] || '#4F46E5'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSessionToItem(session: any) {
  return {
    id: session.id,
    title: session.title,
    venueId: session.venueId,
    venue: session.venueName,
    neighborhood: session.neighborhood,
    category: session.category,
    icon: getCategoryIcon(session.category),
    color: session.categoryColor || getCategoryColor(session.category),
    basePrice: session.basePrice,
    spots: session.availableSpots,
    rating: session.rating || 4.5,
    totalReviews: session.totalReviews || 0,
    time: new Date(session.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    date: new Date(session.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
    duration: `${session.durationMinutes} dk`,
    isDropIn: false as const,
    sessionId: session.id,
  }
}

// Common display item shape shared between API sessions, mock classes, and drop-ins
interface DisplayItem {
  id: number
  title: string
  venueId?: number
  venue?: string
  neighborhood: string
  category: string
  icon: string
  color: string
  basePrice: number
  spots: number
  rating: number
  totalReviews: number
  time: string
  date: string
  duration: string
  isDropIn: boolean
  sessionId?: number
  // drop-in extras (optional)
  pricePerPerson?: number
  format?: string
  // mock class extras (optional)
  [key: string]: unknown
}

const mockClassItems: DisplayItem[] = mockClasses.map(c => ({ ...c, isDropIn: false }))
const mockDropInItems: DisplayItem[] = mockDropInSlots.map(d => ({ ...d, isDropIn: true, basePrice: d.pricePerPerson, spots: d.totalPlayers - d.currentPlayers, rating: 4.6, totalReviews: 50 }))

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [allItems, setAllItems] = useState<DisplayItem[]>([
    ...mockClassItems,
    ...mockDropInItems,
  ])

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await api.getSessions()
        const sessions: unknown[] = result?.sessions ?? []
        if (Array.isArray(sessions) && sessions.length > 0) {
          const mapped = sessions.map(mapSessionToItem)
          setAllItems([...mapped, ...mockDropInItems])
        }
        // else keep mock data already set as initial state
      } catch {
        // API unreachable — keep mock data
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = allItems.filter(c => {
    const matchCat = activeCategory === null || c.category === categories.find(x => x.id === activeCategory)?.name
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('venue' in c && typeof c.venue === 'string' ? c.venue : '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      {/* Hero / Search */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: -1, lineHeight: 1.15 }}>
            İstanbul'un en iyi<br />spor derslerini keşfet
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 28, fontWeight: 400 }}>
            Yoga'dan halı sahaya, Pilates'ten boksa — tek platformdan rezervasyon yap
          </p>
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}><Search size={18} /></span>
            <input
              type="text"
              placeholder="Spor, semt veya tesis ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: 100, border: 'none', fontSize: 15, outline: 'none', backgroundColor: '#fff', color: '#1a1a1a', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24 }}>
            {[{ n: '500+', l: 'Aktif Ders' }, { n: '50+', l: 'Tesis' }, { n: '10K+', l: 'Rezervasyon' }].map((s, i) => (
              <div key={i} style={{ color: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kategoriler */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 2, padding: '4px 0', minWidth: 'max-content' }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{ padding: '16px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeCategory === null ? '#4F46E5' : '#666', borderBottom: activeCategory === null ? '2px solid #4F46E5' : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            >
              Tümü
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                style={{ padding: '16px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeCategory === cat.id ? cat.color : '#666', borderBottom: activeCategory === cat.id ? `2px solid ${cat.color}` : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <SportIcon name={cat.icon} size={16} color={activeCategory === cat.id ? cat.color : '#666'} />{cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            {loading ? (
              <span style={{ fontSize: 20, fontWeight: 700, color: '#aaa' }}>Yükleniyor...</span>
            ) : (
              <>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{filtered.length} etkinlik</span>
                {activeCategory && <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>· {categories.find(c => c.id === activeCategory)?.name}</span>}
                {searchQuery && <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>· "{searchQuery}" için</span>}
              </>
            )}
          </div>
          <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: 12, padding: 3, gap: 2 }}>
            {(['list', 'map'] as const).map(view => (
              <button key={view} onClick={() => setActiveView(view)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: activeView === view ? '#fff' : 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeView === view ? '#1a1a1a' : '#888', boxShadow: activeView === view ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {view === 'list' ? <><LayoutGrid size={14} style={{ marginRight: 4 }} />Liste</> : <><Map size={16} style={{ marginRight: 4 }} />Harita</>}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                <div style={{ background: '#F0F0F0', height: 130, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ padding: '16px 20px 20px' }}>
                  <div style={{ background: '#F0F0F0', borderRadius: 8, height: 14, width: '60%', marginBottom: 10 }} />
                  <div style={{ background: '#F0F0F0', borderRadius: 8, height: 12, width: '40%', marginBottom: 16 }} />
                  <div style={{ background: '#F0F0F0', borderRadius: 8, height: 36 }} />
                </div>
              </div>
            ))}
          </div>
        ) : activeView === 'list' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(item => {
              const href = item.isDropIn ? `/dropin/${item.id}` : `/ders/${item.id}`
              const price = item.isDropIn ? ('pricePerPerson' in item ? item.pricePerPerson : item.basePrice) : item.basePrice
              return (
                <Link key={item.id + (item.isDropIn ? '-drop' : '')} href={href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; el.style.borderColor = '#E0E0E0' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = '#F0F0F0' }}
                  >
                    {/* Kart header - solid color */}
                    <div style={{ background: item.color, padding: '22px 20px 18px', position: 'relative', minHeight: 100 }}>
                      {item.isDropIn && (
                        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: item.color, background: 'rgba(255,255,255,0.95)', padding: '3px 9px', borderRadius: 20 }}>
                          DROP-IN {'format' in item ? item.format : ''}
                        </span>
                      )}
                      {item.spots <= 3 && (
                        <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Flame size={12} /> Son {item.spots} yer
                        </span>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <SportIconBox name={item.icon} bgColor='rgba(255,255,255,0.2)' iconColor='#fff' boxSize={48} borderRadius={14} size={22} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{item.title}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                        {'venue' in item && typeof item.venue === 'string' ? item.venue : ''} · {item.neighborhood}
                      </p>
                    </div>

                    {/* Kart body */}
                    <div style={{ padding: '16px 20px 20px' }}>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={16} /> {'time' in item ? item.time : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Timer size={16} /> {'duration' in item ? item.duration : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                          ★ {item.rating}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>₺{price}</span>
                          <span style={{ fontSize: 12, color: '#aaa', marginLeft: 3 }}>/ kişi</span>
                        </div>
                        <button style={{ padding: '9px 18px', borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          {item.isDropIn ? 'Katıl' : 'Rezervasyon'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ backgroundColor: '#F0F7FF', borderRadius: 24, height: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #BFDBFE', gap: 12 }}>
            <Map size={56} color="#93C5FD" />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1E40AF', margin: 0 }}>Harita Görünümü</p>
            <p style={{ fontSize: 14, color: '#93C5FD', margin: 0 }}>Google Maps entegrasyonu yakında</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #F0F0F0', backgroundColor: '#fff', padding: '32px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5' }}>şipşakspor</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>© 2026 Şipşakspor · İstanbul'un spor platformu</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/salon-giris" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>Salon Başvurusu</Link>
            <Link href="/admin" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
