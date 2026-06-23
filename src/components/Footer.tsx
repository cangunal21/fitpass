'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function Footer() {
  const { t } = useT()
  return (
    <footer style={{ borderTop: '1px solid #F0F0F0', backgroundColor: '#fff', padding: '20px 24px', marginTop: 'auto' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#bbb' }}>© 2026 şipşakspor</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/sikayet" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>
            {t('footer.complaint')}
          </Link>
          <Link href="/sosyal" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>
            {t('nav.social')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
