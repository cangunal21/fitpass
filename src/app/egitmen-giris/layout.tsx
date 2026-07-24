import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Eğitmen Girişi',
  description: 'Şipşakspor eğitmen girişi — puanlarını gör, yorumlara yanıt ver.',
}

export default function EgitmenGirisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
