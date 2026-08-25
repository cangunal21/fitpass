/*
 * Hukuk belgesi gövdesi — üretilen HTML'i site tipografisiyle basar.
 *
 * SUNUCU BİLEŞENİ (bilerek 'use client' yok): metin etkileşimsiz ve 20-30 KB. İstemci
 * bileşeni olsaydı aynı metin hem HTML hem RSC yükünde İKİ KEZ taşınırdı.
 *
 * dangerouslySetInnerHTML KULLANIMI NEDEN GÜVENLİ: içerik kullanıcıdan gelmiyor.
 * Derleme anında ~/sipsakspor_*_src.py kaynaklarından üretiliyor (scripts/hukuk-uret.cjs) ve
 * üretilen dosya repoda duruyor. Yani buraya ancak repoya commit edilmiş metin girebilir.
 */
import styles from './HukukGovde.module.css'

export default function HukukGovde({ html }: { html: string }) {
  return <div className={styles.hukuk} dangerouslySetInnerHTML={{ __html: html }} />
}
