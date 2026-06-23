'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Clock, BookOpen, Calendar, Ticket, AlertCircle, User, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import AvatarUpload from '@/components/AvatarUpload'
import { getInitialsAvatar, uploadToCloudinary } from '@/lib/cloudinary'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const NO_INSTRUCTOR_CATEGORIES = ['Padel', 'Halı Saha', 'Basketbol']
const DROP_IN_SPORTS = ['Basketbol', 'Padel', 'Halı Saha']
const DROP_IN_FORMATS: Record<string, string[]> = {
  'Basketbol': ['4v4 Yarım Saha', '5v5 Tam Saha'],
  'Padel': ['1v1', '2v2'],
  'Halı Saha': ['6v6', '7v7'],
}
const FORMAT_PLAYERS: Record<string, number> = {
  '4v4 Yarım Saha': 8, '5v5 Tam Saha': 10,
  '1v1': 2, '2v2': 4,
  '6v6': 12, '7v7': 14,
}

export default function SalonPaneliPage() {
  const router = useRouter()
  const [venue, setVenue] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'dersler' | 'hocalar' | 'resimler' | 'rezervasyonlar' | 'dropin' | 'istatistikler' | 'kuponlar' | 'gelir' | 'yorumlar' | 'qr' | 'profil'>('dersler')
  const [bookings, setBookings] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Inline class form state
  const [showClassForm, setShowClassForm] = useState(false)
  const [classForm, setClassForm] = useState({ title: '', category: '', basePrice: '', duration: '60', capacity: '', instructorId: '' })
  const [classError, setClassError] = useState('')
  const [classSuccess, setClassSuccess] = useState('')

  // Session forms
  const [sessionForms, setSessionForms] = useState<Record<number, { date: string; time: string; capacity: string; instructorId: string }>>({})
  const [sessionSuccess, setSessionSuccess] = useState<Record<number, string>>({})
  const [sessionError, setSessionError] = useState<Record<number, string>>({})
  const [sessionMode, setSessionMode] = useState<Record<number, 'tek' | 'tekrarlayan'>>({})
  const [recurringForms, setRecurringForms] = useState<Record<number, { time: string; capacity: string; weekDays: number[]; weeks: string }>>({})
  const WEEK_DAYS = [
    { label: 'Pzt', value: 1 }, { label: 'Sal', value: 2 }, { label: 'Çar', value: 3 },
    { label: 'Per', value: 4 }, { label: 'Cum', value: 5 }, { label: 'Cmt', value: 6 }, { label: 'Paz', value: 0 },
  ]

  // Instructor form
  const [instructorForm, setInstructorForm] = useState({ fullName: '', specialty: '', bio: '', avatarUrl: '', phone: '', email: '' })
  const [instructorError, setInstructorError] = useState('')
  const [instructorSuccess, setInstructorSuccess] = useState('')

  const [editingSession, setEditingSession] = useState<number | null>(null)
  const [editSessionForm, setEditSessionForm] = useState<{ date: string; time: string; capacity: string }>({ date: '', time: '', capacity: '' })
  const [editSessionError, setEditSessionError] = useState('')

  const [deletingClass, setDeletingClass] = useState<number | null>(null)
  const [deletingSession, setDeletingSession] = useState<number | null>(null)
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null)
  const [expandedSession, setExpandedSession] = useState<number | null>(null)

  // Venue images state
  const [venueImages, setVenueImages] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagesPendingReview, setImagesPendingReview] = useState(false)

  // New instructor avatar state
  const [newInstructorAvatar, setNewInstructorAvatar] = useState('')

  // Stats state
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Revenue state
  const [revenue, setRevenue] = useState<any>(null)
  const [revenueLoading, setRevenueLoading] = useState(false)

  // Coupon state
  const [coupons, setCoupons] = useState<any[]>([])
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: '', maxUses: '', expiresAt: '' })
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [deletingCoupon, setDeletingCoupon] = useState<number | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})
  const [replyLoading, setReplyLoading] = useState<number | null>(null)

  // Drop-in state
  const [dropInSlots, setDropInSlots] = useState<any[]>([])
  const [dropInForm, setDropInForm] = useState({ sport: '', format: '', date: '', time: '', totalPlayers: '', pricePerPerson: '', visibility: 'open', privateCode: '' })
  const [dropInError, setDropInError] = useState('')
  const [dropInSuccess, setDropInSuccess] = useState('')

  // Profil güncelleme state
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', description: '', website: '' })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', newPassword2: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const formatSessionDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const [sportCategories, setSportCategories] = useState<{ id: number; name: string; hasInstructor: boolean }[]>([])

  useEffect(() => {
    const token = localStorage.getItem('fitpass_venue_token')
    if (!token) { router.push('/salon-giris'); return }
    fetchVenue(token)
    // Kategorileri API'dan çek
    fetch(`${API_URL}/api/public/categories`)
      .then(r => r.json())
      .then(d => { if (d.categories) setSportCategories(d.categories) })
      .catch(() => {})
  }, [])

  const fetchVenue = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/venue/me`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.error) { router.push('/salon-giris'); return }
      setVenue(data.venue)
      // Onay bekleyen set varsa onu göster (salon ne yüklediğini görsün), yoksa canlı set
      const pending = !!data.venue?.imagesPendingReview
      setImagesPendingReview(pending)
      setVenueImages((pending ? data.venue?.pendingImages : data.venue?.images) || [])
      setCoverImage((pending ? data.venue?.pendingCoverImageUrl : data.venue?.coverImageUrl) || '')
      setProfileForm({
        name: data.venue?.name || '',
        phone: data.venue?.phone || '',
        address: data.venue?.address || '',
        description: data.venue?.description || '',
        website: data.venue?.website || '',
      })
    } catch {
      router.push('/salon-giris')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/bookings`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setBookings(data.bookings || [])
  }

  const fetchInstructors = async () => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/instructors`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setInstructors(data.instructors || [])
  }

  const fetchDropInSlots = async () => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/dropin`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setDropInSlots(data.slots || [])
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const token = localStorage.getItem('fitpass_venue_token')!
      const res = await fetch(`${API_URL}/api/venue/stats`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRevenue = async () => {
    setRevenueLoading(true)
    try {
      const token = localStorage.getItem('fitpass_venue_token')!
      const res = await fetch(`${API_URL}/api/venue/revenue`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setRevenue(data)
    } catch { setRevenue(null) }
    setRevenueLoading(false)
  }

  const fetchCoupons = async () => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/coupons`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setCoupons(data.coupons || [])
  }

  const fetchReviews = async () => {
    if (!venue?.id) return
    setReviewsLoading(true)
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/reviews/venue/${venue.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setReviews(data.reviews || [])
    setReviewsLoading(false)
  }

  const handleReply = async (reviewId: number) => {
    const reply = replyTexts[reviewId]?.trim()
    if (!reply) return
    setReplyLoading(reviewId)
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/reviews/${reviewId}/reply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reply }),
    })
    if (res.ok) {
      setReplyTexts(t => ({ ...t, [reviewId]: '' }))
      fetchReviews()
    }
    setReplyLoading(null)
  }

  const handleDeleteReply = async (reviewId: number) => {
    const token = localStorage.getItem('fitpass_venue_token')!
    await fetch(`${API_URL}/api/reviews/${reviewId}/reply`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchReviews()
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(''); setProfileSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileForm),
    })
    const data = await res.json()
    if (data.error) { setProfileError(data.error); return }
    setProfileSuccess('Bilgiler güncellendi!')
    setVenue((v: any) => ({ ...v, ...data.venue }))
    setTimeout(() => setProfileSuccess(''), 3000)
  }

  const handleChangeVenuePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (pwForm.newPassword !== pwForm.newPassword2) { setPwError('Yeni şifreler eşleşmiyor.'); return }
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    if (data.error) { setPwError(data.error); return }
    setPwSuccess('Şifre değiştirildi!')
    setPwForm({ currentPassword: '', newPassword: '', newPassword2: '' })
    setTimeout(() => setPwSuccess(''), 3000)
  }

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError(''); setCouponSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const body: any = {
      code: couponForm.code,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
    }
    if (couponForm.maxUses) body.maxUses = Number(couponForm.maxUses)
    if (couponForm.expiresAt) body.expiresAt = couponForm.expiresAt
    const res = await fetch(`${API_URL}/api/venue/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) { setCouponError(data.error); return }
    setCouponSuccess('Kupon oluşturuldu!')
    setCouponForm({ code: '', discountType: 'percent', discountValue: '', maxUses: '', expiresAt: '' })
    fetchCoupons()
    setTimeout(() => setCouponSuccess(''), 3000)
  }

  const handleDeleteCoupon = async (couponId: number) => {
    if (!confirm('Bu kuponu deaktive etmek istediğinize emin misiniz?')) return
    const token = localStorage.getItem('fitpass_venue_token')!
    setDeletingCoupon(couponId)
    const res = await fetch(`${API_URL}/api/venue/coupons/${couponId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setDeletingCoupon(null)
    if (data.error) { alert(data.error); return }
    fetchCoupons()
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === 'rezervasyonlar') fetchBookings()
    if (tab === 'hocalar') fetchInstructors()
    if (tab === 'dersler') fetchInstructors()
    if (tab === 'dropin') fetchDropInSlots()
    if (tab === 'istatistikler') fetchStats()
    if (tab === 'kuponlar') fetchCoupons()
    if (tab === 'gelir') fetchRevenue()
    if (tab === 'yorumlar') fetchReviews()
  }

  const saveVenueImages = async (images: string[], cover?: string) => {
    const token = localStorage.getItem('fitpass_venue_token')!
    await fetch(`${API_URL}/api/venue/images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ images, coverImageUrl: cover ?? coverImage }),
    })
    // Yüklenen resimler artık admin onayına gider
    setImagesPendingReview(true)
  }

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault()
    setInstructorError(''); setInstructorSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/instructors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(instructorForm),
    })
    const data = await res.json()
    if (data.error) { setInstructorError(data.error); return }
    setInstructorSuccess('Hoca başarıyla eklendi!')
    setInstructorForm({ fullName: '', specialty: '', bio: '', avatarUrl: '', phone: '', email: '' })
    setNewInstructorAvatar('')
    fetchInstructors()
    setTimeout(() => setInstructorSuccess(''), 2000)
  }

  const handleLogout = () => {
    localStorage.removeItem('fitpass_venue_token')
    localStorage.removeItem('fitpass_venue')
    router.push('/salon-giris')
  }

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setClassError(''); setClassSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(classForm),
    })
    const data = await res.json()
    if (data.error) { setClassError(data.error); return }
    setClassSuccess('Ders başarıyla eklendi!')
    setClassForm({ title: '', category: '', basePrice: '', duration: '60', capacity: '', instructorId: '' })
    setShowClassForm(false)
    fetchVenue(token)
    setTimeout(() => setClassSuccess(''), 2500)
  }

  const handleAddSession = async (classId: number) => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const form = sessionForms[classId]
    if (!form?.date || !form?.time || !form?.capacity) return
    setSessionError(prev => ({ ...prev, [classId]: '' }))
    const res = await fetch(`${API_URL}/api/venue/classes/${classId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) {
      setSessionError(prev => ({ ...prev, [classId]: data.error }))
      setTimeout(() => setSessionError(prev => ({ ...prev, [classId]: '' })), 5000)
    } else {
      setSessionSuccess(prev => ({ ...prev, [classId]: `${formatSessionDate(form.date)} saat ${form.time} — ${form.capacity} kişi kapasiteli seans eklendi!` }))
      setSessionForms(prev => ({ ...prev, [classId]: { date: '', time: '', capacity: '', instructorId: '' } }))
      fetchVenue(token)
      setTimeout(() => setSessionSuccess(prev => ({ ...prev, [classId]: '' })), 3000)
    }
  }

  const handleAddRecurring = async (classId: number) => {
    const token = localStorage.getItem('fitpass_venue_token')!
    const form = recurringForms[classId]
    if (!form?.time || !form?.capacity || !form?.weekDays?.length || !form?.weeks) return
    setSessionError(prev => ({ ...prev, [classId]: '' }))
    const res = await fetch(`${API_URL}/api/venue/classes/${classId}/sessions/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) {
      setSessionError(prev => ({ ...prev, [classId]: data.error }))
      setTimeout(() => setSessionError(prev => ({ ...prev, [classId]: '' })), 5000)
    } else {
      setSessionSuccess(prev => ({ ...prev, [classId]: data.message }))
      setRecurringForms(prev => ({ ...prev, [classId]: { time: '', capacity: '', weekDays: [], weeks: '' } }))
      fetchVenue(token)
      setTimeout(() => setSessionSuccess(prev => ({ ...prev, [classId]: '' })), 4000)
    }
  }

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('Bu dersi ve tüm seanslarını silmek istediğinize emin misiniz?')) return
    const token = localStorage.getItem('fitpass_venue_token')!
    setDeletingClass(classId)
    const res = await fetch(`${API_URL}/api/venue/classes/${classId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setDeletingClass(null)
    if (data.error) { alert(data.error); return }
    fetchVenue(token)
  }

  const handleDeleteSession = async (classId: number, sessionId: number) => {
    if (!confirm('Bu seansı silmek istediğinize emin misiniz?')) return
    const token = localStorage.getItem('fitpass_venue_token')!
    setDeletingSession(sessionId)
    const res = await fetch(`${API_URL}/api/venue/classes/${classId}/sessions/${sessionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setDeletingSession(null)
    if (data.error) { alert(data.error); return }
    fetchVenue(token)
  }

  const handleEditSession = async (classId: number, sessionId: number) => {
    setEditSessionError('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/classes/${classId}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editSessionForm)
    })
    const data = await res.json()
    if (data.error) { setEditSessionError(data.error); return }
    setEditingSession(null)
    fetchVenue(token)
  }

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Bu drop-in slotu silmek istediğinize emin misiniz?')) return
    const token = localStorage.getItem('fitpass_venue_token')!
    setDeletingSlot(slotId)
    const res = await fetch(`${API_URL}/api/venue/dropin/${slotId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setDeletingSlot(null)
    if (data.error) { alert(data.error); return }
    fetchDropInSlots()
  }

  const handleAddDropIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setDropInError(''); setDropInSuccess('')
    const token = localStorage.getItem('fitpass_venue_token')!
    const res = await fetch(`${API_URL}/api/venue/dropin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(dropInForm),
    })
    const data = await res.json()
    if (data.error) { setDropInError(data.error); return }
    setDropInSuccess('Drop-in slot oluşturuldu!')
    setDropInForm({ sport: '', format: '', date: '', time: '', totalPlayers: '', pricePerPerson: '', visibility: 'open', privateCode: '' })
    fetchDropInSlots()
    setTimeout(() => setDropInSuccess(''), 3000)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#888' }}>Yükleniyor...</div>

  const selectedCat = sportCategories.find(c => c.name === classForm.category)
  const showInstructor = selectedCat ? selectedCat.hasInstructor : !NO_INSTRUCTOR_CATEGORIES.includes(classForm.category)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5', letterSpacing: -0.5, textDecoration: 'none' }}>şipşakspor</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={16} /> {venue?.name}</span>
          {!venue?.isApproved && <span style={{ fontSize: 12, backgroundColor: '#FEF9C3', color: '#92400e', padding: '4px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> Onay Bekliyor</span>}
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #eee', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>Çıkış</button>
        </div>
      </nav>

      <div className="page-container" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {!venue?.isApproved && (
          <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 16, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#92400e' }}>
            <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /><strong>Salonunuz onay bekliyor.</strong> Onaylandıktan sonra dersleriniz yayınlanacak. Onay süreci genellikle 1-2 iş günü sürmektedir.
          </div>
        )}

        {/* İstatistikler */}
        <div className="stats-grid stats-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Toplam Ders', value: venue?.classes?.length || 0, icon: <BookOpen size={28} />, color: '#8B5CF6' },
            { label: 'Toplam Seans', value: venue?.classes?.reduce((acc: number, c: any) => acc + (c.sessions?.length || 0), 0) || 0, icon: <Calendar size={28} />, color: '#3B82F6' },
            { label: 'Aktif Dersler', value: venue?.classes?.filter((c: any) => c.isActive).length || 0, icon: <Check size={28} />, color: '#10B981' },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="salon-tabs" style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {(() => {
            const DROP_IN_SPORTS = ['padel', 'basketbol', 'halı saha', 'halısaha']
            const venueCategories: string[] = (venue?.sportCategories || []).map((sc: any) => sc.sportCategory?.name?.toLowerCase() || '')
            const hasDropIn = venueCategories.some((c: string) => DROP_IN_SPORTS.includes(c))
            const tabs = [
              { key: 'dersler', label: 'Dersler & Seanslar' },
              { key: 'hocalar', label: 'Hocalarım' },
              { key: 'resimler', label: 'Salon Resimleri' },
              ...(hasDropIn ? [{ key: 'dropin', label: 'Drop-In' }] : []),
              { key: 'rezervasyonlar', label: 'Rezervasyonlar' },
              { key: 'istatistikler', label: 'İstatistikler' },
              { key: 'gelir', label: 'Gelir Raporu' },
              { key: 'kuponlar', label: 'Kuponlar' },
              { key: 'yorumlar', label: 'Yorumlar' },
              { key: 'qr', label: 'QR Kod' },
              { key: 'profil', label: 'Profil & Şifre' },
            ]
            return tabs as { key: typeof activeTab; label: string }[]
          })().map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className="salon-tab-item" style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#1a1a1a' : '#888', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* DERSLER & SEANSLAR */}
        {activeTab === 'dersler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* + Yeni Ders Ekle button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowClassForm(v => !v); setClassError(''); setClassSuccess('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <Plus size={16} /> Yeni Ders Ekle {showClassForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Inline class form */}
            {showClassForm && (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #4F46E5' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>Yeni Ders</h3>
                <form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Ders Adı *</label>
                      <input type="text" placeholder="Vinyasa Flow Yoga" value={classForm.title} onChange={e => setClassForm({ ...classForm, title: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Kategori *</label>
                      <select value={classForm.category} onChange={e => setClassForm({ ...classForm, category: e.target.value, instructorId: '' })} required style={inputStyle}>
                        <option value="">Seçin</option>
                        {sportCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Fiyat (₺) *</label>
                      <input type="number" placeholder="350" value={classForm.basePrice} onChange={e => setClassForm({ ...classForm, basePrice: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Kapasite (kişi) *</label>
                      <input type="number" placeholder="15" min="1" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: e.target.value })} required style={inputStyle} />
                    </div>
                    {showInstructor && (
                      <div>
                        <label style={labelStyle}>Hoca (opsiyonel)</label>
                        <select value={classForm.instructorId} onChange={e => setClassForm({ ...classForm, instructorId: e.target.value })} style={inputStyle}>
                          <option value="">Hoca seçin</option>
                          {instructors.map((inst: any) => (
                            <option key={inst.id} value={inst.id}>{inst.fullName} — {inst.specialty}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {classError && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {classError}</div>}
                  {classSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {classSuccess}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowClassForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #eee', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555' }}>İptal</button>
                    <button type="submit" style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Dersi Kaydet</button>
                  </div>
                </form>
              </div>
            )}

            {(!venue?.classes || venue.classes.length === 0) ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><BookOpen size={48} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Henüz ders eklemediniz</div>
                <button onClick={() => setShowClassForm(true)} style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ İlk Dersi Ekle</button>
              </div>
            ) : venue.classes.map((cls: any) => {
              const needsInstructor = !NO_INSTRUCTOR_CATEGORIES.includes(cls.category)
              return (
                <div key={cls.id} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{cls.title}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, backgroundColor: '#f0f0f0', padding: '3px 10px', borderRadius: 20, color: '#555' }}>{cls.category}</span>
                        <span style={{ fontSize: 12, backgroundColor: cls.isActive ? '#F0FDF4' : '#FEF2F2', padding: '3px 10px', borderRadius: 20, color: cls.isActive ? '#16a34a' : '#DC2626', fontWeight: 600 }}>{cls.isActive ? '● Aktif' : '● Pasif'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>₺{cls.basePrice}</div>
                      <button onClick={() => handleDeleteClass(cls.id)} disabled={deletingClass === cls.id} style={{ padding: '5px 14px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        {deletingClass === cls.id ? '...' : 'Dersi Sil'}
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                    {cls.sessions?.length || 0} seans · {cls.sessions?.reduce((acc: number, s: any) => acc + (s._count?.bookings || 0), 0) || 0} rezervasyon
                  </div>

                  {/* Seans Ekle */}
                  <div style={{ backgroundColor: '#f9f9f9', borderRadius: 14, padding: '18px 20px' }}>
                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>+ Yeni Seans Ekle</div>
                      <div style={{ display: 'flex', gap: 4, backgroundColor: '#e8e8e8', borderRadius: 10, padding: 3 }}>
                        {(['tek', 'tekrarlayan'] as const).map(mode => (
                          <button key={mode} onClick={() => setSessionMode(prev => ({ ...prev, [cls.id]: mode }))}
                            style={{ padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: (sessionMode[cls.id] || 'tek') === mode ? '#fff' : 'transparent', color: (sessionMode[cls.id] || 'tek') === mode ? '#4F46E5' : '#888', boxShadow: (sessionMode[cls.id] || 'tek') === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            {mode === 'tek' ? 'Tek Seferlik' : 'Tekrarlayan'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TEK SEFERLİK FORM */}
                    {(sessionMode[cls.id] || 'tek') === 'tek' && (
                      <div style={{ display: 'grid', gridTemplateColumns: needsInstructor ? '1.2fr 1fr 1fr 1fr auto' : '1.4fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Tarih</label>
                          <input type="date" value={sessionForms[cls.id]?.date || ''} onChange={e => setSessionForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], date: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, backgroundColor: '#fff' }} />
                          {sessionForms[cls.id]?.date && (
                            <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, marginTop: 4 }}>{formatSessionDate(sessionForms[cls.id].date)}</div>
                          )}
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Saat</label>
                          <input type="time" value={sessionForms[cls.id]?.time || ''} onChange={e => setSessionForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], time: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, backgroundColor: '#fff' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Kontenjan</label>
                          <input type="number" placeholder="15" value={sessionForms[cls.id]?.capacity || ''} onChange={e => setSessionForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], capacity: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, backgroundColor: '#fff' }} />
                        </div>
                        {needsInstructor && (
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Hoca</label>
                            <select value={sessionForms[cls.id]?.instructorId || ''} onChange={e => setSessionForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], instructorId: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, backgroundColor: '#fff' }}>
                              <option value="">Seçin</option>
                              {instructors.map((inst: any) => (
                                <option key={inst.id} value={inst.id}>{inst.fullName}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button onClick={() => handleAddSession(cls.id)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, alignSelf: 'end' }}>Ekle</button>
                      </div>
                    )}

                    {/* TEKRARLAYAN FORM */}
                    {sessionMode[cls.id] === 'tekrarlayan' && (
                      <div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>Hangi Günler?</label>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {WEEK_DAYS.map(d => {
                              const selected = recurringForms[cls.id]?.weekDays?.includes(d.value)
                              return (
                                <button key={d.value} onClick={() => setRecurringForms(prev => {
                                  const cur = prev[cls.id]?.weekDays || []
                                  return { ...prev, [cls.id]: { ...prev[cls.id], weekDays: selected ? cur.filter(x => x !== d.value) : [...cur, d.value] } }
                                })}
                                  style={{ padding: '6px 14px', borderRadius: 8, border: selected ? 'none' : '1.5px solid #e5e5e5', background: selected ? '#4F46E5' : '#fff', color: selected ? '#fff' : '#555', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                  {d.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Saat</label>
                            <input type="time" value={recurringForms[cls.id]?.time || ''} onChange={e => setRecurringForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], time: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, backgroundColor: '#fff' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Kontenjan</label>
                            <input type="number" placeholder="15" value={recurringForms[cls.id]?.capacity || ''} onChange={e => setRecurringForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], capacity: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, backgroundColor: '#fff' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Kaç Hafta?</label>
                            <select value={recurringForms[cls.id]?.weeks || ''} onChange={e => setRecurringForms(prev => ({ ...prev, [cls.id]: { ...prev[cls.id], weeks: e.target.value } }))} style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', backgroundColor: '#fff' }}>
                              <option value="">Seçin</option>
                              {[1,2,3,4,6,8,12].map(w => <option key={w} value={w}>{w} hafta</option>)}
                            </select>
                          </div>
                          <button onClick={() => handleAddRecurring(cls.id)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, alignSelf: 'end' }}>Oluştur</button>
                        </div>
                        {recurringForms[cls.id]?.weekDays?.length > 0 && recurringForms[cls.id]?.weeks && (
                          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, marginTop: 8 }}>
                            {WEEK_DAYS.filter(d => recurringForms[cls.id]?.weekDays?.includes(d.value)).map(d => d.label).join(', ')} günleri · {recurringForms[cls.id]?.weeks} hafta · toplam ~{(recurringForms[cls.id]?.weekDays?.length || 0) * parseInt(recurringForms[cls.id]?.weeks || '0')} seans oluşturulacak
                          </div>
                        )}
                      </div>
                    )}

                    {sessionSuccess[cls.id] && (
                      <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 10, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px' }}>
                        ✓ {sessionSuccess[cls.id]}
                      </div>
                    )}
                    {sessionError[cls.id] && (
                      <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, marginTop: 10, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>
                        ✗ {sessionError[cls.id]}
                      </div>
                    )}
                  </div>

                  {/* Seanslar */}
                  {cls.sessions && cls.sessions.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>MEVCUT SEANSLAR</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cls.sessions.map((s: any) => (
                          <div key={s.id} style={{ backgroundColor: '#f5f5f5', borderRadius: 10, overflow: 'hidden', fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', cursor: 'pointer' }} onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} /> {new Date(s.startsAt).toLocaleDateString('tr-TR')} · <Clock size={13} /> {new Date(s.startsAt).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: (s.bookings?.length || 0) > 0 ? '#4F46E5' : '#888', fontWeight: (s.bookings?.length || 0) > 0 ? 700 : 400 }}>
                                  {s.bookings?.length || 0}/{s.availableSpots} kişi {(s.bookings?.length || 0) > 0 ? '▾' : ''}
                                </span>
                                <button onClick={e => {
                                  e.stopPropagation()
                                  const d = new Date(s.startsAt)
                                  const dateStr = d.toISOString().slice(0, 10)
                                  const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
                                  setEditingSession(s.id)
                                  setEditSessionForm({ date: dateStr, time: timeStr, capacity: String(s.availableSpots) })
                                  setEditSessionError('')
                                }} style={{ padding: '3px 10px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                  Düzenle
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleDeleteSession(cls.id, s.id) }} disabled={deletingSession === s.id} style={{ padding: '3px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                  {deletingSession === s.id ? '...' : 'Sil'}
                                </button>
                              </div>
                            </div>
                            {editingSession === s.id && (
                              <div style={{ borderTop: '1px solid #e8e8e8', padding: '12px', backgroundColor: '#F8FAFF' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 8, alignItems: 'end' }}>
                                  <div>
                                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Tarih</label>
                                    <input type="date" value={editSessionForm.date} onChange={e => setEditSessionForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1.5px solid #e5e5e5', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Saat</label>
                                    <input type="time" value={editSessionForm.time} onChange={e => setEditSessionForm(f => ({ ...f, time: e.target.value }))} style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1.5px solid #e5e5e5', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Kontenjan</label>
                                    <input type="number" value={editSessionForm.capacity} onChange={e => setEditSessionForm(f => ({ ...f, capacity: e.target.value }))} style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1.5px solid #e5e5e5', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                                  </div>
                                  <button onClick={() => handleEditSession(cls.id, s.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
                                  <button onClick={() => setEditingSession(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #eee', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#666' }}>İptal</button>
                                </div>
                                {editSessionError && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{editSessionError}</div>}
                              </div>
                            )}
                            {expandedSession === s.id && s.bookings && s.bookings.length > 0 && (
                              <div style={{ borderTop: '1px solid #e8e8e8', padding: '8px 12px', backgroundColor: '#fff' }}>
                                <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 6 }}>KAYITLI KİŞİLER</div>
                                {s.bookings.map((bk: any) => (
                                  <div key={bk.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>
                                      {bk.user?.fullName?.[0] || '?'}
                                    </div>
                                    <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600 }}>{bk.user?.fullName || 'Kullanıcı'}</span>
                                    <span style={{ fontSize: 11, color: bk.status === 'confirmed' ? '#10B981' : '#EF4444', fontWeight: 600, marginLeft: 'auto' }}>
                                      {bk.status === 'confirmed' ? '✓ Onaylı' : '✗ İptal'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {expandedSession === s.id && (!s.bookings || s.bookings.length === 0) && (
                              <div style={{ borderTop: '1px solid #e8e8e8', padding: '8px 12px', fontSize: 12, color: '#aaa', backgroundColor: '#fff' }}>Henüz kayıt yok</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* HOCALAR */}
        {activeTab === 'hocalar' && (
          <div className="instructor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Mevcut Hocalar</h3>
              {instructors.length === 0 ? (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><User size={36} /></div>
                  <div style={{ fontSize: 14, color: '#888' }}>Henüz hoca eklenmedi</div>
                </div>
              ) : instructors.map((inst: any) => (
                <div key={inst.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <AvatarUpload
                    currentUrl={inst.avatarUrl}
                    name={inst.fullName}
                    size={48}
                    editable={true}
                    onUpload={async (url) => {
                      const token = localStorage.getItem('fitpass_venue_token')!
                      await fetch(`${API_URL}/api/venue/instructors/${inst.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ avatarUrl: url }),
                      })
                      fetchInstructors()
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{inst.fullName}</div>
                    <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>{inst.specialty}</div>
                    {inst.bio && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{inst.bio}</div>}
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{inst._count?.classes || 0} ders</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Yeni Hoca Ekle</h3>
              <form onSubmit={handleAddInstructor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Ad Soyad *</label>
                  <input type="text" placeholder="Ayşe Kaya" value={instructorForm.fullName} onChange={e => setInstructorForm({ ...instructorForm, fullName: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Uzmanlık Alanı *</label>
                  <input type="text" placeholder="Yoga, Pilates..." value={instructorForm.specialty} onChange={e => setInstructorForm({ ...instructorForm, specialty: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea placeholder="Hoca hakkında kısa bilgi..." value={instructorForm.bio} onChange={e => setInstructorForm({ ...instructorForm, bio: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Telefon</label>
                  <input type="tel" placeholder="05XX XXX XX XX" value={instructorForm.phone} onChange={e => setInstructorForm({ ...instructorForm, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-posta</label>
                  <input type="email" placeholder="hoca@email.com" value={instructorForm.email} onChange={e => setInstructorForm({ ...instructorForm, email: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fotoğraf (opsiyonel)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AvatarUpload
                      currentUrl={newInstructorAvatar || null}
                      name={instructorForm.fullName || 'Hoca'}
                      size={56}
                      editable={true}
                      onUpload={(url) => { setNewInstructorAvatar(url); setInstructorForm({ ...instructorForm, avatarUrl: url }) }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>Fotoğraf yüklemek için tıkla</span>
                  </div>
                </div>
                {instructorError && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {instructorError}</div>}
                {instructorSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {instructorSuccess}</div>}
                <button type="submit" style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Hoca Ekle</button>
              </form>
            </div>
          </div>
        )}

        {/* SALON RESİMLERİ */}
        {activeTab === 'resimler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {imagesPendingReview && (
              <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> Resimleriniz admin onayını bekliyor. Onaylanana kadar sitede görünmez; onaydan sonra otomatik yayınlanır.
              </div>
            )}
            {/* Cover image */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Kapak Fotoğrafı</h3>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Salonunuzun ana sayfada görünen büyük fotoğrafı</p>
              <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f0f0f0', cursor: 'pointer' }}
                onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange = async (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; setUploadingImage(true); try { const url = await uploadToCloudinary(file); setCoverImage(url); await saveVenueImages(venueImages, url); } catch { alert('Yüklenemedi.') } finally { setUploadingImage(false) } }; inp.click() }}>
                {coverImage ? (
                  <img src={coverImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="kapak" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                    <span style={{ fontSize: 32, color: '#4F46E5' }}>+</span>
                    <span style={{ fontSize: 13, color: '#aaa' }}>Kapak fotoğrafı eklemek için tıkla</span>
                  </div>
                )}
                {uploadingImage && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>Yükleniyor...</div>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Galeri</h3>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Salonunuzu tanıtan ek fotoğraflar (max 10)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {venueImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    <button
                      onClick={async () => { const newImgs = venueImages.filter((_, i) => i !== idx); setVenueImages(newImgs); await saveVenueImages(newImgs) }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                  </div>
                ))}
                {venueImages.length < 10 && (
                  <div
                    onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; (inp as any).multiple=true; inp.onchange = async (e) => { const files = Array.from((e.target as HTMLInputElement).files || []); setUploadingImage(true); try { const urls = await Promise.all(files.slice(0, 10 - venueImages.length).map((f: File) => uploadToCloudinary(f))); const newImgs = [...venueImages, ...urls]; setVenueImages(newImgs); await saveVenueImages(newImgs); } catch { alert('Yüklenemedi.') } finally { setUploadingImage(false) } }; inp.click() }}
                    style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed #d0d0d0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, color: '#aaa' }}
                  >
                    <span style={{ fontSize: 28 }}>+</span>
                    <span style={{ fontSize: 12 }}>Fotoğraf Ekle</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DROP-IN */}
        {activeTab === 'dropin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Create form */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>Yeni Drop-In Slot Oluştur</h3>
              <form onSubmit={handleAddDropIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="dropin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Spor *</label>
                    <select value={dropInForm.sport} onChange={e => setDropInForm({ ...dropInForm, sport: e.target.value, format: '' })} required style={inputStyle}>
                      <option value="">Seçin</option>
                      {DROP_IN_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Format *</label>
                    <select value={dropInForm.format} onChange={e => {
                      const fmt = e.target.value
                      const players = FORMAT_PLAYERS[fmt] || 0
                      setDropInForm({ ...dropInForm, format: fmt, totalPlayers: players ? String(players) : '' })
                    }} required style={inputStyle} disabled={!dropInForm.sport}>
                      <option value="">Seçin</option>
                      {(DROP_IN_FORMATS[dropInForm.sport] || []).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    {dropInForm.format && FORMAT_PLAYERS[dropInForm.format] && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 5 }}>Toplam: {FORMAT_PLAYERS[dropInForm.format]} kişi</div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Tarih *</label>
                    <input type="date" value={dropInForm.date} onChange={e => setDropInForm({ ...dropInForm, date: e.target.value })} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Saat *</label>
                    <input type="time" value={dropInForm.time} onChange={e => setDropInForm({ ...dropInForm, time: e.target.value })} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Kişi Başı Fiyat (₺) *</label>
                    <input type="number" placeholder="200" value={dropInForm.pricePerPerson} onChange={e => setDropInForm({ ...dropInForm, pricePerPerson: e.target.value })} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Görünürlük</label>
                    <select value={dropInForm.visibility} onChange={e => setDropInForm({ ...dropInForm, visibility: e.target.value })} style={inputStyle}>
                      <option value="open">Açık</option>
                      <option value="private">Özel</option>
                    </select>
                  </div>
                  {dropInForm.visibility === 'private' && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Özel Kod *</label>
                      <input type="text" placeholder="Katılım kodu" value={dropInForm.privateCode} onChange={e => setDropInForm({ ...dropInForm, privateCode: e.target.value })} style={inputStyle} />
                    </div>
                  )}
                </div>
                {dropInError && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {dropInError}</div>}
                {dropInSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {dropInSuccess}</div>}
                <button type="submit" style={{ padding: '13px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Slot Oluştur</button>
              </form>
            </div>

            {/* Existing slots */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#555', marginBottom: 12 }}>Mevcut Drop-In Slotlar</h3>
              {dropInSlots.length === 0 ? (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '32px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', color: '#aaa', fontSize: 14 }}>
                  Henüz drop-in slot oluşturulmadı.
                </div>
              ) : dropInSlots.map((slot: any) => (
                <div key={slot.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{slot.title}</div>
                    <div style={{ fontSize: 12, color: '#888', display: 'flex', gap: 12 }}>
                      <span><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{new Date(slot.startsAt).toLocaleDateString('tr-TR')} · {new Date(slot.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{slot.currentPlayers}/{slot.totalPlayers} oyuncu</span>
                    </div>
                    {slot.participants && slot.participants.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 4 }}>KATILIMCILAR</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {slot.participants.map((p: any) => (
                            <span key={p.id} style={{ fontSize: 11, backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                              {p.user?.fullName || 'Kullanıcı'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#4F46E5' }}>₺{slot.pricePerPerson}<span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>/kişi</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: slot.status === 'open' ? '#F0FDF4' : '#FEF2F2', color: slot.status === 'open' ? '#16a34a' : '#DC2626', padding: '3px 10px', borderRadius: 20 }}>{slot.status === 'open' ? '● Açık' : '● Kapalı'}</span>
                      <button onClick={() => handleDeleteSlot(slot.id)} disabled={deletingSlot === slot.id} style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                        {deletingSlot === slot.id ? '...' : 'Sil'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İSTATİSTİKLER */}
        {activeTab === 'istatistikler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: 15 }}>Yükleniyor...</div>
            ) : !stats ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: 15 }}>İstatistikler yüklenemedi.</div>
            ) : (
              <>
                {/* Özet Kartlar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {[
                    { label: 'Toplam Seans', value: stats.summary?.totalSessions ?? 0, color: '#4F46E5' },
                    { label: 'Toplam Rezervasyon', value: stats.summary?.totalBookings ?? 0, color: '#3B82F6' },
                    { label: 'Toplam Gelir', value: `₺${(stats.summary?.totalRevenue ?? 0).toLocaleString('tr-TR')}`, color: '#10B981' },
                    { label: 'Ort. Doluluk', value: `%${Math.round(stats.summary?.avgFillRate ?? 0)}`, color: '#F59E0B' },
                  ].map((card, i) => (
                    <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* Günlere Göre Doluluk */}
                {stats.dayStats && stats.dayStats.length > 0 && (
                  <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Günlere Göre Doluluk</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {stats.dayStats.map((d: any, i: number) => {
                        const fill = Math.round(d.fillRate ?? 0)
                        const barColor = fill >= 80 ? '#EF4444' : fill >= 50 ? '#F97316' : '#10B981'
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, fontSize: 13, fontWeight: 600, color: '#555', flexShrink: 0 }}>{d.day}</div>
                            <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, height: 18, overflow: 'hidden' }}>
                              <div style={{ width: `${fill}%`, backgroundColor: barColor, height: '100%', borderRadius: 8, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ width: 48, fontSize: 13, fontWeight: 700, color: barColor, textAlign: 'right', flexShrink: 0 }}>%{fill}</div>
                            <div style={{ width: 60, fontSize: 11, color: '#888', textAlign: 'right', flexShrink: 0 }}>{d.sessions} seans</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* En Popüler 5 Seans */}
                {stats.topSessions && stats.topSessions.length > 0 && (
                  <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>En Popüler 5 Seans</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {stats.topSessions.slice(0, 5).map((s: any, i: number) => {
                        const fill = Math.round(s.fillRate ?? 0)
                        const fillColor = fill >= 80 ? '#EF4444' : fill >= 50 ? '#F97316' : '#10B981'
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8f8f8', borderRadius: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{s.title}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>{s.date}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: fillColor }}>%{fill}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{s.booked}/{s.capacity} kişi</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Yaklaşan 7 Gün Seansları */}
                {stats.upcoming && stats.upcoming.length > 0 && (
                  <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Yaklaşan 7 Gün</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stats.upcoming.map((s: any, i: number) => {
                        const fill = Math.round(s.fillRate ?? 0)
                        const fillColor = fill >= 80 ? '#EF4444' : fill >= 50 ? '#F97316' : '#10B981'
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #f0f0f0', borderRadius: 12 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{s.title}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{s.date}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 80, backgroundColor: '#f0f0f0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                                <div style={{ width: `${fill}%`, backgroundColor: fillColor, height: '100%', borderRadius: 6 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: fillColor, width: 36, textAlign: 'right' }}>%{fill}</span>
                              <span style={{ fontSize: 11, color: '#888', width: 56, textAlign: 'right' }}>{s.booked}/{s.capacity} kişi</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* KUPONLAR */}
        {activeTab === 'kuponlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Kupon Oluşturma Formu */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>Yeni Kupon Oluştur</h3>
              <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Kupon Kodu *</label>
                    <input type="text" placeholder="YAZA20" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>İndirim Tipi *</label>
                    <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })} style={inputStyle}>
                      <option value="percent">Yüzde (%)</option>
                      <option value="fixed">Sabit Tutar (₺)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>İndirim Değeri *</label>
                    <input type="number" placeholder={couponForm.discountType === 'percent' ? '20' : '50'} value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })} required min="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Maksimum Kullanım (opsiyonel)</label>
                    <input type="number" placeholder="100" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} min="1" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Son Kullanım Tarihi (opsiyonel)</label>
                    <input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                {couponError && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {couponError}</div>}
                {couponSuccess && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>✓ {couponSuccess}</div>}
                <button type="submit" style={{ padding: '13px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Kupon Oluştur</button>
              </form>
            </div>

            {/* Kupon Listesi */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#555', marginBottom: 12 }}>Mevcut Kuponlar</h3>
              {coupons.length === 0 ? (
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '32px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', color: '#aaa', fontSize: 14 }}>
                  Henüz kupon oluşturulmadı.
                </div>
              ) : coupons.map((c: any) => (
                <div key={c.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#EEF2FF', borderRadius: 10, padding: '8px 16px' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5', letterSpacing: 1 }}>{c.code}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                        {c.discountType === 'percent' ? `%${c.discountValue} indirim` : `₺${c.discountValue} indirim`}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2, display: 'flex', gap: 10 }}>
                        <span>{c.usedCount ?? 0}{c.maxUses ? `/${c.maxUses}` : ''} kullanım</span>
                        {c.expiresAt && <span>· Son: {new Date(c.expiresAt).toLocaleDateString('tr-TR')}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: c.isActive !== false ? '#F0FDF4' : '#FEF2F2', color: c.isActive !== false ? '#16a34a' : '#DC2626', padding: '3px 10px', borderRadius: 20 }}>
                      {c.isActive !== false ? '● Aktif' : '● Pasif'}
                    </span>
                    {c.isActive !== false && (
                      <button onClick={() => handleDeleteCoupon(c.id)} disabled={deletingCoupon === c.id} style={{ padding: '5px 14px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        {deletingCoupon === c.id ? '...' : 'Deaktive Et'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GELİR RAPORU */}
        {activeTab === 'gelir' && (
          <div>
            {revenueLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Yükleniyor...</div>
            ) : !revenue ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Veri yüklenemedi.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Özet kartlar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                  {[
                    { label: 'Bu Ay', value: `₺${revenue.summary.thisMonthRevenue.toLocaleString('tr-TR')}`, sub: revenue.summary.monthChange !== null ? `${revenue.summary.monthChange > 0 ? '+' : ''}${revenue.summary.monthChange}% geçen aya göre` : 'İlk ay', color: '#4F46E5', bg: '#EEF2FF' },
                    { label: 'Geçen Ay', value: `₺${revenue.summary.lastMonthRevenue.toLocaleString('tr-TR')}`, sub: `${revenue.summary.totalBookings} toplam rezervasyon`, color: '#0EA5E9', bg: '#F0F9FF' },
                    { label: 'Ort. Ders Geliri', value: `₺${revenue.summary.avgPerBooking.toLocaleString('tr-TR')}`, sub: 'rezervasyon başına', color: '#10B981', bg: '#F0FDF4' },
                    { label: 'İptal Kaybı', value: `₺${revenue.summary.totalCancelledAmount.toLocaleString('tr-TR')}`, sub: `${revenue.summary.cancelledCount} iptal`, color: '#F59E0B', bg: '#FFFBEB' },
                  ].map(card => (
                    <div key={card.label} style={{ backgroundColor: card.bg, borderRadius: 16, padding: '20px 22px' }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>{card.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Aylık gelir bar chart */}
                <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 24 }}>Son 6 Ay Geliri</h3>
                  {revenue.monthlyRevenue.every((m: any) => m.revenue === 0) ? (
                    <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0', fontSize: 14 }}>Henüz gelir verisi yok</div>
                  ) : (() => {
                    const maxRev = Math.max(...revenue.monthlyRevenue.map((m: any) => m.revenue), 1)
                    return (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
                        {revenue.monthlyRevenue.map((m: any, i: number) => {
                          const isThisMonth = i === revenue.monthlyRevenue.length - 1
                          const height = Math.max((m.revenue / maxRev) * 140, m.revenue > 0 ? 4 : 0)
                          return (
                            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              {m.revenue > 0 && <div style={{ fontSize: 10, color: '#666', fontWeight: 700 }}>₺{m.revenue.toLocaleString('tr-TR')}</div>}
                              <div style={{ width: '100%', height: height, backgroundColor: isThisMonth ? '#4F46E5' : '#C7D2FE', borderRadius: '6px 6px 0 0', minHeight: m.revenue > 0 ? 4 : 0 }} />
                              <div style={{ fontSize: 11, color: isThisMonth ? '#4F46E5' : '#999', fontWeight: isThisMonth ? 800 : 500 }}>{m.month}</div>
                              <div style={{ fontSize: 10, color: '#bbb' }}>{m.bookings} rezerv.</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Ders bazlı gelir */}
                <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>Ders Bazlı Gelir</h3>
                  {revenue.byClass.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0', fontSize: 14 }}>Henüz veri yok</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '8px 12px', fontSize: 11, color: '#aaa', fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>
                        <span>DERS</span><span style={{ textAlign: 'right' }}>REZ.</span><span style={{ textAlign: 'right' }}>GELİR</span><span style={{ textAlign: 'right' }}>ORT.</span>
                      </div>
                      {revenue.byClass.map((cls: any, i: number) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '12px 12px', borderBottom: '1px solid #f8f8f8', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{cls.title}</span>
                          <span style={{ fontSize: 13, color: '#888', textAlign: 'right' }}>{cls.bookings}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#4F46E5', textAlign: 'right' }}>₺{cls.revenue.toLocaleString('tr-TR')}</span>
                          <span style={{ fontSize: 12, color: '#aaa', textAlign: 'right' }}>₺{Math.round(cls.revenue / cls.bookings).toLocaleString('tr-TR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CSV İndir */}
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => {
                    const rows = [
                      ['Ay', 'Gelir (₺)', 'Rezervasyon'],
                      ...revenue.monthlyRevenue.map((m: any) => [m.month, m.revenue, m.bookings]),
                      [],
                      ['Ders', 'Rezervasyon', 'Gelir (₺)', 'Ort. (₺)'],
                      ...revenue.byClass.map((c: any) => [c.title, c.bookings, c.revenue, Math.round(c.revenue / c.bookings)]),
                    ]
                    const csv = rows.map(r => r.join(',')).join('\n')
                    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = 'gelir-raporu.csv'; a.click()
                    URL.revokeObjectURL(url)
                  }} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    CSV İndir
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* REZERVASYONLAR */}
        {activeTab === 'rezervasyonlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Ticket size={48} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Henüz rezervasyon yok</div>
              </div>
            ) : bookings.map((b: any) => (
              <div key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(() => { const { initials, color } = getInitialsAvatar(b.user?.fullName || '?'); return (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initials}</div>
                  )})()}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{b.user?.fullName}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{b.session?.class?.title} · {b.session?.startsAt ? new Date(b.session.startsAt).toLocaleDateString('tr-TR') : ''}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}>₺{b.finalAmount}</div>
                  <div style={{ fontSize: 11, color: b.status === 'confirmed' ? '#10B981' : '#EF4444', fontWeight: 600 }}>{b.status === 'confirmed' ? '✓ Onaylı' : '✗ İptal'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'yorumlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Kullanıcı Yorumları</h3>
              <button onClick={fetchReviews} style={{ background: '#F5F3FF', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#4F46E5', cursor: 'pointer' }}>Yenile</button>
            </div>
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Yükleniyor...</div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#bbb' }}>
                <div style={{ fontSize: 40, marginBottom: 10, color: '#e5e5e5' }}>★</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#555' }}>Henüz yorum yok</div>
                <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>Kullanıcılar ders aldıktan sonra yorum yapabilir</div>
              </div>
            ) : reviews.map((r: any) => (
              <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>
                      {r.isAnonymous ? '?' : (r.reviewer?.fullName?.[0] || '?')}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{r.isAnonymous ? 'Anonim' : (r.reviewer?.fullName || 'Kullanıcı')}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 16, color: n <= r.rating ? '#F59E0B' : '#e5e5e5' }}>★</span>)}
                  </div>
                </div>
                {r.comment && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 14px' }}>{r.comment}</p>}
                {r.venueReply ? (
                  <div style={{ backgroundColor: '#F5F3FF', borderRadius: 10, padding: '12px 16px', borderLeft: '3px solid #4F46E5', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>Yanıtınız</div>
                    <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{r.venueReply}</p>
                    <button onClick={() => handleDeleteReply(r.id)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#EF4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Yanıtı Sil</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                      value={replyTexts[r.id] || ''}
                      onChange={e => setReplyTexts(t => ({ ...t, [r.id]: e.target.value }))}
                      placeholder="Bu yoruma yanıt yaz..."
                      rows={2}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                    <button
                      onClick={() => handleReply(r.id)}
                      disabled={replyLoading === r.id || !replyTexts[r.id]?.trim()}
                      style={{ padding: '0 18px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: replyLoading === r.id ? 0.6 : 1 }}
                    >
                      {replyLoading === r.id ? '...' : 'Yanıtla'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'qr' && venue && (
          <QRTab venueId={venue.id} venueName={venue.name} />
        )}

        {activeTab === 'profil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 600 }}>
            {/* Salon bilgileri */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>Salon Bilgileri</h3>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Salon Adı', field: 'name' as const, type: 'text' },
                  { label: 'Telefon', field: 'phone' as const, type: 'tel' },
                  { label: 'Adres', field: 'address' as const, type: 'text' },
                  { label: 'Website', field: 'website' as const, type: 'url' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>{label}</label>
                    <input
                      type={type}
                      value={profileForm[field]}
                      onChange={e => setProfileForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Açıklama</label>
                  <textarea
                    value={profileForm.description}
                    onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                {profileError && <div style={{ color: '#DC2626', fontSize: 13 }}>{profileError}</div>}
                {profileSuccess && <div style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>{profileSuccess}</div>}
                <button type="submit" style={{ padding: '13px', borderRadius: 14, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Bilgileri Güncelle
                </button>
              </form>
            </div>

            {/* Şifre değiştir */}
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>Şifre Değiştir</h3>
              <form onSubmit={handleChangeVenuePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Mevcut Şifre', field: 'currentPassword' as const },
                  { label: 'Yeni Şifre', field: 'newPassword' as const },
                  { label: 'Yeni Şifre (Tekrar)', field: 'newPassword2' as const },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>{label}</label>
                    <input
                      type="password"
                      value={pwForm[field]}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                {pwError && <div style={{ color: '#DC2626', fontSize: 13 }}>{pwError}</div>}
                {pwSuccess && <div style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>{pwSuccess}</div>}
                <button type="submit" style={{ padding: '13px', borderRadius: 14, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Şifremi Değiştir
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckInScanner({ venueId }: { venueId: number }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; alreadyCheckedIn?: boolean; message: string; booking?: any; participant?: any } | null>(null)

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    const token = localStorage.getItem('fitpass_venue_token')!
    // Önce class check-in dene, hata alırsa drop-in check-in dene
    let res = await fetch(`${API_URL}/api/bookings/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    })
    let data = await res.json()
    if (data.error) {
      const res2 = await fetch(`${API_URL}/api/bookings/dropin-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const data2 = await res2.json()
      if (!data2.error) data = data2
    }
    setResult(data.error ? { success: false, message: data.error } : data)
    setLoading(false)
    if (!data.error) setCode('')
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 8 }}>
      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: '0 0 16px' }}>Check-in Yap</h4>
      <form onSubmit={handleCheckIn} style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          placeholder="8 haneli kod (örn: A1B2C3D4)"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null) }}
          maxLength={8}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 700, letterSpacing: 3, fontFamily: 'monospace', outline: 'none', textTransform: 'uppercase' }}
        />
        <button type="submit" disabled={loading || code.length < 4} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading || code.length < 4 ? 0.6 : 1 }}>
          {loading ? '...' : 'Onayla'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 14, borderRadius: 12, padding: '14px 18px', backgroundColor: result.success ? '#F0FDF4' : result.alreadyCheckedIn ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${result.success ? '#BBF7D0' : result.alreadyCheckedIn ? '#FDE68A' : '#FECACA'}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: result.success ? '#166534' : result.alreadyCheckedIn ? '#92400E' : '#DC2626', marginBottom: result.booking ? 8 : 0 }}>
            {result.success ? '✓ ' : result.alreadyCheckedIn ? '⚠ ' : '✗ '}{result.message}
          </div>
          {result.booking && (
            <div style={{ fontSize: 13, color: '#555' }}>
              <strong>{result.booking.user?.fullName}</strong> — {result.booking.classTitle}
              {result.booking.groupSize > 1 && <span style={{ color: '#4F46E5', fontWeight: 600 }}> ({result.booking.groupSize} kişi)</span>}
            </div>
          )}
          {result.participant && (
            <div style={{ fontSize: 13, color: '#555' }}>
              <strong>{result.participant.user?.fullName}</strong> — {result.participant.slotTitle}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QRTab({ venueId, venueName }: { venueId: number; venueName: string }) {
  const SITE_URL = 'https://sipsakspor.com'
  const venueUrl = `${SITE_URL}/venue/${venueId}`
  const registerUrl = `${SITE_URL}/salon-giris`
  const canvasRef1 = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      const opts = { width: 280, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } }
      if (canvasRef1.current) QRCode.toCanvas(canvasRef1.current, venueUrl, opts)
      if (canvasRef2.current) QRCode.toCanvas(canvasRef2.current, registerUrl, opts)
      setReady(true)
    })
  }, [venueUrl, registerUrl])

  const downloadQR = (canvasRef: React.RefObject<HTMLCanvasElement | null>, filename: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>QR Kodlarınız</h3>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>QR kodları yazdırıp salonunuza asın — müşteriler okutunca doğrudan salonunuza veya kayıt sayfasına yönlendirilir.</p>
      </div>

      <CheckInScanner venueId={venueId} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* QR 1 — Müşteri için */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Müşteri QR</div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: '0 0 16px' }}>Salon Sayfanız</h4>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <canvas ref={canvasRef1} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} />
          </div>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>Okutunca: <strong style={{ color: '#555' }}>{venueUrl}</strong></p>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>Müşterileriniz bu QR'ı okutunca salonunuzun sayfasını görür, derslere kayıt olabilir.</p>
          <button
            onClick={() => downloadQR(canvasRef1, `${venueName}-musteri-qr.png`)}
            disabled={!ready}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            PNG İndir
          </button>
        </div>

        {/* QR 2 — Salon kaydı için */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Salon QR</div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: '0 0 16px' }}>Salon Girişi</h4>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <canvas ref={canvasRef2} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} />
          </div>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>Okutunca: <strong style={{ color: '#555' }}>{registerUrl}</strong></p>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>Diğer salonları Şipşakspor'a davet etmek için bu QR'ı paylaşın.</p>
          <button
            onClick={() => downloadQR(canvasRef2, 'sipsakspor-salon-kayit-qr.png')}
            disabled={!ready}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#10B981', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            PNG İndir
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#F5F3FF', borderRadius: 16, padding: '16px 20px', fontSize: 13, color: '#6D28D9', lineHeight: 1.6 }}>
        <strong>Nasıl kullanılır?</strong> Müşteri QR'ını yazdırıp salonunuzun girişine, resepsiyon masasına veya ders listesinin yanına asın. Müşteriler telefon kameralarıyla okutunca doğrudan salonunuzun sayfasına gidip rezervasyon yapabilir.
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
const errorStyle: React.CSSProperties = { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }
