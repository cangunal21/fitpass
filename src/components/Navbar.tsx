'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUser, getToken, apiLogout } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { User, LogOut, Bell } from 'lucide-react'
import { useT } from '@/lib/i18n'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function Navbar() {
  const router = useRouter()
  const { t, lang, setLang } = useT()
  const [user, setUser] = useState<{ username: string; fullName: string } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [compact, setCompact] = useState(false)  // dar ekran (mobil) — navbar taşmasın diye kompakt

  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 480)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const u = getUser()
    setUser(u)
    if (u) {
      const token = getToken()
      if (token) {
        fetch(`${API_URL}/api/social/notifications`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => {
            setNotifications(Array.isArray(d?.notifications) ? d.notifications : [])
            setUnreadCount(d?.unreadCount || 0)
          })
          .catch(() => {})
      }
    }
  }, [])

  const openNotifications = () => {
    setShowNotifications(v => !v)
    if (!showNotifications && unreadCount > 0) {
      const token = getToken()
      if (token) {
        fetch(`${API_URL}/api/social/notifications/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
        setUnreadCount(0)
      }
    }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} dakika önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  const handleLogout = () => {
    apiLogout()
    setUser(null)
    setShowMenu(false)
    router.push('/')
  }

  return (
    <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0', padding: compact ? '0 7px' : '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 34, width: 'auto', display: 'block' }} />
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Link href="/salonlar" style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: '#4F46E5', textDecoration: 'none', padding: compact ? '5px 7px' : '6px 12px', borderRadius: 8, letterSpacing: -0.3 }}>
          {t('nav.venues')}
        </Link>
        <Link href="/sosyal" style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: '#4F46E5', textDecoration: 'none', padding: compact ? '5px 7px' : '6px 12px', borderRadius: 8, letterSpacing: -0.3 }}>
          {t('nav.social')}
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <div
          role="group"
          aria-label="Dil / Language"
          style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #EBEBEB', borderRadius: 100, overflow: 'hidden', background: '#fff' }}
        >
          {(['tr', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                padding: compact ? '6px 8px' : '6px 11px',
                height: compact ? 32 : 34,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.5,
                background: lang === l ? '#4F46E5' : 'transparent',
                color: lang === l ? '#fff' : '#9CA3AF',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        {user && (
          <div style={{ position: 'relative' }}>
            <button onClick={openNotifications} style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', border: '1.5px solid #EBEBEB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={17} color="#444" />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#DC2626' }} />
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: 46, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', border: '1px solid #F0F0F0', minWidth: 300, maxHeight: 360, overflowY: 'auto', zIndex: 200 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', fontSize: 13, fontWeight: 700, color: '#111' }}>{t("nav.notifications")}</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#999' }}>{t("nav.noNotifications")}</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #FAFAFA', backgroundColor: n.isRead ? '#fff' : '#EEF2FF' }}>
                      <div style={{ fontSize: 13, color: '#222' }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px 7px 8px', borderRadius: 100, border: '1.5px solid #EBEBEB', background: '#fff', cursor: 'pointer' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{user.fullName.split(' ')[0]}</span>
            </button>

            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: 52, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', border: '1px solid #F0F0F0', minWidth: 200, zIndex: 200, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F5F5' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{user.fullName}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>@{user.username}</div>
                </div>
                <Link href={`/profil/${user.username}`} onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, color: '#333', textDecoration: 'none', fontWeight: 500, backgroundColor: 'transparent' }}>
                  <User size={16} /> {t("nav.profile")}
                </Link>
                <div style={{ height: 1, backgroundColor: '#F5F5F5' }} />
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', fontSize: 14, color: '#4F46E5', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  <LogOut size={14} /> {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/giris" style={{ padding: compact ? '8px 10px' : '9px 18px', borderRadius: 100, border: '1.5px solid #EBEBEB', background: '#fff', fontSize: compact ? 13 : 14, fontWeight: 600, color: '#333', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {t("nav.login")}
            </Link>
            <Link href="/kayit" style={{ padding: compact ? '8px 10px' : '9px 18px', borderRadius: 100, border: 'none', background: '#4F46E5', fontSize: compact ? 13 : 14, fontWeight: 600, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {t("nav.register")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
