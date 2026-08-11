import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── BİLİNEN BORÇ: hata değil UYARI ─────────────────────────────────────────
  // Amaç lint'i CI'a sokabilmek. CI HATALARDA kırılır; aşağıdakiler bilinçli olarak
  // uyarı seviyesinde tutuluyor ki yeni GERÇEK hatalar fark edilsin, mevcut borç da
  // görünür kalsın (susturulmuyor, sadece kapıyı bloklamıyor).
  {
    // react-hooks kuralları bu blokta ezileceği için plugin AYNI blokta tanımlanmalı.
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // 205 kullanım, 21 dosya — çoğu API yanıtlarının tiplenmemiş sınırında.
      // Gerçek çözüm: paylaşılan bir API tip katmanı (ayrı iş). O yapılana kadar uyarı.
      '@typescript-eslint/no-explicit-any': 'warn',
      // React Compiler HENÜZ AÇIK DEĞİL (next.config.ts'te reactCompiler yok) → bu iki kural
      // bugünkü doğruluğu değil, derleyiciye HAZIRLIK durumunu ölçüyor. Kod bugün doğru
      // çalışıyor. Derleyici açılacağı zaman bunlar 'error'a çekilip tek tek ele alınmalı.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },

  // scripts/*.cjs GERÇEKTEN CommonJS Node betiği — require() orada DOĞRU kullanım.
  {
    files: ['scripts/**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
