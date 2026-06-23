const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = {
  async register(data: { username: string; email: string; password: string; fullName: string; phone?: string; referralCode?: string; preferredSports?: string[]; preferredNeighborhoods?: number[] }) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async getMe(token: string) {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  },

  async createBooking(token: string, data: { classSessionId: number; notes?: string }) {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async getMyBookings(token: string) {
    const res = await fetch(`${API_URL}/api/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  },

  async cancelBooking(token: string, bookingId: number) {
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  },

  async getSessions(params?: { category?: string; date?: string; dateFrom?: string; dateTo?: string; neighborhoodId?: string; search?: string; sort?: string; userNeighborhoodId?: string }) {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : ''
    const res = await fetch(`${API_URL}/api/public/sessions${qs}`)
    return res.json()
  },

  async getSessionById(id: number) {
    const res = await fetch(`${API_URL}/api/public/sessions/${id}`)
    return res.json()
  },

  async getVenues() {
    const res = await fetch(`${API_URL}/api/public/venues`)
    return res.json()
  },

  async getVenueById(id: number) {
    const res = await fetch(`${API_URL}/api/public/venues/${id}`)
    return res.json()
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/api/public/categories`)
    return res.json()
  },

  async getDropInSlots() {
    const res = await fetch(`${API_URL}/api/public/dropin`)
    return res.json()
  },

  async joinDropIn(token: string, slotId: number) {
    const res = await fetch(`${API_URL}/api/bookings/dropin/${slotId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    return res.json()
  },

  async getNeighborhoods() {
    const res = await fetch(`${API_URL}/api/public/neighborhoods`)
    return res.json()
  },

  async getVenuesList() {
    const res = await fetch(`${API_URL}/api/public/venues-list`)
    return res.json()
  },

  async getDropInSlotById(id: number) {
    const res = await fetch(`${API_URL}/api/public/dropin/${id}`)
    return res.json()
  },

  getUserActivities: async (username: string) =>
    fetch(`${API_URL}/api/public/users/${username}`).then(r => r.json()),

  updatePrivacy: async (token: string, activityPrivacy: string) =>
    fetch(`${API_URL}/api/auth/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ activityPrivacy }),
    }).then(r => r.json()),

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  },

  resetPassword: async (token: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    return res.json()
  },

  followUser: async (token: string, username: string) =>
    fetch(`${API_URL}/api/social/follow/${username}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),

  unfollowUser: async (token: string, username: string) =>
    fetch(`${API_URL}/api/social/unfollow/${username}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),

  getFollowStatus: async (token: string, username: string) =>
    fetch(`${API_URL}/api/social/status/${username}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),

  getFollowers: async (username: string) =>
    fetch(`${API_URL}/api/social/followers/${username}`).then(r => r.json()),

  getFollowing: async (username: string) =>
    fetch(`${API_URL}/api/social/following/${username}`).then(r => r.json()),

  updateProfile: async (token: string, data: { fullName?: string; bio?: string; neighborhoodId?: number; avatarUrl?: string }) =>
    fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }).then(r => r.json()),
}

export const saveToken = (token: string) => { if (typeof window !== 'undefined') localStorage.setItem('fitpass_token', token) }
export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('fitpass_token') : null
export const removeToken = () => { if (typeof window !== 'undefined') localStorage.removeItem('fitpass_token') }
export const saveUser = (user: object) => { if (typeof window !== 'undefined') localStorage.setItem('fitpass_user', JSON.stringify(user)) }
export const getUser = () => { if (typeof window === 'undefined') return null; const u = localStorage.getItem('fitpass_user'); return u ? JSON.parse(u) : null }
export const removeUser = () => { if (typeof window !== 'undefined') localStorage.removeItem('fitpass_user') }
