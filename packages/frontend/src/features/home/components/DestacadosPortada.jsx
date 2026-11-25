import React from 'react';
import CardProyecto from '../../../components/CardProyecto/CardProyecto.jsx';
import AlertaError from '../../../components/AlertaError/AlertaError.jsx';
import { EsqueletoGrilla } from '../../../components/Esqueletos/Esqueletos.jsx';
import { useListado } from '../../../hooks/useListado';
import { t } from '../../../i18n/t';

export default function DestacadosPortada() {
  const { datos, cargando, error, recargar } = useListado('/proyectos/destacados');

  return (
    <section className="home-destacados" aria-labelledby="destacados-titulo">
      <h2 id="destacados-titulo">{t('destacados.titulo')}</h2>
      <p>{t('destacados.descripcionPortada')}</p>
      {cargando ? (
        <EsqueletoGrilla etiqueta={t('destacados.cargando')} />
      ) : error ? (
        <AlertaError error={error} titulo={t('destacados.errorCarga')} onReintentar={recargar} />
      ) : datos.length === 0 ? (
        <p>{t('destacados.sinDestacados')}</p>
      ) : (
        <ul className="tarjetas">
          {datos.map((proyecto) => <CardProyecto key={proyecto.id} proyecto={proyecto} />)}
        </ul>
      )}
    </section>
  );
}
