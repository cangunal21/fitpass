import { test, expect } from '@playwright/test'
import { apiKur, salon, salonDersi, diliAyarla } from './yardimcilar'

/**
 * SALON SAYFASI — DERS KARTLARI VE PUAN ÖZETİ
 *
 * Bulgu (14 Ağu 2026, API sözleşmesi denetimi): salon sayfasındaki GERÇEK ders kartları
 * linksizdi. `cursor: 'default'` idi ama `onMouseEnter/onMouseLeave` hover efekti çalışıyordu —
 * yani kart TIKLANABİLİR GÖRÜNÜP hiçbir şey yapmıyordu. Kullanıcı dersi fiyatıyla, kalan
 * yeriyle ve bir sonraki seans tarihiyle görüyor (tam satın alma niyeti anı) ve tıklayınca
 * hiçbir şey olmuyordu: salon → rezervasyon hunisi web'de çıkmaz sokaktı.
 *
 * Sunucu gerekli veriyi ZATEN gönderiyordu (`classes[].sessions[].id`) ve MOBİL bunu
 * kullanıyordu (VenueDetailScreen → navigate('ClassDetail', { id: ilkSeans.id })). Yani
 * bu, ikizi düzeltilmemiş bir kusurdu — bu projede defalarca tekrarlanan sınıf.
 *
 * Aynı sayfadaki ikinci bulgu: yorumlar sekmesindeki puan özeti UYDURMAYDI (sabit beş dolu
 * yıldız + sabit %75/%18/%5 çubukları). Artık dağılım sunucudan geliyor.
 */

test.describe('Salon sayfası — ders kartları', () => {
  test('yaklaşan seansı olan ders kartı SEANSA link verir', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { venue: salon({ classes: [salonDersi()] }) })
    await page.goto('/venue/301')

    await expect(page.getByText('Sabah Yogası').first()).toBeVisible()

    // Kart bir link OLMALI ve hedefi SEANS id'si (777) olmalı — ders id'si (9) DEĞİL.
    const link = page.locator('a[href="/ders/777"]')
    await expect(link).toBeVisible()
    await expect(link).toContainText('Sabah Yogası')

    // Ders id'sine link verilmiş olmamalı: o sayfa getSessionById çağırıyor, yanlış kayıt açardı.
    await expect(page.locator('a[href="/ders/9"]')).toHaveCount(0)
  })

  test('yaklaşan seansı OLMAYAN ders tıklanamaz ve bunu söyler', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { venue: salon({ classes: [salonDersi({ sessions: [] })] }) })
    await page.goto('/venue/301')

    await expect(page.getByText('Sabah Yogası').first()).toBeVisible()
    // Hiçbir /ders/ linki olmamalı — seans yokken gidilecek yer yok.
    await expect(page.locator('a[href^="/ders/"]')).toHaveCount(0)
    await expect(page.getByText('Yaklaşan seans yok')).toBeVisible()
  })
})

test.describe('Salon sayfası — puan özeti', () => {
  test('yorumu olmayan salonda puan özeti HİÇ çizilmez', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // avgRating: 0 "puan yok" demektir — "sıfır puan aldı" DEĞİL. Eskiden bu durumda da
    // kocaman bir "0" ve altında beş ALTIN yıldız çiziliyordu.
    await apiKur(page, {
      venue: salon({ avgRating: 0, totalReviews: 0, classes: [] }),
      yorumlar: { reviews: [], avgRating: 0, totalReviews: 0, ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } },
    })
    await page.goto('/venue/301')
    await page.getByRole('button', { name: /Yorumlar/ }).click()

    // Özet kutusu hiç çizilmemeli. (Metinle aramak yetmez: yıldızlar beş ayrı span ve
    // kapsayıcının metni yine "★★★★★" okunur.)
    await expect(page.getByTestId('puan-ozeti')).toHaveCount(0)
  })

  test('yorumu olan salonda dağılım GERÇEK sayılarla çizilir (sabit oran değil)', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // Mock dağılım: 5★=6, 4★=4, 3★=1, 2★=1, 1★=0 → toplam 12.
    // Sabit kodlu eski hâlde 5★ çubuğu HER ZAMAN %75, 4★ %18, gerisi %5'ti.
    await apiKur(page, { venue: salon({ avgRating: 4.2, totalReviews: 12 }) })
    await page.goto('/venue/301')
    await page.getByRole('button', { name: /Yorumlar/ }).click()

    await expect(page.getByTestId('puan-ozeti')).toBeVisible()

    // YILDIZLAR PUANA GÖRE: avgRating 4.2 → 4 dolu, 1 boş. Eskiden `★★★★★` SABİT kodluydu ve
    // puanı 2.1 olan salon da beş dolu altın yıldız gösteriyordu.
    await expect(page.locator('[data-testid="yildiz"][data-dolu="1"]')).toHaveCount(4)
    await expect(page.locator('[data-testid="yildiz"][data-dolu="0"]')).toHaveCount(1)

    // Her yıldız satırının yanında GERÇEK sayı yazmalı — dağılımın veriden geldiğinin kanıtı.
    // Sabit oranlı eski hâlde hiçbir sayı çizilmiyordu.
    const ozet = page.getByTestId('puan-ozeti')
    await expect(ozet.getByText('6', { exact: true })).toBeVisible()
    await expect(ozet.getByText('1', { exact: true }).first()).toBeVisible()
  })
})
