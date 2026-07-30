import type { Metadata } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const res = await fetch(`${API_URL}/api/public/sessions/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const s = data.session
    if (!s) throw new Error()
    // timeZone ŞART: generateMetadata SUNUCUDA (Vercel = UTC) koşar; verilmezse İstanbul'da
    // 00:00–02:59 başlayan seanslarda başlık ve OG açıklamasındaki tarih bir gün geriye kayar.
    const date = new Date(s.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })
    return {
      title: `${s.title} — ${s.venueName}`,
      description: `${s.title} dersi ${s.venueName}'de, ${date}. ${s.category} · ${s.durationMinutes} dk · ₺${s.basePrice}. Şipşakspor'dan rezervasyon yap.`,
      openGraph: {
        title: `${s.title} | Şipşakspor`,
        description: `${s.venueName}, ${date} — ${s.category} dersi. Hemen rezervasyon yap.`,
      },
    }
  } catch {
    return {
      title: 'Ders Detayı',
      description: 'İstanbul\'da spor dersi rezervasyonu — Şipşakspor',
    }
  }
}

export default function DersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
