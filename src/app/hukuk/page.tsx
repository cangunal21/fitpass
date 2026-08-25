import Link from 'next/link'
import type { Metadata } from 'next'
import { HUKUK_BELGELERI, type HukukKitle } from '@/lib/hukuk/belgeler.generated'

export const metadata: Metadata = {
  title: 'Yasal belgeler — şipşakspor',
  description: 'şipşakspor sözleşmeleri, gizlilik politikası ve platform kuralları.',
}

const GRUPLAR: { kitle: HukukKitle; baslik: string; aciklama: string }[] = [
  { kitle: 'herkes', baslik: 'Herkes için', aciklama: 'Platformu kullanan herkesi ilgilendiren metinler.' },
  { kitle: 'uye', baslik: 'Üyeler için', aciklama: 'Ders rezervasyonu yapan üyeleri ilgilendiren metinler.' },
  { kitle: 'salon', baslik: 'Salonlar için', aciklama: 'Platformda ders sunan salon ve tesisleri ilgilendiren metinler.' },
  { kitle: 'egitmen', baslik: 'Eğitmenler için', aciklama: 'Platformda ders veren eğitmenleri ilgilendiren metinler.' },
]

export default function YasalBelgeler() {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 72px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>Yasal belgeler</h1>
      <p style={{ fontSize: 14.5, color: '#666', lineHeight: 1.7, margin: '0 0 32px' }}>
        Aşağıdaki metinler şipşakspor&apos;u kullanırken geçerli olan koşulları, kişisel
        verilerinizin nasıl işlendiğini ve haklarınızı açıklar. Her metnin yürürlükteki sürümü ve
        son güncelleme tarihi kendi sayfasında yazılıdır.
      </p>

      {GRUPLAR.map(g => {
        const belgeler = HUKUK_BELGELERI.filter(b => b.kitle === g.kitle)
        if (!belgeler.length) return null
        return (
          <section key={g.kitle} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{g.baslik}</h2>
            <p style={{ fontSize: 13, color: '#999', margin: '0 0 14px' }}>{g.aciklama}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {belgeler.map(b => (
                <Link
                  key={b.slug}
                  href={`/hukuk/${b.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '14px 16px',
                    border: '1px solid #EFEFEF',
                    borderRadius: 12,
                    textDecoration: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: '#111' }}>{b.baslik}</span>
                  <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>
                    {b.surum ? `${b.surum} · ` : ''}
                    {b.tarih}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
