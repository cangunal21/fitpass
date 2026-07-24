'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Star, LogOut, MessageSquare, Trash2 } from 'lucide-react'

export default function EgitmenPortalPage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [agg, setAgg] = useState<{ avgRating: number; totalReviews: number }>({ avgRating: 0, totalReviews: 0 })
  const [loading, setLoading] = useState(true)
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({})
  const [replyVis, setReplyVis] = useState<Record<number, 'public' | 'private'>>({})
  const [replyLoading, setReplyLoading] = useState<number | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('fitpass_instructor_token') : null

  const authHeaders = { Authorization: `Bearer ${token}` }

  const fetchReviews = useCallback(async () => {
    const r = await fetch(`${API_URL}/api/instructor/reviews`, { headers: authHeaders }).then(x => x.json()).catch(() => null)
    if (r && !r.error) {
      setReviews(Array.isArray(r.reviews) ? r.reviews : [])
      setAgg({ avgRating: r.avgRating ?? 0, totalReviews: r.totalReviews ?? 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, token])

  useEffect(() => {
    if (!token) { router.push('/egitmen-giris'); return }
    ;(async () => {
      const r = await fetch(`${API_URL}/api/instructor/me`, { headers: authHeaders }).then(x => x.json()).catch(() => null)
      if (!r || r.error || !r.instructor) { localStorage.removeItem('fitpass_instructor_token'); router.push('/egitmen-giris'); return }
      setMe(r.instructor)
      await fetchReviews()
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = () => {
    localStorage.removeItem('fitpass_instructor_token')
    localStorage.removeItem('fitpass_instructor')
    router.push('/egitmen-giris')
  }

  const handleReply = async (reviewId: number) => {
    const reply = (replyTexts[reviewId] || '').trim()
    if (!reply) return
    setReplyLoading(reviewId)
    const res = await fetch(`${API_URL}/api/instructor/reviews/${reviewId}/reply`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply, visibility: replyVis[reviewId] || 'public' }),
    }).then(x => x.json()).catch(() => ({ error: 'Bağlantı hatası.' }))
    setReplyLoading(null)
    if (res.error) { alert(res.error); return }
    setReplyTexts(p => ({ ...p, [reviewId]: '' }))
    fetchReviews()
  }

  const handleDeleteReply = async (reviewId: number) => {
    setReplyLoading(reviewId)
    await fetch(`${API_URL}/api/instructor/reviews/${reviewId}/reply`, { method: 'DELETE', headers: authHeaders }).catch(() => {})
    setReplyLoading(null)
    fetchReviews()
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Yükleniyor…</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4F46E5' }}>
          <GraduationCap size={24} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>Eğitmen Portalı</span>
        </div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 24, border: '1px solid #eee', background: '#fff', fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer' }}><LogOut size={15} /> Çıkış</button>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Profil */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
          <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {me?.avatarUrl ? (/* eslint-disable-next-line @next/next/no-img-element */<img src={me.avatarUrl} alt={me.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : <span style={{ fontSize: 26, fontWeight: 800, color: '#4F46E5' }}>{me?.fullName?.[0] || '?'}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>{me?.fullName}</div>
            {me?.specialty && <div style={{ fontSize: 14, color: '#777', marginTop: 2 }}>{me.specialty}</div>}
            {me?.venue?.name && <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>{me.venue.name}</div>}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#111', lineHeight: 1 }}>{agg.avgRating || '—'}</div>
            <div style={{ color: '#F59E0B', fontSize: 15, margin: '4px 0 2px' }}>★</div>
            <div style={{ fontSize: 12, color: '#999' }}>{agg.totalReviews} yorum</div>
          </div>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} /> Yorumlarım</h2>

        {reviews.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 36, textAlign: 'center', color: '#aaa', fontSize: 14 }}>Henüz yorum yok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map((r: any) => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{r.isAnonymous ? 'Anonim' : (r.reviewer?.fullName || 'Kullanıcı')}</div>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} size={15} color="#F59E0B" fill={n <= r.rating ? '#F59E0B' : 'none'} />)}
                  </div>
                </div>
                {r.comment && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 4px' }}>{r.comment}</p>}
                <div style={{ fontSize: 11, color: '#bbb' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

                {r.venueReply ? (
                  <div style={{ marginTop: 12, background: '#F5F3FF', borderRadius: 12, padding: '12px 16px', borderLeft: '3px solid #4F46E5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>Yanıtın {r.replyVisibility === 'private' ? '· 🔒 özel (yalnız kullanıcı görür)' : '· herkese açık'}</span>
                      <button onClick={() => handleDeleteReply(r.id)} disabled={replyLoading === r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Trash2 size={13} /> Sil</button>
                    </div>
                    <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>{r.venueReply}</p>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={replyTexts[r.id] || ''}
                      onChange={e => setReplyTexts(p => ({ ...p, [r.id]: e.target.value }))}
                      placeholder="Yanıtını yaz…"
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', backgroundColor: '#fafafa' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 10, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', cursor: 'pointer' }}>
                        <input type="checkbox" checked={(replyVis[r.id] || 'public') === 'private'} onChange={e => setReplyVis(p => ({ ...p, [r.id]: e.target.checked ? 'private' : 'public' }))} />
                        Özel yanıt (yalnız yorumu yazan görür)
                      </label>
                      <button onClick={() => handleReply(r.id)} disabled={replyLoading === r.id || !(replyTexts[r.id] || '').trim()} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: (replyTexts[r.id] || '').trim() ? '#4F46E5' : '#ccc', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        {replyLoading === r.id ? '...' : 'Yanıtla'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
