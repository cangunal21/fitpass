// Taşıma-katmanı hataları React dışında üretiliyor (useT yok) → sözlüğü doğrudan oku.
// Eskiden bu üç metin SABİT TÜRKÇE idi; EN kullanıcısı offline/timeout durumunda Türkçe görüyordu.
import { tSync } from './i18n'
// API SÖZLEŞMESİ — üç repoda birebir aynı dosya (bkz. scripts/tip-damgasi.cjs).
import type { ApiResult, SessionListResponse, SessionDetailResponse, ForYouResponse, VenueReviewsResponse, FavoritesResponse, VenueListResponse, VenueDetailResponse, MyBookingsResponse, WaitlistStatusResponse, WaitlistActionResponse } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const DEFAULT_TIMEOUT = 15000

// Tek noktadan güvenli istek: timeout + ağ hatası + JSON-dışı yanıt yakalanır.
// ASLA exception fırlatmaz → çağıran sayfalar offline/timeout/502'de çökmez,
// tutarlı `{ error }` alır. (Çöp yığını whack-a-mole yerine oturan sistem.)
// Sessiz yenileme: access token 401 dönünce refresh token ile yenisini al.
// Eşzamanlı 401'ler realm BAŞINA tek bir refresh çağrısını paylaşır.
//
// REALM-DUYARLI (#30): eskiden tek bir yol vardı — hep `fitpass_refresh` + /api/auth/refresh,
// hata olunca da ÜYE oturumu kapatılırdı. Salon/eğitmen panelinde 401 alınınca yanlış realm'in
// jetonuyla yenileme deneniyor, sonra ÜYE oturumu siliniyor ve kullanıcı üye giriş sayfasına
// atılıyordu. Panel token'ları 1 saate indiği için (eskiden 7 gün) bu yol artık SÜREKLİ
// kullanılıyor; realm ayrımı olmadan salonlar saat başı dışarı atılırdı.
type Realm = 'user' | 'venue' | 'instructor'

const REALM_AYAR: Record<Realm, { access: string; refresh: string; profil: string; uc: string; giris: string }> = {
  user:       { access: 'fitpass_token',            refresh: 'fitpass_refresh',            profil: 'fitpass_user',       uc: '/api/auth/refresh',       giris: '/giris' },
  venue:      { access: 'fitpass_venue_token',      refresh: 'fitpass_venue_refresh',      profil: 'fitpass_venue',      uc: '/api/venue/refresh',      giris: '/salon-giris' },
  instructor: { access: 'fitpass_instructor_token', refresh: 'fitpass_instructor_refresh', profil: 'fitpass_instructor', uc: '/api/instructor/refresh', giris: '/egitmen-giris' },
}

/**
 * İsteğin hangi realm'e ait olduğunu ÖNCE JETONDAN, olmazsa URL'den çıkar.
 *
 * URL TEK BAŞINA YETMİYOR: salon paneli check-in'i `/api/bookings/checkin`, yorum yanıtını
 * `/api/reviews/:id/reply` uçlarına SALON jetonuyla atıyor. Yalnız yola bakan bir tespit
 * bunları "kullanıcı" sayıyor, yanlış anahtarla yenilemeye çalışıyor ve başarısız olunca
 * salon görevlisini üye giriş sayfasına atıyordu (üstelik salonun kendi oturumu sağlamken).
 * Jetonun kendi payload'ı bu soruyu kesin yanıtlıyor — imza doğrulaması gerekmez, yalnızca
 * "hangi anahtarla yenileyeyim" sorusuna cevap arıyoruz; jetonu zaten sunucu doğruluyor.
 */
function realmOfToken(auth?: string): Realm | null {
  const t = auth?.replace(/^Bearer\s+/i, '').trim()
  if (!t) return null
  try {
    const g = t.split('.')[1]
    if (!g) return null
    const json = atob(g.replace(/-/g, '+').replace(/_/g, '/'))
    const p = JSON.parse(json)
    if (p?.venueId) return 'venue'
    if (p?.instructorId) return 'instructor'
    if (p?.userId) return 'user'
  } catch { /* bozuk/atipik jeton → URL'ye düş */ }
  return null
}

