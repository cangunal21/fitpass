'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SkeletonList } from '@/components/Skeleton'
import { getUser, getToken } from '@/lib/api'
import { getInitialsAvatar } from '@/lib/cloudinary'
import { MapPin, Heart, MessageCircle, X, Send } from 'lucide-react'
import Link from 'next/link'
import { SportIconBox } from '@/lib/sportIcons'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Kategoriler API'dan yüklenir

const MOCK_USERS = [
  { id: 'm1', username: 'zeynep_aktif', avatarUrl: null, lessonCount: 42, neighborhood: { name: 'Kadıköy' } },
  { id: 'm2', username: 'baris_sporcu', avatarUrl: null, lessonCount: 38, neighborhood: { name: 'Beşiktaş' } },
  { id: 'm3', username: 'elif_yoga', avatarUrl: null, lessonCount: 31, neighborhood: { name: 'Şişli' } },
  { id: 'm4', username: 'mert_boks', avatarUrl: null, lessonCount: 27, neighborhood: { name: 'Üsküdar' } },
  { id: 'm5', username: 'selin_pilates', avatarUrl: null, lessonCount: 24, neighborhood: { name: 'Bakırköy' } },
  { id: 'm6', username: 'ahmet_crossfit', avatarUrl: null, lessonCount: 19, neighborhood: { name: 'Sarıyer' } },
  { id: 'm7', username: 'dila_dans', avatarUrl: null, lessonCount: 15, neighborhood: { name: 'Maltepe' } },
]

const MOCK_FEED = [
  { id: 'f1', type: 'class', user: { username: 'selin_y', fullName: 'Selin Yıldız', avatarUrl: null }, category: 'Yoga', categoryColor: '#C4A882', title: 'Vinyasa Flow Yoga', venueName: 'Zen Studio Beşiktaş', date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), likeCount: 4, commentCount: 1, likedByMe: false },
  { id: 'f2', type: 'dropin', user: { username: 'ali_demir', fullName: 'Ali Demir', avatarUrl: null }, category: 'Halı Saha', categoryColor: '#16A34A', title: '7v7 Halı Saha Maçı', venueName: 'Spor Arena Ataşehir', date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), likeCount: 9, commentCount: 3, likedByMe: false },
  { id: 'f3', type: 'class', user: { username: 'mert_boks', fullName: 'Mert Boks', avatarUrl: null }, category: 'Boks', categoryColor: '#DC2626', title: 'Kickboks Başlangıç', venueName: 'Fight Club Şişli', date: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), likeCount: 2, commentCount: 0, likedByMe: false },
]

const MOCK_VENUES = [
  { id: 'v1', name: 'Kadıköy Spor Merkezi', avgRating: 4.9, totalReviews: 128, coverImageUrl: null, mainIcon: 'yoga', iconBg: '#F0FDF4', iconColor: '#16A34A', neighborhood: { name: 'Kadıköy' }, sportCategories: [{ sportCategory: { name: 'Yoga' } }, { sportCategory: { name: 'Pilates' } }, { sportCategory: { name: 'HIIT' } }] },
  { id: 'v2', name: 'Beşiktaş Boks Kulübü', avgRating: 4.8, totalReviews: 94, coverImageUrl: null, mainIcon: 'boxing', iconBg: '#FFF1F2', iconColor: '#E11D48', neighborhood: { name: 'Beşiktaş' }, sportCategories: [{ sportCategory: { name: 'Boks' } }, { sportCategory: { name: 'Crossfit' } }] },
  { id: 'v3', name: 'Flow Yoga Studio', avgRating: 4.7, totalReviews: 73, coverImageUrl: null, mainIcon: 'yoga', iconBg: '#F0FDF4', iconColor: '#16A34A', neighborhood: { name: 'Şişli' }, sportCategories: [{ sportCategory: { name: 'Yoga' } }, { sportCategory: { name: 'Dans' } }] },
  { id: 'v4', name: 'Padel İstanbul', avgRating: 4.6, totalReviews: 61, coverImageUrl: null, mainIcon: 'padel', iconBg: '#EFF6FF', iconColor: '#2563EB', neighborhood: { name: 'Sarıyer' }, sportCategories: [{ sportCategory: { name: 'Padel' } }] },
  { id: 'v5', name: 'Üsküdar Fitness Club', avgRating: 4.5, totalReviews: 55, coverImageUrl: null, mainIcon: 'hiit', iconBg: '#FFF7ED', iconColor: '#EA580C', neighborhood: { name: 'Üsküdar' }, sportCategories: [{ sportCategory: { name: 'HIIT' } }, { sportCategory: { name: 'Pilates' } }] },
]

