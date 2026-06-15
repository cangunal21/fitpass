const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = {
  async register(data: { username: string; email: string; password: string; fullName: string; phone?: string }) {
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

  async getSessions() {
    const res = await fetch(`${API_URL}/api/public/sessions`)
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
}

export const saveToken = (token: string) => localStorage.setItem('fitpass_token', token)
export const getToken = () => localStorage.getItem('fitpass_token')
export const removeToken = () => localStorage.removeItem('fitpass_token')
export const saveUser = (user: object) => localStorage.setItem('fitpass_user', JSON.stringify(user))
export const getUser = () => { const u = localStorage.getItem('fitpass_user'); return u ? JSON.parse(u) : null }
export const removeUser = () => localStorage.removeItem('fitpass_user')
