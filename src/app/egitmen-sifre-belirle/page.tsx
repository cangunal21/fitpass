'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react'

function SetPasswordInner() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); return }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/instructor/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setDone(true)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#4F46E5' }}><GraduationCap size={38} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Şifre Belirle</h1>
        <p style={{ fontSize: 14, color: '#888' }}>Eğitmen girişin için bir şifre oluştur</p>
      </div>

      {!token ? (
        <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> Geçersiz bağlantı. Lütfen salonundan yeni bir davet iste.</div>
      ) : done ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#16a34a' }}><CheckCircle2 size={40} /></div>
          <p style={{ fontSize: 15, color: '#166534', fontWeight: 600, marginBottom: 20 }}>Şifren belirlendi! Artık giriş yapabilirsin.</p>
          <Link href="/egitmen-giris" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 14, background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Eğitmen Girişine Git →</Link>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Yeni Şifre</label>
            <input type="password" placeholder="En az 8 karakter" value={password} onChange={e => { setPassword(e.target.value); setError('') }} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Şifre (Tekrar)</label>
            <input type="password" placeholder="Şifreyi tekrar gir" value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }} required style={inputStyle} />
          </div>
          {error && <div style={{ ...errorStyle, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} /> {error}</div>}
          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi Belirle'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function EgitmenSifreBelirlePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>{ }<img src="/sipsakspor-logo.svg" alt="Şipşakspor" style={{ height: 30, width: 'auto', display: 'block' }} /></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <Suspense fallback={<div style={{ color: '#888' }}>Yükleniyor…</div>}>
          <SetPasswordInner />
        </Suspense>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a', boxSizing: 'border-box' }
const errorStyle: React.CSSProperties = { backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }
const btnStyle = (loading: boolean): React.CSSProperties => ({ marginTop: 6, padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#ccc' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' })
