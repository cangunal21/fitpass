'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Nasıl rezervasyon yapabilirim?',
  'İptal politikası nedir?',
  'Drop-in nedir?',
  'Hangi sporlar var?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Merhaba! Ben Şipşakspor asistanıyım 👋 Spor rezervasyonları, salonlar veya platform hakkında sana yardımcı olabilirim.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    setError('')

    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setError('Bağlantı hatası, tekrar deneyin.')
    }
    setLoading(false)
  }

  const showSuggestions = messages.length === 1

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 999,
          width: 340, maxHeight: 500,
          backgroundColor: '#fff', borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #ebebeb',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Şipşak Asistan</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Genellikle anında yanıt verir</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? '#4F46E5' : '#F4F4F5',
                  color: m.role === 'user' ? '#fff' : '#1a1a1a',
                  fontSize: 13, lineHeight: 1.45,
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#F4F4F5', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#aaa', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', padding: '4px 8px', backgroundColor: '#FEF2F2', borderRadius: 8 }}>{error}</div>
            )}

            {/* Suggestions */}
            {showSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: '#fff', fontSize: 12, color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} style={{ height: 8 }} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Bir şey sor..."
              style={{ flex: 1, padding: '9px 12px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: input.trim() && !loading ? '#4F46E5' : '#e5e5e5', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={15} color={input.trim() && !loading ? '#fff' : '#aaa'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  )
}
