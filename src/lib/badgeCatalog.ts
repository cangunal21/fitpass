// Tüm rozet kataloğu — "nasıl kazanılır" gösterimi için (kilitli/açık). İki dilli [TR, EN].
// lib/ i18n taramasının dışında olduğundan Türkçe metinler burada tutulur.
export const BADGE_CATALOG: { iconUrl?: string; special?: string; name: [string, string]; crit: [string, string] }[] = [
  { iconUrl: 'Flag', name: ['İlk adım', 'First step'], crit: ['İlk dersini tamamla', 'Complete your first class'] },
  { iconUrl: 'Target', name: ['Düzenli', 'Regular'], crit: ['Bir sezonda 10 derse ulaş', 'Reach 10 classes in a season'] },
  { special: 'streak', name: ['Rekor seri', 'Record streak'], crit: ['3+ gün üst üste git — rekorun gösterilir', 'Go 3+ days in a row'] },
  { iconUrl: 'Compass', name: ['Çok yönlü', 'Versatile'], crit: ['3 farklı spor dalına git', 'Try 3 different sports'] },
  { iconUrl: 'Heart', name: ['Sadık sporcu', 'Loyal athlete'], crit: ['Aynı salona 5 kez git', 'Visit the same venue 5 times'] },
  { iconUrl: 'Users', name: ['Takım oyuncusu', 'Team player'], crit: ['3 kez arkadaş etiketleyerek git', 'Attend 3 times tagging a friend'] },
  { iconUrl: 'sport', name: ['Spor ustası', 'Sport master'], crit: ['Bir spor dalında 40 ders yap', 'Do 40 classes in one sport'] },
  { iconUrl: 'Crown', name: ['Kurucu', 'Founder'], crit: ['İlk 500 üyeden biri ol + ilk dersini yap', 'First 500 members + first class'] },
  { iconUrl: 'Speakerphone', name: ['Elçi', 'Ambassador'], crit: ['3 davetini tamamla', 'Complete 3 referrals'] },
  { iconUrl: 'Trophy', name: ['Olimpik', 'Olympic'], crit: ['Olimpik seviyeye ulaş', 'Reach the Olympic tier'] },
  { iconUrl: 'champion', name: ['Sezon şampiyonu', 'Season champion'], crit: ['Bir sezonda ilinde/ilçende bir sporda ilk 3’e gir', 'Top 3 in your city/district in a sport'] },
]
