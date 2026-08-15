'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getUser } from '@/lib/api'
import { useT } from '@/lib/i18n'

/**
 * /profil — KENDİ PROFİLİNE YÖNLENDİRİCİ
 *
 * NEDEN VAR: profil sayfası `/profil/[username]` altında yaşıyor, yani `/profil` diye bir rota
 * YOKTU. Ama BEŞ E-POSTA ŞABLONUNUN ana butonu tam olarak oraya gidiyordu
 * (`${SITE_URL}/profil` — rezervasyon onayı, hatırlatma, iptal, puanlama daveti…).
 * Yani kullanıcı "Rezervasyonlarımı Gör" butonuna bastığında **404 alıyordu.**
 *
 * Şablonları tek tek düzeltmek yerine rotayı var etmek doğru çözüm: e-postanın kullanıcı adını
 * bilmesi gerekmiyor, gelecekte yazılacak şablonlar da çalışıyor ve `/profil` zaten kullanıcının
 * elle yazacağı doğal bir adres.
 *
 * Oturum MONTAJDAN SONRA okunur — `getToken`/`getUser` localStorage'a bakıyor ve render
 * sırasında çağrılırsa sunucu/istemci ağaçları ayrışıp hidrasyon uyuşmazlığı çıkıyor
 * (profil ve sosyal sayfalarında yaşandı, aynı desenle çözüldü).
 */
export default function ProfilYonlendir() {
  const router = useRouter()
  const { t } = useT()

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    // Girişliyse kendi profiline; değilse girişe (`redirect` — giriş sayfasının okuduğu
    // parametre adı bu; `next` DEĞİL, o /dogrula'nın adı). `replace` çünkü bu sayfa tarayıcı
    // geçmişinde bir durak olmamalı — geri tuşu kullanıcıyı buraya geri düşürmesin.
    if (token && user?.username) router.replace(`/profil/${encodeURIComponent(user.username)}`)
    else router.replace('/giris?redirect=/profil')
  }, [router])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <p style={{ color: '#999', fontSize: 14 }}>{t('common.loading')}</p>
    </div>
  )
}
