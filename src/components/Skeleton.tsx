import React from 'react'

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: 8,
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style = {} }: {
  width?: string | number
  height?: number
  borderRadius?: number
  style?: React.CSSProperties
}) {
  return <div style={{ ...shimmer, width, height, borderRadius, ...style }} />
}

export function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
      <SkeletonBox height={130} borderRadius={0} />
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <SkeletonBox width={40} height={40} borderRadius={12} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBox width="65%" height={14} />
            <SkeletonBox width="40%" height={12} />
          </div>
        </div>
        <SkeletonBox height={36} borderRadius={12} />
      </div>
    </div>
  )
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export function SkeletonListItem() {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
      <SkeletonBox width={50} height={50} borderRadius={14} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBox width="55%" height={15} />
        <SkeletonBox width="35%" height={12} />
      </div>
      <SkeletonBox width={60} height={28} borderRadius={100} />
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonListItem key={i} />)}
    </div>
  )
}

export function SkeletonVenuePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
          <SkeletonBox height={200} borderRadius={0} />
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonBox width={240} height={28} />
            <SkeletonBox width={160} height={16} />
            <SkeletonBox width={200} height={14} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonListItem key={i} />)}
        </div>
      </div>
  )
}
