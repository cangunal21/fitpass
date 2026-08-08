'use client'

import { installAuthFetch } from '@/lib/api'

// Global auth-fetch yamasını MODÜL YÜKLENİR YÜKLENMEZ kurar (useEffect İÇİNDE DEĞİL).
// Sebep: React'te ÇOCUK bileşenlerin effect'leri parent'tan ÖNCE çalışır. Kurulumu effect'e
// koysaydık, bir sayfanın açılıştaki ilk yetkili isteği yama devreye girmeden gidebilirdi
// (tam da token'ın süresi dolmuşken yapılan o ilk istek). Modül seviyesi en erken güvenli an.
// installAuthFetch() kendi içinde SSR (window yok) ve çift-kurulum korumalı.
installAuthFetch()

export default function AuthFetchInstaller() {
  return null
}
