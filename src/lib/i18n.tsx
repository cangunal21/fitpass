'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Lang = 'tr' | 'en'

// Çeviri sözlüğü. Yeni metinler eklendikçe iki dile de eklenir.
const dict: Record<Lang, Record<string, string>> = {
  tr: {
    // Navbar
    'nav.social': 'Sosyal',
    'nav.login': 'Giriş Yap',
    'nav.register': 'Kayıt Ol',
    'nav.profile': 'Profilim',
    'nav.logout': 'Çıkış Yap',
    'nav.notifications': 'Bildirimler',
    'nav.noNotifications': 'Henüz bildirim yok',
    // Auth — ortak
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.fullName': 'Ad Soyad',
    'auth.username': 'Kullanıcı adı',
    'auth.phone': 'Telefon',
    // Giriş
    'login.title': 'Tekrar hoş geldin',
    'login.subtitle': 'Hesabına giriş yap',
    'login.button': 'Giriş Yap',
    'login.loading': 'Giriş yapılıyor...',
    'login.noAccount': 'Hesabın yok mu?',
    'login.registerLink': 'Kayıt ol',
    'login.forgot': 'Şifremi unuttum',
    'login.error': 'E-posta veya şifre hatalı.',
    'login.subtitle2': 'Hesabına giriş yap, derslerini bul',
    'login.venueOwner': 'Salon sahibi misiniz? →',
    'auth.heroTitle': "İstanbul'un spor platformu",
    'auth.heroDesc': "Yoga'dan boksa, halı sahadan pilates'e — İstanbul'un en iyi spor derslerini tek platformda keşfet.",
    'auth.feat1': '500+ aktif ders ve etkinlik',
    'auth.feat2': '50+ onaylı tesis ve salon',
    'auth.feat3': 'Kolay rezervasyon ve iptal',
    'auth.emailLabel': 'E-posta adresi',
    // Kayıt
    'register.title': 'Hesap oluştur',
    'register.subtitle': 'Saniyeler içinde üye ol',
    'register.passwordPlaceholder': 'En az 6 karakter',
    'register.passwordConfirm': 'Şifre Tekrar',
    'register.referral': 'Davet Kodu',
    'register.optional': '(isteğe bağlı)',
    'register.sportsLabel': 'İlgilendiğin sporlar',
    'register.neighborhoodsLabel': 'Hangi ilçelerde spor yaparsın',
    'register.multiHint': '(birden fazla seçebilirsin)',
    'register.button': 'Kayıt Ol',
    'register.loading': 'Hesap oluşturuluyor...',
    'register.haveAccount': 'Zaten hesabın var mı?',
    'register.loginLink': 'Giriş yap',
    'register.passwordMismatch': 'Şifreler eşleşmiyor.',
    'register.passwordShort': 'Şifre en az 6 karakter olmalı.',
    'register.referralBonus': '🎁 İlk dersin için 150 TL kredi kazanacaksın!',
    'register.heroTitle': 'Spor hayatın başlıyor',
    'register.subtitle2': 'Birkaç saniyede başla, ücretsiz',
    'register.feat1': 'Ücretsiz hesap oluştur',
    'register.feat2': 'Sınırsız keşfet ve rezervasyon yap',
    'register.feat3': 'İstediğin zaman iptal et',
    'register.usernameLabel': 'Kullanıcı Adı',
    // Ortak
    'common.error': 'Bir hata oluştu, tekrar dene.',
    'common.connectionError': 'Bağlantı hatası. Lütfen tekrar dene.',
  },
  en: {
    // Navbar
    'nav.social': 'Social',
    'nav.login': 'Log in',
    'nav.register': 'Sign up',
    'nav.profile': 'My Profile',
    'nav.logout': 'Log out',
    'nav.notifications': 'Notifications',
    'nav.noNotifications': 'No notifications yet',
    // Auth — common
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full name',
    'auth.username': 'Username',
    'auth.phone': 'Phone',
    // Login
    'login.title': 'Welcome back',
    'login.subtitle': 'Sign in to your account',
    'login.button': 'Log in',
    'login.loading': 'Signing in...',
    'login.noAccount': "Don't have an account?",
    'login.registerLink': 'Sign up',
    'login.forgot': 'Forgot password?',
    'login.error': 'Incorrect email or password.',
    'login.subtitle2': 'Sign in and find your classes',
    'login.venueOwner': 'Are you a venue owner? →',
    'auth.heroTitle': "Istanbul's sports platform",
    'auth.heroDesc': 'From yoga to boxing, football to pilates — discover the best sports classes in Istanbul, all in one place.',
    'auth.feat1': '500+ active classes and events',
    'auth.feat2': '50+ verified venues and studios',
    'auth.feat3': 'Easy booking and cancellation',
    'auth.emailLabel': 'Email address',
    // Register
    'register.title': 'Create account',
    'register.subtitle': 'Join in seconds',
    'register.passwordPlaceholder': 'At least 6 characters',
    'register.passwordConfirm': 'Confirm password',
    'register.referral': 'Referral code',
    'register.optional': '(optional)',
    'register.sportsLabel': 'Sports you’re interested in',
    'register.neighborhoodsLabel': 'Which districts do you work out in',
    'register.multiHint': '(you can pick more than one)',
    'register.button': 'Sign up',
    'register.loading': 'Creating account...',
    'register.haveAccount': 'Already have an account?',
    'register.loginLink': 'Log in',
    'register.passwordMismatch': 'Passwords do not match.',
    'register.passwordShort': 'Password must be at least 6 characters.',
    'register.referralBonus': '🎁 You’ll earn 150 TL credit for your first class!',
    'register.heroTitle': 'Your sports life begins',
    'register.subtitle2': 'Get started in seconds, free',
    'register.feat1': 'Create a free account',
    'register.feat2': 'Explore and book without limits',
    'register.feat3': 'Cancel anytime',
    'register.usernameLabel': 'Username',
    // Common
    'common.error': 'Something went wrong, please try again.',
    'common.connectionError': 'Connection error. Please try again.',
  },
}

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }
const LanguageContext = createContext<LangCtx>({ lang: 'tr', setLang: () => {}, t: (k) => k })

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Sunucu ve ilk client render'ı 'tr' (hydration uyumu); mount sonrası tercih/ tarayıcı diline göre güncellenir
  const [lang, setLangState] = useState<Lang>('tr')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fitpass_lang') as Lang | null
      if (stored === 'tr' || stored === 'en') { setLangState(stored); return }
      const browser = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'tr'
      setLangState(browser)
    } catch { /* yoksay */ }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('fitpass_lang', l) } catch { /* yoksay */ }
  }

  const t = (key: string) => dict[lang][key] ?? dict.tr[key] ?? key

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export const useT = () => useContext(LanguageContext)
