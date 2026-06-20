'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockUsers } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { api, getUser, getToken } from '@/lib/api'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
import type { ReactNode } from 'react'
import { User, Users, Ticket, Award, ClipboardList, BarChart2, BookOpen, Calendar, Flame, Dumbbell, Heart, Building, MapPin, Gift, Medal, Check, X, Lock, CreditCard, Copy, CheckCheck } from 'lucide-react'
import { SportIcon, SportIconBox, getIconKeyForCategory, getColorForCategory } from '@/lib/sportIcons'
import AvatarUpload from '@/components/AvatarUpload'
import { getInitialsAvatar } from '@/lib/cloudinary'

type OwnTab = 'aktivite' | 'rezervasyonlar' | 'hesap' | 'ödeme' | 'favoriler' | 'referans'
type PublicTab = 'aktivite' | 'arkadaşlar' | 'istatistik'

export default function ProfilPage() {
  const params = useParams()
  const username = params.username as string
  const loggedInUser = getUser()
  const isOwnProfile = loggedInUser?.username === username

  // Real user data for own profile
  const [meData, setMeData] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [dropIns, setDropIns] = useState<any[]>([])
  const [loadingMe, setLoadingMe] = useState(isOwnProfile)
  const [loadingBookings, setLoadingBookings] = useState(isOwnProfile)
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<any[]>([])

  // Public profile data
  const [publicData, setPublicData] = useState<any>(null)
  const [loadingPublic, setLoadingPublic] = useState(!isOwnProfile)

  // Privacy toggle
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [privacySaved, setPrivacySaved] = useState(false)

  // Bildirim tercihleri
  const [emailReminders, setEmailReminders] = useState(true)
  const [smsReminders, setSmsReminders] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  // Profile edit
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', bio: '', neighborhoodId: '', avatarUrl: '' })
  const [editSaved, setEditSaved] = useState(false)
  const [editError, setEditError] = useState('')
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])

  const [activeTab, setActiveTab] = useState<OwnTab | PublicTab>('aktivite')
  const [isFollowing, setIsFollowing] = useState(false)
  const [referralInfo, setReferralInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Follow system state
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [socialLoaded, setSocialLoaded] = useState(false)

  // Mock data for public profiles (or fallback)
  const mockUser = mockUsers.find(u => u.username === username) || mockUsers[0]
  const friends = mockUsers.filter(u => u.id !== mockUser.id).slice(0, 4)

  useEffect(() => {
    if (!isOwnProfile) {
      api.getUserActivities(username).then((data: any) => {
        setPublicData(data)
        setLoadingPublic(false)
      }).catch(() => setLoadingPublic(false))

      // Fetch follow status if logged in
      if (loggedInUser) {
        const token = getToken()
        if (token) {
          api.getFollowStatus(token, username).then((data: any) => {
            if (data.isFollowing !== undefined) setIsFollowing(data.isFollowing)
            if (data.followers !== undefined) setFollowersCount(data.followers)
            if (data.following !== undefined) setFollowingCount(data.following)
          }).catch(() => {})
        }
      } else {
        // Still fetch counts without auth
        api.getFollowers(username).then((data: any) => {
          if (data.followers) setFollowersCount(data.followers.length)
        }).catch(() => {})
        api.getFollowing(username).then((data: any) => {
          if (data.following) setFollowingCount(data.following.length)
        }).catch(() => {})
      }
      return
    }
    const token = getToken()
    if (!token) { setLoadingMe(false); setLoadingBookings(false); return }

    api.getMe(token).then((data: any) => {
      if (data.user) {
        setMeData(data.user)
        setPrivacy(data.user.activityPrivacy || 'public')
        setEmailReminders(data.user.emailReminders !== false)
        setSmsReminders(data.user.smsReminders === true)
        setEditForm({
          fullName: data.user.fullName || '',
          bio: data.user.bio || '',
          neighborhoodId: data.user.neighborhoodId ? String(data.user.neighborhoodId) : '',
          avatarUrl: data.user.avatarUrl || '',
        })
      }
      setLoadingMe(false)
    }).catch(() => setLoadingMe(false))

    api.getNeighborhoods().then((data: any) => {
      if (data.neighborhoods) setNeighborhoods(data.neighborhoods)
    }).catch(() => {})

    api.getMyBookings(token).then((data: any) => {
      if (data.bookings) setBookings(data.bookings)
      if (data.dropInParticipations) setDropIns(data.dropInParticipations)
      setLoadingBookings(false)
    }).catch(() => setLoadingBookings(false))
  }, [isOwnProfile, username])

  const handleCancel = async (bookingId: number) => {
    if (cancelConfirm !== bookingId) {
      setCancelConfirm(bookingId)
      return
    }
    const token = getToken()
    if (!token) return
    setCancelError(null)
    try {
      const res = await api.cancelBooking(token, bookingId)
      if (res.error) {
        setCancelError(res.error)
      } else {
        const message = res.message || 'Rezervasyon iptal edildi.'
        setCancelError(null)
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled', notes: res.booking?.notes || b.notes } : b))
        // Show success message via error state with green styling (re-used as info)
        setCancelError(`✓ ${message}`)
        setTimeout(() => setCancelError(null), 5000)
      }
    } catch {
      setCancelError('İptal edilirken bir hata oluştu.')
    }
    setCancelConfirm(null)
  }

  // Tiers for progress bar
  const tiers = [
    { name: 'Acemi', min: 1 }, { name: 'Aday', min: 10 }, { name: 'Sporcu', min: 35 },
    { name: 'Atlet', min: 70 }, { name: 'Şampiyon', min: 120 },
  ]

  // Use real data for own profile, mock for others
  const user = isOwnProfile && meData ? null : mockUser  // public profile uses mockUser

  const recentActivity: any[] = [] // artık kullanılmıyor

  // İkon ve renk artık keyword matching ile dinamik — hardcoded map yok

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} dakika önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Dün'
    if (days < 7) return `${days} gün önce`
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  }

  // Kendi profilinde gerçek aktivite listesi (booking + drop-in birleşik, en yeni önce)
  const realActivities = [
    ...bookings
      .filter(b => b.status === 'confirmed')
      .map(b => ({ type: 'booking' as const, date: new Date(b.session?.startsAt || b.createdAt), data: b })),
    ...dropIns
      .filter(dp => dp.status === 'confirmed')
      .map(dp => ({ type: 'dropin' as const, date: new Date(dp.slot?.startsAt || dp.joinedAt), data: dp })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20)

  const ownTabs: { key: OwnTab; label: ReactNode }[] = [
    { key: 'aktivite', label: <><ClipboardList size={15} style={{ marginRight: 5 }} />Aktivite</> },
    { key: 'rezervasyonlar', label: <><Ticket size={15} style={{ marginRight: 5 }} />Aktivitelerim</> },
    { key: 'hesap', label: <><User size={15} style={{ marginRight: 5 }} />Hesap Bilgilerim</> },
    { key: 'ödeme', label: <><CreditCard size={15} style={{ marginRight: 5 }} />Ödeme Bilgilerim</> },
    { key: 'favoriler', label: <><Heart size={15} style={{ marginRight: 5 }} />Favori Salonlar</> },
    { key: 'referans', label: <><Gift size={15} style={{ marginRight: 5 }} />Davet Et</> },
  ]

  const publicTabs: { key: PublicTab; label: ReactNode }[] = [
    { key: 'aktivite', label: <><ClipboardList size={15} style={{ marginRight: 5 }} />Aktivite</> },
    { key: 'arkadaşlar', label: <><Users size={15} style={{ marginRight: 5 }} />Arkadaşlar</> },
    { key: 'istatistik', label: <><BarChart2 size={15} style={{ marginRight: 5 }} />İstatistik</> },
  ]

  const tabs = isOwnProfile ? ownTabs : publicTabs

  // Loading skeleton for own profile
  if (isOwnProfile && loadingMe) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Navbar />
        <div className="page-container" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0', marginBottom: 20 }}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, #E0E0E0 0%, #EBEBEB 100%)' }} />
            <div style={{ padding: '0 32px 28px' }}>
              <div style={{ marginTop: -40, width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E0E0E0', border: '4px solid #fff' }} />
              <div style={{ marginTop: 16, width: 200, height: 24, backgroundColor: '#E0E0E0', borderRadius: 6 }} />
              <div style={{ marginTop: 8, width: 120, height: 16, backgroundColor: '#EBEBEB', borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: 40 }}>Profil yükleniyor...</div>
        </div>
      </div>
    )
  }

  // Determine display values
  const pubUser = !isOwnProfile ? publicData?.user : null
  const displayName = isOwnProfile && meData ? meData.fullName : (pubUser?.fullName ?? mockUser.fullName)
  const displayUsername = isOwnProfile && meData ? meData.username : (pubUser?.username ?? mockUser.username)
  const displayTierName = isOwnProfile && meData?.tier ? meData.tier.name : (pubUser?.tier?.name ?? mockUser.tier.name)
  const displayTierColor = isOwnProfile && meData?.tier ? `#${meData.tier.colorHex || '4F46E5'}` : (pubUser?.tier?.colorHex ? `#${pubUser.tier.colorHex}` : mockUser.tier.color)
  const displayTierDiscount = isOwnProfile && meData?.tier ? meData.tier.discountPercent : (pubUser?.tier?.discountPercent ?? mockUser.tier.discountPercent)
  const displayNeighborhood = isOwnProfile && meData?.neighborhood ? meData.neighborhood.name : (pubUser?.neighborhood?.name ?? (isOwnProfile ? '' : mockUser.neighborhood))
  const displayTotalLessons = isOwnProfile && meData ? meData.totalLessonsCompleted : (pubUser?.totalLessonsCompleted ?? mockUser.stats.totalLessons)
  const displayTierIcon = isOwnProfile && meData?.tier ? 'medal' : (pubUser?.tier ? 'medal' : mockUser.tier.icon)

  const currentTierIndex = tiers.findIndex(t => t.name === displayTierName)
  const nextTier = tiers[currentTierIndex + 1]
  const progressPercent = nextTier
    ? Math.min(100, ((displayTotalLessons - tiers[Math.max(0, currentTierIndex)].min) / (nextTier.min - tiers[Math.max(0, currentTierIndex)].min)) * 100)
    : 100

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div className="page-container" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 14, textDecoration: 'none', fontWeight: 500, marginBottom: 28 }}>
          ← Ana sayfa
        </Link>

        {/* Profil kartı */}
        <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0', marginBottom: 20 }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${displayTierColor} 0%, ${displayTierColor}80 100%)` }} />

          <div style={{ padding: '0 32px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div style={{ marginTop: -40 }}>
                <AvatarUpload
                  currentUrl={isOwnProfile ? meData?.avatarUrl : pubUser?.avatarUrl}
                  name={displayName || '?'}
                  size={96}
                  editable={isOwnProfile}
                  onUpload={async (url) => {
                    const token = localStorage.getItem('fitpass_token')
                    if (!token) return
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/profile`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ avatarUrl: url }),
                    })
                    setMeData((prev: any) => prev ? { ...prev, avatarUrl: url } : prev)
                  }}
                />
              </div>
              {!isOwnProfile && (
                <button
                  onClick={async () => {
                    const token = getToken()
                    if (!token) return
                    const prevFollowing = isFollowing
                    setIsFollowing(!isFollowing)
                    setFollowersCount(c => prevFollowing ? c - 1 : c + 1)
                    try {
                      if (prevFollowing) {
                        await api.unfollowUser(token, username)
                      } else {
                        await api.followUser(token, username)
                      }
                    } catch {
                      setIsFollowing(prevFollowing)
                      setFollowersCount(c => prevFollowing ? c + 1 : c - 1)
                    }
                  }}
                  style={{ padding: '10px 24px', borderRadius: 100, border: isFollowing ? '1.5px solid #EBEBEB' : 'none', background: isFollowing ? '#fff' : '#4F46E5', color: isFollowing ? '#555' : '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16 }}
                >
                  {isFollowing ? '✓ Takip Ediliyor' : '+ Takip Et'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{displayName}</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: displayTierColor, backgroundColor: displayTierColor + '18', padding: '4px 12px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <SportIcon name={displayTierIcon} size={12} color={displayTierColor} /> {displayTierName}
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#aaa', marginBottom: 4 }}>@{displayUsername}</div>
            {displayNeighborhood && (
              <div style={{ fontSize: 13, color: '#bbb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {displayNeighborhood}, İstanbul</div>
            )}

            {nextTier && (
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: 14, padding: '14px 18px', marginBottom: 16, border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#555', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><SportIcon name={displayTierIcon} size={13} color={displayTierColor} /> {displayTierName}</span>
                  <span style={{ fontSize: 12, color: '#999' }}>{nextTier.min - displayTotalLessons} ders daha → <strong style={{ color: '#111' }}>{nextTier.name}</strong></span>
                </div>
                <div style={{ height: 6, backgroundColor: '#EBEBEB', borderRadius: 100 }}>
                  <div style={{ height: '100%', backgroundColor: displayTierColor, borderRadius: 100, width: `${progressPercent}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {displayTierDiscount > 0 && (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Gift size={16} /> {displayTierName} avantajı: %{displayTierDiscount} indirim</span>
              </div>
            )}
          </div>

          {/* İstatistik satırı */}
          <div className="stats-grid" style={{ borderTop: '1px solid #F5F5F5', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Toplam Ders', value: displayTotalLessons, icon: <BookOpen size={20} /> },
              { label: 'Bu Ay', value: isOwnProfile && meData ? (() => { const now = new Date(); return bookings.filter(b => b.status === 'confirmed' && new Date(b.session?.startsAt || b.createdAt).getMonth() === now.getMonth() && new Date(b.session?.startsAt || b.createdAt).getFullYear() === now.getFullYear()).length + dropIns.filter(dp => dp.status === 'confirmed' && new Date(dp.slot?.startsAt || dp.joinedAt).getMonth() === now.getMonth() && new Date(dp.slot?.startsAt || dp.joinedAt).getFullYear() === now.getFullYear()).length })() : (pubUser?.totalLessonsCompleted ?? '-'), icon: <Calendar size={20} /> },
              { label: 'İstanbul Sırası', value: '-', icon: <Building size={20} /> },
              { label: 'Puan', value: isOwnProfile && meData ? meData.rewardPoints : '-', icon: <MapPin size={20} /> },
            ].map((stat, i) => (
              <div key={i} style={{ padding: '18px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid #F5F5F5' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sporlar + Rozetler — only for public profiles */}
        {!isOwnProfile && !loadingPublic && !publicData?.isPrivate && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '22px 24px', border: '1px solid #F0F0F0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Medal size={16} /> Ana Sporlar</h3>
              {(() => {
                const counts: Record<string, number> = {}
                ;(publicData?.bookings || []).forEach((b: any) => {
                  const cat = b.session?.class?.category || b.session?.class?.sportCategory?.name || ''
                  if (cat) counts[cat] = (counts[cat] || 0) + 1
                })
                ;(publicData?.dropInParticipations || []).forEach((dp: any) => {
                  const cat = dp.slot?.sportCategory?.name || ''
                  if (cat) counts[cat] = (counts[cat] || 0) + 1
                })
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4)
                if (sorted.length === 0) return <div style={{ color: '#bbb', fontSize: 13 }}>Henüz aktivite yok.</div>
                const max = sorted[0][1]
                return sorted.map(([cat, count], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <SportIconBox name={getIconKeyForCategory(cat)} bgColor={getColorForCategory(cat) + '20'} iconColor={getColorForCategory(cat)} boxSize={38} borderRadius={12} size={18} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{cat}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>{count} aktivite</span>
                      </div>
                      <div style={{ height: 5, backgroundColor: '#F0F0F0', borderRadius: 100 }}>
                        <div style={{ height: '100%', backgroundColor: getColorForCategory(cat), borderRadius: 100, width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '22px 24px', border: '1px solid #F0F0F0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Award size={16} /> Rozetler</h3>
              {(() => {
                const badges = publicData?.user?.badges || []
                if (badges.length === 0) return <div style={{ color: '#bbb', fontSize: 13 }}>Henüz rozet kazanılmadı.</div>
                return badges.slice(0, 5).map((ub: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#F0FDF4', borderRadius: 12, marginBottom: 8 }}>
                    <Award size={18} color="#16A34A" />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{ub.badge?.name || 'Rozet'}</div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="profile-tabs" style={{ backgroundColor: '#fff', borderRadius: 16, padding: '4px', border: '1px solid #F0F0F0', display: 'inline-flex', gap: 2, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className="profile-tab-item"
              onClick={() => {
                setActiveTab(tab.key as any)
                if (tab.key === 'favoriler') {
                  if (isOwnProfile) {
                    const token = localStorage.getItem('fitpass_token')
                    if (token) {
                      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/favorites/my`, {
                        headers: { Authorization: `Bearer ${token}` }
                      }).then(r => r.json()).then(d => setFavorites(d.favorites || []))
                    }
                  } else {
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/favorites/user/${username}`)
                      .then(r => r.json()).then(d => setFavorites(d.favorites || []))
                  }
                }
                if (tab.key === 'arkadaşlar' && !socialLoaded) {
                  Promise.all([
                    api.getFollowers(username),
                    api.getFollowing(username),
                  ]).then(([frs, fng]: any[]) => {
                    setFollowers(frs.followers || [])
                    setFollowing(fng.following || [])
                    setSocialLoaded(true)
                  }).catch(() => setSocialLoaded(true))
                }
              }}
              style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#4F46E5' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#fff' : '#888', transition: 'all 0.15s' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aktivite — kendi profilim */}
        {activeTab === 'aktivite' && isOwnProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingBookings ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ height: 14, width: '55%', borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                      <div style={{ height: 12, width: '35%', borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : realActivities.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏃</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>Henüz aktivite yok</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>Bir derse katıl veya drop-in maça kaydol — burada görünecek.</div>
              </div>
            ) : realActivities.map((item, idx) => {
              if (item.type === 'booking') {
                const b = item.data
                const session = b.session
                const classObj = session?.class
                const venue = classObj?.venue
                const catName = classObj?.category || classObj?.sportCategory?.name || ''
                const icon = getIconKeyForCategory(catName)
                const color = getColorForCategory(catName)
                return (
                  <div key={`a-b-${b.id}`} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <SportIconBox name={icon} bgColor={color + '18'} iconColor={color} boxSize={46} borderRadius={14} size={20} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{classObj?.title || 'Ders'}</div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{venue?.name || ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>{timeAgo(item.date)}</div>
                      <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Ders</span>
                    </div>
                  </div>
                )
              } else {
                const dp = item.data
                const slot = dp.slot
                const cat = slot?.sportCategory
                const iconColor = cat?.colorHex ? `#${cat.colorHex}` : '#3B82F6'
                return (
                  <div key={`a-dp-${dp.id}`} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <SportIconBox name={cat?.iconUrl || 'football'} bgColor={iconColor + '18'} iconColor={iconColor} boxSize={46} borderRadius={14} size={20} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{slot?.title || 'Maç'}</div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{slot?.venue?.name || ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>{timeAgo(item.date)}</div>
                      <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>Drop-in</span>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )}

        {/* Aktivite — public profile */}
        {activeTab === 'aktivite' && !isOwnProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingPublic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ height: 15, width: '50%', borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                      <div style={{ height: 12, width: '30%', borderRadius: 6, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : publicData?.isPrivate ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Lock size={48} color="#ccc" /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>Bu kullanıcının aktiviteleri gizli.</div>
              </div>
            ) : publicData?.bookings || publicData?.dropInParticipations ? (
              (() => {
                const pubBookings: any[] = publicData.bookings || []
                const pubDropIns: any[] = publicData.dropInParticipations || []
                const allActivities = [
                  ...pubBookings.map((b: any) => ({ type: 'booking', date: new Date(b.session?.startsAt || b.createdAt), data: b })),
                  ...pubDropIns.map((dp: any) => ({ type: 'dropin', date: new Date(dp.slot?.startsAt || dp.joinedAt), data: dp })),
                ].sort((a, b) => b.date.getTime() - a.date.getTime())

                if (allActivities.length === 0) {
                  return <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '40px', textAlign: 'center', border: '1px solid #F0F0F0', color: '#999', fontSize: 14 }}>Henüz aktivite yok</div>
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {allActivities.map((item) => {
                      if (item.type === 'booking') {
                        const b = item.data
                        const session = b.session
                        const classObj = session?.class
                        const venue = classObj?.venue
                        const startsAt = session?.startsAt ? new Date(session.startsAt) : null
                        const dateStr = startsAt ? startsAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                        const timeStr = startsAt ? startsAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''
                        const catName = classObj?.category || ''
                        const icon = getIconKeyForCategory(catName)
                        const color = getColorForCategory(catName)
                        return (
                          <div key={`pb-${b.id}`} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <SportIconBox name={icon} bgColor={color + '18'} iconColor={color} boxSize={50} borderRadius={14} size={22} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>{classObj?.title || 'Ders'}</div>
                              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 2 }}>{venue?.name || ''}</div>
                              <div style={{ fontSize: 12, color: '#bbb' }}>{dateStr}{timeStr ? ` · ${timeStr}` : ''}</div>
                            </div>
                            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Onaylı</span>
                          </div>
                        )
                      } else {
                        const dp = item.data
                        const slot = dp.slot
                        const cat = slot?.sportCategory
                        const slotStartsAt = slot?.startsAt ? new Date(slot.startsAt) : null
                        const dpDateStr = slotStartsAt ? slotStartsAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                        const dpTimeStr = slotStartsAt ? slotStartsAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''
                        const iconColor = cat?.colorHex ? `#${cat.colorHex}` : '#3B82F6'
                        return (
                          <div key={`pdp-${dp.id}`} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <SportIconBox name={cat?.iconUrl || 'football'} bgColor={iconColor + '18'} iconColor={iconColor} boxSize={50} borderRadius={14} size={22} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>{slot?.title || 'Maç'}</div>
                              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 2 }}>{slot?.venue?.name || ''}</div>
                              <div style={{ fontSize: 12, color: '#bbb' }}>{dpDateStr}{dpTimeStr ? ` · ${dpTimeStr}` : ''}</div>
                            </div>
                            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Katıldı</span>
                          </div>
                        )
                      }
                    })}
                  </div>
                )
              })()
            ) : (
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏃</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>Henüz aktivite yok</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>Bu kullanıcının henüz tamamlanmış aktivitesi bulunmuyor.</div>
              </div>
            )}
          </div>
        )}

        {/* Rezervasyonlarım — own profile only */}
        {activeTab === 'rezervasyonlar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cancelError && (
              <div style={{ backgroundColor: cancelError.startsWith('✓') ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${cancelError.startsWith('✓') ? '#BBF7D0' : '#FECACA'}`, borderRadius: 12, padding: '12px 16px', fontSize: 13, color: cancelError.startsWith('✓') ? '#16a34a' : '#DC2626', fontWeight: 500 }}>{cancelError}</div>
            )}
            {loadingBookings ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0', color: '#999', fontSize: 14 }}>Rezervasyonlar yükleniyor...</div>
            ) : bookings.length === 0 && dropIns.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Ticket size={52} color="#ccc" /></div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Henüz rezervasyonun yok</div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Dersler sayfasından ders bul ve rezervasyon yap</div>
                <Link href="/" style={{ padding: '12px 28px', borderRadius: 14, background: '#4F46E5', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Ders Bul</Link>
              </div>
            ) : (
              (() => {
                // Bookings ve drop-ins birleştir, tarihe göre sırala
                const allActivities = [
                  ...bookings.map((b: any) => ({ type: 'booking', date: new Date(b.session?.startsAt || b.createdAt), data: b })),
                  ...dropIns.map((dp: any) => ({ type: 'dropin', date: new Date(dp.slot?.startsAt || dp.joinedAt), data: dp })),
                ].sort((a, b) => b.date.getTime() - a.date.getTime())

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {allActivities.map((item) => {
                      if (item.type === 'booking') {
                        const b = item.data
                        const session = b.session
                        const classObj = session?.class
                        const venue = classObj?.venue
                        const startsAt = session?.startsAt ? new Date(session.startsAt) : null
                        const dateStr = startsAt ? startsAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                        const timeStr = startsAt ? startsAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''
                        const isFuture = startsAt ? startsAt > new Date() : false
                        const isConfirmed = b.status === 'confirmed'
                        const isCancelled = b.status === 'cancelled'
                        const awaitingConfirm = cancelConfirm === b.id
                        const catName = classObj?.category || ''
                        const icon = getIconKeyForCategory(catName)
                        const color = getColorForCategory(catName)

                        return (
                          <div key={`b-${b.id}`} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <SportIconBox name={icon} bgColor={isCancelled ? '#F5F5F5' : color + '18'} iconColor={isCancelled ? '#ccc' : color} boxSize={50} borderRadius={14} size={22} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: isCancelled ? '#bbb' : '#111', textDecoration: isCancelled ? 'line-through' : 'none', marginBottom: 3 }}>{classObj?.title || 'Ders'}</div>
                              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 2 }}>{venue?.name || ''}</div>
                              <div style={{ fontSize: 12, color: '#bbb' }}>{dateStr}{timeStr ? ` · ${timeStr}` : ''}</div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: isCancelled ? '#bbb' : '#4F46E5' }}>₺{b.finalAmount}</div>
                              {isCancelled ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                  <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, backgroundColor: '#FEF2F2', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> İptal edildi</span>
                                  {b.notes?.includes('iade') && (
                                    <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>{b.notes.split('İptal: ')[1] || ''}</div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Onaylı</span>
                                  {isConfirmed && isFuture && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                      {b.checkInCode && (
                                        <CheckInQR code={b.checkInCode} />
                                      )}
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        {awaitingConfirm ? (
                                          <button onClick={() => handleCancel(b.id)} style={{ fontSize: 12, color: '#fff', fontWeight: 600, background: '#EF4444', border: 'none', borderRadius: 100, padding: '4px 12px', cursor: 'pointer' }}>Evet, İptal Et</button>
                                        ) : (
                                          <button onClick={() => handleCancel(b.id)} style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, background: 'none', border: '1px solid #FECACA', borderRadius: 100, padding: '3px 10px', cursor: 'pointer' }}>İptal Et</button>
                                        )}
                                        {awaitingConfirm && <button onClick={() => setCancelConfirm(null)} style={{ fontSize: 12, color: '#888', fontWeight: 600, background: 'none', border: '1px solid #E0E0E0', borderRadius: 100, padding: '3px 10px', cursor: 'pointer' }}>Vazgeç</button>}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>
                                        24s+ tam iade · 12-24s yarım iade · 12s- iptal yok
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      } else {
                        const dp = item.data
                        const slot = dp.slot
                        const cat = slot?.sportCategory
                        const slotStartsAt = slot?.startsAt ? new Date(slot.startsAt) : null
                        const dpDateStr = slotStartsAt ? slotStartsAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                        const dpTimeStr = slotStartsAt ? slotStartsAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''
                        const dpCancelled = dp.status === 'cancelled' || slot?.status === 'cancelled'
                        const iconColor = cat?.colorHex ? `#${cat.colorHex}` : '#3B82F6'

                        return (
                          <div key={`dp-${dp.id}`} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <SportIconBox name={cat?.iconUrl || 'football'} bgColor={dpCancelled ? '#F5F5F5' : iconColor + '18'} iconColor={dpCancelled ? '#ccc' : iconColor} boxSize={50} borderRadius={14} size={22} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: dpCancelled ? '#bbb' : '#111', textDecoration: dpCancelled ? 'line-through' : 'none', marginBottom: 3 }}>{slot?.title || 'Maç'}</div>
                              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 2 }}>{slot?.venue?.name || ''}</div>
                              <div style={{ fontSize: 12, color: '#bbb' }}>{dpDateStr}{dpTimeStr ? ` · ${dpTimeStr}` : ''}</div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              {dpCancelled
                                ? <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, backgroundColor: '#FEF2F2', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> İptal</span>
                                : <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, backgroundColor: '#F0FDF4', padding: '3px 10px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Katıldı</span>
                              }
                              {!dpCancelled && slotStartsAt && slotStartsAt > new Date() && dp.checkInCode && (
                                <CheckInQR code={dp.checkInCode} />
                              )}
                            </div>
                          </div>
                        )
                      }
                    })}
                  </div>
                )
              })()
            )}
          </div>
        )}

        {/* Hesap Bilgilerim — own profile only */}
        {activeTab === 'hesap' && isOwnProfile && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #F0F0F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}><User size={18} /> Hesap Bilgileri</h3>
              {!editMode && (
                <button onClick={() => { setEditMode(true); setEditError(''); setEditSaved(false) }} style={{ padding: '8px 18px', borderRadius: 100, border: '1.5px solid #E5E5E5', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4F46E5' }}>+ Profili Düzenle</button>
              )}
            </div>
            {[
              { label: 'Ad Soyad', value: meData?.fullName },
              { label: 'E-posta', value: meData?.email },
              { label: 'Telefon', value: meData?.phone || 'Eklenmemiş' },
              { label: 'Üyelik Tarihi', value: meData?.createdAt ? new Date(meData.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
              { label: 'Tier', value: meData?.tier?.name || '-' },
              { label: 'Ödül Puanı', value: meData?.rewardPoints ?? '-' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 5 ? '1px solid #F5F5F5' : 'none' }}>
                <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 14, color: '#111', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}

            {/* Edit form */}
            {editMode && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #F0F0F0' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16 }}>Profili Düzenle</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Ad Soyad</label>
                    <input type="text" value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Bio <span style={{ color: '#bbb', fontWeight: 400 }}>(max 160 karakter)</span></label>
                    <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 160) }))} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                    <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 3 }}>{editForm.bio.length}/160</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>İlçe</label>
                    <select value={editForm.neighborhoodId} onChange={e => setEditForm(f => ({ ...f, neighborhoodId: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E5E5', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as const }}>
                      <option value="">Seçin</option>
                      {neighborhoods.map(n => <option key={n.id} value={String(n.id)}>{n.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Profil Fotoğrafı <span style={{ color: '#bbb', fontWeight: 400 }}>(opsiyonel)</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AvatarUpload
                        currentUrl={editForm.avatarUrl || null}
                        name={editForm.fullName || meData?.fullName || '?'}
                        size={56}
                        editable={true}
                        onUpload={(url) => setEditForm(f => ({ ...f, avatarUrl: url }))}
                      />
                      <span style={{ fontSize: 12, color: '#888' }}>Fotoğraf yüklemek için tıkla</span>
                    </div>
                  </div>
                  {editError && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{editError}</div>}
                  {editSaved && <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Kaydedildi ✓</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => { setEditMode(false); setEditSaved(false); setEditError('') }} style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #eee', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555' }}>İptal</button>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = getToken()
                        if (!token) return
                        setEditError('')
                        const payload: any = {}
                        if (editForm.fullName) payload.fullName = editForm.fullName
                        if (editForm.bio !== undefined) payload.bio = editForm.bio
                        if (editForm.neighborhoodId) payload.neighborhoodId = parseInt(editForm.neighborhoodId)
                        if (editForm.avatarUrl) payload.avatarUrl = editForm.avatarUrl
                        const res = await api.updateProfile(token, payload)
                        if (res.error) { setEditError(res.error); return }
                        setMeData((prev: any) => ({ ...prev, ...res.user, neighborhood: res.user?.neighborhood || prev?.neighborhood }))
                        setEditSaved(true)
                        setEditMode(false)
                        setTimeout(() => setEditSaved(false), 3000)
                      }}
                      style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            )}
            {editSaved && !editMode && <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600, marginTop: 8 }}>Kaydedildi ✓</div>}

            {/* Privacy toggle */}
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #F0F0F0' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={16} /> Aktivite Gizliliği</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  onClick={async () => {
                    setPrivacy('public')
                    setPrivacySaved(false)
                    const token = getToken()
                    if (token) {
                      await api.updatePrivacy(token, 'public')
                      setPrivacySaved(true)
                      setTimeout(() => setPrivacySaved(false), 2000)
                    }
                  }}
                  style={{ padding: '8px 20px', borderRadius: 100, border: 'none', background: privacy === 'public' ? '#4F46E5' : '#F0F0F0', color: privacy === 'public' ? '#fff' : '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  🌍 Herkese Açık
                </button>
                <button
                  onClick={async () => {
                    setPrivacy('private')
                    setPrivacySaved(false)
                    const token = getToken()
                    if (token) {
                      await api.updatePrivacy(token, 'private')
                      setPrivacySaved(true)
                      setTimeout(() => setPrivacySaved(false), 2000)
                    }
                  }}
                  style={{ padding: '8px 20px', borderRadius: 100, border: 'none', background: privacy === 'private' ? '#4F46E5' : '#F0F0F0', color: privacy === 'private' ? '#fff' : '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  🔒 Gizli
                </button>
              </div>
              <div style={{ fontSize: 13, color: '#888' }}>
                {privacy === 'public' ? 'Aktiviteleriniz diğer kullanıcılar tarafından görülebilir.' : 'Aktiviteleriniz yalnızca size görünür.'}
              </div>
              {privacySaved && <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600, marginTop: 8 }}>Kaydedildi ✓</div>}
            </div>

            {/* Bildirim Tercihleri */}
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #F0F0F0' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 16 }}>🔔 Bildirim Tercihleri</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'E-posta hatırlatmaları', desc: 'Ders öncesi hatırlatma maili al', value: emailReminders, set: setEmailReminders },
                  { label: 'SMS hatırlatmaları', desc: 'Ders öncesi hatırlatma SMS\'i al (yakında)', value: smsReminders, set: setSmsReminders },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F8F8F8', borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <button onClick={async () => {
                      const newVal = !item.value
                      item.set(newVal)
                      const token = getToken()
                      await fetch(`${API_URL}/api/auth/notifications`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ emailReminders: item.label.includes('E-posta') ? newVal : emailReminders, smsReminders: item.label.includes('SMS') ? newVal : smsReminders })
                      })
                      setNotifSaved(true)
                      setTimeout(() => setNotifSaved(false), 2000)
                    }} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: item.value ? '#4F46E5' : '#D1D5DB', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: item.value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                ))}
              </div>
              {notifSaved && <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600, marginTop: 10 }}>Kaydedildi ✓</div>}
            </div>
          </div>
        )}

        {/* Ödeme Bilgilerim — own profile only */}
        {activeTab === 'ödeme' && isOwnProfile && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '64px 32px', border: '1px solid #F0F0F0', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={32} color="#4F46E5" />
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 10 }}>Ödeme Yöntemi</div>
            <div style={{ fontSize: 14, color: '#888', maxWidth: 320, margin: '0 auto' }}>Ödeme yöntemi ekleme özelliği çok yakında geliyor.</div>
          </div>
        )}

        {/* Favori Salonlar */}
        {activeTab === 'favoriler' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 14 }}>
                {isOwnProfile ? 'Henüz favori salon eklemediniz.' : 'Favori salon yok.'}
              </div>
            ) : favorites.map((v: any) => (
              <a key={v.id} href={`/venue/${v.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 14, alignItems: 'center' }}>
                  {v.coverImageUrl ? (
                    <img src={v.coverImageUrl} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} alt="" />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏋️</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{v.address}</div>
                    <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, marginTop: 2 }}>
                      ★ {v.avgRating?.toFixed(1) || '—'} · {v.totalReviews || 0} yorum
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: '#DC2626' }}>❤️</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* REFERANS */}
        {activeTab === 'referans' && isOwnProfile && (
          <ReferralTab referralInfo={referralInfo} setReferralInfo={setReferralInfo} copied={copied} setCopied={setCopied} />
        )}

        {/* Arkadaşlar — public profiles only */}
        {activeTab === 'arkadaşlar' && !isOwnProfile && (
          <div>
            {!socialLoaded && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32, color: '#999', fontSize: 14 }}>Yükleniyor...</div>
            )}
            {socialLoaded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#555', marginBottom: 12 }}>Takipçiler ({followers.length})</h3>
                  {followers.length === 0 ? (
                    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', textAlign: 'center', border: '1px solid #F0F0F0', color: '#bbb', fontSize: 14 }}>Henüz takipçi yok.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {followers.map((f: any) => (
                        <Link key={f.id} href={`/profil/${f.username}`} style={{ textDecoration: 'none' }}>
                          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px', border: '1px solid #F0F0F0', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                              {f.avatarUrl ? <img src={f.avatarUrl} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : <User size={22} />}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>{f.fullName}</div>
                            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 6 }}>@{f.username}</div>
                            {f.tier && (
                              <div style={{ fontSize: 11, fontWeight: 700, color: `#${f.tier.colorHex || '4F46E5'}`, backgroundColor: `#${f.tier.colorHex || '4F46E5'}18`, padding: '3px 10px', borderRadius: 100, display: 'inline-block' }}>{f.tier.name}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#555', marginBottom: 12 }}>Takip Edilenler ({following.length})</h3>
                  {following.length === 0 ? (
                    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '24px', textAlign: 'center', border: '1px solid #F0F0F0', color: '#bbb', fontSize: 14 }}>Henüz takip edilmiyor.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {following.map((f: any) => (
                        <Link key={f.id} href={`/profil/${f.username}`} style={{ textDecoration: 'none' }}>
                          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '18px', border: '1px solid #F0F0F0', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                              {f.avatarUrl ? <img src={f.avatarUrl} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} alt="" /> : <User size={22} />}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>{f.fullName}</div>
                            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 6 }}>@{f.username}</div>
                            {f.tier && (
                              <div style={{ fontSize: 11, fontWeight: 700, color: `#${f.tier.colorHex || '4F46E5'}`, backgroundColor: `#${f.tier.colorHex || '4F46E5'}18`, padding: '3px 10px', borderRadius: 100, display: 'inline-block' }}>{f.tier.name}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* İstatistik — public profiles only */}
        {activeTab === 'istatistik' && !isOwnProfile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Toplam Ders', value: mockUser.stats.totalLessons, icon: <BookOpen size={32} />, color: '#8B5CF6' },
              { label: 'Bu Ay', value: mockUser.stats.thisMonth, icon: <Calendar size={32} />, color: '#3B82F6' },
              { label: 'Günlük Seri', value: mockUser.stats.streak, icon: <Flame size={32} />, color: '#EF4444' },
              { label: 'İptal Yok', value: mockUser.stats.noCancel, icon: <Dumbbell size={32} />, color: '#10B981' },
              { label: 'Favori Salon', value: mockUser.stats.sameVenue, icon: <Heart size={32} />, color: '#EC4899' },
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px 20px', border: '1px solid #F0F0F0', textAlign: 'center' }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CheckInQR({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && canvasRef.current) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(canvasRef.current!, code, { width: 160, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } })
      })
    }
  }, [open, code])

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{ fontSize: 12, color: '#4F46E5', fontWeight: 700, background: '#EEF2FF', border: 'none', borderRadius: 100, padding: '4px 12px', cursor: 'pointer' }}>
        {open ? 'QR Gizle' : 'Check-in QR'}
      </button>
      {open && (
        <div style={{ marginTop: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', textAlign: 'center', border: '1px solid #F0F0F0' }}>
          <canvas ref={canvasRef} style={{ borderRadius: 8, display: 'block', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', letterSpacing: 4, fontFamily: 'monospace' }}>{code}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Salona QR veya kodu göster</div>
        </div>
      )}
    </div>
  )
}

const API_URL_REF = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function ReferralTab({ referralInfo, setReferralInfo, copied, setCopied }: any) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (referralInfo) return
    setLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('fitpass_token') : null
    if (!token) { setLoading(false); return }
    fetch(`${API_URL_REF}/api/referral`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setReferralInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const referralLink = referralInfo?.referralCode
    ? `https://sipsakspor.com/kayit?ref=${referralInfo.referralCode}`
    : ''

  const handleCopy = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 14 }}>Yükleniyor...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Kredi bakiyesi */}
      <div style={{ backgroundColor: '#4F46E5', borderRadius: 20, padding: '24px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Uygulama Kredisi</div>
          <div style={{ fontSize: 36, fontWeight: 900 }}>₺{referralInfo?.creditBalance || 0}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Ders rezervasyonlarında kullanabilirsin</div>
        </div>
        <Gift size={44} style={{ opacity: 0.3 }} />
      </div>

      {/* Nasıl çalışır */}
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 14 }}>🎁 Arkadaşını Davet Et</div>
        {[
          { step: '1', text: 'Linki arkadaşınla paylaş' },
          { step: '2', text: 'Arkadaşın kayıt olunca 150 TL kredi kazanır' },
          { step: '3', text: 'Arkadaşın ilk dersini alınca sen de 150 TL kazanırsın' },
        ].map(({ step, text }) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</div>
            <span style={{ fontSize: 14, color: '#444' }}>{text}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, padding: '10px 14px', backgroundColor: '#FEF9C3', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
          ⚠️ En fazla 3 arkadaş davet edebilirsin. ({referralInfo?.referralCount || 0}/3 kullanıldı)
        </div>
      </div>

      {/* Referral linki */}
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Davet Linkin</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '12px 14px', backgroundColor: '#F5F5F5', borderRadius: 10, fontSize: 13, color: '#333', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {referralLink || 'Yükleniyor...'}
          </div>
          <button onClick={handleCopy} style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: copied ? '#10B981' : '#4F46E5', color: '#fff', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
            {copied ? <CheckCheck size={18} /> : <Copy size={18} />}
          </button>
        </div>
        {copied && <div style={{ fontSize: 12, color: '#10B981', marginTop: 6, fontWeight: 600 }}>✓ Link kopyalandı!</div>}
      </div>

      {/* Davet edilenler listesi */}
      {referralInfo?.referrals?.length > 0 && (
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12 }}>Davet Ettiklerin</div>
          {referralInfo.referrals.map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F5F5' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{r.fullName}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>@{r.username}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: r.status === 'completed' ? '#F0FDF4' : '#FEF9C3', color: r.status === 'completed' ? '#16a34a' : '#92400e' }}>
                {r.status === 'completed' ? '✓ +150 ₺ kazandın' : '⏳ Bekliyor'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
