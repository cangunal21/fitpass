'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import ReviewSheet from './ReviewSheet'

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

// Global ders-sonrası puanlama modalı (web) — mobildeki RatingPrompt'un ikizi. Giriş yapmış kullanıcı
// derse gitti (check-in) + ders bitti + henüz puanlamadıysa /api/reviews/pending döner ve modal açılır.
// Önce salon (zorunlu ★ + opsiyonel yorum), sonra —ders bir hocaya bağlıysa— hoca. "Daha sonra" ile
// kapatılırsa o booking localStorage'da işaretlenir, tekrar otomatik açılmaz.
export default function RatingPrompt() {
  const pathname = usePathname()
  const [target, setTarget] = useState<Pending | null>(null)
  const checkedRef = useRef(false)

  const getDismissed = (): number[] => {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') } catch { return [] }
  }
  const addDismissed = (id: number) => {
    const d = getDismissed(); if (!d.includes(id)) d.push(id)
    localStorage.setItem(DISMISS_KEY, JSON.stringify(d))
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
    // Form durumu ReviewSheet'in içinde; her açılışta yeni bir örnek monte edildiği için
    // ayrıca sıfırlamaya gerek yok (key olarak bookingId veriliyor).
    if (next) setTarget(next)
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

  if (!target) return null

  // Form ve gönderim ORTAK bileşende (components/ReviewSheet.tsx). Bu bileşenin tek işi
  // "ne zaman açılacağı": bekleyen puanlama var mı, kullanıcı daha önce kapattı mı, hangi
  // sayfalarda çıkmamalı. Formu burada tekrar yazmak, profil sayfasındaki ikinci modalda
  // yaşandığı gibi sessiz bir sapmaya (hoca puanının kaybolmasına) yol açıyordu.
  return (
    <ReviewSheet
      key={target.bookingId}
      hedef={target}
      onKapat={close}
      onGonderildi={() => addDismissed(target.bookingId)}
    />
  )
}
