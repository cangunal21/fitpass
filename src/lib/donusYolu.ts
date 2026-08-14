/**
 * `?next=` DÖNÜŞ YOLU SÜZGECİ — AÇIK YÖNLENDİRME (open redirect) KORUMASI
 * ============================================================================================
 * Bir sayfa kullanıcıyı "geldiği yere" geri göndermek için adres çubuğundan bir yol okuyorsa,
 * o değer SALDIRGAN KONTROLÜNDEDİR. Süzgeçsiz bırakılırsa saldırgan
 *
 *     https://sipsakspor.com/dogrula?next=//kotu-site.com
 *
 * gibi bir bağlantı dağıtıp kullanıcıyı KENDİ sitesine yollayabilir — üstelik bağlantı bizim
 * alan adımızla başladığı için güvenilir görünür. Klasik kimlik avı vektörü.
 *
 * KURAL: yalnız `/` ile BAŞLAYAN ve `//` ile BAŞLAMAYAN yollar kabul edilir.
 *   · `/ders/777`        ✓ site içi
 *   · `//kotu-site.com`  ✗ protokol-göreli MUTLAK adres — tarayıcı bunu dış siteye çevirir
 *   · `https://...`      ✗ mutlak adres
 *   · `\\/kotu.com`      ✗ bazı tarayıcılar ters eğik çizgiyi eğik çizgi gibi çözümlüyor
 *
 * Bu fonksiyon TEK YERDE durur: `?next=` destekleyen her sayfa bunu kullanmalı, kendi
 * kontrolünü yazmamalı. Kopyalanan her kontrol bir sürüklenme kaynağıdır ve güvenlik
 * kontrollerinde sürüklenmenin bedeli daha ağırdır.
 */
export function guvenliDonusYolu(ham: string | null | undefined, varsayilan = '/'): string {
  if (!ham) return varsayilan
  // Ters eğik çizgiyi eğik çizgi sayarak değerlendir: `/\kotu.com` ve `\\kotu.com` gibi
  // biçimler bazı tarayıcılarda protokol-göreli adres gibi çözümleniyor.
  const normal = ham.replace(/\\/g, '/')
  if (!normal.startsWith('/')) return varsayilan
  if (normal.startsWith('//')) return varsayilan
  // Kontrol karakteri içeren yol (satır sonu, sekme vb.) — tarayıcılar bunları ayıklayıp
  // geriye kalanı adres sanabiliyor.
  if (/[\u0000-\u001F\u007F]/.test(normal)) return varsayilan
  return normal
}
