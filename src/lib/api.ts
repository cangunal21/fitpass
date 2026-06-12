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
}

export const saveToken = (token: string) => localStorage.setItem('fitpass_token', token)
export const getToken = () => localStorage.getItem('fitpass_token')
export const removeToken = () => localStorage.removeItem('fitpass_token')
export const saveUser = (user: object) => localStorage.setItem('fitpass_user', JSON.stringify(user))
export const getUser = () => { const u = localStorage.getItem('fitpass_user'); return u ? JSON.parse(u) : null }
export const removeUser = () => localStorage.removeItem('fitpass_user')
