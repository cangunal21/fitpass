import type { Page, Route } from '@playwright/test'

/**
 * API MOCK YARDIMCILARI
 *
 * Testler gerçek backend'e çıkmaz (bkz. playwright.config.ts). Buradaki yardımcılar
 * sunucudan gelen yanıtları kurgular; böylece "dolu ders", "gizli profil", "check-in
 * yapılmamış rezervasyon" gibi durumlar veri hazırlamadan üretilebilir.
 */

const API = 'http://localhost:9'

/** Bir seans nesnesinin sunucudan geldiği hâli (publicController sözleşmesi). */
export function seans(over: Record<string, unknown> = {}) {
  // startsAt UTC olarak verilir. 16:00Z = İstanbul 19:00 → saat dilimi testleri buna dayanıyor.
  return {
    id: 501,
    title: 'Sabah Yogası',
    titleEn: 'Morning Yoga',
    venueId: 301,
    venueName: 'Test Salonu',
    venueAddress: 'Test Adres',
    instructorId: null,
    instructorName: null,
    category: 'Yoga',
    categoryColor: '#C4A882',
    startsAt: '2030-08-12T16:00:00.000Z',
    endsAt: '2030-08-12T17:00:00.000Z',
    durationMinutes: 60,
    basePrice: 200,
    spotsLeft: 6,
    availableSpots: 6,
    capacity: 10,
    neighborhood: 'Kadıköy',
    neighborhoodId: 1,
    rating: 4.6,
    totalReviews: 12,
    description: 'Test açıklaması',
    status: 'open',
    ...over,
  }
}

export function salon(over: Record<string, unknown> = {}) {
  return {
    id: 301,
    name: 'Test Salonu',
    address: 'Test Adres',
    description: 'Salon açıklaması',
    avgRating: 4.6,
    totalReviews: 12,
    isApproved: true,
    isVerified: false, // varsayılan: DOĞRULANMAMIŞ (rozet çıkmamalı)
    neighborhood: { id: 1, name: 'Kadıköy' },
    images: [],
    coverImageUrl: null,
    instructors: [],
    classes: [],
    ...over,
  }
}

/** Tüm public uçları tek yerden karşıla. Her test kendi ihtiyacını `over` ile ezer. */
export async function apiKur(page: Page, over: {
  sessions?: unknown[]
  session?: unknown
  venue?: unknown
  dropInSlot?: { status: number; body?: unknown }
  categories?: unknown[]
  yorumlar?: unknown
} = {}) {
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(`${API}/**`, async (route) => {
    const url = new URL(route.request().url())
    const p = url.pathname

    if (p === '/api/public/categories') return json(route, { categories: over.categories ?? [{ id: 1, name: 'Yoga', colorHex: '#C4A882', iconUrl: null }] })
    if (p === '/api/public/cities') return json(route, { cities: [{ id: 1, name: 'İstanbul' }] })
    if (p === '/api/public/neighborhoods') return json(route, { neighborhoods: [{ id: 1, name: 'Kadıköy' }] })
    if (p === '/api/public/venues-list') return json(route, { venues: [] })
    if (p === '/api/public/venues') return json(route, { venues: [] })
    if (p === '/api/public/sessions') return json(route, { sessions: over.sessions ?? [seans()], total: 1, page: 1, pageSize: 24, hasMore: false })
    if (p.startsWith('/api/public/sessions/')) return json(route, { session: over.session ?? seans() })
    if (p.startsWith('/api/public/venues/')) return json(route, { venue: over.venue ?? salon() })
    if (p.startsWith('/api/public/dropin/')) {
      const d = over.dropInSlot ?? { status: 404, body: { error: 'Slot bulunamadı.' } }
      return json(route, d.body ?? {}, d.status)
    }
    if (p === '/api/public/dropin') return json(route, { slots: [], hasMore: false })
    if (p === '/api/public/for-you') return json(route, { sessions: [] })
    // Yorum + puan özeti. `ratingBreakdown` GERÇEK dağılımdır: web'de bu dağılım bir dönem
    // sabit kodluydu (%75/%18/%5) ve avgRating ne olursa olsun aynı çubuklar çiziliyordu.
    if (p.startsWith('/api/reviews/venue/')) {
      return json(route, over.yorumlar ?? { reviews: [], avgRating: 4.6, totalReviews: 12, ratingBreakdown: { '1': 0, '2': 1, '3': 1, '4': 4, '5': 6 } })
    }

    // Tanımlanmamış uç: boş ama BAŞARILI dönme — sessizce yanlış yorumlanmasın diye 404.
    return json(route, { error: `mock'lanmamış uç: ${p}` }, 404)
  })
}

/** Arayüz dilini sabitle (testler dile bağlı metin arıyor). */
export async function diliAyarla(page: Page, lang: 'tr' | 'en') {
  await page.addInitScript((l) => {
    try { localStorage.setItem('fitpass_lang', l) } catch { /* yoksay */ }
  }, lang)
}

/**
 * Salonun bir DERSİ (getVenueById → venue.classes[] elemanı).
 *
 * `sessions[0].id` KRİTİK: salon sayfasındaki ders kartı bu seansa link verir. Ders id'sine
 * link vermek "çalışıyor gibi" görünüp yanlış kaydı açardı — /ders/[id] getSessionById çağırıyor.
 */
export function salonDersi(over: Record<string, unknown> = {}) {
  return {
    id: 9,
    title: 'Sabah Yogası',
    titleEn: 'Morning Yoga',
    durationMinutes: 60,
    basePrice: 200,
    isActive: true,
    sportCategory: { name: 'Yoga', colorHex: '#C4A882', iconUrl: null },
    instructor: { id: 4, fullName: 'Ayşe Hoca' },
    sessions: [{ id: 777, startsAt: '2030-08-12T16:00:00.000Z', endsAt: '2030-08-12T17:00:00.000Z', spotsLeft: 4, capacity: 10 }],
    ...over,
  }
}
