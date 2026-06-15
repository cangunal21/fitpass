'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockDropInSlots, mockVenues } from '@/lib/mockData'
import Navbar from '@/components/Navbar'
import { Calendar, Clock, Timer, MapPin, User, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react'
import { SportIconBox } from '@/lib/sportIcons'

export default function DropInPage() {
  const params = useParams()
  const slot = mockDropInSlots.find(s => s.id === Number(params.id)) || mockDropInSlots[0]
  const venue = mockVenues.find(v => v.id === slot.venueId)!
  const [showJoin, setShowJoin] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null)
  const [joinStep, setJoinStep] = useState(1)

  const percentage = (slot.currentPlayers / slot.totalPlayers) * 100

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>← Geri Dön</Link>

          <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ background: `linear-gradient(135deg, ${slot.color} 0%, ${slot.color}cc 100%)`, padding: '28px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, marginBottom: 12, display: 'inline-block' }}>DROP-IN · {slot.format}</span>
                  <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{slot.title}</h1>
                  <Link href={`/venue/${venue.id}`} style={{ fontSize: 14, opacity: 0.9, color: '#fff', textDecoration: 'underline' }}>{venue.name} · {slot.neighborhood}</Link>
                </div>
                <SportIconBox name={slot.icon} bgColor="rgba(255,255,255,0.2)" iconColor="#fff" boxSize={72} borderRadius={20} size={36} />
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, opacity: 0.85 }}>Doluluk</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{slot.currentPlayers}/{slot.totalPlayers} oyuncu</span>
                </div>
                <div style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
                  <div style={{ height: '100%', backgroundColor: '#fff', borderRadius: 4, width: `${percentage}%` }} />
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{slot.totalPlayers - slot.currentPlayers} yer kaldı — dolunca maç başlıyor!</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Tarih', value: slot.date, icon: <Calendar size={14} /> },
                { label: 'Saat', value: `${slot.time} - ${slot.endsAt}`, icon: <Clock size={14} /> },
                { label: 'Süre', value: slot.duration, icon: <Timer size={14} /> },
                { label: 'Kişi Başı', value: `₺${slot.pricePerPerson}`, icon: null },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: i === 3 ? slot.color : '#1a1a1a', display: 'flex', alignItems: 'center', gap: 4 }}>{item.icon}{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Takımlar */}
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Takımlar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {(['A', 'B'] as const).map(team => (
                <div key={team} style={{ border: `2px solid ${team === 'A' ? '#DBEAFE' : '#FCE7F3'}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ backgroundColor: team === 'A' ? '#EFF6FF' : '#FDF2F8', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: team === 'A' ? '#1E40AF' : '#9D174D' }}>{team === 'A' ? '🔵' : '🔴'} Takım {team}</span>
                    <span style={{ fontSize: 12, color: team === 'A' ? '#3B82F6' : '#EC4899', fontWeight: 600 }}>{slot.teams[team].length}/{slot.totalPlayers / 2}</span>
                  </div>
                  <div style={{ padding: '12px' }}>
                    {slot.teams[team].map(p => (
                      <Link key={p.id} href={`/profil/${p.username}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f9f9f9'}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} /></div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5' }}>@{p.username}</div>
                            <div style={{ fontSize: 11, color: p.tierColor, fontWeight: 600 }}>{p.tier}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {Array.from({ length: slot.openSpots[team] }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', opacity: 0.4 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc' }}>+</div>
                        <div style={{ fontSize: 13, color: '#999' }}>Boş yer</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salon */}
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Saha</h2>
            <Link href={`/venue/${venue.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', backgroundColor: '#f9f9f9', borderRadius: 14, cursor: 'pointer' }}>
                <SportIconBox name={venue.coverEmoji} bgColor={venue.color + '20'} iconColor={venue.color} boxSize={52} borderRadius={14} size={24} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>{venue.name}</div>
                  <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {venue.address}</div>
                </div>
              </div>
            </Link>
            <div style={{ marginTop: 14, padding: '12px 14px', backgroundColor: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> Bu etkinlik <strong>{venue.name}</strong> tarafından düzenlenmektedir. Şipşakspor yalnızca booking altyapısını sağlar.</p>
            </div>
          </div>
        </div>

        {/* Sağ panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>₺{slot.pricePerPerson}<span style={{ fontSize: 14, fontWeight: 400, color: '#999' }}> / kişi</span></div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Toplam: ₺{slot.totalPrice} · {slot.totalPlayers} kişiye bölünür</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#555' }}>Doluluk</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: slot.color }}>{slot.currentPlayers}/{slot.totalPlayers}</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ height: '100%', backgroundColor: slot.color, borderRadius: 4, width: `${percentage}%` }} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 10 }}>Takım Seç:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {(['A', 'B'] as const).map(team => (
                <button key={team} onClick={() => setSelectedTeam(team)} style={{ padding: '12px', borderRadius: 12, border: `2px solid ${selectedTeam === team ? (team === 'A' ? '#3B82F6' : '#EC4899') : '#eee'}`, background: selectedTeam === team ? (team === 'A' ? '#EFF6FF' : '#FDF2F8') : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: selectedTeam === team ? (team === 'A' ? '#1E40AF' : '#9D174D') : '#555' }}>
                  {team === 'A' ? '🔵' : '🔴'} Takım {team}<br />
                  <span style={{ fontSize: 11, fontWeight: 400 }}>{slot.openSpots[team]} yer</span>
                </button>
              ))}
            </div>

            <button onClick={() => selectedTeam && setShowJoin(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: selectedTeam ? slot.color : '#ddd', color: '#fff', fontSize: 15, fontWeight: 700, cursor: selectedTeam ? 'pointer' : 'not-allowed', marginBottom: 12 }}>
              {selectedTeam ? `Takım ${selectedTeam}'ye Katıl` : 'Takım Seç'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><CreditCard size={14} /> Maç dolunca ödeme çekilir</p>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ShieldCheck size={14} /> Dolmazsa tam iade garantisi</p>
          </div>
        </div>
      </div>

      {showJoin && selectedTeam && (
        <JoinModal slot={slot} team={selectedTeam} onClose={() => { setShowJoin(false); setJoinStep(1) }} step={joinStep} setStep={setJoinStep} />
      )}
    </div>
  )
}

function JoinModal({ slot, team, onClose, step, setStep }: { slot: typeof mockDropInSlots[0], team: 'A' | 'B', onClose: () => void, step: number, setStep: (s: number) => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: '32px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>×</button>
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: s <= step ? slot.color : '#eee' }} />)}
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Katılımı Onayla</h2>
            <div style={{ backgroundColor: '#f9f9f9', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><SportIconBox name={slot.icon} bgColor={slot.color + '18'} iconColor={slot.color} boxSize={28} borderRadius={8} size={16} /> {slot.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, color: '#555' }}>Takım</span><span style={{ fontSize: 13, fontWeight: 600 }}>{team === 'A' ? '🔵 Takım A' : '🔴 Takım B'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, color: '#555' }}>Saat</span><span style={{ fontSize: 13, fontWeight: 600 }}>{slot.time}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#555' }}>Ücret</span><span style={{ fontSize: 13, fontWeight: 700, color: slot.color }}>₺{slot.pricePerPerson}</span></div>
            </div>
            <button onClick={() => setStep(2)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: slot.color, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Devam Et →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Kart Bilgileri</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <input type="text" placeholder="0000 0000 0000 0000" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input type="text" placeholder="AA/YY" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a' }} />
                <input type="text" placeholder="CVV" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', backgroundColor: '#fafafa', color: '#1a1a1a' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #eee', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#333' }}>← Geri</button>
              <button onClick={() => setStep(3)} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: slot.color, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Lobiye Katıl 🚀</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><SportIconBox name={slot.icon} bgColor={slot.color + '18'} iconColor={slot.color} boxSize={80} borderRadius={24} size={40} /></div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Lobiye Katıldın!</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}><strong>{team === 'A' ? '🔵 Takım A' : '🔴 Takım B'}</strong> takımındasın.<br />Maç dolunca ₺{slot.pricePerPerson} kartından çekilecek.</p>
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: slot.color, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Harika! 🎉</button>
          </div>
        )}
      </div>
    </div>
  )
}
