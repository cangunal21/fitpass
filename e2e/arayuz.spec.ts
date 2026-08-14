import { test, expect } from '@playwright/test'
import { apiKur, seans, salon, diliAyarla } from './yardimcilar'

/**
 * ARAYÜZ REGRESYON TESTLERİ
 *
 * Buradaki her test, 10-11 Ağustos 2026 denetiminde bulunmuş GERÇEK bir web hatasına karşılık
 * gelir. Hepsinin ortak özelliği: tip kontrolünden de build'den de geçiyorlardı, çünkü hiçbiri
 * "derlenmiyor" değildi — hepsi ÇALIŞAN ama YANLIŞ arayüz davranışıydı. Bu yüzden ancak
 * tarayıcıda görülebiliyorlardı.
 *
 * Cihaz saat dilimi TORONTO'ya sabitlenmiştir. Bu tesadüf değil: saat dilimi hatası tam olarak
 * "kullanıcı İstanbul dışındayken" ortaya çıkıyordu ve CI koşucusu UTC olduğu için sabitlemezsek
 * test hatayı yakalayamazdı.
 */
test.use({ timezoneId: 'America/Toronto' })

test.describe('Kapasite / kalan yer', () => {
  test('ders kartı KALAN yeri gösterir, kapasiteyi değil', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // Kapasite 10, kalan 2 → kart "2" demeli. Eski hata: availableSpots (=kapasite) basılıyordu.
    await apiKur(page, { sessions: [seans({ spotsLeft: 2, availableSpots: 2, capacity: 10 })] })
    await page.goto('/')

    const kart = page.locator('text=Sabah Yogası').first()
    await expect(kart).toBeVisible()
    // "Son 2 yer" rozeti (spots <= 3) — kapasite basılsaydı 10 olurdu ve rozet HİÇ çıkmazdı.
    await expect(page.getByText(/Son 2 yer|2 yer kaldı/).first()).toBeVisible()
    await expect(page.getByText(/10 yer kaldı/)).toHaveCount(0)
  })

  /**
   * GÜNCELLENDİ (13 Ağu 2026) — testin ESKİ hâli devre dışı bir "Seans Dolu" butonu bekliyordu.
   * O buton kaldırıldı: dolu seans artık çıkmaz sokak değil, BEKLEME LİSTESİ sunuyor (mobilde
   * zaten böyleydi; parite denetimi web'deki eksiği buldu). Testin ASIL amacı korunuyor:
   *   • dolu seansta rezervasyon TEKLİF EDİLMEMELİ
   *   • "0 yer kaldı" uyarısı ÇIKMAMALI (kalan yer gerçekten 0 olabildiği için anlamsızdı)
   * Bekleme listesi akışının kendi testi ayrı: e2e/beklemelistesi.spec.ts
   */
  test('dolu seansta rezervasyon teklif edilmez, "0 yer kaldı" uyarısı çıkmaz', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { session: seans({ spotsLeft: 0, availableSpots: 0, capacity: 10 }) })
    await page.goto('/ders/501')

    // Rezervasyon butonu HİÇ olmamalı (eskiden "kapalı buton" olarak duruyordu)
    await expect(page.getByRole('button', { name: /Hemen Rezervasyon|Rezervasyon Yap/i })).toHaveCount(0)
    // Yerine bekleme listesi teklif edilmeli
    await expect(page.getByRole('button', { name: /Bekleme Listesine Katıl/i })).toBeVisible()
    await expect(page.getByText(/0 yer kaldı/)).toHaveCount(0)
  })

  test('"Kapasite" kutusu toplam kapasiteyi gösterir (kalan yeri değil)', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { session: seans({ spotsLeft: 6, capacity: 10 }) })
    await page.goto('/ders/501')
    // Etiket "Kontenjan", değer "10 kişi" olmalı. Eski hata: değer kalan yeri (6) gösteriyordu.
    await expect(page.getByText('10 kişi')).toBeVisible()
  })
})

