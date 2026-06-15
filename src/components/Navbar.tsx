'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUser, removeToken, removeUser } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; fullName: string } | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    removeToken()
    removeUser()
    setUser(null)
    setShowMenu(false)
    router.push('/')
  }

  return (
    <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link href="/" style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5', letterSpacing: -0.5, textDecoration: 'none' }}>şipşakspor</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  <User size={16} /> Profilim
                </Link>
                <div style={{ height: 1, backgroundColor: '#F5F5F5' }} />
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', fontSize: 14, color: '#4F46E5', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  <LogOut size={14} /> Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/giris" style={{ padding: '9px 18px', borderRadius: 100, border: '1.5px solid #EBEBEB', background: '#fff', fontSize: 14, fontWeight: 600, color: '#333', textDecoration: 'none' }}>
              Giriş Yap
            </Link>
            <Link href="/kayit" style={{ padding: '9px 18px', borderRadius: 100, border: 'none', background: '#4F46E5', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
              Kayıt Ol
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
