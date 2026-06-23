'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n'
import Navbar from '@/components/Navbar'
import { CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const SUBJECTS = [
  'Rezervasyon sorunu',
  'Ödeme sorunu',
  'Salon hakkında şikayet',
  'Uygulama hatası',
  'Hesap sorunu',
  'Diğer',
]

export default function SikayetPage() {
  const { t } = useT()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/public/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(true)
      }
    } catch {
      setError(t('common.connectionError'))
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', margin: '0 0 8px', letterSpacing: -0.5 }}>{t('footer.complaint')}</h1>
          <p style={{ fontSize: 15, color: '#888', margin: 0 }}>{t('comp.sub')}</p>
        </div>

        {success ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '48px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <CheckCircle size={52} color="#10B981" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>{t('comp.sent')}</h2>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px', lineHeight: 1.6 }}>
              {t('comp.sentSub')}
            </p>
            <button onClick={() => { setSuccess(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
              style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {t('comp.newMessage')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{t('comp.name')}</label>
                <input
                  required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('comp.namePlaceholder')}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{t('auth.email')}</label>
                <input
                  required type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ornek@mail.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{t('comp.subject')}</label>
              <select
                required value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }}
              >
                <option value="">{t('acc.select')}</option>
                {[t('comp.subj1'),t('comp.subj2'),t('comp.subj3'),t('comp.subj4'),t('comp.subj5'),t('comp.subj6')].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>{t('comp.message')}</label>
              <textarea
                required value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder={t('comp.messagePlaceholder')}
                rows={5}
                maxLength={2000}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 }}>{form.message.length}/2000</div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
                <AlertCircle size={16} color="#DC2626" />
                <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#a5b4fc' : '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
              {loading ? t('comp.sending') : t('report.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