test.describe('Saat dilimi', () => {
  test('ders saati cihaz diliminden BAĞIMSIZ, hep İstanbul saati', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // 16:00Z = İstanbul 19:00. Cihaz Toronto (UTC-4) → eski kod "12:00" gösteriyordu.
    await apiKur(page, { session: seans({ startsAt: '2030-08-12T16:00:00.000Z' }) })
    await page.goto('/ders/501')

    await expect(page.getByText('19:00').first()).toBeVisible()
    await expect(page.getByText('12:00')).toHaveCount(0)
  })

  test('gece yarısına yakın seansta TARİH bir gün geriye kaymaz', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // 21:30Z = İstanbul 13 Ağustos 00:30. Toronto'da aynı an 12 Ağustos 17:30 →
    // eski kod hem günü hem saati yanlış gösteriyordu.
    await apiKur(page, { session: seans({ startsAt: '2030-08-12T21:30:00.000Z' }) })
    await page.goto('/ders/501')

    await expect(page.getByText('00:30').first()).toBeVisible()
    await expect(page.getByText(/13 Ağustos/).first()).toBeVisible()
    await expect(page.getByText(/12 Ağustos/)).toHaveCount(0)
  })
})

test.describe('Dil', () => {
  test('EN arayüzde <html lang> gerçekten "en" olur', async ({ page }) => {
    await diliAyarla(page, 'en')
    await apiKur(page)
    await page.goto('/')
    // lang "tr" kalırsa tarayıcı İngilizce metne TÜRKÇE büyük-harf kuralı uygular
    // (TIME → TİME) ve ekran okuyucular metni Türkçe telaffuz eder.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('TR arayüzde <html lang> "tr" olur', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page)
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
  })
})

test.describe('Salon doğrulanmışlık rozeti', () => {
  test('doğrulanmamış salonda rozet ÇIKMAZ', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // isApproved=true ama isVerified=false. Eski hata: rozet isApproved'dan türetiliyordu ve
    // uç zaten yalnız onaylı salon döndürdüğü için rozet HER salonda çıkıyordu.
    await apiKur(page, { venue: salon({ isApproved: true, isVerified: false }) })
    await page.goto('/venue/301')

    await expect(page.getByText('Test Salonu').first()).toBeVisible()
    await expect(page.getByText(/Onaylı|Verified/)).toHaveCount(0)
  })

  test('doğrulanmış salonda rozet ÇIKAR', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, { venue: salon({ isVerified: true }) })
    await page.goto('/venue/301')
    await expect(page.getByText(/Onaylı/).first()).toBeVisible()
  })
})

test.describe('Özel drop-in maçı', () => {
  test('kodsuz link sonsuz iskelet yerine kod ekranı gösterir', async ({ page }) => {
    await diliAyarla(page, 'tr')
    // Sunucu özel slotta kodsuz isteğe 404 döner. Eski hata: istemci boş mock dizisine
    // düşüp TypeError atıyor, sayfa kalıcı gri iskelette kilitleniyordu.
    await apiKur(page, { dropInSlot: { status: 404, body: { error: 'Slot bulunamadı.' } } })
    await page.goto('/dropin/42')

    await expect(page.getByText('Bu özel bir maç')).toBeVisible()
    await expect(page.getByPlaceholder('Davet kodu')).toBeVisible()
  })

  test('URL\'de kod varsa maç doğrudan açılır', async ({ page }) => {
    await diliAyarla(page, 'tr')
    await apiKur(page, {
      dropInSlot: {
        status: 200,
        body: {
          slot: {
            id: 42, title: 'Özel Halı Saha', startsAt: '2030-08-12T16:00:00.000Z',
            endsAt: '2030-08-12T17:00:00.000Z', format: '5v5', totalPlayers: 10,
            currentPlayers: 0, totalPrice: 500, pricePerPerson: 50, status: 'open',
            venue: { id: 301, name: 'Test Salonu', address: 'A' },
            sportCategory: { name: 'Halı Saha', colorHex: '#16A34A', iconUrl: 'football' },
            participants: [],
          },
        },
      },
    })
    await page.goto('/dropin/42?code=GIZLI42')

    await expect(page.getByText('Özel Halı Saha')).toBeVisible()
    await expect(page.getByText('Bu özel bir maç')).toHaveCount(0)
  })
})
