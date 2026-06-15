import {
  Dumbbell, Trophy, Music2, Leaf, Target, Heart, Zap, Star, Circle, Medal, Shield
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
