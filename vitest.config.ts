import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * BİRİM TESTİ KOŞUCUSU (web)
 *
 * NEDEN VAR: web'de HİÇ birim testi koşucusu yoktu — yalnız Playwright (e2e) vardı ve o,
 * tarayıcı davranışını sınıyor. Oysa realm-duyarlı jeton yenileme mantığı (`lib/api.ts`)
 * saf TypeScript ve iki kez GERÇEKTEN bozuldu: bir kez realm tespiti URL'e düştü, bir kez
 * `endSession` yanlış realm'in anahtarlarını sildi. Mobil ikizinde bu mantığın regresyon
 * testi VARDI, web'de yoktu — parite denetimi bu boşluğu buldu.
 *
 * e2e ile çakışmaz: `e2e/` klasörü hariç tutulur (Playwright kendi koşucusuyla çalışır).
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
