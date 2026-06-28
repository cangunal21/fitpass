'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, CalendarCheck, Share2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { SportIcon, getColorForCategory } from '@/lib/sportIcons'

type Activity = { date: string; category: string | null; title: string }

// İstanbul saatine göre YYYY-MM-DD (backend tarihleriyle eşleşsin diye)
const istanbulYmd = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
const pad = (n: number) => String(n).padStart(2, '0')

export default function ActivityCalendar({ token }: { token: string }) {
  const { t, lang } = useT()
  const [activities, setActivities] = useState<Activity[]>([])
  const [streaks, setStreaks] = useState({ daily: 0, weekly: 0 })
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })

  useEffect(() => {
    let alive = true
    api.getMyCalendar(token)
      .then(r => {
        if (!alive) return
        if (Array.isArray(r?.activities)) setActivities(r.activities)
        setStreaks({ daily: Number(r?.dailyStreak) || 0, weekly: Number(r?.weeklyStreak) || 0 })
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [token])

  // tarih -> kategori listesi
  const byDate = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const a of activities) {
      if (!map[a.date]) map[a.date] = []
      if (a.category) map[a.date].push(a.category)
    }
    return map
  }, [activities])

  const { y, m } = cursor
  const monthPrefix = `${y}-${pad(m + 1)}`
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7 // Pazartesi=0
  const todayYmd = istanbulYmd(new Date())

  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  const monthLabel = new Date(y, m, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  // Hafta günü başlıklarını locale'den üret (Pazartesi başlangıçlı) — sabit metin yok
  const weekDays = useMemo(() => {
    const monday = new Date(2024, 0, 1) // 1 Ocak 2024 = Pazartesi
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      return d.toLocaleDateString(locale, { weekday: 'short' })
    })
  }, [locale])

  const monthActivityCount = useMemo(
    () => Object.keys(byDate).filter(d => d.startsWith(monthPrefix)).reduce((s, d) => s + byDate[d].length, 0),
    [byDate, monthPrefix]
  )

  const move = (delta: number) => setCursor(c => {
    const nm = c.m + delta
    return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
  })

  const handleShare = async () => {
    const text = `🔥 ${streaks.daily} ${t('cal.dayStreak')}, 📅 ${streaks.weekly} ${t('cal.weekStreak')} — ${t('cal.shareTag')}`
    const url = 'https://sipsakspor.com'
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Şipşakspor', text, url }) } catch { /* kullanıcı iptal etti */ }
    } else {
      try { await navigator.clipboard.writeText(`${text} ${url}`); alert(t('cal.copied')) } catch { /* yoksay */ }
    }
  }

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', padding: 20 }}>
      {/* Seri rozetleri */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', borderRadius: 12, padding: '10px 14px' }}>
          <Flame size={20} color="#EF4444" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>{streaks.daily}</div>
            <div style={{ fontSize: 11, color: '#B91C1C' }}>{t('cal.dayStreak')}</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#EEF2FF', borderRadius: 12, padding: '10px 14px' }}>
          <CalendarCheck size={20} color="#4F46E5" />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4F46E5', lineHeight: 1 }}>{streaks.weekly}</div>
            <div style={{ fontSize: 11, color: '#3730A3' }}>{t('cal.weekStreak')}</div>
          </div>
        </div>
      </div>

      {/* Başlık + ay navigasyonu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => move(-1)} aria-label="prev" style={navBtn}><ChevronLeft size={18} /></button>
        <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{monthLabel}</div>
        <button onClick={() => move(1)} aria-label="next" style={navBtn}><ChevronRight size={18} /></button>
      </div>

      {/* Hafta günleri */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aaa' }}>{d}</div>
        ))}
      </div>

      {/* Günler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />
          const key = `${monthPrefix}-${pad(day)}`
          const cats = byDate[key] || []
          const isToday = key === todayYmd
          const has = cats.length > 0
          return (
            <div
              key={key}
              title={cats.length ? cats.join(', ') : undefined}
              style={{
                aspectRatio: '1', borderRadius: 10, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative',
                background: has ? '#EEF2FF' : '#FAFAFA',
                border: isToday ? '2px solid #4F46E5' : '1px solid #f0f0f0',
              }}
            >
              <span style={{ fontSize: 10, color: has ? '#4F46E5' : '#bbb', fontWeight: isToday ? 700 : 500, position: 'absolute', top: 4, left: 6 }}>{day}</span>
              {has && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 6 }}>
                  {cats.slice(0, 2).map((c, idx) => (
                    <SportIcon key={idx} name={c} size={16} color={getColorForCategory(c)} />
                  ))}
                  {cats.length > 2 && <span style={{ fontSize: 9, color: '#4F46E5', fontWeight: 700 }}>+{cats.length - 2}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Alt özet + paylaş */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666' }}>
          <Flame size={15} color="#EF4444" />
          {loading ? t('common.loading') : t('cal.monthSummary').replace('{n}', String(monthActivityCount))}
        </span>
        <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4F46E5', border: 'none', borderRadius: 100, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Share2 size={15} /> {t('cal.share')}
        </button>
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid #eee', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555',
}
