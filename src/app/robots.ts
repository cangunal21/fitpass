import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/salon-paneli', '/profil/*/rezervasyonlar', '/profil/*/hesap'],
      },
    ],
    sitemap: 'https://sipsakspor.com/sitemap.xml',
  }
}
