import type { NextConfig } from "next";

/**
 * GÜVENLİK BAŞLIKLARI (bağımsız denetim bulgusu)
 *
 * Site hiçbir güvenlik başlığı göndermiyordu. En somut sonucu clickjacking'di ve BUGÜN
 * sömürülebilirdi: saldırgan sayfası `<iframe src="https://sipsakspor.com/salon-paneli">`i
 * şeffaf bırakıp üstüne yem düğme koyduğunda, tarayıcı çerçevelemeyi engelleyecek bir kural
 * görmediği için giriş yapmış salon sahibi kendi oturumuyla istemediği işlemi tetikleyebiliyordu.
 *
 * CSP'nin ayrı bir ağırlığı var: 180 günlük yenileme jetonu localStorage'da duruyor, yani tek bir
 * XSS kalıcı hesap ele geçirmesine dönüşür. CSP bu zinciri kırmaya çalışan katmandır.
 *
 * CSP NEDEN 'unsafe-inline' İÇERİYOR: Next.js sunucu bileşenlerini satır içi script/style ile
 * hidre ediyor; nonce'a geçmek middleware + her sayfada nonce yayma işi (ayrı bir iş). Bugünkü
 * hâli bile sıfırdan iyi: dış kaynak yükleme yüzeyi (script-src/connect-src/img-src) kapalı
 * listeye indirildi, `object-src 'none'` ve `frame-ancestors 'none'` mutlak.
 *
 * connect-src'a backend'in kendisi de yazılmalı, aksi halde tüm API çağrıları bloklanır.
 */
const API = process.env.NEXT_PUBLIC_API_URL || "https://fitpass-backend-production-e0c9.up.railway.app";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://ui-avatars.com https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  `connect-src 'self' ${API} https://api.cloudinary.com`,
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          // frame-ancestors'ı desteklemeyen eski tarayıcılar için ikinci kemer.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Dış sitelere tam adres (ders/profil id'leri dahil) sızmasın.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Uygulama bunların hiçbirini kullanmıyor; kullanmadığın yetkiyi kapalı tut.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // 2 yıl HSTS. Vercel zaten HTTPS zorluyor; bu, ilk isteğin de https olmasını sağlar.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
