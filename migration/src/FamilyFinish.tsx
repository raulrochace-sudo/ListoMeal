type Props = { lang: 'en' | 'es' };

/** The image is bundled with the app so the finale works without API calls. */
export function FamilyFinish({ lang }: Props) {
  return <div className="family-finish" role="img" aria-label={lang === 'es' ? 'Familia disfrutando la cena y haciendo la seña de listo' : 'Family enjoying dinner and giving a thumbs up'}>
    <img className="family-finish-photo" src="/resources/listomeal-familia-listo.webp" alt="" />
    <span className="family-spark family-spark-a" aria-hidden="true">✦</span>
    <span className="family-spark family-spark-b" aria-hidden="true">✦</span>
    <span className="family-finish-label">{lang === 'es' ? '¡Listo! A comer en familia' : 'Listo! Family dinner time'}</span>
  </div>;
}
