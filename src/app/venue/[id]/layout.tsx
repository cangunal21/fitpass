import type { Metadata } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const res = await fetch(`${API_URL}/api/public/venues/${id}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const venue = data.venue
    if (!venue) throw new Error()
    return {
      title: `${venue.name} — Spor Salonu`,
      description: `${venue.name}, ${venue.neighborhood?.name || 'İstanbul'}. ${venue.description || 'Ders programı ve rezervasyon için Şipşakspor\'u ziyaret et.'}`,
      openGraph: {
        title: `${venue.name} | Şipşakspor`,
        description: `${venue.name} İstanbul'da spor dersleri. Şipşakspor üzerinden rezervasyon yap.`,
      },
    }
  } catch {
    return {
      title: 'Spor Salonu',
      description: 'İstanbul\'da spor salonu rezervasyonu — Şipşakspor',
    }
  }
}

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
