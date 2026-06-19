import type { Metadata } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const res = await fetch(`${API_URL}/api/public/sessions/${id}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const s = data.session
    if (!s) throw new Error()
    const date = new Date(s.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
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
