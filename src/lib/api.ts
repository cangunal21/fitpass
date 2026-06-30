const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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

export async function request(path: string, opts: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT, _retried = false): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_URL}${path}`, { ...opts, signal: controller.signal })
    const hasAuth = !!(opts.headers as Record<string, string> | undefined)?.Authorization
    // Access token süresi dolmuş → sessizce yenile + isteği bir kez tekrar dene.
    if (res.status === 401 && hasAuth && !_retried && typeof window !== 'undefined' && !path.includes('/api/auth/refresh')) {
      if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
      const newToken = await refreshPromise
      if (newToken) {
        clearTimeout(timer)
        return request(path, { ...opts, headers: { ...(opts.headers as object), Authorization: `Bearer ${newToken}` } }, timeoutMs, true)
      }
      // Yenileme de başarısız → oturum gerçekten bitti → temizle + girişe yönlendir
      const p = window.location.pathname
      if (!p.startsWith('/giris') && !p.startsWith('/kayit') && !p.startsWith('/salon') && !p.startsWith('/admin')) {
        localStorage.removeItem('fitpass_token')
        localStorage.removeItem('fitpass_user')
        localStorage.removeItem('fitpass_refresh')
        window.location.href = '/giris?expired=1'
      }
    }
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

  getMyCalendar: (token: string) =>
    request('/api/social/my-calendar', { headers: authHeaders(token) }),

  deleteAccount: (token: string, password: string) =>
    request('/api/auth/account', { method: 'DELETE', headers: jsonHeaders(token), body: JSON.stringify({ password }) }),

  cancelBooking: (token: string, bookingId: number) =>
    request(`/api/bookings/${bookingId}/cancel`, { method: 'PUT', headers: authHeaders(token) }),

  getSessions: (params?: { category?: string; date?: string; dateFrom?: string; dateTo?: string; neighborhoodId?: string; search?: string; sort?: string; userNeighborhoodId?: string }) =>
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

  getNeighborhoods: () =>
    request('/api/public/neighborhoods'),

  getVenuesList: () =>
    request('/api/public/venues-list'),

  getDropInSlotById: (id: number) =>
    request(`/api/public/dropin/${id}`),

  getUserActivities: (username: string) =>
    request(`/api/public/users/${username}`),

  updatePrivacy: (token: string, activityPrivacy: string) =>
    request('/api/auth/privacy', { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ activityPrivacy }) }),

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

  getFollowers: (username: string) =>
    request(`/api/social/followers/${username}`),

  getFollowing: (username: string) =>
    request(`/api/social/following/${username}`),

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
  if (rt) { try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }) } catch { /* yoksay */ } }
  removeToken(); removeUser(); removeRefreshToken()
}
