import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'Şipşakspor hesabına giriş yap ve İstanbul\'daki spor derslerini keşfet.',
}

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
