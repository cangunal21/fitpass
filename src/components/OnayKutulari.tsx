'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

/*
 * KAYIT ONAYLARI — sözleşme kabulü + isteğe bağlı açık rıza.
 *
 * NEDEN AYRI BİLEŞEN: üç kayıt ekranı (üye, salon, eğitmen) aynı hukuki yükümlülüğe tabi.
 * Üç yerde ayrı ayrı yazılsaydı biri güncellenip diğerleri unutulurdu — ve unutulan ekran,
 * onayı alınmamış bir metne dayanarak veri toplamaya devam ederdi.
 *
 * KURAL: zorunlu kutu ÖNCEDEN İŞARETLİ GELMEZ. KVKK'da rıza "özgür irade" ister; ön-işaretli
 * kutu rıza saymaz. Aynı sebeple ticari ileti rızası ayrı ve bağımsız bir kutudur — sözleşme
 * onayıyla aynı kutuya konulamaz.
 */

export type OnayDurumu = {
  sozlesme: boolean
  /** 18 yaş beyanı — sözleşme onayından AYRI kutu (Gizlilik 11.4 "ayrı bir onayla alınır"). */
  yasBeyani: boolean
  ticariIleti: boolean
}

export const BOS_ONAY: OnayDurumu = { sozlesme: false, yasBeyani: false, ticariIleti: false }

/** Backend'in beklediği gövde (bkz. fitpass/src/utils/consent.ts). */
export function onayGovdesi(ozne: 'uye' | 'salon' | 'egitmen', d: OnayDurumu): Record<string, boolean> {
  const sozlesmeler: Record<string, boolean> =
    ozne === 'salon'
      ? { 'salon-araciligi': d.sozlesme, gizlilik: d.sozlesme }
      : ozne === 'egitmen'
        ? { 'egitmen-aydinlatma': d.sozlesme, gizlilik: d.sozlesme }
        : { uyelik: d.sozlesme, gizlilik: d.sozlesme }
  // Salon tüzel kişidir, yaş beyanı istenmez (bkz. fitpass/src/utils/consent.ts).
  const yas: Record<string, boolean> = ozne === 'salon' ? {} : { 'yas-beyani': d.yasBeyani }
  return { ...sozlesmeler, ...yas, 'acik-riza-ticari-ileti': d.ticariIleti }
}

const kutuStil: React.CSSProperties = {
  width: 17,
  height: 17,
  marginTop: 1,
  flexShrink: 0,
  accentColor: '#4F46E5',
  cursor: 'pointer',
}

const satirStil: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontSize: 13,
  color: '#555',
  lineHeight: 1.6,
  cursor: 'pointer',
}

const bagStil: React.CSSProperties = { color: '#4F46E5', textDecoration: 'underline' }

export default function OnayKutulari({
  ozne,
  deger,
  onChange,
}: {
  ozne: 'uye' | 'salon' | 'egitmen'
  deger: OnayDurumu
  onChange: (d: OnayDurumu) => void
}) {
  const { t } = useT()

  const sozlesmeBagi =
    ozne === 'salon'
      ? { href: '/hukuk/salon-araciligi', ad: t('consent.docVenue') }
      : ozne === 'egitmen'
        ? { href: '/hukuk/egitmen-aydinlatma', ad: t('consent.docInstructor') }
        : { href: '/hukuk/uyelik', ad: t('consent.docMembership') }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: '#FAFAFA',
        border: '1px solid #EFEFEF',
        borderRadius: 12,
      }}
    >
      <label style={satirStil}>
        <input
          type="checkbox"
          checked={deger.sozlesme}
          onChange={e => onChange({ ...deger, sozlesme: e.target.checked })}
          style={kutuStil}
        />
        <span>
          <Link href={sozlesmeBagi.href} target="_blank" style={bagStil}>
            {sozlesmeBagi.ad}
          </Link>
          {t('consent.and')}
          <Link href="/hukuk/gizlilik" target="_blank" style={bagStil}>
            {t('consent.docPrivacy')}
          </Link>
          {t('consent.accept')}
        </span>
      </label>

      {ozne !== 'salon' && (
        <label style={satirStil}>
          <input
            type="checkbox"
            checked={deger.yasBeyani}
            onChange={e => onChange({ ...deger, yasBeyani: e.target.checked })}
            style={kutuStil}
          />
          <span>{t('consent.age')}</span>
        </label>
      )}

      <label style={satirStil}>
        <input
          type="checkbox"
          checked={deger.ticariIleti}
          onChange={e => onChange({ ...deger, ticariIleti: e.target.checked })}
          style={kutuStil}
        />
        <span>
          {t('consent.marketing')}{' '}
          <span style={{ color: '#999' }}>{t('consent.optional')}</span>
        </span>
      </label>

      <p style={{ margin: 0, fontSize: 11.5, color: '#999', lineHeight: 1.6 }}>
        {t('consent.note')}{' '}
        <Link href="/hukuk" target="_blank" style={{ color: '#888', textDecoration: 'underline' }}>
          {t('footer.legal')}
        </Link>
      </p>
    </div>
  )
}
