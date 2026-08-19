'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { mockClasses, mockDropInSlots } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { api, getToken, getUser, saveUser } from '@/lib/api'
import { Search, LayoutGrid, Map, Flame, Clock, Timer, X, BadgeCheck } from 'lucide-react'
import { SportIcon, SportIconBox, getIconKeyForCategory, getColorForCategory } from '@/lib/sportIcons'
import { SkeletonCardGrid } from '@/components/Skeleton'
import { useT, translateCategory, localizeText } from '@/lib/i18n'
import { trToday, trAddDays, trInstant, trWeekday, trTime, trDateFull, haftaSonuAraligi } from '@/lib/trTime'
import type { SessionSummary } from '@/types/api'

const dateLocale = () => (typeof window !== 'undefined' && localStorage.getItem('fitpass_lang') === 'en') ? 'en-US' : 'tr-TR'

// Kategoriler API'dan dinamik olarak yüklenir
interface Category { id: number; name: string; icon: string; color: string; onlineAllowed: boolean }

// PARAMETRE ARTIK `any` DEĞİL: sunucu sözleşmesine bağlı (src/types/api.ts). `any` iken bu
// fonksiyon sözleşmenin bittiği yerdi — alan adı yanlış yazılsa ya da sunucudan kalksa tsc
// göremiyordu. `availableSpots` faciası tam olarak burada, bu satırlarda görünmüştü.
function mapSessionToItem(session: SessionSummary) {
  return {
    id: session.id,
    title: session.title,
    titleEn: session.titleEn || null,
    venueId: session.venueId,
    venue: session.venueName,
    deliveryMode: session.deliveryMode,
    instructorName: session.instructorName,
    neighborhood: session.neighborhood,
    category: session.category,
    icon: getIconKeyForCategory(session.category),
    color: session.categoryColor || getColorForCategory(session.category),
    basePrice: session.basePrice,
    // KALAN yer (sunucu hesaplıyor). availableSpots eskiden TOPLAM KAPASİTE dönüyordu ve
    // burada kalan yer sanılıyordu → dolu ders "10 yer kaldı" görünüyordu. Fallback yalnızca
    // eski backend'e karşı geçiş güvencesi; backend deploy olunca spotsLeft her zaman gelir.
    spots: session.spotsLeft ?? session.availableSpots,
    rating: session.rating || 4.5,
    totalReviews: session.totalReviews || 0,
    time: trTime(session.startsAt, dateLocale()),
    date: trDateFull(session.startsAt, dateLocale()),
    duration: `${session.durationMinutes} dk`,
    isDropIn: false as const,
    sessionId: session.id,
  }
}

