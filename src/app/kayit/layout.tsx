import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kayıt Ol',
  description: 'Şipşakspor\'a ücretsiz kayıt ol. İstanbul\'daki spor derslerini keşfet ve rezervasyon yap.',
}

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