export default function SosyalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'siralama' | 'arkadaslar' | 'feed'>('siralama')
  const [feed, setFeed] = useState<any[]>([])
  const [isMockFeed, setIsMockFeed] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)
  const [siralamaType, setSiralamaType] = useState<'kullanici' | 'streak' | 'salon'>('kullanici')
  const [selectedBranch, setSelectedBranch] = useState('Tümü')
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([])
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const [userLeaderboard, setUserLeaderboard] = useState<any[]>([])
  const [venueLeaderboard, setVenueLeaderboard] = useState<any[]>([])
  const [streakLeaderboard, setStreakLeaderboard] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<string[]>(['Tümü'])
  const [commentModal, setCommentModal] = useState<string | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const currentUser = getUser()

  useEffect(() => {
    fetch(`${API_URL}/api/public/neighborhoods`).then(r => r.json()).then(d => setNeighborhoods(d.neighborhoods || []))
    fetch(`${API_URL}/api/public/categories`).then(r => r.json()).then(d => {
      if (d.categories) setBranches(['Tümü', ...d.categories.map((c: any) => c.name)])
    })
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [siralamaType, selectedBranch, selectedNeighborhood])

  useEffect(() => {
    if (activeTab === 'arkadaslar' && currentUser) fetchFriends()
    if (activeTab === 'feed' && currentUser) fetchFeed()
  }, [activeTab])

  const fetchLeaderboard = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedBranch !== 'Tümü') params.set('branch', selectedBranch)
    if (selectedNeighborhood) params.set('neighborhoodId', selectedNeighborhood)

    try {
      if (siralamaType === 'kullanici') {
        const res = await fetch(`${API_URL}/api/social/leaderboard/users?${params}`)
        const data = await res.json()
        setUserLeaderboard(data.leaderboard || [])
      } else if (siralamaType === 'streak') {
        const res = await fetch(`${API_URL}/api/social/leaderboard/streaks?${params}`)
        const data = await res.json()
        setStreakLeaderboard(data.leaderboard || [])
      } else {
        const res = await fetch(`${API_URL}/api/social/leaderboard/venues?${params}`)
        const data = await res.json()
        setVenueLeaderboard(data.leaderboard || [])
      }
    } catch {}
    setLoading(false)
  }

  const fetchFriends = async () => {
    const token = getToken()
    if (!token || !currentUser) return
    setLoading(true)
    try {
      const [followingRes, followersRes, suggestionsRes] = await Promise.all([
        fetch(`${API_URL}/api/social/following/${currentUser.username}`).then(r => r.json()),
        fetch(`${API_URL}/api/social/followers/${currentUser.username}`).then(r => r.json()),
        fetch(`${API_URL}/api/social/suggestions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ])
      setFollowing(followingRes.following || [])
      setFollowers(followersRes.followers || [])
      setSuggestions(suggestionsRes.suggestions || [])
    } catch {}
    setLoading(false)
  }

  const fetchFeed = async () => {
    const token = getToken()
    if (!token) return
    setFeedLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/social/feed`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      const realFeed = data.feed || []
      setIsMockFeed(realFeed.length === 0)
      setFeed(realFeed.length === 0 ? MOCK_FEED : realFeed)
    } catch {}
    setFeedLoading(false)
  }

  const toggleLike = async (item: any) => {
    if (isMockFeed) return
    const token = getToken()
    if (!token) return
    setFeed(prev => prev.map(f => f.id === item.id
      ? { ...f, likedByMe: !f.likedByMe, likeCount: f.likedByMe ? f.likeCount - 1 : f.likeCount + 1 }
      : f
    ))
    await fetch(`${API_URL}/api/social/feed/${item.id}/like`, {
      method: item.likedByMe ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const openComments = async (feedKey: string) => {
    if (isMockFeed) return
    setCommentModal(feedKey)
    setReplyTo(null)
    setCommentsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/social/feed/${feedKey}/comments`)
      const data = await res.json()
      setComments(Array.isArray(data?.comments) ? data.comments : [])
    } catch {}
    setCommentsLoading(false)
  }

  const submitComment = async () => {
    const token = getToken()
    if (!token || !commentModal || !commentInput.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`${API_URL}/api/social/feed/${commentModal}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentInput.trim(), parentId: replyTo?.id }),
      })
      const data = await res.json()
      if (data?.comment) {
        if (replyTo) {
          setComments(prev => prev.map(c => c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), data.comment] } : c))
        } else {
          setComments(prev => [...prev, { ...data.comment, replies: [] }])
        }
        setCommentInput('')
        setReplyTo(null)
        setFeed(prev => prev.map(f => f.id === commentModal ? { ...f, commentCount: (f.commentCount || 0) + 1 } : f))
      }
    } catch {}
    setSubmittingComment(false)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} dakika önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Dün'
    return `${days} gün önce`
  }

  const handleFollow = async (username: string) => {
    const token = getToken()
    if (!token) { router.push('/giris?redirect=/sosyal'); return }
    await fetch(`${API_URL}/api/social/follow/${username}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    setSuggestions(prev => prev.filter(u => u.username !== username))
    fetchFriends()
  }

  const handleUnfollow = async (username: string) => {
    const token = getToken()
    if (!token) return
    await fetch(`${API_URL}/api/social/unfollow/${username}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchFriends()
  }

  const medalColor = (i: number) => i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7C2F' : '#e5e5e5'
  const medalEmoji = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '28px 24px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#4F46E5', marginBottom: 6, letterSpacing: -1 }}>Sosyal</h1>
          <p style={{ fontSize: 15, color: '#888' }}>İstanbul&apos;un en aktif sporcularını keşfet</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, backgroundColor: '#eee', borderRadius: 16, padding: 4, marginTop: -20, marginBottom: 24, width: 'fit-content' }}>
          {[
            { key: 'siralama', label: 'Sıralama' },
            { key: 'feed', label: 'Feed' },
            { key: 'arkadaslar', label: 'Arkadaşlar' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: activeTab === tab.key ? '#1a1a1a' : '#888', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SIRALAMA TAB */}
        {activeTab === 'siralama' && (
          <div>
            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[{ key: 'kullanici', label: 'Sporcular' }, { key: 'streak', label: '🔥 Seri' }, { key: 'salon', label: 'Salonlar' }].map(t => (
                <button key={t.key} onClick={() => setSiralamaType(t.key as any)}
                  style={{ padding: '8px 20px', borderRadius: 100, border: siralamaType === t.key ? 'none' : '1.5px solid #e5e5e5', background: siralamaType === t.key ? '#4F46E5' : '#fff', color: siralamaType === t.key ? '#fff' : '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={selectedNeighborhood} onChange={e => setSelectedNeighborhood(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                <option value="">İstanbul Geneli</option>
                {[...neighborhoods].sort((a, b) => a.name.localeCompare(b.name, 'tr')).map(n => (
                  <option key={n.id} value={String(n.id)}>{n.name}</option>
                ))}
              </select>
            </div>

            {/* User Leaderboard */}
            {siralamaType === 'kullanici' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                  <SkeletonList count={5} />
                ) : (() => {
                  const isMock = userLeaderboard.length === 0
                  return (isMock ? MOCK_USERS : userLeaderboard).map((user, i) => {
                    const { initials, color } = getInitialsAvatar(user.username || '?')
                    const card = (
                      <div style={{ backgroundColor: i < 3 ? '#FFFBEB' : '#fff', borderRadius: 16, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14, border: i === 0 ? '2px solid #F59E0B' : '1px solid transparent' }}>
                        <div style={{ width: 36, textAlign: 'center', fontSize: i < 3 ? 22 : 14, fontWeight: 800, color: medalColor(i) }}>
                          {medalEmoji(i)}
                        </div>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: user.avatarUrl ? 'transparent' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                          {user.avatarUrl ? <img src={user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>@{user.username}</div>
                          {user.neighborhood && <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {user.neighborhood.name}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5' }}>{user.lessonCount}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>ders</div>
                        </div>
                      </div>
                    )
                    return isMock ? (
                      <div key={user.id} style={{ cursor: 'default' }}>{card}</div>
                    ) : (
                      <Link key={user.id} href={user.username ? `/profil/${user.username}` : '#'} style={{ textDecoration: 'none' }}>{card}</Link>
                    )
                  })
                })()}
              </div>
            )}


            {/* Streak Leaderboard */}
            {siralamaType === 'streak' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                  <SkeletonList count={5} />
                ) : streakLeaderboard.length === 0 ? (
                  <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#999', fontSize: 14 }}>
                    Henüz seri yapan sporcu yok. Üst üste günlerde derse giderek seriye gir! 🔥
                  </div>
                ) : streakLeaderboard.map((user, i) => {
                  const { initials, color } = getInitialsAvatar(user.username || '?')
                  return (
                    <Link key={user.id} href={user.username ? `/profil/${user.username}` : '#'} style={{ textDecoration: 'none' }}>
                      <div style={{ backgroundColor: i < 3 ? '#FFF7ED' : '#fff', borderRadius: 16, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14, border: i === 0 ? '2px solid #F97316' : '1px solid transparent' }}>
                        <div style={{ width: 36, textAlign: 'center', fontSize: i < 3 ? 22 : 14, fontWeight: 800, color: medalColor(i) }}>{medalEmoji(i)}</div>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: user.avatarUrl ? 'transparent' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                          {user.avatarUrl ? <img src={user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>@{user.username}</div>
                          {user.neighborhood && <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {user.neighborhood.name}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#F97316' }}>🔥 {user.streak}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>gün seri</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Venue Leaderboard */}
            {siralamaType === 'salon' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? (
                  <SkeletonList count={5} />
                ) : (venueLeaderboard.length === 0 ? MOCK_VENUES : venueLeaderboard).map((venue, i) => (
                  <Link key={venue.id} href={typeof venue.id === 'number' ? `/venue/${venue.id}` : '#'} style={{ textDecoration: 'none' }}>
                    <div style={{ backgroundColor: i < 3 ? '#FFFBEB' : '#fff', borderRadius: 16, padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14, border: i === 0 ? '2px solid #F59E0B' : '1px solid transparent' }}>
                      <div style={{ width: 36, textAlign: 'center', fontSize: i < 3 ? 22 : 14, fontWeight: 800, color: medalColor(i) }}>
                        {medalEmoji(i)}
                      </div>
                      {venue.coverImageUrl ? (
                        <img src={venue.coverImageUrl} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt="" />
                      ) : (
                        <SportIconBox
                          name={venue.mainIcon || (venue.sportCategories?.[0]?.sportCategory?.name?.toLowerCase() ?? 'weightlifting')}
                          bgColor={venue.iconBg || '#EEF2FF'}
                          iconColor={venue.iconColor || '#4F46E5'}
                          boxSize={44}
                          size={22}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{venue.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                          {venue.sportCategories?.slice(0, 3).map((sc: any) => (
                            <span key={sc.sportCategory.name} style={{ fontSize: 11, backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 20 }}>{sc.sportCategory.name}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>★ {venue.avgRating?.toFixed(1) || '—'}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{venue.totalReviews} yorum</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!currentUser ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Feed'i görmek için giriş yap</div>
                <Link href="/giris?redirect=/sosyal" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>Giriş Yap →</Link>
              </div>
            ) : feedLoading ? (
              <SkeletonList count={5} />
            ) : feed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Henüz aktivite yok</div>
                <div style={{ fontSize: 13, color: '#bbb' }}>Arkadaş ekleyince onların aktiviteleri burada görünür</div>
              </div>
            ) : feed.map(item => {
              const initialsData = getInitialsAvatar(item.user.fullName || item.user.username)
              return (
                <div key={item.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {/* Avatar */}
                    <Link href={`/profil/${item.user.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      {item.user.avatarUrl ? (
                        <img src={item.user.avatarUrl} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: initialsData.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: initialsData.color }}>{initialsData.initials}</div>
                      )}
                    </Link>
                    {/* İçerik */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
                        <Link href={`/profil/${item.user.username}`} style={{ fontWeight: 700, color: '#111', textDecoration: 'none' }}>{item.user.fullName}</Link>
                        {item.taggedFriends && item.taggedFriends.length > 0 && (
                          <>
                            {item.taggedFriends.map((t: any, i: number) => (
                              <span key={t.username}>
                                {i === 0 ? ' ' : ', '}
                                <Link href={`/profil/${t.username}`} style={{ fontWeight: 700, color: '#4F46E5', textDecoration: 'none' }}>@{t.username}</Link>
                              </span>
                            ))}
                            {' ile birlikte'}
                          </>
                        )}
                        {' '}{item.type === 'dropin' ? 'drop-in etkinliğine katıldı' : 'dersine katıldı'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: (item.categoryColor || '#4F46E5') + '18', color: item.categoryColor || '#4F46E5' }}>{item.category}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>{item.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                        {item.venueName && <span>📍 {item.venueName} · </span>}
                        {timeAgo(item.date)}
                      </div>
                    </div>
                    {/* Tip ikonu */}
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{item.type === 'dropin' ? '⚡' : '✅'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                    <button onClick={() => toggleLike(item)} disabled={isMockFeed} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: isMockFeed ? 'default' : 'pointer', padding: 0, opacity: isMockFeed ? 0.5 : 1 }}>
                      <Heart size={16} color={item.likedByMe ? '#DC2626' : '#999'} fill={item.likedByMe ? '#DC2626' : 'none'} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: item.likedByMe ? '#DC2626' : '#999' }}>{item.likeCount || 0}</span>
                    </button>
                    <button onClick={() => openComments(item.id)} disabled={isMockFeed} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: isMockFeed ? 'default' : 'pointer', padding: 0, opacity: isMockFeed ? 0.5 : 1 }}>
                      <MessageCircle size={16} color="#999" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#999' }}>{item.commentCount || 0}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ARKADASLAR TAB */}
        {activeTab === 'arkadaslar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {!currentUser ? (
              <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, color: '#888', marginBottom: 16 }}>Arkadaşlarını görmek için giriş yap</div>
                <Link href="/giris?redirect=/sosyal" style={{ padding: '12px 24px', borderRadius: 12, background: '#4F46E5', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Giriş Yap</Link>
              </div>
            ) : (
              <>
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Tanıyor Olabileceğin Kişiler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {suggestions.map(u => {
                        const { initials, color } = getInitialsAvatar(u.username || '?')
                        return (
                          <div key={u.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: u.avatarUrl ? 'transparent' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                              {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : initials}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Link href={`/profil/${u.username}`} style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none' }}>@{u.username}</Link>
                              {u.neighborhood && <div style={{ fontSize: 12, color: '#888' }}>{u.neighborhood.name}</div>}
                            </div>
                            <button onClick={() => handleFollow(u.username)}
                              style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                              Takip Et
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Following */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Takip Ettiklerim ({following.length})</h3>
                  {following.length === 0 ? (
                    <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>Henüz kimseyi takip etmiyorsun.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {following.map(u => {
                        const { initials, color } = getInitialsAvatar(u.username || '?')
                        return (
                          <div key={u.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: u.avatarUrl ? 'transparent' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                              {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : initials}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Link href={`/profil/${u.username}`} style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none' }}>@{u.username}</Link>
                              {u.neighborhood && <div style={{ fontSize: 12, color: '#888' }}>{u.neighborhood?.name}</div>}
                            </div>
                            <button onClick={() => handleUnfollow(u.username)}
                              style={{ padding: '7px 16px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: '#fff', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              Takibi Bırak
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Followers */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Takipçilerim ({followers.length})</h3>
                  {followers.length === 0 ? (
                    <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>Henüz takipçin yok.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {followers.map(u => {
                        const { initials, color } = getInitialsAvatar(u.username || '?')
                        return (
                          <div key={u.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: u.avatarUrl ? 'transparent' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                              {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : initials}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Link href={`/profil/${u.username}`} style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none' }}>@{u.username}</Link>
                              {u.neighborhood && <div style={{ fontSize: 12, color: '#888' }}>{u.neighborhood?.name}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      {commentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setCommentModal(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, padding: 24, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>Yorumlar</div>
              <button onClick={() => setCommentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#999" /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 80 }}>
              {commentsLoading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>Yükleniyor...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>Henüz yorum yok, ilk sen yaz!</div>
              ) : (
                comments.map(c => (
                  <div key={c.id}>
                    <div style={{ backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{c.user?.fullName || c.user?.username}</div>
                      <div style={{ fontSize: 13, color: '#333', marginTop: 2 }}>{c.content}</div>
                      <button onClick={() => setReplyTo({ id: c.id, name: c.user?.fullName || c.user?.username })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 6, fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>Cevapla</button>
                    </div>
                    {(c.replies || []).map((r: any) => (
                      <div key={r.id} style={{ backgroundColor: '#F0F0F5', borderRadius: 12, padding: 10, marginBottom: 8, marginLeft: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{r.user?.fullName || r.user?.username}</div>
                        <div style={{ fontSize: 13, color: '#333', marginTop: 2 }}>{r.content}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {replyTo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 10, padding: 8, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>{replyTo.name} kullanıcısına cevap yazıyorsun</span>
                <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color="#999" /></button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
              <input
                type="text"
                placeholder={replyTo ? 'Cevap yaz...' : 'Yorum yaz...'}
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={submitComment} disabled={submittingComment || !commentInput.trim()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Send size={20} color="#4F46E5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
