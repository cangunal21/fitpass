const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const DEFAULT_TIMEOUT = 15000

// Tek noktadan güvenli istek: timeout + ağ hatası + JSON-dışı yanıt yakalanır.
// ASLA exception fırlatmaz → çağıran sayfalar offline/timeout/502'de çökmez,
// tutarlı `{ error }` alır. (Çöp yığını whack-a-mole yerine oturan sistem.)
// Sessiz yenileme: access token 401 dönünce refresh token ile yenisini al.
// Eşzamanlı 401'ler tek bir refresh çağrısını paylaşır (refreshPromise).
let refreshPromise: Promise<string | null> | null = null
async function doRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const rt = localStorage.getItem('fitpass_refresh')
  if (!rt) return null
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.token) { localStorage.setItem('fitpass_token', data.token); return data.token }
    return null
  } catch { return null }
}

// Arayüz dilini backend'e bildir. Backend (authMiddleware.syncLocale) bunu kullanıcının kayıtlı
// diliyle karşılaştırır ve DEĞİŞTİYSE günceller → e-posta/push kullanıcının o anki diliyle gider.
// Ayrı bir "dili kaydet" çağrısı yok: dil değişimi kendiliğinden ilk istekte senkronlanır.
//
// YALNIZCA ZATEN PREFLIGHT YAPAN İSTEKLERE eklenir (Authorization veya Content-Type taşıyanlar).
// Sebep: X-Locale CORS-safelisted DEĞİL; anonim public GET'lere (ana sayfa, ders/salon listesi)
// eklemek onları "basit istek" olmaktan çıkarıp her birine OPTIONS preflight ekler → public
// sayfalarda her çağrı 2 tura çıkardı. Auth'lu istekler ve JSON POST'lar zaten preflight'lı,
// orada ek maliyet YOK. Dil senkronu zaten yalnız girişli kullanıcı için anlamlı (User'a yazılır).
function localeHeader(existing?: HeadersInit): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const h = (existing || {}) as Record<string, string>
  const preflighted = !!(h.Authorization || h['Content-Type'] || h['content-type'])
  if (!preflighted) return {}
  try {
    const l = localStorage.getItem('fitpass_lang')
    return l ? { 'X-Locale': l } : {}
  } catch { return {} }
}

// Oturum gerçekten bittiğinde: yerel oturumu temizle + girişe yönlendir.
function endSession() {
  if (typeof window === 'undefined') return
  const p = window.location.pathname
  if (p.startsWith('/giris') || p.startsWith('/kayit') || p.startsWith('/salon') || p.startsWith('/admin')) return
  localStorage.removeItem('fitpass_token')
  localStorage.removeItem('fitpass_user')
  localStorage.removeItem('fitpass_refresh')
  window.location.href = '/giris?expired=1'
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL AUTH-FETCH YAMASI — sessiz token yenilemenin TEK ve KAPSAYICI yeri.
//
// SORUN: Kullanıcı access token'ı 1 saat (kısa tutuluyor çünkü JWT iptal edilemez). Sessiz yenileme
// yalnız `request()` helper'ının içindeydi; oysa web'de yetkili çağrıların ÇOĞU (rezervasyon POST'u
// dahil, ~56 nokta) doğrudan `fetch(...)` ile yazılmış ve helper'ı atlıyordu. Sonuç: kullanıcı 1 saat
// sonra hiçbir uyarı almadan işlem yapamıyor, istekler sessizce 401 alıyordu.
//
// NEDEN 56 ÇAĞRIYI TEK TEK TAŞIMADIM: o yaklaşım (a) 56 dosyada riskli değişiklik, (b) bir tanesini
// atlarsan sessizce bozuk kalır, (c) YARIN yazılacak yeni bir ham fetch yine kapsam dışı kalır.
// Yama tek noktada, geriye ve İLERİYE dönük kapsıyor — doğru derinlik burası.
//
// Yalnız KENDİ API'mize giden ve Authorization taşıyan istekleri ele alır; başka origin'lere
// (Cloudinary vb.) ve anonim isteklere DOKUNMAZ.
// ─────────────────────────────────────────────────────────────────────────────
let installed = false
export function installAuthFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const native = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const headers = (init?.headers || {}) as Record<string, string>
    const isOurApi = typeof url === 'string' && url.startsWith(API_URL)
    const hasAuth = !!(headers.Authorization || headers.authorization)
    const isRefresh = typeof url === 'string' && url.includes('/api/auth/refresh')
    // Request nesnesiyle çağrılan (nadir) istekleri ellemeyiz: header'ını güvenle yeniden yazamayız.
    const plain = typeof input === 'string' || input instanceof URL

    if (!isOurApi || !hasAuth || isRefresh || !plain) {
      return native(input as any, init)
    }

    const res = await native(input as any, init)
    if (res.status !== 401) return res

    // Access token süresi dolmuş olabilir → tek bir paylaşılan yenileme, sonra TEK tekrar deneme.
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
    const newToken = await refreshPromise
    if (!newToken) { endSession(); return res }

    // Tekrar deneme YAMALI fetch'i değil `native`'i çağırır → yama hiç yeniden girilmez,
    // sonsuz döngü imkânsız (işaretçi başlığa gerek yok, sunucuya çöp başlık gitmez).
    return native(input as any, {
      ...init,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    })
  }
}

