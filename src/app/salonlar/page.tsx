'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X, MapPin, BadgeCheck, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useT, translateCategory } from '@/lib/i18n'
import { SportIconBox, resolveCategoryColor, resolveCategoryIcon } from '@/lib/sportIcons'
import { mockSocialVenues as MOCK_VENUES } from '@/lib/mockData'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const selStyle = { padding: '11px 12px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', background: '#fff', color: '#333', cursor: 'pointer' } as const

export default function SalonlarPage() {
  const { t, lang } = useT()
  const [venues, setVenues] = useState<any[]>([])
  const [cities, setCities] = useState<{ id: number; name: string }[]>([])
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')          // cityId (string)
  const [district, setDistrict] = useState('')   // neighborhoodId (string)
  const [category, setCategory] = useState('')   // kategori adı
  const [sort, setSort] = useState<'recommended' | 'rating' | 'newest'>('recommended')

  // Türkçe alfabetik sıralama (İ/ı, ş, ğ, ö, ü, ç doğru sıralansın)
  const trSort = (arr: any[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  useEffect(() => {
    fetch(`${API_URL}/api/public/venues`).then(r => r.json()).then(d => {
      setVenues(Array.isArray(d?.venues) ? d.venues : [])
    }).catch(() => {})
    fetch(`${API_URL}/api/public/cities`).then(r => r.json()).then(d => { if (d?.cities) setCities(trSort(d.cities)) }).catch(() => {})
    fetch(`${API_URL}/api/public/categories`).then(r => r.json()).then(d => { if (d?.categories) setCategories(d.categories) }).catch(() => {})
  }, [])

  // İl seçilince o ilin ilçelerini çek (il'e göre ilçe açılır); il yoksa ilçe listesi boş
  useEffect(() => {
    setDistrict('')
    if (!city) { setNeighborhoods([]); return }
    fetch(`${API_URL}/api/public/neighborhoods?cityId=${city}`).then(r => r.json()).then(d => { if (d?.neighborhoods) setNeighborhoods(trSort(d.neighborhoods)) }).catch(() => {})
  }, [city])

  // Gerçek salon sayısı azken demo kartlarıyla doldur (lansmanda #35 ile tamamen kalkacak)
  const base = venues.length >= 6 ? venues : [...venues, ...MOCK_VENUES]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = base.filter(v => {
      if (q) {
        const hay = `${v.name || ''} ${v.address || ''} ${v.neighborhood?.name || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (city && String(v.cityId ?? v.neighborhood?.cityId ?? '') !== city) return false
      if (district) {
        const nid = v.neighborhood?.id ?? v.neighborhoodId
        if (String(nid) !== district) return false
      }
      if (category) {
        const cats = (v.sportCategories || []).map((sc: any) => sc?.sportCategory?.name)
        if (!cats.includes(category)) return false
      }
      return true
    })
    const rating = (v: any) => Number(v.avgRating) || 0
    const reviews = (v: any) => Number(v.totalReviews) || 0
    const created = (v: any) => new Date(v.createdAt || 0).getTime()
    const arr = [...list]
    if (sort === 'rating') arr.sort((a, b) => rating(b) - rating(a) || reviews(b) - reviews(a))
    else if (sort === 'newest') arr.sort((a, b) => created(b) - created(a))
    else arr.sort((a, b) => (Number(!!b.isVerified) - Number(!!a.isVerified)) || rating(b) - rating(a) || reviews(b) - reviews(a)) // önerilen
    return arr
  }, [base, search, city, district, category, sort])

  const hasFilters = !!(search || city || district || category)
  const clearFilters = () => { setSearch(''); setCity(''); setDistrict(''); setCategory('') }

  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)', padding: '40px 24px 44px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 8 }}>{t('venues.title')}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{t('venues.subtitle')}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('venues.search')} style={{ width: '100%', padding: '11px 12px 11px 36px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, flex: '1 1 380px' }}>
            <select value={city} onChange={e => setCity(e.target.value)} style={{ ...selStyle, flex: 1, minWidth: 0 }}>
              <option value="">{t('common.city')}</option>
              {cities.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!city} style={{ ...selStyle, flex: 1, minWidth: 0, opacity: city ? 1 : 0.5, cursor: city ? 'pointer' : 'not-allowed' }}>
              <option value="">{t('common.district')}</option>
              {neighborhoods.map(n => <option key={n.id} value={String(n.id)}>{n.name}</option>)}
            </select>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...selStyle, flex: 1, minWidth: 0 }}>
              <option value="">{t('common.category')}</option>
              {categories.map(c => <option key={c.id} value={c.name}>{translateCategory(c.name, lang)}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', background: '#fff', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <X size={14} /> {t('common.clear')}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{filtered.length} {t('venues.countLabel')}</div>
          <select value={sort} onChange={e => setSort(e.target.value as 'recommended' | 'rating' | 'newest')} style={{ ...selStyle, padding: '8px 12px', fontSize: 13 }}>
            <option value="recommended">{t('sort.recommended')}</option>
            <option value="rating">{t('sort.rating')}</option>
            <option value="newest">{t('sort.newest')}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb', fontSize: 15 }}>{t('venues.empty')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((v, i) => {
              const cats = (v.sportCategories || []).map((sc: any) => sc?.sportCategory).filter(Boolean)
              const firstCat = cats[0]?.name || ''
              const accent = resolveCategoryColor(cats[0]?.colorHex, firstCat)
              const isReal = typeof v.id === 'number'
              const card = (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', overflow: 'hidden', height: '100%' }}>
                  <div style={{ height: 130, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {v.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.coverImageUrl} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <SportIconBox name={resolveCategoryIcon(cats[0]?.iconUrl, firstCat)} bgColor="transparent" iconColor={accent} boxSize={56} size={30} />
                    )}
                  </div>
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{v.name}</span>
                      {v.isVerified && <BadgeCheck size={16} color="#2563EB" />}
                    </div>
                    {v.neighborhood?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#888', marginBottom: 10 }}>
                        <MapPin size={12} /> {v.neighborhood.name}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {cats.slice(0, 3).map((c: any, idx: number) => {
                        const col = resolveCategoryColor(c.colorHex, c.name)
                        return <span key={idx} style={{ fontSize: 11.5, fontWeight: 600, color: col, background: col + '15', padding: '3px 9px', borderRadius: 100 }}>{translateCategory(c.name, lang)}</span>
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontWeight: 700, color: '#111' }}>{v.avgRating ? Number(v.avgRating).toFixed(1) : '—'}</span>
                      <span style={{ color: '#aaa', fontSize: 12 }}>({v.totalReviews || 0})</span>
                    </div>
                  </div>
                </div>
              )
              return isReal
                ? <Link key={v.id} href={`/venue/${v.id}`} style={{ textDecoration: 'none' }}>{card}</Link>
                : <div key={`m-${i}`}>{card}</div>
            })}
          </div>
        )}
      </div>
    </>
  )
}
