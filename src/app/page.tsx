'use client'

import { useState } from 'react'
import Link from 'next/link'
import { mockClasses, mockDropInSlots } from '@/lib/mockData'

const categories = [
  { id: 1, name: 'Yoga', icon: '🧘', color: '#8B5CF6' },
  { id: 2, name: 'Pilates', icon: '🤸', color: '#EC4899' },
  { id: 3, name: 'Boks', icon: '🥊', color: '#EF4444' },
  { id: 4, name: 'Padel', icon: '🎾', color: '#10B981' },
  { id: 5, name: 'Halı Saha', icon: '⚽', color: '#3B82F6' },
  { id: 6, name: 'Basketbol', icon: '🏀', color: '#F59E0B' },
  { id: 7, name: 'HIIT', icon: '🔥', color: '#EF4444' },
  { id: 8, name: 'Dans', icon: '💃', color: '#A855F7' },
  { id: 9, name: 'Yüzme', icon: '🏊', color: '#06B6D4' },
  { id: 10, name: 'Crossfit', icon: '💪', color: '#84CC16' },
]

const allItems = [
  ...mockClasses.map(c => ({ ...c, isDropIn: false })),
  ...mockDropInSlots.map(d => ({ ...d, isDropIn: true, basePrice: d.pricePerPerson, spots: d.totalPlayers - d.currentPlayers, rating: 4.6, totalReviews: 50 })),
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = allItems.filter(c => {
    const matchCat = activeCategory === null || c.category === categories.find(x => x.id === activeCategory)?.name
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('venue' in c && typeof c.venue === 'string' ? c.venue : '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#FF385C', letterSpacing: -0.5 }}>fitpass</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Giriş Yap</Link>
          <Link href="/kayit" style={{ padding: '8px 18px', borderRadius: 24, border: 'none', background: '#FF385C', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Kayıt Ol</Link>
        </div>
      </nav>

      <div style={{ backgroundColor: '#fff', padding: '20px 24px 16px', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
          <input type="text" placeholder="Spor, venue veya semt ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 32, border: '1.5px solid #ddd', fontSize: 15, outline: 'none', backgroundColor: '#fafafa', color: '#333' }} />
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
          <button onClick={() => setActiveCategory(null)} style={{ padding: '8px 18px', borderRadius: 24, border: '1.5px solid ' + (activeCategory === null ? '#FF385C' : '#eee'), background: activeCategory === null ? '#FF385C' : '#fff', color: activeCategory === null ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tümü</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} style={{ padding: '8px 18px', borderRadius: 24, border: '1.5px solid ' + (activeCategory === cat.id ? cat.color : '#eee'), background: activeCategory === cat.id ? cat.color : '#fff', color: activeCategory === cat.id ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{cat.icon}</span>{cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ color: '#666', fontSize: 14 }}><strong style={{ color: '#1a1a1a' }}>{filtered.length}</strong> etkinlik bulundu</p>
          <div style={{ display: 'flex', gap: 4, background: '#eee', borderRadius: 24, padding: 3 }}>
            {(['list', 'map'] as const).map(view => (
              <button key={view} onClick={() => setActiveView(view)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: activeView === view ? '#fff' : 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeView === view ? '#1a1a1a' : '#888', boxShadow: activeView === view ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {view === 'list' ? '≡ Liste' : '🗺 Harita'}
              </button>
            ))}
          </div>
        </div>

        {activeView === 'list' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map(item => {
              const href = item.isDropIn ? `/dropin/${item.id}` : `/ders/${item.id}`
              return (
                <Link key={item.id + (item.isDropIn ? '-drop' : '')} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)' }}
                  >
                    <div style={{ background: item.color + '18', padding: '20px 20px 16px', borderBottom: '1px solid ' + item.color + '22' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{item.title}</h3>
                          <p style={{ fontSize: 13, color: '#666' }}>{item.neighborhood}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {item.isDropIn && <span style={{ fontSize: 11, fontWeight: 700, color: item.color, background: item.color + '20', padding: '3px 10px', borderRadius: 12, display: 'block', marginBottom: 6 }}>DROP-IN {'format' in item ? item.format : ''}</span>}
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>₺{item.isDropIn ? ('pricePerPerson' in item ? item.pricePerPerson : item.basePrice) : item.basePrice}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>kişi başı</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: '#555' }}>🕐 {'time' in item ? item.time : ''} · {'duration' in item ? item.duration : ''}</div>
                        <div style={{ fontSize: 13, color: '#555' }}>📍 {item.neighborhood}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>★ {item.rating}</span>
                        <div style={{ fontSize: 12, color: item.spots <= 3 ? '#EF4444' : '#10B981', fontWeight: 600 }}>{item.spots} yer kaldı</div>
                      </div>
                      <button style={{ width: '100%', marginTop: 14, padding: '11px', borderRadius: 12, border: 'none', background: item.color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                        {item.isDropIn ? 'Katıl' : 'Rezervasyon Yap'}
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ backgroundColor: '#e8f4fd', borderRadius: 20, height: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #93C5FD', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🗺️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1E40AF' }}>Harita Görünümü</p>
            <p style={{ fontSize: 14, color: '#60A5FA' }}>Google Maps entegrasyonu yakında eklenecek</p>
          </div>
        )}
      </div>
    </div>
  )
}
