import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sosyal & Liderlik Tablosu',
  description: 'İstanbul\'daki sporcuları keşfet, liderlik tablosunu gör. Şipşakspor sosyal spor topluluğu.',
}

export default function SosyalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
