'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'

/**
 * PUANLAMA FORMU — TEK KAYNAK (web)
 *
 * NEDEN ÇIKARILDI: web'de İKİ ayrı puanlama arayüzü vardı ve davranışları ayrışmıştı.
 *   • components/RatingPrompt.tsx — ders sonrası otomatik açılan modal: salon ★ + HOCA ★
 *   • profil/[username] içindeki "Yorum Yap" modalı — YALNIZ salon ★, hoca bölümü YOK
 *
 * Bu kozmetik bir fark değildi: backend bir rezervasyonu YALNIZ BİR KEZ puanlatıyor
 * (reviewController: 'venue' satırı varsa 400 "zaten puan verdiniz") ve hoca satırı SADECE
 * aynı istekte yaratılıyor. Yani profilden puan veren web kullanıcısının HOCA PUANI
 * O REZERVASYON İÇİN BİR DAHA ASLA VERİLEMİYORDU — sessiz veri kaybı. Aynı kullanıcı
 * mobilde iki puanı da veriyordu, çünkü mobil bunu tek bileşende (ReviewSheet) çözmüş.
 *
 * Bu dosya mobildeki `ReviewSheet` ile aynı işi yapar ve aynı adı taşır: iki istemcinin
 * puanlama sözleşmesi bir daha ayrışmasın.
 */

export type ReviewHedefi = {
  bookingId: number
  className?: string | null
  venueName?: string | null
  instructorId?: number | null
  instructorName?: string | null
}

// starLabel: ekran okuyucuya giden etiket de çevrilir.
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

