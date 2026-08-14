'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getToken, getUser } from '@/lib/api'
import { useT } from '@/lib/i18n'
import DogrulamaKodu from '@/components/DogrulamaKodu'
import { guvenliDonusYolu } from '@/lib/donusYolu'

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
 *
 * ── NEDEN İKİ BİLEŞEN ───────────────────────────────────────────────────────────────────────
 * `useSearchParams()` bir rota ön-render edilirken, en yakın `<Suspense>` sınırına kadarki
 * istemci ağacını istemci-tarafı render'a düşürür. Sınır YOKSA Next production build'i
 * "useSearchParams() should be wrapped in a suspense boundary" diyerek KIRILIR.
 *
 * ÖNEMLİ: bunu `tsc`, lint ve testler GÖREMEZ — yalnız `npm run build` yakalar. Bu sayfaya
 * `?next=` desteği eklenirken tam olarak bu oldu ve CI kırmızıya döndü. Statik kabuk (kart,
 * arka plan) ön-render edilir; yalnız parametreye bağlı iç kısım istemcide çizilir.
 */
export default function DogrulaPage() {
  const { t } = useT()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, padding: '40px 32px', border: '1px solid #F0F0F0' }}>
        <Suspense fallback={<p style={{ textAlign: 'center', color: '#999', fontSize: 14 }}>{t('common.loading')}</p>}>
          <DogrulaIcerik />
        </Suspense>
      </div>
    </div>
  )
}

function DogrulaIcerik() {
  const router = useRouter()
  const aramaParam = useSearchParams()
  const { t } = useT()

  /**
   * Doğrulama bitince kullanıcının GELDİĞİ yere dön. Rezervasyon ekranından 403 alıp buraya
   * yönlendirilen biri, doğruladıktan sonra ana sayfaya düşerse dersi yeniden bulmak zorunda
   * kalıyordu.
   *
   * Süzgeç `@/lib/donusYolu` içinde ve TEST EDİLİ — açık yönlendirme koruması bir sayfanın
   * içine gömülü kalmamalı; `?next=` destekleyen her sayfa aynı fonksiyonu kullanmalı.
   */
  const donusYolu = guvenliDonusYolu(aramaParam.get('next'))
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

  if (!oturum) return <p style={{ textAlign: 'center', color: '#999', fontSize: 14 }}>{t('common.loading')}</p>

  return (
    <>
      <DogrulamaKodu token={oturum.token} email={oturum.email} onBasarili={() => router.push(donusYolu)} />
      <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #F5F5F5' }}>
        <Link href="/" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', fontWeight: 500 }}>
          {t('verify.later')}
        </Link>
      </div>
    </>
  )
}
