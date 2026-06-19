import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Şikayet & Geri Bildirim',
  description: 'Şipşakspor ile ilgili şikayet veya geri bildirimini ilet. Sana en kısa sürede dönelim.',
}

export default function SikayetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