export default function ReviewSheet({
  hedef,
  onKapat,
  onGonderildi,
}: {
  hedef: ReviewHedefi
  onKapat: () => void
  /** Gönderim başarılı olduğunda çağrılır; çağıran listeyi tazeleyebilir. */
  onGonderildi?: (sonuc: { venueRating: number; venueComment: string }) => void
}) {
  const { t } = useT()
  const [venueRating, setVenueRating] = useState(0)
  const [venueComment, setVenueComment] = useState('')
  const [instructorRating, setInstructorRating] = useState(0)
  const [instructorComment, setInstructorComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  // GİZLİ BÖLÜM — yalnız yöneticiye gider, hiçbir yerde yayımlanmaz. İSTEĞE BAĞLI:
  // null = kullanıcı cevaplamadı (atladı) → hiç gönderilmez.
  const [ilanEdilenGibi, setIlanEdilenGibi] = useState<boolean | null>(null)
  const [gizliSebep, setGizliSebep] = useState('')
  const [gizliYorum, setGizliYorum] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const hasInstructor = hedef.instructorId != null

  const submit = async () => {
    if (venueRating < 1) { setError(t('rate.venueRequired')); return }
    const token = localStorage.getItem('fitpass_token')
    if (!token) return
    setSubmitting(true); setError('')
    const res = await api.createReview(token, {
      bookingId: hedef.bookingId,
      venueRating,
      venueComment: venueComment.trim() || undefined,
      // Hoca puanı YALNIZ aynı istekte gönderilebilir (backend tek seferlik) — boş bırakılırsa
      // o rezervasyon için bir daha verilemez. Bu yüzden bölüm gizlenmiyor, opsiyonel bırakılıyor.
      instructorRating: hasInstructor && instructorRating >= 1 ? instructorRating : undefined,
      instructorComment: hasInstructor && instructorRating >= 1 ? (instructorComment.trim() || undefined) : undefined,
      isAnonymous,
    })
    if (res?.error) { setSubmitting(false); setError(res.error); return }

    // GİZLİ GERİ BİLDİRİM — AYRI uç, ayrı tablo, yalnız yöneticiye.
    // Public puanlama başarılı olduktan SONRA gönderiliyor ve hatası kullanıcıya YANSITILMIYOR:
    // isteğe bağlı bir ek adımın hatası, başarıyla kaydedilmiş puanlamayı başarısız göstermemeli.
    if (ilanEdilenGibi !== null) {
      await api.gizliGeriBildirim(token, {
        bookingId: hedef.bookingId,
        ilanEdilenGibi,
        sebep: ilanEdilenGibi ? undefined : (gizliSebep || undefined),
        yorum: gizliYorum.trim() || undefined,
      }).catch(() => {})
    }

    setSubmitting(false)
    setDone(true)
    onGonderildi?.({ venueRating, venueComment })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onKapat}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', padding: '24px 26px', boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{t('rate.title')}</div>
            {hedef.className && <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{hedef.className}</div>}
          </div>
          <button onClick={onKapat} aria-label={t('rate.later')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}><X size={22} /></button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 15, color: '#16a34a', fontWeight: 700, marginBottom: 20 }}>{t('rate.thanks')}</div>
            <button onClick={onKapat} style={primaryBtn}>{t('rate.close')}</button>
          </div>
        ) : (
          <>
            {/* SALON — zorunlu */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '18px 0 8px' }}>{t('rate.venue')}{hedef.venueName ? ` · ${hedef.venueName}` : ''}</div>
            <Stars value={venueRating} onChange={setVenueRating} starLabel={t('rate.star')} />
            <textarea value={venueComment} onChange={e => setVenueComment(e.target.value)} placeholder={t('rate.venuePh')} rows={2} style={commentBox} />

            {/* HOCA — ders bir hocaya bağlıysa, opsiyonel */}
            {hasInstructor && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '18px 0 8px' }}>{t('rate.instructor')}{hedef.instructorName ? ` · ${hedef.instructorName}` : ''}</div>
                <Stars value={instructorRating} onChange={setInstructorRating} starLabel={t('rate.star')} />
                <textarea value={instructorComment} onChange={e => setInstructorComment(e.target.value)} placeholder={t('rate.instructorPh')} rows={2} style={commentBox} />
              </>
            )}

            {/* GİZLİ BÖLÜM — yukarıdaki puanlamadan görsel olarak AYRILMIŞ. Kullanıcı neyin
                yayımlandığını, neyin yalnız yöneticiye gittiğini karıştırmamalı. */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: '#FAFAFA', border: '1px solid #EFEFEF', borderRadius: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>{t('rate.privateQ')}</div>
              <div style={{ fontSize: 11.5, color: '#999', marginTop: 3, lineHeight: 1.6 }}>{t('rate.privateNote')}</div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {([true, false] as const).map(v => (
                  <button key={String(v)} type="button"
                    onClick={() => { setIlanEdilenGibi(ilanEdilenGibi === v ? null : v); if (v) setGizliSebep('') }}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                      border: `1.5px solid ${ilanEdilenGibi === v ? (v ? '#16a34a' : '#DC2626') : '#E5E5E5'}`,
                      background: ilanEdilenGibi === v ? (v ? '#F0FDF4' : '#FEF2F2') : '#fff',
                      color: ilanEdilenGibi === v ? (v ? '#16a34a' : '#DC2626') : '#666' }}>
                    {v ? t('rate.privateYes') : t('rate.privateNo')}
                  </button>
                ))}
              </div>

              {ilanEdilenGibi === false && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {([['hoca_gelmedi', t('rate.rNoShow')], ['kisa_surdu', t('rate.rShort')], ['baglanti', t('rate.rLink')], ['icerik_farkli', t('rate.rContent')], ['diger', t('rate.rOther')]] as const).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setGizliSebep(gizliSebep === k ? '' : k)}
                      style={{ padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                        border: `1px solid ${gizliSebep === k ? '#4F46E5' : '#E5E5E5'}`,
                        background: gizliSebep === k ? '#EEF2FF' : '#fff', color: gizliSebep === k ? '#4F46E5' : '#666' }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {ilanEdilenGibi !== null && (
                <textarea value={gizliYorum} onChange={e => setGizliYorum(e.target.value)} placeholder={t('rate.privatePh')} rows={2} style={commentBox} />
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', cursor: 'pointer', marginTop: 16 }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              {t('rate.anon')}
            </label>

            {/* Sunucunun reddetme gerekçesi (check-in yok, ders bitmedi, zaten puanlanmış) GÖSTERİLİR. */}
            {error && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 12 }}>{error}</div>}

            <button onClick={submit} disabled={submitting} style={{ ...primaryBtn, marginTop: 18, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? t('rate.sending') : t('rate.send')}
            </button>
            <button onClick={onKapat} style={{ width: '100%', background: 'none', border: 'none', color: '#999', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '12px 0 2px' }}>{t('rate.later')}</button>
          </>
        )}
      </div>
    </div>
  )
}

const primaryBtn: React.CSSProperties = { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const commentBox: React.CSSProperties = { width: '100%', marginTop: 10, padding: '10px 12px', borderRadius: 12, border: '1.5px solid #e5e5e5', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: '#fafafa', minHeight: 60 }
