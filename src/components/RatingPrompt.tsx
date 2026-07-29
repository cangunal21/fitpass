'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'

const DISMISS_KEY = 'fitpass_rating_dismissed'
// Puanlama prompt'u salon/eğitmen/giriş panellerinde çıkmasın (kullanıcı token'ı orada zaten yok ama net olsun)
const SKIP_PREFIXES = ['/salon', '/egitmen', '/admin', '/giris', '/kayit']

type Pending = {
  bookingId: number
  className?: string
  venueId?: number | null
  venueName?: string | null
  instructorId?: number | null
  instructorName?: string | null
}

// starLabel: ekran okuyucuya giden etiket de çevrilmeli (modalin görünen tüm metinleri t() ile çevriliyken
// bu sabit Türkçe kalmıştı → EN kullanıcıya erişilebilirlik katmanında Türkçe okunuyordu).
function Stars({ value, onChange, starLabel }: { value: number; onChange: (n: number) => void; starLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} ${starLabel}`}
          style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1, background: 'transparent', color: n <= value ? '#F59E0B' : '#d8d8e0' }}>
          ★
        </button>
      ))}
    </div>
  )
}

// Global ders-sonrası puanlama modalı (web) — mobildeki RatingPrompt'un ikizi. Giriş yapmış kullanıcı
// derse gitti (check-in) + ders bitti + henüz puanlamadıysa /api/reviews/pending döner ve modal açılır.
// Önce salon (zorunlu ★ + opsiyonel yorum), sonra —ders bir hocaya bağlıysa— hoca. "Daha sonra" ile
// kapatılırsa o booking localStorage'da işaretlenir, tekrar otomatik açılmaz.
export default function RatingPrompt() {
  const { t } = useT()
  const pathname = usePathname()
  const [target, setTarget] = useState<Pending | null>(null)
  const [venueRating, setVenueRating] = useState(0)
  const [venueComment, setVenueComment] = useState('')
  const [instructorRating, setInstructorRating] = useState(0)
  const [instructorComment, setInstructorComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const checkedRef = useRef(false)

  const hasInstructor = target?.instructorId != null

  const getDismissed = (): number[] => {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') } catch { return [] }
  }
  const addDismissed = (id: number) => {
    const d = getDismissed(); if (!d.includes(id)) d.push(id)
    localStorage.setItem(DISMISS_KEY, JSON.stringify(d))
  }

  const resetForm = () => {
    setVenueRating(0); setVenueComment(''); setInstructorRating(0); setInstructorComment('')
    setIsAnonymous(true); setError(''); setDone(false); setSubmitting(false)
  }

  const check = useCallback(async () => {
    if (checkedRef.current) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('fitpass_token') : null
    if (!token) return
    if (SKIP_PREFIXES.some(p => pathname?.startsWith(p))) return
    checkedRef.current = true
    const res = await api.getPendingReviews(token)
    const list: Pending[] = Array.isArray(res?.pending) ? res.pending : []
    const dismissed = getDismissed()
    const next = list.find(p => !dismissed.includes(p.bookingId))
    if (next) { resetForm(); setTarget(next) }
  }, [pathname])

  // Giriş yapılmış her oturumda bir kez kontrol et (mount + sekmeye geri dönünce)
  useEffect(() => {
    check()
    const onFocus = () => check()
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisible) }
  }, [check])

  const close = () => {
    if (target) addDismissed(target.bookingId)
    setTarget(null)
    checkedRef.current = false // kapatınca sonraki foreground'da bir sonraki bekleyeni yakalayabilir
  }

  const submit = async () => {
    if (!target) return
    if (venueRating < 1) { setError(t('rate.venueRequired')); return }
    const token = localStorage.getItem('fitpass_token')
    if (!token) return
    setSubmitting(true); setError('')
    const res = await api.createReview(token, {
      bookingId: target.bookingId,
      venueRating,
      venueComment: venueComment.trim() || undefined,
      instructorRating: hasInstructor && instructorRating >= 1 ? instructorRating : undefined,
      instructorComment: hasInstructor && instructorRating >= 1 ? (instructorComment.trim() || undefined) : undefined,
      isAnonymous,
    })
    setSubmitting(false)
    if (res?.error) { setError(res.error); return }
    if (target) addDismissed(target.bookingId)
    setDone(true)
  }

  if (!target) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', padding: '24px 26px', boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{t('rate.title')}</div>
            {target.className && <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{target.className}</div>}
          </div>
          <button onClick={close} aria-label={t('rate.later')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}><X size={22} /></button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 15, color: '#16a34a', fontWeight: 700, marginBottom: 20 }}>{t('rate.thanks')}</div>
            <button onClick={() => setTarget(null)} style={primaryBtn}>{t('rate.close')}</button>
          </div>
        ) : (
          <>
            {/* SALON */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '18px 0 8px' }}>{t('rate.venue')}{target.venueName ? ` · ${target.venueName}` : ''}</div>
            <Stars value={venueRating} onChange={setVenueRating} starLabel={t('rate.star')} />
            <textarea value={venueComment} onChange={e => setVenueComment(e.target.value)} placeholder={t('rate.venuePh')} rows={2}
              style={commentBox} />

            {/* HOCA (varsa) */}
            {hasInstructor && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '18px 0 8px' }}>{t('rate.instructor')}{target.instructorName ? ` · ${target.instructorName}` : ''}</div>
                <Stars value={instructorRating} onChange={setInstructorRating} starLabel={t('rate.star')} />
                <textarea value={instructorComment} onChange={e => setInstructorComment(e.target.value)} placeholder={t('rate.instructorPh')} rows={2}
                  style={commentBox} />
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', cursor: 'pointer', marginTop: 16 }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              {t('rate.anon')}
            </label>

            {error && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 12 }}>{error}</div>}

            <button onClick={submit} disabled={submitting} style={{ ...primaryBtn, marginTop: 18, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? t('rate.sending') : t('rate.send')}
            </button>
            <button onClick={close} style={{ width: '100%', background: 'none', border: 'none', color: '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '12px 0 2px' }}>{t('rate.later')}</button>
          </>
        )}
      </div>
    </div>
  )
}

const primaryBtn: React.CSSProperties = { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const commentBox: React.CSSProperties = { width: '100%', marginTop: 10, padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: '#fafafa', minHeight: 60 }
