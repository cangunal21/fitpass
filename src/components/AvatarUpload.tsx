'use client'
import { useState, useRef } from 'react'
import { uploadToCloudinary, getInitialsAvatar } from '@/lib/cloudinary'

interface AvatarUploadProps {
  currentUrl?: string | null
  name: string
  size?: number
  onUpload: (url: string) => void
  editable?: boolean
}

export default function AvatarUpload({ currentUrl, name, size = 80, onUpload, editable = true }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { initials, color } = getInitialsAvatar(name, size)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Show local preview immediately
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      // Upload to Cloudinary
      const url = await uploadToCloudinary(file)
      setPreviewUrl(url)
      onUpload(url)
    } catch {
      alert('Resim yüklenemedi. Lütfen tekrar deneyin.')
      setPreviewUrl(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Avatar circle */}
      <div
        onClick={() => editable && inputRef.current?.click()}
        style={{
          width: size, height: size, borderRadius: '50%',
          backgroundColor: previewUrl ? 'transparent' : color,
          overflow: 'hidden', cursor: editable ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 800, color: '#fff',
          border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          position: 'relative',
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{initials}</span>
        )}
        {/* Hover overlay */}
        {editable && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <span style={{ fontSize: size * 0.18, color: '#fff', fontWeight: 700 }}>
              {uploading ? '...' : '📷'}
            </span>
          </div>
        )}
      </div>
      {editable && (
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      )}
    </div>
  )
}
