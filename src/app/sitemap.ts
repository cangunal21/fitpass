import type { MetadataRoute } from 'next'

const BASE_URL = 'https://sipsakspor.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/salonlar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/kayit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/giris`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/sosyal`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/dropin`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/sikayet`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dinamik salon sayfaları
  let venuePages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/public/venues`, { next: { revalidate: 3600 } })
    const data = await res.json()
    venuePages = (data.venues || []).map((v: { id: number; updatedAt?: string }) => ({
      url: `${BASE_URL}/venue/${v.id}`,
      lastModified: v.updatedAt ? new Date(v.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
  } catch {}

  return [...staticPages, ...venuePages]
}
