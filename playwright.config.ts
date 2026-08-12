import { defineConfig, devices } from '@playwright/test'

/**
 * E2E TEST YAPILANDIRMASI (task #69)
 *
 * NEDEN VAR: backend'de 167 otomatik test vardı, ARAYÜZDE SIFIR. Denetimde bulunan web
 * hatalarının çoğu (kalan-yer yerine kapasite gösterimi, saat diliminin cihazdan alınması,
 * puanlama hatasının yutulması, "onaylı" rozetinin herkese çıkması) tam olarak bu boşlukta
 * yaşıyordu: hiçbiri tip kontrolünden ya da build'den geçmezdi, çünkü hepsi ÇALIŞAN ama
 * YANLIŞ arayüz davranışıydı.
 *
 * TASARIM TERCİHİ — API MOCK'LANIR:
 * Testler gerçek backend/veritabanı ayağa kaldırmaz; `page.route` ile API yanıtları taklit
 * edilir. Sebepleri:
 *  • DETERMİNİZM — "dolu ders", "gizli profil", "check-in yapılmamış rezervasyon" gibi
 *    durumları veri kurgulayarak üretmek yerine doğrudan tanımlarız.
 *  • Test edilen KATMAN doğru olur — bu testlerin işi backend'i doğrulamak değil (onu 167
 *    smoke testi yapıyor), İSTEMCİNİN sunucudan geleni doğru yorumlayıp yorumlamadığını
 *    doğrulamak. Denetimdeki web hatalarının hepsi bu sınırdaydı.
 *  • CI'da Postgres + backend ayağa kaldırmak gerekmez → hızlı ve kırılgan değil.
 *
 * Tarayıcı: yerelde sistem Chrome'u (Playwright'ın paketlediği Chromium macOS 13'ü
 * desteklemiyor), CI'da (Ubuntu) paketlenmiş Chromium.
 */
const CI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  // YERELDE DE 1 TEKRAR: tam takım paralel koşarken Chrome zaman zaman
  // "Protocol error … session closed" ile ÇÖKÜYOR (test hatası değil, kaynak sıkışması —
  // aynı test tek başına koşunca hep geçiyor). Tekrarsız bırakmak, gerçek bir hatayla
  // tarayıcı çökmesini ayırt edilemez kılıyordu: takım kırmızı yanıyor ama sebep test değil.
  retries: 1,
  // Yerelde işçi sayısı sınırlı: varsayılan (çekirdek/2) bu makinede backend sunucuları da
  // koşarken çökmeleri tetikliyor.
  workers: CI ? 2 : 3,
  reporter: CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: 'http://localhost:3210',
    trace: 'on-first-retry',
    // Testler kendi verisini mock'ladığı için gerçek ağa çıkılmamalı; kaçak bir istek
    // olursa sessizce geçmesin diye açıkça görünür olsun.
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // CI'da paketlenmiş Chromium, yerelde sistem Chrome'u.
        ...(CI ? {} : { channel: 'chrome' }),
      },
    },
  ],

  // Testler kendi dev sunucusunu ayrı bir portta açar (3210) — geliştirirken açık olan
  // 3000'deki sunucuyu ezmez.
  webServer: {
    command: 'npm run dev -- -p 3210',
    url: 'http://localhost:3210',
    reuseExistingServer: !CI,
    timeout: 120_000,
    env: {
      // Gerçek backend'e ÇIKILMAZ; tüm /api çağrıları testlerde page.route ile karşılanır.
      // Yine de tanımlı olmalı ki istemci kodu URL kurabilsin.
      NEXT_PUBLIC_API_URL: 'http://localhost:9',
    },
  },
})
