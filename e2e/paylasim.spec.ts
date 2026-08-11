import { test, expect } from '@playwright/test'
import { diliAyarla } from './yardimcilar'

/**
 * PAYLAŞIM GÖRSELİ (task #34)
 *
 * Aktivite takvimi eskiden yalnız METİN+link paylaşıyordu; Instagram story'ye atılabilir bir
 * şey yoktu. Artık story ölçüsünde (1080×1920) bir kart çizilip DOSYA olarak paylaşılıyor.
 *
 * Paylaşım sayfasının kendisi işletim sistemi diyaloğudur, otomatikleştirilemez. Bu yüzden
 * `navigator.share`/`canShare` sayfa bağlamında değiştirilip GÖNDERİLEN DOSYA yakalanıyor:
 * gerçekten PNG mi, story ölçüsünde mi, boş/tek renk mi — hepsi ölçülüyor.
 */
test.use({ timezoneId: 'America/Toronto' })

const API = 'http://localhost:9'

test('takvim paylaşımı 1080×1920 gerçek bir PNG üretir ve dosya olarak paylaşır', async ({ page }) => {
  await diliAyarla(page, 'tr')

  // Giriş yapılmış kullanıcı — takvim yalnız KENDİ profilinde render ediliyor.
  await page.addInitScript(() => {
    localStorage.setItem('fitpass_token', 'test-token')
    localStorage.setItem('fitpass_user', JSON.stringify({ id: 1, username: 'testci', fullName: 'Testçi', email: 't@x.com' }))
  })

  // navigator.share'i YAKALA: OS diyaloğu açılmasın, gönderilen dosyayı okuyalım.
  await page.addInitScript(() => {
    const w = window as unknown as { __paylasilan?: { ad: string; tip: string; b64: string } }
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
    nav.canShare = () => true
    // @ts-expect-error test amaçlı override
    nav.share = async (data: { files?: File[] }) => {
      const f = data.files?.[0]
      if (!f) throw new Error('dosya yok')
      const buf = await f.arrayBuffer()
      let s = ''
      const bytes = new Uint8Array(buf)
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
      w.__paylasilan = { ad: f.name, tip: f.type, b64: btoa(s) }
    }
  })

  await page.route(`${API}/**`, async (route) => {
    const p = new URL(route.request().url()).pathname
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (p === '/api/auth/me') {
      return json({ user: { id: 1, username: 'testci', fullName: 'Testçi', email: 't@x.com', rewardPoints: 0, totalLessonsCompleted: 3, badges: [], tier: null, recordStreak: 2 } })
    }
    if (p === '/api/social/my-calendar') {
      // Aktiviteler İÇİNDE BULUNULAN aya konur: takvim varsayılan olarak bu ayı açar, başka
      // bir aya yazarsak görselde hiçbir gün dolu çıkmaz ve test aslında boş bir kart
      // doğrulamış olur (ilk denemede tam olarak bu oldu — sabit 2030 tarihleri yüzünden
      // "Bu ay 0 aktivite" çıktı ve fark edilmedi).
      const buAy = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }).slice(0, 7)
      return json({
        activities: [1, 2, 3, 6, 7].map(g => ({
          date: `${buAy}-${String(g).padStart(2, '0')}`, category: 'Yoga', title: 'Ders',
        })),
        dailyStreak: 4,
        weeklyStreak: 2,
      })
    }
    if (p === '/api/bookings/my') return json({ bookings: [] })
    return json({}, 200)
  })

  await page.goto('/profil/testci')

  // Takvim sekmesine geç
  await page.getByRole('button', { name: /Takvim/i }).first().click()

  // VERİ YOLU DOĞRULAMASI: görsel bu sayıdan besleniyor. Boş çıkarsa aşağıdaki PNG
  // kontrolleri yine geçerdi (geçerli ama BOŞ bir kart) — o yüzden önce bunu sabitliyoruz.
  await expect(page.getByText('Bu ay 5 aktivite')).toBeVisible()

  const paylasButonu = page.getByRole('button', { name: /Paylaş/i }).first()
  await expect(paylasButonu).toBeVisible()
  await paylasButonu.click()

  // Görsel üretimi + paylaşım tamamlanana kadar bekle
  await expect.poll(
    async () => await page.evaluate(() => (window as unknown as { __paylasilan?: unknown }).__paylasilan ?? null),
    { timeout: 15_000 },
  ).not.toBeNull()

  const pay = await page.evaluate(() => (window as unknown as { __paylasilan: { ad: string; tip: string; b64: string } }).__paylasilan)

  expect(pay.tip).toBe('image/png')
  expect(pay.ad).toMatch(/\.png$/)

  const buf = Buffer.from(pay.b64, 'base64')
  // PNG imzası
  expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  // PNG başlığındaki genişlik/yükseklik (IHDR: 16-24. baytlar) — story ölçüsü olmalı
  expect(buf.readUInt32BE(16)).toBe(1080)
  expect(buf.readUInt32BE(20)).toBe(1920)
  // Boş/tek renk bir görsel değil: 1080×1920 gerçek içerik ~100KB'ın üzerinde olur.
  expect(buf.byteLength).toBeGreaterThan(20_000)
})
