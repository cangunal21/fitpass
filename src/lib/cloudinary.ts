export const CLOUDINARY_CLOUD = 'duxqsdjpl'
export const CLOUDINARY_PRESET = 'sipsakspor_uploads'

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Resim yüklenemedi.')
  const data = await res.json()
  return data.secure_url as string
}

export function getInitialsAvatar(name: string, size = 80): { initials: string; color: string } {
  const words = (name || '?').trim().split(' ')
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : (words[0]?.[0] || '?').toUpperCase()

  const colors = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#D97706', '#059669', '#0891B2', '#1D4ED8']
  let hash = 0
  for (const c of name || '') hash = c.charCodeAt(0) + ((hash << 5) - hash)
  const color = colors[Math.abs(hash) % colors.length]

  return { initials, color }
}
