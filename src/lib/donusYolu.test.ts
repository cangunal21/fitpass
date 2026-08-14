import { describe, it, expect } from 'vitest'
import { guvenliDonusYolu } from './donusYolu'

/**
 * AÇIK YÖNLENDİRME KORUMASI
 *
 * `/dogrula?next=...` desteği eklenirken bu süzgeç yazıldı. Sınanan şey bir "olsa iyi olur"
 * değil: süzgeç olmadan saldırgan, BİZİM alan adımızla başlayan bir bağlantı dağıtıp
 * kullanıcıyı kendi sitesine yollayabilir. Bağlantı güvenilir göründüğü için klasik bir
 * kimlik avı vektörüdür.
 *
 * Not: kabul edilen yolların da sınanması şart — süzgeç fazla katı olursa özellik sessizce
 * ölür (herkes ana sayfaya düşer) ve kimse fark etmez.
 */
describe('guvenliDonusYolu', () => {
  it('site içi yolları KABUL eder', () => {
    expect(guvenliDonusYolu('/ders/777')).toBe('/ders/777')
    expect(guvenliDonusYolu('/venue/301')).toBe('/venue/301')
    expect(guvenliDonusYolu('/profil/testci?sekme=rezervasyonlar')).toBe('/profil/testci?sekme=rezervasyonlar')
    expect(guvenliDonusYolu('/')).toBe('/')
  })

  it('protokol-göreli MUTLAK adresi reddeder (asıl saldırı)', () => {
    // `//kotu-site.com` tarayıcıda https://kotu-site.com'a çözümlenir — `/` ile başladığı için
    // naif bir "yol mu?" kontrolünden GEÇER. Bu testin asıl sebebi bu.
    expect(guvenliDonusYolu('//kotu-site.com')).toBe('/')
    expect(guvenliDonusYolu('//kotu-site.com/giris')).toBe('/')
  })

  it('mutlak adresleri reddeder', () => {
    expect(guvenliDonusYolu('https://kotu-site.com')).toBe('/')
    expect(guvenliDonusYolu('http://kotu-site.com')).toBe('/')
    expect(guvenliDonusYolu('javascript:alert(1)')).toBe('/')
  })

  it('ters eğik çizgiyle gizlenmiş adresleri reddeder', () => {
    // Bazı tarayıcılar `\` karakterini `/` gibi çözümlüyor; `/\kotu.com` protokol-göreli olur.
    expect(guvenliDonusYolu('/\\kotu-site.com')).toBe('/')
    expect(guvenliDonusYolu('\\\\kotu-site.com')).toBe('/')
  })

  it('kontrol karakteri içeren yolu reddeder', () => {
    // Tarayıcılar satır sonu/sekmeyi ayıklayıp geriye kalanı adres sanabiliyor.
    expect(guvenliDonusYolu('/\n/kotu-site.com')).toBe('/')
    expect(guvenliDonusYolu('/\t/kotu-site.com')).toBe('/')
  })

  it('boş/eksik girdide varsayılana döner', () => {
    expect(guvenliDonusYolu(null)).toBe('/')
    expect(guvenliDonusYolu(undefined)).toBe('/')
    expect(guvenliDonusYolu('')).toBe('/')
  })

  it('çağıran kendi varsayılanını verebilir', () => {
    expect(guvenliDonusYolu('//kotu.com', '/profil')).toBe('/profil')
  })
})