/** Son çare: yol tabanlı tahmin (jeton okunamadığında). */
function realmOf(url: string): Realm {
  if (url.includes('/api/venue/')) return 'venue'
  if (url.includes('/api/instructor/')) return 'instructor'
  return 'user'
}

const refreshPromises: Partial<Record<Realm, Promise<string | null> | null>> = {}

async function doRefresh(realm: Realm = 'user'): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const a = REALM_AYAR[realm]
  const rt = localStorage.getItem(a.refresh)
  if (!rt) return null
  try {
    const res = await fetch(`${API_URL}${a.uc}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.token) {
      localStorage.setItem(a.access, data.token)
      // DÖNDÜRME (#30): sunucu her yenilemede YENİ bir refresh jetonu verir ve eskisini iptal eder.
      // Bunu saklamazsak bir sonraki yenilemede eski jetonu göndeririz; sunucu bunu ÇALINMIŞ
      // jeton replay'i sayar ve o oturum zincirini tamamen kapatır → kullanıcı dışarı atılır.
      if (data.refreshToken) localStorage.setItem(a.refresh, data.refreshToken)
      return data.token
    }
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

// Oturum gerçekten bittiğinde: O REALM'in yerel oturumunu temizle + kendi giriş sayfasına yönlendir.
// Eskiden hangi realm'de olursak olalım ÜYE oturumu siliniyor ve /giris'e atılıyordu.
function endSession(realm: Realm = 'user') {
  if (typeof window === 'undefined') return
  const p = window.location.pathname
  const a = REALM_AYAR[realm]
  // Zaten ilgili giriş/kayıt sayfasındaysak yönlendirme döngüsü kurma.
  if (p.startsWith(a.giris) || p.startsWith('/kayit') || p.startsWith('/admin')) return
  localStorage.removeItem(a.access)
  localStorage.removeItem(a.refresh)
  // HESAP NESNESİ DE SİLİNİR. Eskiden yalnız üye realm'inde (`fitpass_user`) siliniyordu;
  // salon/eğitmen zorla çıkarıldığında `fitpass_venue` / `fitpass_instructor` diskte KALIYORDU.
  // İçinde hesabın E-POSTASI da var (backend girişte {id,name,email,isApproved} döndürüyor),
  // yani ortak/ödünç bir bilgisayarda oturum kapandıktan sonra bile okunabilir kalıyordu.
  localStorage.removeItem(a.profil)
  window.location.href = `${a.giris}?expired=1`
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
    const isRefresh = typeof url === 'string' && /\/api\/(auth|venue|instructor)\/refresh/.test(url)
    // Request nesnesiyle çağrılan (nadir) istekleri ellemeyiz: header'ını güvenle yeniden yazamayız.
    const plain = typeof input === 'string' || input instanceof URL

    if (!isOurApi || !hasAuth || isRefresh || !plain) {
      return native(input as any, init)
    }

    const res = await native(input as any, init)
    if (res.status !== 401) return res

    // Access token süresi dolmuş olabilir → o REALM için tek bir paylaşılan yenileme, sonra TEK tekrar deneme.
    const realm = realmOfToken(headers.Authorization || headers.authorization) ?? realmOf(url)
    if (!refreshPromises[realm]) refreshPromises[realm] = doRefresh(realm).finally(() => { refreshPromises[realm] = null })
    const newToken = await refreshPromises[realm]
    if (!newToken) { endSession(realm); return res }

    // Tekrar deneme YAMALI fetch'i değil `native`'i çağırır → yama hiç yeniden girilmez,
    // sonsuz döngü imkânsız (işaretçi başlığa gerek yok, sunucuya çöp başlık gitmez).
    return native(input as any, {
      ...init,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    })
  }
}

export async function request<T = any>(path: string, opts: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT): Promise<T> {
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
    // AŞAĞIDAKİ ÜÇ `as T` SINIR DÖNÜŞÜMÜ — gerekçesi: ağ katmanı ya gövdeyi ya da `{ error }`
    // döndürür; `T` yalnızca ÇAĞIRANIN "gövde gelirse şu şekilde olur" iddiasıdır. Bu yüzden
    // çağıran tarafta tip DAİMA `ApiResult<T>` olmalı (veri alanları isteğe bağlı + `error`).
    // `ApiResult` kullanılmazsa `data.sessions.map(...)` ağ koptuğunda çöker ve tsc göremez.
    return { error: res.ok ? null : tSync('net.unreachable') } as T
  } catch (e: any) {
    if (e?.name === 'AbortError') return { error: tSync('net.timeout') } as T
    return { error: tSync('net.offline') } as T
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
    request<ApiResult<MyBookingsResponse>>('/api/bookings/my', { headers: authHeaders(token) }),

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

  // BEKLEME LİSTESİ — üç ucun tamamı. Web'de HİÇ sarmalayıcı yoktu: yalnız ana sayfada bir
  // ham `fetch` POST duruyordu, çıkma ve durum sorgusu hiçbir yerde kullanılmıyordu. Sonuç:
  // web kullanıcısı ders detayından listeye giremiyor, girdiği listeden çıkamıyor ve zaten
  // listede olduğunu göremediği için butona tekrar basınca "Zaten bekleme listesindesiniz."
  // hatası alıyordu. Mobilde üçü de çalışıyordu.
  joinWaitlist: (token: string, sessionId: number) =>
    request<ApiResult<WaitlistActionResponse>>(`/api/waitlist/sessions/${sessionId}`, { method: 'POST', headers: authHeaders(token) }),

  leaveWaitlist: (token: string, sessionId: number) =>
    request<ApiResult<WaitlistActionResponse>>(`/api/waitlist/sessions/${sessionId}`, { method: 'DELETE', headers: authHeaders(token) }),

  getWaitlistStatus: (token: string, sessionId: number) =>
    request<ApiResult<WaitlistStatusResponse>>(`/api/waitlist/sessions/${sessionId}/status`, { headers: authHeaders(token) }),

  resendVerification: (token: string) =>
    request('/api/auth/resend-verification', { method: 'POST', headers: jsonHeaders(token) }),

  // Kayıt akışının ikinci adımı: e-postaya giden 6 haneli kod. Jetonla korunuyor (kullanıcı
  // kendi hesabını doğruluyor), bu yüzden gövdede e-posta taşınmıyor.
  verifyCode: (token: string, code: string) =>
    request('/api/auth/verify-code', { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ code }) }),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    request('/api/auth/change-password', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(data) }),

  cancelBooking: (token: string, bookingId: number) =>
    request(`/api/bookings/${bookingId}/cancel`, { method: 'PUT', headers: authHeaders(token) }),

  getSessions: (params?: { category?: string; date?: string; dateFrom?: string; dateTo?: string; neighborhoodId?: string; cityId?: string; search?: string; sort?: string; userNeighborhoodId?: string; /** 'in_person' | 'online' — verilmezse SUNUCU in_person varsayar (online opt-in). */ mode?: string; limit?: string; page?: string }) =>
    request<ApiResult<SessionListResponse>>(`/api/public/sessions${qsOf(params)}`),

  getSessionById: (id: number) =>
    request<ApiResult<SessionDetailResponse>>(`/api/public/sessions/${id}`),

  // Kişiselleştirilmiş öneriler. Ana sayfa bunu HAM `fetch` ile çağırıyordu: sözleşme katmanını
  // da, jeton yenileme/zaman aşımı korumasını da atlıyordu.
  getForYouSessions: (token: string) =>
    request<ApiResult<ForYouResponse>>(`/api/public/for-you`, { headers: authHeaders(token) }),

  // Salon yorumları + puan özeti. Salon sayfası bunu HAM `fetch` ile çağırıyordu ve yanıttaki
  // `ratingBreakdown` yerine SABİT KODLU bir dağılım çiziyordu.
  getVenueReviews: (venueId: number) =>
    request<ApiResult<VenueReviewsResponse>>(`/api/reviews/venue/${venueId}`),

  // Favoriler. Profil sayfası bu iki ucu HAM `fetch` ile çağırıyordu: `.catch` yoktu (ağ hatası
  // yakalanmıyordu), yükleniyor durumu yoktu ve `private` bayrağı hiç okunmuyordu.
  getMyFavorites: (token: string) =>
    request<ApiResult<FavoritesResponse>>('/api/favorites/my', { headers: authHeaders(token) }),

  getUserFavorites: (username: string) =>
    request<ApiResult<FavoritesResponse>>(`/api/favorites/user/${encodeURIComponent(username)}`),

  getVenues: () =>
    request<ApiResult<VenueListResponse>>('/api/public/venues'),

  getVenueById: (id: number) =>
    request<ApiResult<VenueDetailResponse>>(`/api/public/venues/${id}`),

  getCategories: () =>
    request('/api/public/categories'),

  getDropInSlots: () =>
    request('/api/public/dropin'),

  // privateCode: özel slota katılım kapısı (bookingController). Gönderilmezse sunucu 403 verir.
  joinDropIn: (token: string, slotId: number, code?: string) =>
    request(`/api/bookings/dropin/${slotId}/join`, {
      method: 'POST',
      headers: jsonHeaders(token),
      ...(code ? { body: JSON.stringify({ privateCode: code }) } : {}),
    }),

  getNeighborhoods: (cityId?: string | number) =>
    request(`/api/public/neighborhoods${cityId ? `?cityId=${cityId}` : ''}`),

  getCities: () =>
    request('/api/public/cities'),

  getVenuesList: () =>
    request('/api/public/venues-list'),

  // ÖZEL (private) slot: sunucu ?code= ister, yoksa 404 döner (id enumerasyonuyla roster sızmasın).
  // Hiçbir istemci kodu göndermediği için özel slot özelliği hiç çalışmıyordu — davetli linki
  // açtığında 404 alıp mock yoluna düşüyordu.
  getDropInSlotById: (id: number, code?: string) =>
    request(`/api/public/dropin/${id}${code ? `?code=${encodeURIComponent(code)}` : ''}`),

  getUserActivities: (username: string) =>
    request(`/api/public/users/${encodeURIComponent(username)}`),

  updatePrivacy: (token: string, activityPrivacy: string) =>
    request('/api/auth/privacy', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ activityPrivacy }) }),
  updateProfilePrivacy: (token: string, profilePrivacy: string) =>
    request('/api/auth/privacy', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ profilePrivacy }) }),

  forgotPassword: (email: string) =>
    request('/api/auth/forgot-password', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    request('/api/auth/reset-password', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ token, password }) }),

  followUser: (token: string, username: string) =>
    request(`/api/social/follow/${encodeURIComponent(username)}`, { method: 'POST', headers: authHeaders(token) }),

  unfollowUser: (token: string, username: string) =>
    request(`/api/social/unfollow/${encodeURIComponent(username)}`, { method: 'DELETE', headers: authHeaders(token) }),

  getFollowStatus: (token: string, username: string) =>
    request(`/api/social/status/${encodeURIComponent(username)}`, { headers: authHeaders(token) }),

  getFollowers: (username: string, token?: string | null) =>
    request(`/api/social/followers/${encodeURIComponent(username)}`, { headers: jsonHeaders(token) }),

  getFollowing: (username: string, token?: string | null) =>
    request(`/api/social/following/${encodeURIComponent(username)}`, { headers: jsonHeaders(token) }),

  getFollowRequests: (token: string) =>
    request(`/api/social/follow-requests`, { headers: authHeaders(token) }),
  acceptFollowRequest: (token: string, username: string) =>
    request(`/api/social/follow-requests/${encodeURIComponent(username)}/accept`, { method: 'POST', headers: authHeaders(token) }),
  rejectFollowRequest: (token: string, username: string) =>
    request(`/api/social/follow-requests/${encodeURIComponent(username)}/reject`, { method: 'POST', headers: authHeaders(token) }),

  updateProfile: (token: string, data: { fullName?: string; bio?: string; neighborhoodId?: number; avatarUrl?: string }) =>
    request('/api/auth/profile', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(data) }),
}

export const saveToken = (token: string) => { if (typeof window !== 'undefined') localStorage.setItem('fitpass_token', token) }
export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('fitpass_token') : null

// Realm'e göre access jetonu. Anahtar adları REALM_AYAR'da tek yerde tanımlı — görsel yükleme
// gibi üç realm'de birden çalışan yerler adları kopyalamasın diye buradan veriliyor.
export type Realm2 = Realm
export const getRealmToken = (realm: Realm = 'user'): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(REALM_AYAR[realm].access) : null
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
