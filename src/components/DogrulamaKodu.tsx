'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { AlertCircle, MailCheck } from 'lucide-react'

/**
 * E-POSTA DOĞRULAMA KODU EKRANI (kayıt akışının 2. adımı)
 *
 * Kullanıcı kararı (12 Ağu 2026): doğrulama linki yerine 6 haneli kod. Link mobilde uygulamadan
 * çıkıp posta kutusuna gitmeyi ve geri dönmeyi gerektiriyor; akış orada kopuyor.
 *
 * TASARIM NOTLARI:
 *  • 6 ayrı kutu değil TEK input. Ayrı kutular şık görünür ama yapıştırma, otomatik doldurma
 *    (`one-time-code`), geri silme ve ekran okuyucu davranışını bozar; kazanç kozmetik.
 *  • `inputMode="numeric"` + `autoComplete="one-time-code"`: iOS/Android klavyeyi sayısal açar
 *    ve gelen SMS/e-posta kodunu otomatik önerir.
 *  • 6 hane dolunca KENDİLİĞİNDEN gönderilir — kullanıcı ayrıca butona basmak zorunda kalmasın.
 *  • Tekrar gönderme sayacı: sunucu tarafında 2 dk soğuma var (authController.resendVerification).
 *    Butonu o süre boyunca kapalı tutmak, kullanıcının boşuna tıklayıp hata görmesini engeller.
 */

const TEKRAR_SANIYE = 120

export default function DogrulamaKodu({
  token,
  email,
  onBasarili,
}: {
  token: string
  email: string
  onBasarili: () => void
}) {
  const { t } = useT()
  const [kod, setKod] = useState('')
  const [hata, setHata] = useState('')
  const [bilgi, setBilgi] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [kalan, setKalan] = useState(TEKRAR_SANIYE)
  const gonderiliyor = useRef(false)

  useEffect(() => {
    if (kalan <= 0) return
    const id = setInterval(() => setKalan(k => (k > 0 ? k - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [kalan])

  const dogrula = async (deger: string) => {
    // Çift gönderim koruması: otomatik gönderim ile butona basma aynı anda tetiklenebiliyor.
    if (gonderiliyor.current) return
    gonderiliyor.current = true
    setYukleniyor(true)
    setHata('')
    setBilgi('')
    try {
      const res = await api.verifyCode(token, deger)
      if (res?.verified) { onBasarili(); return }
      setHata(res?.error || t('verify.wrongCode'))
      setKod('')
    } catch {
      setHata(t('common.connectionError'))
    } finally {
      gonderiliyor.current = false
      setYukleniyor(false)
    }
  }

  const degisti = (v: string) => {
    const temiz = v.replace(/\D/g, '').slice(0, 6)
    setKod(temiz)
    setHata('')
    if (temiz.length === 6) dogrula(temiz)
  }

  const tekrarGonder = async () => {
    setHata('')
    setBilgi('')
    try {
      const res = await api.resendVerification(token)
      setBilgi(res?.message || t('verify.resent'))
      setKalan(TEKRAR_SANIYE)
    } catch {
      setHata(t('common.connectionError'))
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <MailCheck size={30} color="#4F46E5" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 8 }}>{t('verify.title')}</h1>
      <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6, marginBottom: 4 }}>{t('verify.subtitle')}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 28, wordBreak: 'break-all' }}>{email}</p>

      <input
        value={kod}
        onChange={e => degisti(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        placeholder="000000"
        aria-label={t('verify.title')}
        disabled={yukleniyor}
        style={{
          width: '100%', padding: '18px 12px', fontSize: 32, fontWeight: 800, textAlign: 'center',
          letterSpacing: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          border: `2px solid ${hata ? '#DC2626' : '#E5E7EB'}`, borderRadius: 16, outline: 'none',
          color: '#111', background: yukleniyor ? '#FAFAFA' : '#fff',
        }}
      />

      {hata && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, color: '#DC2626', fontSize: 14 }}>
          <AlertCircle size={16} />
          <span>{hata}</span>
        </div>
      )}
      {bilgi && <p style={{ marginTop: 14, color: '#059669', fontSize: 14 }}>{bilgi}</p>}

      <button
        onClick={() => kod.length === 6 && dogrula(kod)}
        disabled={kod.length !== 6 || yukleniyor}
        style={{
          width: '100%', marginTop: 22, padding: '15px', borderRadius: 14, border: 'none',
          background: kod.length === 6 && !yukleniyor ? '#4F46E5' : '#C7D2FE', color: '#fff',
          fontSize: 16, fontWeight: 700, cursor: kod.length === 6 && !yukleniyor ? 'pointer' : 'default',
        }}
      >
        {yukleniyor ? t('verify.checking') : t('verify.button')}
      </button>

      <div style={{ marginTop: 20, fontSize: 14, color: '#888' }}>
        {kalan > 0 ? (
          <span>{t('verify.resendIn').replace('{s}', String(kalan))}</span>
        ) : (
          <button onClick={tekrarGonder} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, cursor: 'pointer', fontSize: 14, padding: 0 }}>
            {t('verify.resend')}
          </button>
        )}
      </div>

      <p style={{ marginTop: 18, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{t('verify.spamHint')}</p>
    </div>
  )
}
