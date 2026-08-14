import { test, expect } from '@playwright/test'
import { diliAyarla } from './yardimcilar'

/**
 * ONAYLI GİZLİLİK MODELİ — İKİ AYARIN FARKI (kullanıcı kararı, Instagram mantığı)
 *
 * İki bağımsız ayar var ve karıştırılmaları KULLANICI KARARINI bozar:
 *   • activityPrivacy = private → YALNIZ gidilen dersler/takvim gizlenir.
 *     Rozet, tier ve istatistik HERKESE AÇIK kalır.
 *   • profilePrivacy  = private → her şey kapanır; yabancı sadece kimlik + "gizli hesap" görür.
 *
 * WEB BUNU İHLAL EDİYORDU: iki bayrağı aynı kefeye koyup (`isPrivate || isProfilePrivate`)
 * aktivitesini gizleyen kullanıcının ROZETLERİNİ de saklıyordu. Mobil doğru davranıyordu ve
 * sunucu da aktivite-gizli dalında rozetleri BİLEREK gönderiyor. Web/mobil parite denetiminde
 * bulundu.
 *
 * Bu test kuralı kilitler: bir daha "gizlilik sızıntısı" sanılıp geri alınmasın.
 */

const API = 'http://localhost:9'

test.use({ timezoneId: 'America/Toronto' })

function kullanici(over: Record<string, unknown> = {}) {
  return {
    id: 77,
    username: 'testci',
    fullName: 'Test Kullanıcı',
    avatarUrl: null,
    totalLessonsCompleted: 12,
    recordStreak: 4,
    tier: { name: 'Sporcu', pointRate: 2, colorHex: '#4F46E5', iconUrl: null },
    badges: [{ id: 1, badge: { name: 'İlk Ders', iconUrl: 'Flag', description: 'İlk dersini tamamladın' } }],
    ...over,
  }
}

async function apiKur(page: import('@playwright/test').Page, aktivite: Record<string, unknown>) {
  const json = (route: import('@playwright/test').Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(`${API}/**`, async (route) => {
    const p = new URL(route.request().url()).pathname
    if (p.startsWith('/api/public/users/')) return json(route, aktivite)
    if (p === '/api/public/categories') return json(route, { categories: [] })
    if (p === '/api/public/neighborhoods') return json(route, { neighborhoods: [] })
    if (p === '/api/public/cities') return json(route, { cities: [] })
    if (p.startsWith('/api/social/followers') || p.startsWith('/api/social/following')) return json(route, { followers: [], following: [] })
    return json(route, {}, 404)
  })
}

test.describe('Gizlilik: aktivite-gizli ile profil-gizli AYNI ŞEY DEĞİL', () => {
  test('aktivitesi gizli kullanıcının ROZETLERİ GÖRÜNÜR (aktivite gizli kalır)', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // Sunucunun aktivite-gizli dalı: TAM user (rozetler dahil) + activities:null + isPrivate
    await apiKur(page, { user: kullanici(), activities: null, isPrivate: true })
    await page.goto('/profil/testci')

    // ROZET BÖLÜMÜ AÇIK olmalı — kullanıcının onayladığı kural bu
    await expect(page.getByRole('heading', { name: /Rozet/i })).toBeVisible()
    // ...ama aktivite listesi GİZLİ kalmalı
    await expect(page.getByText(/Aktiviteleri gizli|gizli/i).first()).toBeVisible()
  })

  test('profili gizli kullanıcıda rozetler de GİZLİ', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // Sunucunun profil-gizli dalı: yalnız kimlik alanları döner
    await apiKur(page, {
      user: { id: 77, username: 'testci', fullName: 'Test Kullanıcı', avatarUrl: null, profilePrivacy: 'private' },
      activities: null,
      isProfilePrivate: true,
    })
    await page.goto('/profil/testci')

    await expect(page.getByText('Bu hesap gizli')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Rozet/i })).toHaveCount(0)
  })
})
