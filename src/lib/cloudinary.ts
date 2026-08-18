const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * İMZALI GÖRSEL YÜKLEME
 *
 * ESKİDEN: yükleme "imzasız" (unsigned) yapılıyordu ve gereken tek şey `upload_preset` adıydı.
 * O ad, hesap adıyla birlikte tam olarak BU DOSYADA, yani herkesin indirebildiği JavaScript
 * paketinin içindeydi → sayfa kaynağını açan biri, giriş yapmadan hesaba dosya yükleyebiliyordu.
 * İstek backend'e hiç uğramadığı için koyduğumuz rate limit'lerin de hiçbiri devreye girmiyordu.
 *
 * ŞİMDİ: önce kendi sunucumuzdan imza alınıyor (jeton gerekli), sonra yükleme o imzayla
 * yapılıyor. Klasörü SUNUCU belirliyor, istemci seçemiyor.
 *
 * REALM: aynı bileşen üç farklı hesap türünde kullanılıyor (üye avatarı, salon görselleri,
 * eğitmen fotoğrafı) ve her birinin jetonu farklı bir uçta doğrulanıyor — bu yüzden çağıran
 * hangi realm'de olduğunu söylüyor.
 */
export type YuklemeRealm = 'user' | 'venue' | 'instructor'

const IMZA_UCU: Record<YuklemeRealm, string> = {
  user: '/api/auth/upload-signature',
  venue: '/api/venue/upload-signature',
  instructor: '/api/instructor/upload-signature',
}

type Imza = { signature: string; timestamp: number; folder: string; apiKey: string; cloudName: string }

async function imzaAl(token: string, realm: YuklemeRealm): Promise<Imza> {
  const res = await fetch(`${API_URL}${IMZA_UCU[realm]}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  // DURUM KODUNU VE code ALANINI OKU. Eskiden her başarısızlık aynı jenerik mesaja iniyordu:
  // sunucu doğrulanmamış e-posta için 403 + { code: 'EMAIL_NOT_VERIFIED' } döndürüyor (requireVerified),
  // ama kullanıcı "Yükleme izni alınamadı." görüyor ve NEDEN olduğunu anlamıyordu — üstelik kayıt
  // akışı jetonu doğrulama ekranından ÖNCE sakladığı için doğrulanmamış kullanıcı bu yola ulaşabiliyor.
  if (!res.ok) {
    let d: any = null
    try { d = await res.json() } catch { /* govde JSON degil */ }
    if (res.status === 403 && d?.code === 'EMAIL_NOT_VERIFIED') {
      throw new Error('Fotoğraf yükleyebilmek için önce e-posta adresini doğrulaman gerekiyor.')
    }
    if (res.status === 401) throw new Error('Oturumun sona ermiş. Lütfen tekrar giriş yap.')
    throw new Error(d?.error || `Yükleme izni alınamadı (HTTP ${res.status}).`)
  }
  return res.json()
}

export async function uploadToCloudinary(file: File, token: string, realm: YuklemeRealm = 'user'): Promise<string> {
  const imza = await imzaAl(token, realm)

  const formData = new FormData()
  formData.append('file', file)
  // Bu dördü İMZANIN KAPSAMINDA. Biri değiştirilirse Cloudinary yüklemeyi reddeder —
  // istemcinin başka bir klasöre yazmasını engelleyen şey de tam olarak bu.
  formData.append('api_key', imza.apiKey)
  formData.append('timestamp', String(imza.timestamp))
  formData.append('folder', imza.folder)
  formData.append('signature', imza.signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${imza.cloudName}/image/upload`, {
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
