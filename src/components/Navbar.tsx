'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUser, removeToken, removeUser } from '@/lib/api'
import { useRouter } from 'next/navigation'

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
    <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: '#FF385C', letterSpacing: -0.5, textDecoration: 'none' }}>fitpass</Link>

      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 24, border: '1.5px solid #eee', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#333' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FF385C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            {user.fullName.split(' ')[0]}
          </button>

          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: 44, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #eee', minWidth: 180, zIndex: 200, overflow: 'hidden' }}>
              <Link href={`/profil/${user.username}`} onClick={() => setShowMenu(false)} style={{ display: 'block', padding: '12px 18px', fontSize: 14, color: '#333', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid #f5f5f5' }}>
                👤 Profilim
              </Link>
              <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '12px 18px', fontSize: 14, color: '#EF4444', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                🚪 Çıkış Yap
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/giris" style={{ padding: '8px 18px', borderRadius: 24, border: '1px solid #ddd', background: '#fff', fontSize: 14, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Giriş Yap</Link>
          <Link href="/kayit" style={{ padding: '8px 18px', borderRadius: 24, border: 'none', background: '#FF385C', fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Kayıt Ol</Link>
        </div>
      )}
    </nav>
  )
}
