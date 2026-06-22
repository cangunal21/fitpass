'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { mockClasses, mockDropInSlots } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { api, getToken, getUser } from '@/lib/api'
import { Search, LayoutGrid, Map, Flame, Clock, Timer, X } from 'lucide-react'
import { SportIcon, SportIconBox, getIconKeyForCategory, getColorForCategory } from '@/lib/sportIcons'
import { SkeletonCardGrid } from '@/components/Skeleton'

// Kategoriler API'dan dinamik olarak yüklenir
interface Category { id: number; name: string; icon: string; color: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSessionToItem(session: any) {
  return {
    id: session.id,
    title: session.title,
    venueId: session.venueId,
    venue: session.venueName,
    neighborhood: session.neighborhood,
    category: session.category,
    icon: getIconKeyForCategory(session.category),
    color: session.categoryColor || getColorForCategory(session.category),
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
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'list' | 'map'>('list')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [allItems, setAllItems] = useState<DisplayItem[]>([
    ...mockClassItems,
    ...mockDropInItems,
  ])
  const [filters, setFilters] = useState({ category: '', date: '', neighborhoodId: '', search: '' })
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'weekend'>('all')
  const [sort, setSort] = useState<'latest' | 'rating' | 'nearby'>('latest')
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [venueResults, setVenueResults] = useState<any[]>([])
  const [allVenues, setAllVenues] = useState<any[]>([])

  // Fetch neighborhoods + categories on mount
  useEffect(() => {
    api.getNeighborhoods().then((r: any) => {
      if (r?.neighborhoods) setNeighborhoods(r.neighborhoods)
    }).catch(() => {})
    api.getCategories().then((r: any) => {
      if (r?.categories) {
        setCategories(r.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: getIconKeyForCategory(c.name),
          color: c.colorHex || getColorForCategory(c.name),
        })))
      }
    }).catch(() => {})
    api.getVenues().then((r: any) => {
      if (Array.isArray(r?.venues)) setAllVenues(r.venues)
    }).catch(() => {})
  }, [])

  const getDateRange = (filter: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)
    const dayOfWeek = today.getDay()
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
    const saturday = new Date(today); saturday.setDate(today.getDate() + daysUntilSat)
    const monday = new Date(saturday); monday.setDate(saturday.getDate() + 2)
    if (filter === 'today') return { dateFrom: today.toISOString(), dateTo: tomorrow.toISOString() }
    if (filter === 'week') return { dateFrom: today.toISOString(), dateTo: nextWeek.toISOString() }
    if (filter === 'weekend') return { dateFrom: saturday.toISOString(), dateTo: monday.toISOString() }
    return {}
  }

  const fetchSessions = useCallback(async (activeFilters: typeof filters, activeSortParam?: string, activeTimeFilter?: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (activeFilters.category) params.category = activeFilters.category
      if (activeFilters.date) params.date = activeFilters.date
      if (activeFilters.neighborhoodId) params.neighborhoodId = activeFilters.neighborhoodId
      if (activeFilters.search) params.search = activeFilters.search
      const sortParam = activeSortParam ?? sort
      if (sortParam && sortParam !== 'latest') params.sort = sortParam
      if (sortParam === 'nearby') {
        const u = getUser()
        if (u?.neighborhoodId) params.userNeighborhoodId = String(u.neighborhoodId)
      }
      const tf = activeTimeFilter ?? timeFilter
      const dateRange = getDateRange(tf)
      if ((dateRange as any).dateFrom) params.dateFrom = (dateRange as any).dateFrom
      if ((dateRange as any).dateTo) params.dateTo = (dateRange as any).dateTo

      const result = await api.getSessions(Object.keys(params).length ? params : undefined)
      const sessions: unknown[] = result?.sessions ?? []
      if (Array.isArray(sessions) && sessions.length > 0) {
        const mapped = sessions.map(mapSessionToItem)
        setAllItems(mapped)
      } else {
        setAllItems([...mockClassItems, ...mockDropInItems])
      }
    } catch {
      setAllItems([...mockClassItems, ...mockDropInItems])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions(filters, sort, timeFilter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.date, filters.neighborhoodId, sort, timeFilter])

  // Debounce search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }))
      fetchSessions({ ...filters, search: searchInput }, sort, timeFilter)
      const s = searchInput.trim().toLowerCase()
      if (s) {
        setVenueResults(allVenues.filter(v =>
          v.name?.toLowerCase().includes(s) || v.neighborhood?.name?.toLowerCase().includes(s)
        ))
      } else {
        setVenueResults([])
      }
    }, 400)
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const hasActiveFilter = filters.category || filters.date || filters.neighborhoodId || filters.search

  const filtered = allItems.filter(c => {
    const activeCatName = filters.category || (activeCategory ? categories.find(x => x.id === activeCategory)?.name : null)
    const matchCat = !activeCatName || c.category === activeCatName
    const s = filters.search.toLowerCase()
    const matchSearch = !filters.search ||
      c.title?.toLowerCase().includes(s) ||
      (typeof c.venue === 'string' ? c.venue.toLowerCase().includes(s) : (c.venue as any)?.name?.toLowerCase().includes(s)) ||
      c.neighborhood?.toLowerCase().includes(s) ||
      c.category?.toLowerCase().includes(s)
    return matchCat && matchSearch
  })

  const handleCategoryTabClick = (catId: number | null) => {
    setActiveCategory(catId)
    const catName = catId ? categories.find(x => x.id === catId)?.name || '' : ''
    const newFilters = { ...filters, category: catName }
    setFilters(newFilters)
    fetchSessions(newFilters)
  }

  const handleCardBookingClick = (e: React.MouseEvent, item: DisplayItem) => {
    e.preventDefault()
    if (item.spots === 0) return
    const token = getToken()
    const user = getUser()
    if (!token || !user) {
      router.push('/giris?redirect=' + encodeURIComponent(item.isDropIn ? `/dropin/${item.id}` : `/ders/${item.id}`))
      return
    }
    router.push(item.isDropIn ? `/dropin/${item.id}` : `/ders/${item.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      {/* Hero / Search */}
      <div className="hero-section" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h1 className="hero-title" style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: -1, lineHeight: 1.15 }}>
            İstanbul'un en iyi<br />spor derslerini keşfet
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 28, fontWeight: 400 }}>
            Yoga'dan halı sahaya, Pilates'ten boksa — tek platformdan rezervasyon yap
          </p>
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}><Search size={18} /></span>
            <input
              type="text"
              placeholder="Spor, semt veya tesis ara..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
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
          <div className="category-tabs" style={{ display: 'flex', gap: 2, padding: '4px 0', minWidth: 'max-content' }}>
            <button
              onClick={() => handleCategoryTabClick(null)}
              className="category-tab-item"
              style={{ padding: '16px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeCategory === null ? '#4F46E5' : '#666', borderBottom: activeCategory === null ? '2px solid #4F46E5' : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            >
              Tümü
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryTabClick(activeCategory === cat.id ? null : cat.id)}
                className="category-tab-item"
                style={{ padding: '16px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeCategory === cat.id ? cat.color : '#666', borderBottom: activeCategory === cat.id ? `2px solid ${cat.color}` : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <SportIcon name={cat.icon} size={16} color={activeCategory === cat.id ? cat.color : '#666'} />{cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0', padding: '12px 24px 0' }}>
        <div className="filter-bar" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              type="text"
              placeholder="Ders veya salon ara..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, outline: 'none', color: '#1a1a1a', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={filters.category}
            onChange={e => {
              const catName = e.target.value
              const cat = categories.find(c => c.name === catName)
              setActiveCategory(cat ? cat.id : null)
              const newFilters = { ...filters, category: catName }
              setFilters(newFilters)
              fetchSessions(newFilters)
            }}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.category ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff' }}
          >
            <option value="">Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filters.neighborhoodId}
            onChange={e => setFilters(f => ({ ...f, neighborhoodId: e.target.value }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.neighborhoodId ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff', maxHeight: 300 }}
            size={1}
          >
            <option value="">İlçe</option>
            {[...neighborhoods].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(n => (
              <option key={n.id} value={String(n.id)}>{n.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.date ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff' }}
          />

          <div className="filter-sort" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 13, color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>Sırala:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: '#1a1a1a', outline: 'none', cursor: 'pointer', background: '#fff' }}
            >
              <option value="latest">Tarihe Göre</option>
              <option value="rating">Puana Göre</option>
              <option value="nearby">Bana Yakın</option>
            </select>
          </div>

          {hasActiveFilter && (
            <button
              onClick={() => {
                setFilters({ category: '', date: '', neighborhoodId: '', search: '' })
                setSearchInput('')
                setActiveCategory(null)
                setTimeFilter('all')
                setSort('latest')
                fetchSessions({ category: '', date: '', neighborhoodId: '', search: '' }, 'latest', 'all')
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #EEE', background: '#F5F5F5', fontSize: 13, color: '#666', cursor: 'pointer', fontWeight: 500 }}
            >
              <X size={14} /> Temizle
            </button>
          )}
        </div>

        {/* Time filter pills */}
        <div className="time-filters" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {([
            { key: 'all', label: 'Tümü' },
            { key: 'today', label: 'Bugün' },
            { key: 'week', label: 'Bu Hafta' },
            { key: 'weekend', label: 'Bu Hafta Sonu' },
          ] as const).map(tf => (
            <button
              key={tf.key}
              onClick={() => setTimeFilter(tf.key)}
              className="time-filter-item"
              style={{ padding: '8px 18px', borderRadius: 100, border: timeFilter === tf.key ? 'none' : '1.5px solid #E5E5E5', background: timeFilter === tf.key ? '#4F46E5' : '#fff', color: timeFilter === tf.key ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div className="page-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {venueResults.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#888' }}>Salonlar</span>
            <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginTop: 10 }}>
              {venueResults.map(v => (
                <Link key={v.id} href={`/venue/${v.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                      {v.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{v.name}</div>
                      {v.neighborhood?.name && <div style={{ fontSize: 12, color: '#888' }}>{v.neighborhood.name}</div>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            {loading ? (
              <span style={{ fontSize: 20, fontWeight: 700, color: '#aaa' }}>Yükleniyor...</span>
            ) : (
              <>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{filtered.length} etkinlik</span>
                {activeCategory && <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>· {categories.find(c => c.id === activeCategory)?.name}</span>}
                {filters.search && <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>· "{filters.search}" için</span>}
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
          <SkeletonCardGrid count={6} />
        ) : activeView === 'list' ? (
          <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(item => {
              const href = item.isDropIn ? `/dropin/${item.id}` : `/ders/${item.id}`
              const price = item.isDropIn ? ('pricePerPerson' in item ? item.pricePerPerson : item.basePrice) : item.basePrice
              const isFull = item.spots === 0
              const isLowSpots = !isFull && item.spots <= 3
              return (
                <Link key={item.id + (item.isDropIn ? '-drop' : '')} href={href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 0.2s', opacity: isFull ? 0.75 : 1 }}
                    onMouseEnter={e => { if (!isFull) { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; el.style.borderColor = '#E0E0E0' } }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = '#F0F0F0' }}
                  >
                    {/* Kart header - solid color */}
                    <div style={{ background: item.color, padding: '22px 20px 18px', position: 'relative', minHeight: 100 }}>
                      {item.isDropIn && (
                        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: item.color, background: 'rgba(255,255,255,0.95)', padding: '3px 9px', borderRadius: 20 }}>
                          DROP-IN {'format' in item ? item.format : ''}
                        </span>
                      )}
                      {isFull && (
                        <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '3px 9px', borderRadius: 20 }}>
                          DOLU
                        </span>
                      )}
                      {isLowSpots && (
                        <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Flame size={12} /> Son {item.spots} yer
                        </span>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <SportIconBox name={item.icon} bgColor='rgba(255,255,255,0.2)' iconColor='#fff' boxSize={48} borderRadius={14} size={22} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{item.title}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                        {'venueId' in item && item.venueId ? (
                          <Link href={`/venue/${item.venueId}`} onClick={e => e.stopPropagation()} style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline', fontWeight: 600 }}>
                            {'venue' in item && typeof item.venue === 'string' ? item.venue : ''}
                          </Link>
                        ) : (
                          'venue' in item && typeof item.venue === 'string' ? item.venue : ''
                        )} · {item.neighborhood}
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
                          {!isFull && isLowSpots && (
                            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 2 }}>{item.spots} yer kaldı</div>
                          )}
                        </div>
                        {isFull ? (
                          <button
                            onClick={async (e) => {
                              e.preventDefault()
                              const token = localStorage.getItem('fitpass_token')
                              if (!token) { router.push(`/giris?redirect=/`); return }
                              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                              const res = await fetch(`${API_URL}/api/waitlist/sessions/${item.sessionId || item.id}`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` }
                              })
                              const data = await res.json()
                              if (data.error) { alert(data.error); return }
                              alert('Bekleme listesine eklendiniz! Yer açılınca email ile bildirileceksiniz.')
                            }}
                            style={{ padding: '9px 18px', borderRadius: 12, border: '1.5px solid #F59E0B', background: '#FFFBEB', color: '#D97706', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                          >
                            🔔 Bekleme Listesi
                          </button>
                        ) : (
                          <button
                            onClick={e => handleCardBookingClick(e, item)}
                            style={{ padding: '9px 18px', borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                          >
                            {item.isDropIn ? 'Katıl' : 'Rezervasyon'}
                          </button>
                        )}
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
