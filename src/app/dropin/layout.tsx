import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Drop-in Etkinlikler',
  description: 'İstanbul\'da anlık katılımlı spor etkinlikleri. Futbol, basketbol, padel ve daha fazlası. Şipşakspor ile katıl.',
}

export default function DropinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
