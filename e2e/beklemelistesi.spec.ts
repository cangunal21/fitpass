import { test, expect } from '@playwright/test'
import { seans, diliAyarla } from './yardimcilar'

/**
 * BEKLEME LİSTESİ — web'de bu akış HİÇ YOKTU (parite denetimi bulgusu).
 *
 * Dolu seansta yalnız devre dışı bir "Seans Dolu" butonu vardı: kullanıcı listeye giremiyor,
 * girdiyse çıkamıyor ve zaten listede olduğunu göremediği için ana sayfadaki butona tekrar
 * basınca sunucudan "Zaten bekleme listesindesiniz." hatası yiyordu. Backend üç ucu da
 * sunuyor (POST katıl / DELETE çık / GET status), mobil üçünü de kullanıyordu.
 *
 * Bu test üç davranışı da kilitler — hiçbiri tip kontrolünden ya da build'den geçmez.
 */

const API = 'http://localhost:9'

test.use({ timezoneId: 'America/Toronto' })

async function apiKur(page: import('@playwright/test').Page, opts: { baslangictaListede: boolean }) {
  let listede = opts.baslangictaListede
  const json = (route: import('@playwright/test').Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(`${API}/**`, async (route) => {
    const p = new URL(route.request().url()).pathname
    const m = route.request().method()

    // DOLU seans (spotsLeft = 0)
    if (p.startsWith('/api/public/sessions/')) return json(route, { session: seans({ spotsLeft: 0, availableSpots: 0 }) })
    if (p === '/api/public/categories') return json(route, { categories: [] })
    if (p === '/api/public/neighborhoods') return json(route, { neighborhoods: [] })
    if (p === '/api/public/cities') return json(route, { cities: [] })

    if (p.endsWith('/status')) return json(route, { onWaitlist: listede })
    if (p.startsWith('/api/waitlist/sessions/')) {
      if (m === 'POST') { listede = true; return json(route, { ok: true }) }
      if (m === 'DELETE') { listede = false; return json(route, { ok: true }) }
    }
    return json(route, {}, 404)
  })

  // Girişli kullanıcı: waitlist uçları jeton istiyor
  await page.addInitScript(() => {
    localStorage.setItem('fitpass_token', 'test-token')
    localStorage.setItem('fitpass_user', JSON.stringify({ id: 1, username: 'testci', email: 't@x.com', fullName: 'Test' }))
  })
}

test.describe('Dolu seansta bekleme listesi', () => {
  test('dolu seansta "Katıl" görünür ve tıklayınca listeye girilir', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { baslangictaListede: false })
    await page.goto('/ders/501')

    const katil = page.getByRole('button', { name: /Bekleme Listesine Katıl/i })
    await expect(katil).toBeVisible()
    await katil.click()

    // Artık "Çık" olmalı — kullanıcı listede olduğunu GÖRMELİ
    await expect(page.getByRole('button', { name: /Bekleme Listesinden Çık/i })).toBeVisible()
    await expect(page.getByText(/Bekleme listesindesin/i)).toBeVisible()
  })

  test('ZATEN listedeyse sayfa açılır açılmaz "Çık" gösterir', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { baslangictaListede: true })
    await page.goto('/ders/501')

    // Durum sorgusu olmasaydı "Katıl" görünür, kullanıcı basıp hata alırdı.
    await expect(page.getByRole('button', { name: /Bekleme Listesinden Çık/i })).toBeVisible()
  })

  test('listeden ÇIKILABİLİR (backend ucu vardı ama web hiç kullanmıyordu)', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { baslangictaListede: true })
    await page.goto('/ders/501')

    await page.getByRole('button', { name: /Bekleme Listesinden Çık/i }).click()
    await expect(page.getByRole('button', { name: /Bekleme Listesine Katıl/i })).toBeVisible()
  })
})
