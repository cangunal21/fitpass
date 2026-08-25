import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { HUKUK_BELGELERI, hukukBul } from '@/lib/hukuk/belgeler.generated'
import HukukGovde from '@/components/HukukGovde'

export const dynamicParams = false

export function generateStaticParams() {
  return HUKUK_BELGELERI.map(b => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const belge = hukukBul(slug)
  if (!belge) return {}
  return {
    title: `${belge.baslik} — şipşakspor`,
    description: `şipşakspor ${belge.baslik}. Son güncelleme: ${belge.tarih}.`,
  }
}

export default async function HukukSayfasi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const belge = hukukBul(slug)
  if (!belge) notFound()

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '28px 24px 72px' }}>
      <Link
        href="/hukuk"
        style={{ fontSize: 13.5, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}
      >
        ← Yasal belgeler
      </Link>

      <article style={{ marginTop: 22 }}>
        <HukukGovde html={belge.govde} />
      </article>

      <div
        style={{
          marginTop: 36,
          padding: '14px 16px',
          backgroundColor: '#FAFAFA',
          border: '1px solid #EFEFEF',
          borderRadius: 12,
          fontSize: 12.5,
          color: '#888',
          lineHeight: 1.7,
        }}
      >
        Bu metnin yürürlükteki sürümü {belge.surum ? `${belge.surum}, ` : ''}son güncelleme tarihi{' '}
        {belge.tarih}&apos;dır. Metin güncellendiğinde bu sayfa üzerinden yayımlanır; sizi
        etkileyen esaslı değişiklikler ayrıca bildirilir. Sorularınız için{' '}
        <a href="mailto:admin@sipsakspor.com" style={{ color: '#4F46E5' }}>
          admin@sipsakspor.com
        </a>
        .
      </div>
    </main>
  )
}