export async function request(path: string, opts: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    // 401 → yenile → tekrar dene mantığı ARTIK BURADA DEĞİL: global yama (installAuthFetch) yapıyor.
    // Böylece helper'ı kullanan da kullanmayan da aynı korumaya sahip, mantık tek yerde.
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers: { ...localeHeader(opts.headers), ...(opts.headers as object) }, signal: controller.signal })
    const text = await res.text()
    let body: any = null
    if (text) { try { body = JSON.parse(text) } catch { body = null } }
    if (body !== null && typeof body === 'object') return body
    return { error: res.ok ? null : 'Sunucuya ulaşılamadı. Lütfen tekrar dene.' }
  } catch (e: any) {
    if (e?.name === 'AbortError') return { error: 'İstek zaman aşımına uğradı. Bağlantını kontrol et.' }
    return { error: 'Bağlantı hatası. İnternetini kontrol et.' }
  } finally {
    clearTimeout(timer)
  }
}

const jsonHeaders = (token?: string | null): Record<string, string> =>
  ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) })
const authHeaders = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` })
const qsOf = (params?: Record<string, string | undefined>) =>
  params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : ''

export const api = {
  register: (data: { username: string; email: string; password: string; fullName: string; phone?: string; referralCode?: string; preferredSports?: string[]; preferredNeighborhoods?: number[] }) =>
    request('/api/auth/register', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) }),

  getMe: (token: string) =>
    request('/api/auth/me', { headers: authHeaders(token) }),

  getMyBookings: (token: string) =>
    request('/api/bookings/my', { headers: authHeaders(token) }),

  // Puanlanmayı bekleyen dersler (katıldı + bitti + puansız) → puanlama modalını besler
  getPendingReviews: (token: string) =>
    request('/api/reviews/pending', { headers: authHeaders(token) }),

  // Çift puanlama: salon (zorunlu) + hoca (opsiyonel), iki ayrı yorum
  createReview: (token: string, data: {
    bookingId: number
    venueRating: number; venueComment?: string
    instructorRating?: number; instructorComment?: string
    isAnonymous?: boolean
  }) =>
    request('/api/reviews', { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(data) }),

  getMyCalendar: (token: string) =>
    request('/api/social/my-calendar', { headers: authHeaders(token) }),

  deleteAccount: (token: string, password: string) =>
    request('/api/auth/account', { method: 'DELETE', headers: jsonHeaders(token), body: JSON.stringify({ password }) }),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    request('/api/auth/change-password', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(data) }),

  cancelBooking: (token: string, bookingId: number) =>
    request(`/api/bookings/${bookingId}/cancel`, { method: 'PUT', headers: authHeaders(token) }),

  getSessions: (params?: { category?: string; date?: string; dateFrom?: string; dateTo?: string; neighborhoodId?: string; cityId?: string; search?: string; sort?: string; userNeighborhoodId?: string }) =>
    request(`/api/public/sessions${qsOf(params)}`),

  getSessionById: (id: number) =>
    request(`/api/public/sessions/${id}`),

  getVenues: () =>
    request('/api/public/venues'),

  getVenueById: (id: number) =>
    request(`/api/public/venues/${id}`),

  getCategories: () =>
    request('/api/public/categories'),

  getDropInSlots: () =>
    request('/api/public/dropin'),

  joinDropIn: (token: string, slotId: number) =>
    request(`/api/bookings/dropin/${slotId}/join`, { method: 'POST', headers: jsonHeaders(token) }),

  getNeighborhoods: (cityId?: string | number) =>
    request(`/api/public/neighborhoods${cityId ? `?cityId=${cityId}` : ''}`),

  getCities: () =>
    request('/api/public/cities'),

  getVenuesList: () =>
    request('/api/public/venues-list'),

  getDropInSlotById: (id: number) =>
    request(`/api/public/dropin/${id}`),

  getUserActivities: (username: string) =>
    request(`/api/public/users/${username}`),

  updatePrivacy: (token: string, activityPrivacy: string) =>
    request('/api/auth/privacy', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ activityPrivacy }) }),
  updateProfilePrivacy: (token: string, profilePrivacy: string) =>
    request('/api/auth/privacy', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ profilePrivacy }) }),

  forgotPassword: (email: string) =>
    request('/api/auth/forgot-password', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    request('/api/auth/reset-password', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ token, password }) }),

  followUser: (token: string, username: string) =>
    request(`/api/social/follow/${username}`, { method: 'POST', headers: authHeaders(token) }),

  unfollowUser: (token: string, username: string) =>
    request(`/api/social/unfollow/${username}`, { method: 'DELETE', headers: authHeaders(token) }),

  getFollowStatus: (token: string, username: string) =>
    request(`/api/social/status/${username}`, { headers: authHeaders(token) }),

  getFollowers: (username: string, token?: string | null) =>
    request(`/api/social/followers/${username}`, { headers: jsonHeaders(token) }),

  getFollowing: (username: string, token?: string | null) =>
    request(`/api/social/following/${username}`, { headers: jsonHeaders(token) }),

  getFollowRequests: (token: string) =>
    request(`/api/social/follow-requests`, { headers: authHeaders(token) }),
  acceptFollowRequest: (token: string, username: string) =>
    request(`/api/social/follow-requests/${username}/accept`, { method: 'POST', headers: authHeaders(token) }),
  rejectFollowRequest: (token: string, username: string) =>
    request(`/api/social/follow-requests/${username}/reject`, { method: 'POST', headers: authHeaders(token) }),

  updateProfile: (token: string, data: { fullName?: string; bio?: string; neighborhoodId?: number; avatarUrl?: string }) =>
    request('/api/auth/profile', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(data) }),
}

export const saveToken = (token: string) => { if (typeof window !== 'undefined') localStorage.setItem('fitpass_token', token) }
export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('fitpass_token') : null
export const removeToken = () => { if (typeof window !== 'undefined') localStorage.removeItem('fitpass_token') }
export const saveUser = (user: object) => { if (typeof window !== 'undefined') localStorage.setItem('fitpass_user', JSON.stringify(user)) }
export const getUser = () => { if (typeof window === 'undefined') return null; const u = localStorage.getItem('fitpass_user'); return u ? JSON.parse(u) : null }
export const removeUser = () => { if (typeof window !== 'undefined') localStorage.removeItem('fitpass_user') }
export const saveRefreshToken = (t: string) => { if (typeof window !== 'undefined' && t) localStorage.setItem('fitpass_refresh', t) }
export const removeRefreshToken = () => { if (typeof window !== 'undefined') localStorage.removeItem('fitpass_refresh') }
// Çıkış: refresh token'ı sunucuda iptal et + yerel oturumu tamamen temizle
export const apiLogout = async () => {
  const rt = typeof window !== 'undefined' ? localStorage.getItem('fitpass_refresh') : null
  // Yerel oturumu ÖNCE temizle: eskiden sunucu logout POST'u await ediliyordu ve timeout yoktu →
  // sunucu takılırsa yerel token/user/refresh HİÇ silinmez, kullanıcı "çıktım" sanıp içeride kalırdı.
  removeToken(); removeUser(); removeRefreshToken()
  // Sonra best-effort: refresh token'ı sunucuda iptal et (5sn timeout; başarısızsa yoksay).
  if (rt) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 5000)
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }), signal: ctrl.signal })
      clearTimeout(timer)
    } catch { /* yoksay — yerel zaten temizlendi */ }
  }
}