// Common display item shape shared between API sessions, mock classes, and drop-ins
interface DisplayItem {
  id: number
  title: string
  // MEKÂNSIZ (bireysel) HOCA DERSİ: salon YOK → ikisi de `null`. Kartta salon satırı
  // çizilmemeli, yerine eğitmen gösterilmeli (sözleşme: venueId === null ⇒ online).
  venueId?: number | null
  venue?: string | null
  /** 'online' = programlı canlı ders. Online kartta mesafe/harita/adres gösterilmez. */
  deliveryMode?: 'in_person' | 'online'
  /** Mekânsız hoca dersinde kartın kimlik satırı SALON değil EĞİTMEN olur. */
  instructorName?: string | null
  // `string | null` — SUNUCU GERÇEĞİ: mahallesi atanmamış salon için `null` geliyor.
  // Burada `string` yazıyordu ve `any` sayesinde kimse fark etmiyordu; sonuç, aşağıdaki
  // kartlarda boşta kalan bir "·" ayracıydı (React `null`'ı hiç basmaz, ayraç kalır).
  neighborhood: string | null
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
  const { t, lang } = useT()
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'list' | 'map'>('list')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [allItems, setAllItems] = useState<DisplayItem[]>([
    ...mockClassItems,
    ...mockDropInItems,
  ])
  const [filters, setFilters] = useState({ category: '', date: '', neighborhoodId: '', cityId: '', search: '' })
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'weekend'>('all')
  const [sort, setSort] = useState<'latest' | 'rating' | 'nearby'>('latest')
  // TESLİM MODU — 'Yüz yüze' | 'Online'. Sunucunun varsayılanı da in_person (mode gönderilmezse
  // online karışmaz), burada AÇIKÇA gönderiyoruz ki niyet okunur olsun.
  // Online modda konum kavramı YOK: şehir/ilçe filtreleri ve "bana yakın" sıralaması gizlenir.
  // ÜÇ SEKME. 'in_person'/'online' teslim biçimi, 'instructors' ise AYRI bir keşif nesnesi
  // (ders değil, eğitmen listesi). Tek state tutuluyor çünkü kullanıcı için hepsi aynı anahtar.
  const [mode, setMode] = useState<'in_person' | 'online' | 'instructors'>('in_person')
  const [instructors, setInstructors] = useState<any[]>([])
  const [instructorsLoading, setInstructorsLoading] = useState(false)
  // Online modda yalnız uygun branşlar listelenir (yüzme/binicilik/deniz sporları/tenis/dövüş
  // fiziksel ya da içerik olarak online'a uymuyor). Kaynağı sunucu, burada sadece süzüyoruz.
  const gorunenKategoriler = mode === 'online' ? categories.filter(c => c.onlineAllowed) : categories
  // fetchSessions'a giden değer: 'instructors' bir TESLİM BİÇİMİ değil; o sekmede ders sorgusu
  // zaten yapılmıyor ama parametre tipi daralmış kalsın diye burada indirgeniyor.
  const dersModu = (m: typeof mode): 'in_person' | 'online' => (m === 'online' ? 'online' : 'in_person')
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])
  const [cities, setCities] = useState<{ id: number; name: string }[]>([])
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [venueResults, setVenueResults] = useState<any[]>([])
  const [allVenues, setAllVenues] = useState<any[]>([])
  const [forYouItems, setForYouItems] = useState<DisplayItem[]>([])
  // ONLINE ŞERİDİ — yüz yüze modda ana akışın üstünde duran küçük vitrin. Bilerek AYRI bir
  // istek: ana listeyi karıştırmak konum filtreleriyle ve mesafe sıralamasıyla çelişirdi
  // (online dersin mahallesi yok). Şerit, online'ı sekmeye gömmeden görünür kılıyor.
  const [onlineItems, setOnlineItems] = useState<DisplayItem[]>([])

  // Kişiselleştirilmiş "Senin için" seansları (giriş yapılmışsa)
  useEffect(() => {
    const token = getToken()
    if (!token) return
    // HAM `fetch` DEĞİL, TİPLİ İSTEMCİ: ham fetch sözleşme katmanını atlıyordu (yanıt `any`,
    // alan adı denetlenmiyor). Ayrıca zaman aşımı, dil başlığı ve tek biçimli hata gövdesi de
    // `request()` içinde. (Jeton yenileme ham fetch'te de vardı — global `installAuthFetch`
    // yaması onu da kapsıyor; oradaki kayıp tip denetimiydi.)
    api.getForYouSessions(token)
      .then(d => {
        if (Array.isArray(d?.sessions) && d.sessions.length > 0) setForYouItems(d.sessions.map(mapSessionToItem))
      })
      .catch(() => {})
  }, [])

  // Online şeridi: yalnız yüz yüze moddayken çekilir (online moddayken ana liste zaten online).
  useEffect(() => {
    if (mode !== 'in_person') { setOnlineItems([]); return }
    // Değişken adı bilerek İNGİLİZCE: i18n tarayıcısı bu dosyada `iptal`i JSX metin düğümü sanıp
    // "çevrilmemiş Türkçe" diye işaretliyordu (CI'da kırmızı, yerelde de tekrarlanabilir).
    // Tarayıcıyı gevşetmek yanlış olurdu — gerçek çevrilmemiş metni de görmez hâle gelirdi.
    let aborted = false
    api.getSessions({ mode: 'online', limit: '8' })
      .then(d => {
        if (aborted) return
        if (Array.isArray(d?.sessions) && d.sessions.length > 0) setOnlineItems(d.sessions.map(mapSessionToItem))
        else setOnlineItems([])
      })
      .catch(() => { if (!aborted) setOnlineItems([]) })
    return () => { aborted = true }
  }, [mode])

  // Fetch neighborhoods + categories on mount
  useEffect(() => {
    api.getCities().then((r: any) => {
      if (r?.cities) setCities([...r.cities].sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr')))
    }).catch(() => {})
    api.getCategories().then((r: any) => {
      if (r?.categories) {
        setCategories(r.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: getIconKeyForCategory(c.name),
          color: c.colorHex || getColorForCategory(c.name),
          // ONLINE UYGUNLUĞU SUNUCUDAN gelir (SportCategory.onlineAllowed) — istemcide sabit
          // liste tutmuyoruz; iki istemcide çiftlenir ve ilkinde bayatlardı.
          onlineAllowed: !!c.onlineAllowed,
        })))
      }
    }).catch(() => {})
    api.getVenues().then((r: any) => {
      if (Array.isArray(r?.venues)) setAllVenues(r.venues)
    }).catch(() => {})
  }, [])

  // Gün sınırları İSTANBUL'a göre kurulur. Eskiden new Date(y, m, d) ile CİHAZIN yerel gece
  // yarısı alınıyordu: kullanıcı yurt dışındayken "Bugün" filtresi yanlış günü gösteriyordu
  // (Toronto'da 20:00 = İstanbul'da ertesi gün 03:00 → tüm gün kayıyor).
  const getDateRange = (filter: string) => {
    const today = trToday()
    const dayStart = (ymd: string) => trInstant(ymd).toISOString()
    if (filter === 'today') return { dateFrom: dayStart(today), dateTo: dayStart(trAddDays(today, 1)) }
    if (filter === 'week') return { dateFrom: dayStart(today), dateTo: dayStart(trAddDays(today, 7)) }
    if (filter === 'weekend') {
      // "Hafta sonu" = İÇİNDE BULUNULAN ya da BİR SONRAKİ hafta sonu.
      //
      // Eskiden `... % 7 || 7` yazıyordu ve `||` sıfırı da yakaladığı için CUMARTESİ GÜNÜ
      // sonuç 7 oluyordu: kullanıcı cumartesi sabahı "Hafta sonu" filtresine bastığında
      // O GÜNKÜ dersler gizleniyor, bir HAFTA SONRASI gösteriliyordu. Pazar günü de aynı
      // şekilde içinde bulunulan hafta sonu atlanıyordu.
      //
      // Doğru davranış:
      //   Pzt–Cum → gelecek Cmt 00:00 .. Paz 23:59
      //   Cmt     → bugün 00:00 .. yarın (Paz) 23:59
      //   Paz     → bugün 00:00 .. bugün 23:59   (hafta sonu bitiyor; bugünü gizleme)
      const { baslangic, bitis } = haftaSonuAraligi(trWeekday(new Date()), today)
      return { dateFrom: dayStart(baslangic), dateTo: dayStart(bitis) }
    }
    return {}
  }

  const fetchSessions = useCallback(async (activeFilters: typeof filters, activeSortParam?: string, activeTimeFilter?: string, pageNum = 1, append = false, activeModeParam?: 'in_person' | 'online') => {
    if (append) setLoadingMore(true); else setLoading(true)
    try {
      const params: Record<string, string> = { page: String(pageNum), limit: '24' }
      if (activeFilters.category) params.category = activeFilters.category
      if (activeFilters.date) params.date = activeFilters.date
      if (activeFilters.neighborhoodId) params.neighborhoodId = activeFilters.neighborhoodId
      if (activeFilters.cityId) params.cityId = activeFilters.cityId
      if (activeFilters.search) params.search = activeFilters.search
      params.mode = activeModeParam ?? 'in_person'
      const sortParam = activeSortParam ?? sort
      if (sortParam && sortParam !== 'latest') params.sort = sortParam
      if (sortParam === 'nearby') {
        // "Bana yakın" HİÇ ÇALIŞMIYORDU: login yanıtında neighborhoodId yoktu, saklanan
        // kullanıcıda da bulunmuyordu → parametre gitmiyor, sunucu mesafe sıralamasını
        // sessizce atlayıp normal sıralama uyguluyordu. Backend artık login'de gönderiyor;
        // ZATEN GİRİŞ YAPMIŞ kullanıcıların saklı kaydı eski olduğu için /me'den bir kez
        // tamamlayıp geri yazıyoruz (bir sonraki aramada localStorage'dan gelir).
        let u = getUser()
        if (u && u.neighborhoodId == null) {
          const t = getToken()
          if (t) {
            try {
              const me: any = await api.getMe(t)
              if (me?.user?.neighborhoodId != null) {
                u = { ...u, neighborhoodId: me.user.neighborhoodId }
                saveUser(u)
              }
            } catch { /* sıralama yine de çalışsın */ }
          }
        }
        if (u?.neighborhoodId) params.userNeighborhoodId = String(u.neighborhoodId)
      }
      const tf = activeTimeFilter ?? timeFilter
      const dateRange = getDateRange(tf)
      if ((dateRange as any).dateFrom) params.dateFrom = (dateRange as any).dateFrom
      if ((dateRange as any).dateTo) params.dateTo = (dateRange as any).dateTo

      const result = await api.getSessions(Object.keys(params).length ? params : undefined)
      const sessions: SessionSummary[] = result?.sessions ?? []
      if (Array.isArray(sessions) && sessions.length > 0) {
        const mapped = sessions.map(mapSessionToItem)
        setAllItems(prev => append ? [...prev, ...mapped] : mapped)
        setHasMore(!!result?.hasMore)
        setPage(pageNum)
      } else if (!append) {
        // Yalnızca ilk sayfada boşsa demo verisine düş (sonraki sayfalarda eklemeyiz)
        console.warn('[fitpass] API boş seans döndü — DEMO verisi gösteriliyor. Filtreler:', activeFilters)
        setAllItems([...mockClassItems, ...mockDropInItems])
        setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      if (!append) {
        console.error('[fitpass] Seanslar yüklenemedi — DEMO verisine düşülüyor:', err)
        setAllItems([...mockClassItems, ...mockDropInItems])
      }
      setHasMore(false)
    } finally {
      if (append) setLoadingMore(false); else setLoading(false)
    }
  }, [])

  // mode AÇIKÇA geçiliyor: fetchSessions boş bağımlılık dizisiyle sarmalandığı için içindeki
  // `mode` İLK render'ın değerinde donar — anahtarı çevirmek hiçbir şey yapmazdı (sessiz kusur).
  // filters/sort/timeFilter de tam bu yüzden parametre olarak geçiliyor.
  const loadMore = () => fetchSessions(filters, sort, timeFilter, page + 1, true, dersModu(mode))

  // Eğitmen listesi — kendi ucundan, ders sorgusundan bağımsız.
  useEffect(() => {
    if (mode !== 'instructors') return
    let aborted = false
    setInstructorsLoading(true)
    api.getInstructors({ ...(filters.category ? { category: filters.category } : {}), ...(filters.search ? { search: filters.search } : {}), limit: '48' })
      .then(d => { if (!aborted) setInstructors(Array.isArray(d?.instructors) ? d.instructors : []) })
      .catch(() => { if (!aborted) setInstructors([]) })
      .finally(() => { if (!aborted) setInstructorsLoading(false) })
    return () => { aborted = true }
  }, [mode, filters.category, filters.search])

  useEffect(() => {
    if (mode === 'instructors') return
    fetchSessions(filters, sort, timeFilter, 1, false, dersModu(mode))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.date, filters.neighborhoodId, filters.cityId, sort, timeFilter, mode])

  // İl'e göre ilçeleri getir (il yoksa İstanbul — geriye uyum). İl değişince ilçe seçimi sıfırlanır (onChange'de).
  useEffect(() => {
    api.getNeighborhoods(filters.cityId || undefined).then((r: any) => {
      if (r?.neighborhoods) setNeighborhoods(r.neighborhoods)
    }).catch(() => {})
  }, [filters.cityId])

  // Debounce search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }))
      fetchSessions({ ...filters, search: searchInput }, sort, timeFilter, 1, false, dersModu(mode))
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
    fetchSessions(newFilters, sort, timeFilter, 1, false, dersModu(mode))
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
            {t('home.heroTitle')}
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 28, fontWeight: 400 }}>
            {t('home.heroSubtitle')}
          </p>
          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex' }}><Search size={18} /></span>
            <input
              type="text"
              placeholder={t('home.search1')}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: 100, border: 'none', fontSize: 15, outline: 'none', backgroundColor: '#fff', color: '#1a1a1a', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', boxSizing: 'border-box' }}
            />
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
              {t('time.all')}
            </button>
            {gorunenKategoriler.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryTabClick(activeCategory === cat.id ? null : cat.id)}
                className="category-tab-item"
                style={{ padding: '16px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeCategory === cat.id ? cat.color : '#666', borderBottom: activeCategory === cat.id ? `2px solid ${cat.color}` : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <SportIcon name={cat.icon} size={16} color={activeCategory === cat.id ? cat.color : '#666'} />{translateCategory(cat.name, lang)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TESLİM MODU ANAHTARI — filtre barının ÜSTÜNDE, çünkü altındaki filtrelerin hangileri
          anlamlı olduğunu bu belirliyor: online modda şehir/ilçe ve "bana yakın" yok. */}
      <div style={{ backgroundColor: '#fff', padding: '14px 24px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {([
            { key: 'in_person' as const, label: t('home.modeInPerson') },
            { key: 'online' as const, label: t('home.modeOnline') },
            { key: 'instructors' as const, label: t('home.modeInstructors') },
          ]).map(m => (
            <button
              key={m.key}
              onClick={() => {
                if (m.key === mode) return
                setMode(m.key)
                // Online'a geçerken konum filtrelerini ve "bana yakın" sıralamasını DÜŞÜR:
                // aksi halde seçili bir ilçe online listeyi sunucuda tamamen boşaltır
                // (online dersin mahallesi yok) ve kullanıcı "hiç ders yok" sanır.
                if (m.key === 'online') {
                  setFilters(f => ({ ...f, cityId: '', neighborhoodId: '' }))
                  setSort(prev => (prev === 'nearby' ? 'latest' : prev))
                  // Seçili branş online'a uygun değilse TEMİZLE. Aksi halde filtre görünmez bir
                  // yerde ("Yüzme") takılı kalır, liste boş döner ve kullanıcı sebebini göremez —
                  // seçenek listeden kalktığı için geri de alamaz.
                  const secili = categories.find(c => c.name === filters.category)
                  if (secili && !secili.onlineAllowed) {
                    setFilters(f => ({ ...f, cityId: '', neighborhoodId: '', category: '' }))
                    setActiveCategory(null)
                  }
                }
              }}
              aria-pressed={mode === m.key}
              style={{
                padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === m.key ? '#fff' : 'transparent',
                color: mode === m.key ? '#4F46E5' : '#666',
                fontSize: 14, fontWeight: 600,
                boxShadow: mode === m.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0', padding: '12px 24px 0' }}>
        <div className="filter-bar" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input
              type="text"
              placeholder={t('home.search2')}
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
              fetchSessions(newFilters, sort, timeFilter, 1, false, dersModu(mode))
            }}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.category ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff' }}
          >
            <option value="">{t('common.category')}</option>
            {gorunenKategoriler.map(cat => (
              <option key={cat.id} value={cat.name}>{translateCategory(cat.name, lang)}</option>
            ))}
          </select>

          {/* KONUM FİLTRELERİ yalnız yüz yüze modda. Online derste şehir/ilçe kavramı yok;
              gösterilirse kullanıcı seçer ve liste sessizce boşalır. */}
          {mode === 'in_person' && (
          <select
            value={filters.cityId}
            onChange={e => setFilters(f => ({ ...f, cityId: e.target.value, neighborhoodId: '' }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.cityId ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff' }}
          >
            <option value="">{t('common.city')}</option>
            {cities.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          )}

          {mode === 'in_person' && (
          <select
            value={filters.neighborhoodId}
            onChange={e => setFilters(f => ({ ...f, neighborhoodId: e.target.value }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.neighborhoodId ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff', maxHeight: 300 }}
            size={1}
          >
            <option value="">{t('common.district')}</option>
            {[...neighborhoods].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(n => (
              <option key={n.id} value={String(n.id)}>{n.name}</option>
            ))}
          </select>
          )}

          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: filters.date ? '#1a1a1a' : '#888', outline: 'none', cursor: 'pointer', background: '#fff' }}
          />

          <div className="filter-sort" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 13, color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>{t('common.sortBy')}</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 13, color: '#1a1a1a', outline: 'none', cursor: 'pointer', background: '#fff' }}
            >
              <option value="latest">{t('sort.date')}</option>
              <option value="rating">{t('sort.rating')}</option>
              {/* "Bana yakın" online modda anlamsız — mesafe hesabı salonun mahallesinden gelir. */}
              {mode === 'in_person' && <option value="nearby">{t('sort.nearby')}</option>}
            </select>
          </div>

          {hasActiveFilter && (
            <button
              onClick={() => {
                setFilters({ category: '', date: '', neighborhoodId: '', cityId: '', search: '' })
                setSearchInput('')
                setActiveCategory(null)
                setTimeFilter('all')
                setSort('latest')
                // Mod BİLEREK sıfırlanmıyor: "temizle" filtreleri temizler, sekmeyi değiştirmez.
                fetchSessions({ category: '', date: '', neighborhoodId: '', cityId: '', search: '' }, 'latest', 'all', 1, false, dersModu(mode))
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #EEE', background: '#F5F5F5', fontSize: 13, color: '#666', cursor: 'pointer', fontWeight: 500 }}
            >
              <X size={14} /> {t('common.clear')}
            </button>
          )}
        </div>

        {/* Time filter pills */}
        <div className="time-filters" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {([
            { key: 'all', label: t('time.all') },
            { key: 'today', label: t('time.today') },
            { key: 'week', label: t('time.week') },
            { key: 'weekend', label: t('time.weekend') },
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
            <span style={{ fontSize: 15, fontWeight: 700, color: '#888' }}>{t('home.venues')}</span>
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
              <span style={{ fontSize: 20, fontWeight: 700, color: '#aaa' }}>{t('common.loading')}</span>
            ) : (
              <>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{filtered.length} {t('home.events')}</span>
                {activeCategory && <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>· {categories.find(c => c.id === activeCategory)?.name}</span>}
                {filters.search && <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>· {t('home.searchFor').replace('{q}', filters.search)}</span>}
              </>
            )}
          </div>
          <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: 12, padding: 3, gap: 2 }}>
            {(['list', 'map'] as const).map(view => (
              <button key={view} onClick={() => setActiveView(view)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: activeView === view ? '#fff' : 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeView === view ? '#1a1a1a' : '#888', boxShadow: activeView === view ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {view === 'list' ? <><LayoutGrid size={14} style={{ marginRight: 4 }} />{t('view.list')}</> : <><Map size={16} style={{ marginRight: 4 }} />{t('view.map')}</>}
              </button>
            ))}
          </div>
        </div>

        {forYouItems.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>✨ {t('home.forYou')}</h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>{t('home.forYouSub')}</p>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
              {forYouItems.map(item => (
                <Link key={'fy-' + item.id} href={`/ders/${item.id}`} style={{ textDecoration: 'none', flex: '0 0 240px' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                    <div style={{ background: item.color, padding: '16px 16px 14px' }}>
                      <SportIconBox name={item.icon} bgColor='rgba(255,255,255,0.2)' iconColor='#fff' boxSize={40} borderRadius={12} size={18} />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '10px 0 2px', lineHeight: 1.3 }}>{lang === 'en' && item.titleEn ? String(item.titleEn) : item.title}</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{'venue' in item && typeof item.venue === 'string' ? item.venue : ''}{item.neighborhood ? ` · ${item.neighborhood}` : ''}</p>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#666', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {'time' in item ? localizeText(item.time as string, lang) : ''}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>₺{item.basePrice}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {mode === 'in_person' && onlineItems.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>💻 {t('home.onlineStrip')}</h2>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
              {onlineItems.map(item => (
                <Link key={'on-' + item.id} href={`/ders/${item.id}`} style={{ textDecoration: 'none', flex: '0 0 240px' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                    <div style={{ background: item.color, padding: '16px 16px 14px' }}>
                      <SportIconBox name={item.icon} bgColor='rgba(255,255,255,0.2)' iconColor='#fff' boxSize={40} borderRadius={12} size={18} />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '10px 0 2px', lineHeight: 1.3 }}>{lang === 'en' && item.titleEn ? String(item.titleEn) : item.title}</h3>
                      {/* Online kartta salon/mahalle YOK — kimlik satırı eğitmendir. */}
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{item.instructorName || ''}</p>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#666', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {'time' in item ? localizeText(item.time as string, lang) : ''}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>₺{item.basePrice}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {mode === 'instructors' ? (
          instructorsLoading ? (
            <SkeletonCardGrid count={6} />
          ) : instructors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888', fontSize: 14 }}>{t('home.noInstructors')}</div>
          ) : (
            <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {instructors.map((ins: any) => (
                <Link key={'ins-' + ins.id} href={`/instructor/${ins.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #F0F0F0', display: 'flex', gap: 14, alignItems: 'center' }}>
                    {ins.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ins.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                        {(ins.fullName || '?').trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.fullName}</span>
                        {ins.verified && <BadgeCheck size={15} color="#2563EB" />}
                      </div>
                      {/* Mekânsız hocada salon YOK — "Bağımsız eğitmen" yazıyoruz; boş satır
                          bırakmak kartı kırık gösterirdi. */}
                      <div style={{ fontSize: 12.5, color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ins.venueName || t('home.instructorIndependent')}{ins.neighborhood ? ` · ${ins.neighborhood}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                        {lang === 'en' && ins.specialtyEn ? ins.specialtyEn : (ins.specialty || '')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>★ {(ins.avgRating ?? 0).toFixed(1)}</div>
                      <div style={{ fontSize: 11, color: '#bbb' }}>({ins.totalReviews || 0})</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{t('home.instructorClasses').replace('{n}', String(ins.classCount ?? 0))}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : loading ? (
          <SkeletonCardGrid count={6} />
        ) : activeView === 'list' ? (
          <>
          <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(item => {
              const href = item.isDropIn ? `/dropin/${item.id}` : `/ders/${item.id}`
              const price = item.isDropIn ? ('pricePerPerson' in item ? item.pricePerPerson : item.basePrice) : item.basePrice
              const isFull = item.spots === 0
              const isLowSpots = !isFull && item.spots <= 3
              return (
                <div key={item.id + (item.isDropIn ? '-drop' : '')}>
                  {/* "STRETCHED LINK" KALIBI — kart eskiden tümüyle <Link> ile sarılıydı ve İÇİNDE
                      başka bir <Link> (salon) + İKİ <button> (favori, rezervasyon) vardı. HTML'de
                      <a> içine <a> ya da <button> koymak GEÇERSİZ: React hidrasyon hatası veriyordu
                      ("<a> cannot be a descendant of <a>") ve iç içe interaktif öğeler klavye
                      gezinmesini bozuyordu. Çözüm: kart artık düz bir <div>; ders bağlantısı kartı
                      kaplayan MUTLAK KONUMLU tek bir <a>. Böylece hâlâ GERÇEK bir link (sağ tık →
                      yeni sekme, orta tık, SEO, prefetch korunur) ama hiçbir şeyi sarmıyor.
                      Salon linki ve butonlar üstte (zIndex 2) kalıp normal çalışır. */}
                  <div
                    style={{ position: 'relative', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #F0F0F0', cursor: 'pointer', transition: 'all 0.2s', opacity: isFull ? 0.75 : 1 }}
                    onMouseEnter={e => { if (!isFull) { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; el.style.borderColor = '#E0E0E0' } }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = '#F0F0F0' }}
                  >
                    {/* Kartı kaplayan asıl bağlantı (görünmez, tüm yüzeyi tıklanabilir yapar) */}
                    <Link
                      href={href}
                      aria-label={lang === 'en' && item.titleEn ? String(item.titleEn) : item.title}
                      style={{ position: 'absolute', inset: 0, zIndex: 1, textDecoration: 'none' }}
                    />

                    {/* Kart header - solid color */}
                    <div style={{ background: item.color, padding: '22px 20px 18px', position: 'relative', minHeight: 100 }}>
                      {item.isDropIn && (
                        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: item.color, background: 'rgba(255,255,255,0.95)', padding: '3px 9px', borderRadius: 20 }}>
                          DROP-IN {'format' in item ? item.format : ''}
                        </span>
                      )}
                      {isFull && (
                        <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '3px 9px', borderRadius: 20 }}>
                          {t('card.full')}
                        </span>
                      )}
                      {isLowSpots && (
                        <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Flame size={12} /> {t('card.lastSpots').replace('{n}', String(item.spots))}
                        </span>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <SportIconBox name={item.icon} bgColor='rgba(255,255,255,0.2)' iconColor='#fff' boxSize={48} borderRadius={14} size={22} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{lang === 'en' && item.titleEn ? String(item.titleEn) : item.title}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {item.deliveryMode === 'online' && (
                          <span style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, letterSpacing: 0.2 }}>
                            {t('home.onlineBadge')}
                          </span>
                        )}
                        {/* MEKÂNSIZ HOCA DERSİ: salon yok → kimlik satırı eğitmenin adı. Eskiden
                            burası salon adına bakıyordu ve online kartta BOŞ bir satır kalırdı. */}
                        {'venueId' in item && item.venueId ? (
                          <Link href={`/venue/${item.venueId}`} onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 2, color: 'rgba(255,255,255,0.9)', textDecoration: 'underline', fontWeight: 600 }}>
                            {'venue' in item && typeof item.venue === 'string' ? item.venue : ''}
                          </Link>
                        ) : (
                          <span>{item.instructorName || ('venue' in item && typeof item.venue === 'string' ? item.venue : '')}</span>
                        )}
                        {item.neighborhood ? <span>· {item.neighborhood}</span> : null}
                      </p>
                    </div>

                    {/* Kart body */}
                    <div style={{ padding: '16px 20px 20px' }}>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={16} /> {'time' in item ? localizeText(item.time as string, lang) : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Timer size={16} /> {'duration' in item ? localizeText(item.duration as string, lang) : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                          ★ {item.rating}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>₺{price}</span>
                          <span style={{ fontSize: 12, color: '#aaa', marginLeft: 3 }}>{t('card.perPerson')}</span>
                          {!isFull && isLowSpots && (
                            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 2 }}>{t('card.spotsLeft').replace('{n}', String(item.spots))}</div>
                          )}
                        </div>
                        {isFull ? (
                          <button
                            onClick={async (e) => {
                              e.preventDefault()
                              const token = localStorage.getItem('fitpass_token')
                              if (!token) { router.push(`/giris?redirect=/`); return }
                              // Sarmalayıcı üzerinden: ham fetch, sessiz jeton yenilemeyi ve
                              // JSON-dışı yanıt korumasını atlıyordu (bu blok tek başına kalmıştı).
                              const data = await api.joinWaitlist(token, Number(item.sessionId || item.id))
                              if (data?.error) { alert(data.error); return }
                              alert(t('home.waitlistAdded'))
                            }}
                            style={{ position: 'relative', zIndex: 2, padding: '9px 18px', borderRadius: 12, border: '1.5px solid #F59E0B', background: '#FFFBEB', color: '#D97706', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                          >
                            🔔 {t('card.waitlist').replace('🔔 ','')}
                          </button>
                        ) : (
                          <button
                            onClick={e => handleCardBookingClick(e, item)}
                            style={{ position: 'relative', zIndex: 2, padding: '9px 18px', borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                          >
                            {item.isDropIn ? t('card.join') : t('card.book')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button onClick={loadMore} disabled={loadingMore} style={{ padding: '12px 32px', borderRadius: 100, border: '1.5px solid #4F46E5', background: '#fff', color: '#4F46E5', fontSize: 15, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1 }}>
                {loadingMore ? t('common.loading') : t('home.loadMore')}
              </button>
            </div>
          )}
          </>
        ) : (
          <div style={{ backgroundColor: '#F0F7FF', borderRadius: 24, height: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #BFDBFE', gap: 12 }}>
            <Map size={56} color="#93C5FD" />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1E40AF', margin: 0 }}>{t('map.title')}</p>
            <p style={{ fontSize: 14, color: '#93C5FD', margin: 0 }}>{t('map.soon')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #F0F0F0', backgroundColor: '#fff', padding: '32px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          { }<img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 30, width: 'auto', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#aaa' }}>{t('footer.tagline')}</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/salon-giris" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>{t('footer.venueApply')}</Link>
            <Link href="/admin" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>{t('footer.admin')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
