'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getToken, getUser } from '@/lib/api'
import { useT } from '@/lib/i18n'
import DogrulamaKodu from '@/components/DogrulamaKodu'

/**
 * DOĞRULAMA SAYFASI — kayıt akışının dışındaki giriş noktası.
 *
 * Kayıt sayfası kodu kendi içinde soruyor. Bu sayfa iki durum için var:
 *  • Kullanıcı kaydı yarım bırakıp sonra GİRİŞ yaptı (login `requiresEmailVerification` döner).
 *  • Doğrulanmamış hesapla rezervasyon/yorum denendi ve 403 EMAIL_NOT_VERIFIED geldi.
 * İkisinde de kullanıcı buraya yönlendirilir; tek bir ekran, tek bir mantık.
 *
 * Oturum bilgisi MONTAJDAN SONRA okunur — getToken/getUser localStorage'a bakıyor ve render
 * sırasında çağrılırsa sunucu/istemci ağaçları ayrışıp hidrasyon uyuşmazlığı çıkıyor
 * (profil ve sosyal sayfalarında yaşandı, aynı desenle çözüldü).
 */
export default function DogrulaPage() {
  const router = useRouter()
  const aramaParam = useSearchParams()
  const { t } = useT()

  /**
   * Doğrulama bitince kullanıcının GELDİĞİ yere dön. Rezervasyon ekranından 403 alıp buraya
   * yönlendirilen biri, doğruladıktan sonra ana sayfaya düşerse dersi yeniden bulmak zorunda
   * kalıyordu.
   *
   * AÇIK YÖNLENDİRME KORUMASI: yalnız `/` ile başlayan ve `//` ile başlaMAYAN yollar kabul
   * edilir. `//kotu-site.com` tarayıcıda protokol-göreli MUTLAK adrestir; süzgeçsiz bırakılsa
   * saldırgan `?next=//...` ile kullanıcıyı kendi sitesine yollayabilirdi.
   */
  const donusYolu = (() => {
    const ham = aramaParam.get('next')
    if (!ham || !ham.startsWith('/') || ham.startsWith('//')) return '/'
    return ham
  })()
  const [oturum, setOturum] = useState<{ token: string; email: string } | null>(null)
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    if (token && user?.email) setOturum({ token, email: user.email })
    setHazir(true)
  }, [])

  useEffect(() => {
    // Girişsiz kullanıcının doğrulayacak bir hesabı yok.
    if (hazir && !oturum) router.replace('/giris')
  }, [hazir, oturum, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, padding: '40px 32px', border: '1px solid #F0F0F0' }}>
        {oturum ? (
          <>
            <DogrulamaKodu token={oturum.token} email={oturum.email} onBasarili={() => router.push(donusYolu)} />
            <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #F5F5F5' }}>
              <Link href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', fontWeight: 500 }}>
                {t('verify.later')}
              </Link>
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 14 }}>{t('common.loading')}</p>
        )}
      </div>
    </div>
  )
}
