import { test, expect } from '@playwright/test'
import { diliAyarla } from './yardimcilar'

/**
 * KAYIT AKIŞI — 6 HANELİ E-POSTA DOĞRULAMA KODU
 *
 * Kullanıcı kararı (12 Ağu 2026): doğrulama linki yerine kod. Backend tarafı smoke'ta
 * ("Kayıt: e-posta doğrulama kodu…") ayrıca sınanıyor; burada İSTEMCİNİN sözleşmeyi doğru
 * yorumlayıp yorumlamadığı test ediliyor:
 *   • kayıt yanıtındaki `requiresEmailVerification` bayrağı kod ekranını AÇIYOR mu,
 *   • 6. hane girilince istek KENDİLİĞİNDEN gidiyor mu,
 *   • yanlış kodda kullanıcı ekranda KALIYOR ve hatayı görüyor mu,
 *   • doğru kodda ana sayfaya geçiliyor mu.
 * Bu dört davranışın hiçbiri tip kontrolünden ya da build'den geçmez — tam olarak
 * e2e'nin var oluş sebebi.
 */

const API = 'http://localhost:9'

test.use({ timezoneId: 'America/Toronto' })

async function apiKur(page: import('@playwright/test').Page, opts: { dogruKod: string }) {
  const json = (route: import('@playwright/test').Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(`${API}/**`, async (route) => {
    const p = new URL(route.request().url()).pathname

    if (p === '/api/public/categories') return json(route, { categories: [{ id: 1, name: 'Yoga', colorHex: '#C4A882', iconUrl: null }] })
    if (p === '/api/public/neighborhoods') return json(route, { neighborhoods: [{ id: 1, name: 'Kadıköy' }] })

    if (p === '/api/auth/register') {
      return json(route, {
        message: 'Kayıt alındı!',
        token: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: { id: 1, username: 'testci', email: 'testci@ornek.com', fullName: 'Test Kullanıcı' },
        emailVerificationSent: true,
        requiresEmailVerification: true,
      }, 201)
    }

    if (p === '/api/auth/verify-code') {
      const govde = JSON.parse(route.request().postData() || '{}')
      if (govde.code === opts.dogruKod) return json(route, { message: 'E-posta doğrulandı!', verified: true })
      return json(route, { error: 'Kod hatalı. Lütfen e-postandaki 6 haneli kodu kontrol et.', reason: 'gecersiz' }, 400)
    }

    // Doğrulamadan sonra ana sayfa açılıyor; oradaki uçlar boş dönebilir.
    if (p === '/api/public/sessions') return json(route, { sessions: [], total: 0, page: 1, pageSize: 24, hasMore: false })
    if (p === '/api/public/cities') return json(route, { cities: [{ id: 1, name: 'İstanbul' }] })
    if (p === '/api/public/for-you') return json(route, { sessions: [] })
    if (p === '/api/public/venues-list' || p === '/api/public/venues') return json(route, { venues: [] })

    return json(route, { error: `mock'lanmamış uç: ${p}` }, 404)
  })
}

async function formuDoldur(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('Adın Soyadın').fill('Test Kullanıcı')
  await page.getByPlaceholder('kullaniciadi').fill('testci')
  await page.locator('input[name="email"]').fill('testci@ornek.com')
  await page.locator('input[name="password"]').fill('Parola12345')
  await page.locator('input[name="passwordConfirm"]').fill('Parola12345')
  await page.getByRole('button', { name: /^Kayıt Ol$/ }).click()
}

test.describe('Kayıt — e-posta doğrulama kodu', () => {
  test('kayıttan sonra kod ekranı açılır ve e-posta adresi gösterilir', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { dogruKod: '135790' })
    await page.goto('/kayit')
    await formuDoldur(page)

    // Kod ekranı: başlık + kullanıcının adresi görünmeli (yanlış adrese kayıt olan fark etsin)
    await expect(page.getByRole('heading', { name: /E-postanı doğrula/i })).toBeVisible()
    await expect(page.getByText('testci@ornek.com')).toBeVisible()
    // Ana sayfaya GEÇMEMELİ — kayıt henüz tamamlanmadı
    await expect(page).toHaveURL(/\/kayit/)
  })

  test('yanlış kod: kullanıcı ekranda kalır ve hatayı görür', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { dogruKod: '135790' })
    await page.goto('/kayit')
    await formuDoldur(page)

    // 6. hane girilince istek KENDİLİĞİNDEN gider (kullanıcı ayrıca butona basmak zorunda değil)
    await page.getByPlaceholder('000000').fill('111111')
    await expect(page.getByText(/Kod hatalı/i)).toBeVisible()
    await expect(page).toHaveURL(/\/kayit/)
    // Alan temizlenmeli ki kullanıcı silmeden yeniden yazabilsin
    await expect(page.getByPlaceholder('000000')).toHaveValue('')
  })

  test('doğru kod: hesap açılır ve ana sayfaya geçilir', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { dogruKod: '135790' })
    await page.goto('/kayit')
    await formuDoldur(page)

    await page.getByPlaceholder('000000').fill('135790')
    await expect(page).toHaveURL(/localhost:3210\/$/)
  })
})
