import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * NOT — `installAuthFetch()` modül başına BİR KEZ kurulur (çift kurulum koruması var, doğru
 * davranış). Bu yüzden her test kendi modül örneğini alır: `vi.resetModules()` + dinamik import.
 * Aksi halde ikinci testte yama, testin YENİ mock'unu sarmalamıyor ve sessizce devre dışı kalıyor.
 */
async function apiModulu() {
  vi.resetModules()
  return await import('./api')
}

/**
 * REALM-DUYARLI JETON YENİLEME — web tarafı regresyon testi.
 *
 * Bu mantık web'de İKİ KEZ gerçekten bozuldu:
 *   1) realm tespiti URL'e düştü → salon paneli 401'inde ÜYE jetonuyla yenileme denendi,
 *      başarısız olunca salon görevlisi üye giriş sayfasına atıldı.
 *   2) `endSession` yanlış realm'in anahtarlarını sildi → salon panelindeki bir 401,
 *      kullanıcının kendi oturumunu da kapattı.
 * Mobil ikizinde bu senaryoların regresyon testi VARDI; web'de hiç birim testi koşucusu
 * yoktu ve aynı hata sessizce geri gelebilirdi. Parite denetimi bu boşluğu buldu.
 */

// Gerçek JWT payload'ı — imza doğrulanmıyor, yalnız realm okunuyor.
function jeton(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.imza`
}

const USER_TOK = jeton({ userId: 7, email: 'u@x.com' })
const VENUE_TOK = jeton({ venueId: 42, email: 'v@x.com', role: 'venue' })

const API = 'http://localhost:3001'
let cagrilar: { url: string; body?: any }[] = []

function fetchKur(opts: { yenilemeBasarili?: boolean } = {}) {
  const { yenilemeBasarili = true } = opts
  cagrilar = []
  globalThis.fetch = vi.fn(async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input.url
    cagrilar.push({ url, body: init?.body ? JSON.parse(init.body) : undefined })
    if (url.includes('/refresh')) {
      // json() DE verilmeli: doRefresh `res.json()` kullanıyor. Yalnız text() veren bir mock,
      // yenilemeyi sessizce başarısız kılıp testi YANLIŞ sebeple kırmızıya çekiyordu.
      const govde = { token: 'YENI-ACCESS', refreshToken: 'YENI-REFRESH' }
      if (!yenilemeBasarili) return { ok: false, status: 401, text: async () => '{}', json: async () => ({}) } as any
      return { ok: true, status: 200, text: async () => JSON.stringify(govde), json: async () => govde } as any
    }
    const auth = init?.headers?.Authorization || ''
    const yenilenmis = String(auth).includes('YENI-ACCESS')
    return { ok: yenilenmis, status: yenilenmis ? 200 : 401, text: async () => JSON.stringify(yenilenmis ? { ok: true } : { error: 'yetkisiz' }) } as any
  }) as any
}

describe('realm-duyarlı yenileme (web)', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { vi.restoreAllMocks() })

  it('SALON jetonuyla çağrılan realm-öneksiz uç SALON olarak yenilenir', async () => {
    fetchKur()
    localStorage.setItem('fitpass_venue_refresh', 'salon-refresh')
    const { installAuthFetch } = await apiModulu()
    installAuthFetch()

    await fetch(`${API}/api/bookings/checkin`, { method: 'POST', headers: { Authorization: `Bearer ${VENUE_TOK}` } })

    const yenileme = cagrilar.find(c => c.url.includes('/refresh'))
    expect(yenileme).toBeDefined()
    // KRİTİK: yol "/api/bookings/..." olsa da jeton SALONA ait → salon ucu kullanılmalı
    expect(yenileme!.url).toContain('/api/venue/refresh')
    expect(yenileme!.body.refreshToken).toBe('salon-refresh')
  })

  it('yenileme sonrası YENİ refresh jetonu saklanır (döndürme)', async () => {
    fetchKur()
    localStorage.setItem('fitpass_refresh', 'eski-refresh')
    const { installAuthFetch } = await apiModulu()
    installAuthFetch()

    await fetch(`${API}/api/bookings/my`, { headers: { Authorization: `Bearer ${USER_TOK}` } })

    // Saklanmazsa bir sonraki yenileme sunucuda REPLAY sayılır ve oturum zinciri kapanır.
    expect(localStorage.getItem('fitpass_refresh')).toBe('YENI-REFRESH')
    expect(localStorage.getItem('fitpass_token')).toBe('YENI-ACCESS')
  })

  it('request() JSON-dışı yanıtta çökmez, {error} döner', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 502, text: async () => '<html>bad gateway</html>' })) as any
    const { request } = await apiModulu()
    const r = await request('/api/public/cities')
    expect(r).toHaveProperty('error')
    expect(typeof r.error).toBe('string')
  })

  it('ağ hatasında istisna FIRLATMAZ — çağıran sayfa çökmesin', async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError('Failed to fetch') }) as any
    const { request } = await apiModulu()
    const r = await request('/api/public/cities')
    expect(r).toHaveProperty('error')
  })
})
