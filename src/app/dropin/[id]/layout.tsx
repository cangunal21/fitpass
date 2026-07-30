import type { Metadata } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const res = await fetch(`${API_URL}/api/public/dropin/${encodeURIComponent(id)}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const slot = data.slot
    if (!slot) throw new Error()
    // timeZone ŞART: generateMetadata SUNUCUDA (Vercel = UTC) koşar; verilmezse İstanbul'da
    // 00:00–02:59 başlayan seanslarda başlık ve OG açıklamasındaki tarih bir gün geriye kayar.
    const date = new Date(slot.startsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })
    return {
      title: `${slot.title} — ${slot.venue?.name}`,
      description: `${slot.sportCategory?.name} drop-in etkinliği. ${slot.venue?.name}, ${date}. ₺${slot.pricePerPerson} kişi başı. Şipşakspor'dan katıl.`,
      openGraph: {
        title: `${slot.title} | Şipşakspor`,
        description: `${slot.venue?.name}, ${date} — Drop-in ${slot.sportCategory?.name} etkinliği.`,
      },
    }
  } catch {
    return {
      title: 'Drop-in Etkinlik',
      description: 'İstanbul\'da drop-in spor etkinliği — Şipşakspor',
    }
  }
}

export default function DropinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
