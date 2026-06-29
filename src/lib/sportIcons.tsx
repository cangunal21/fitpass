import {
  Dumbbell, Trophy, Music2, Leaf, Target, Heart, Zap, Star, Circle, Medal, Shield, Anchor
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import {
  IconBallFootball,
  IconBallBasketball,
  IconBallTennis,
  IconSwimming,
} from '@tabler/icons-react'
import { PiBoxingGlove } from 'react-icons/pi'
import { FaRunning, FaHorse } from 'react-icons/fa'
import { GrYoga } from 'react-icons/gr'
import { TbYoga } from 'react-icons/tb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, React.ComponentType<any>> = {
  // Sporlar
  yoga: GrYoga,
  pilates: TbYoga,
  boxing: PiBoxingGlove,
  hiit: FaRunning,
  football: IconBallFootball,
  basketball: IconBallBasketball,
  padel: IconBallTennis,
  swimming: IconSwimming,
  dance: Music2,
  wellness: Leaf,
  weightlifting: Dumbbell,
  strength: Dumbbell,
  crossfit: Dumbbell,
  equestrian: FaHorse,
  binicilik: FaHorse,
  sailing: Anchor,
  yelken: Anchor,
  // Rozetler
  target: Target,
  heart: Heart,
  // Tier ikonları
  zap: Zap,
  trophy: Trophy,
  circle: Circle,
  medal: Medal,
  shield: Shield,
}

// Kategori adından icon key döndürür — isim değişse bile keyword matching ile çalışır
export function getIconKeyForCategory(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('yoga')) return 'yoga'
  if (n.includes('pilates')) return 'pilates'
  if (n.includes('yüzme') || n.includes('swim')) return 'swimming'
  if (n.includes('dans') || n.includes('dance') || n.includes('zumba')) return 'dance'
  if (n.includes('halı') || n.includes('futbol') || n.includes('soccer')) return 'football'
  if (n.includes('basket')) return 'basketball'
  if (n.includes('padel') || n.includes('tenis') || n.includes('squash') || n.includes('badminton') || n.includes('masa tenisi')) return 'padel'
  if (n.includes('boks') || n.includes('dövüş') || n.includes('mma') || n.includes('kick') || n.includes('muay') || n.includes('jiu') || n.includes('judo') || n.includes('güreş') || n.includes('boxing')) return 'boxing'
  if (n.includes('cross') || n.includes('hiit') || n.includes('kondisyon')) return 'hiit'
  if (n.includes('binici') || n.includes('biniç') || n.includes('ata biniş') || n.includes('equestrian')) return 'equestrian'
  if (n.includes('yelken') || n.includes('yatçılık') || n.includes('sail')) return 'sailing'
  return 'strength'
}

// Kategori adından fallback renk döndürür (DB'de colorHex yoksa)
export function getColorForCategory(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('yoga')) return '#C4A882'
  if (n.includes('pilates')) return '#C9849A'
  if (n.includes('yüzme') || n.includes('swim')) return '#0891B2'
  if (n.includes('dans') || n.includes('dance') || n.includes('zumba')) return '#9333EA'
  if (n.includes('halı') || n.includes('futbol')) return '#16A34A'
  if (n.includes('basket')) return '#C2501F'
  if (n.includes('tenis')) return '#65A30D'
  if (n.includes('padel')) return '#EAB308'
  if (n.includes('boks') || n.includes('dövüş') || n.includes('mma') || n.includes('kick')) return '#DC2626'
  if (n.includes('cross') || n.includes('hiit')) return '#F97316'
  if (n.includes('binici') || n.includes('biniç') || n.includes('equestrian')) return '#92400E'
  if (n.includes('yelken') || n.includes('yatçılık')) return '#0EA5E9'
  return '#4F46E5'
}

interface SportIconProps extends LucideProps {
  name: string
}

export function SportIcon({ name, size = 20, color, ...props }: SportIconProps) {
  const Icon = iconMap[name] || Star
  return <Icon size={size} color={color} {...props} />
}

export function SportIconBox({
  name,
  size = 20,
  bgColor = '#F5F5F5',
  iconColor,
  boxSize = 44,
  borderRadius = 12,
}: {
  name: string
  size?: number
  bgColor?: string
  iconColor?: string
  boxSize?: number
  borderRadius?: number
}) {
  const Icon = iconMap[name] || Star
  return (
    <div
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius,
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={size} color={iconColor || '#555'} />
    </div>
  )
}
