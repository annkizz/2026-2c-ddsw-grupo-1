import React from 'react';
import { Skeleton } from '@mui/material';
import { t } from '../../i18n/t';
import './Esqueletos.css';
import PropTypes from 'prop-types';

const conEtiqueta = { etiqueta: PropTypes.string };

// Esqueletos con la forma del contenido. La región se marca aria-busy y anuncia la carga una vez.
const Region = ({ etiqueta, mensajeVisible, className = '', children }) => (
  <div className={`esqueleto ${className}`.trim()} aria-busy="true" role="status">
    {mensajeVisible ? (
      <p className="esqueleto__mensaje">{mensajeVisible}</p>
    ) : (
      <span className="visualmente-oculto">{etiqueta ?? t('comun.cargando')}</span>
    )}
    <div aria-hidden="true" className="esqueleto__contenido">
      {children}
    </div>
  </div>
);

const Linea = ({ ancho = '100%', variante = 'text', alto }) => (
  <Skeleton variant={variante} width={ancho} height={alto} />
);

export const EsqueletoCard = () => (
  <div className="esqueleto-card">
    <Linea variante="rounded" alto="var(--space-10)" />
    <Linea ancho="70%" alto="var(--space-3)" />
    <Linea ancho="90%" />
    <Linea ancho="50%" />
    <div className="esqueleto-fila">
      <Linea variante="rounded" ancho="var(--space-10)" alto="var(--space-4)" />
      <Linea variante="rounded" ancho="var(--space-10)" alto="var(--space-4)" />
    </div>
    <Linea variante="rounded" alto="var(--control-min-height)" />
  </div>
);

export const EsqueletoGrilla = ({ cantidad = 6, etiqueta }) => (
  <Region etiqueta={etiqueta} className="esqueleto-grilla">
    {Array.from({ length: cantidad }, (_, i) => (
      <EsqueletoCard key={i} />
    ))}
  </Region>
);

export const EsqueletoLista = ({ cantidad = 4, etiqueta }) => (
  <Region etiqueta={etiqueta} className="esqueleto-lista">
    {Array.from({ length: cantidad }, (_, i) => (
      <div className="esqueleto-item" key={i}>
        <div className="esqueleto-item__texto">
          <Linea ancho="60%" alto="var(--space-3)" />
          <Linea ancho="85%" />
          <Linea ancho="40%" />
        </div>
        <Linea variante="rounded" ancho="var(--space-10)" alto="var(--control-min-height)" />
      </div>
    ))}
  </Region>
);

export const EsqueletoDetalle = ({ etiqueta }) => (
  <Region etiqueta={etiqueta} className="esqueleto-detalle">
    <Linea ancho="30%" />
    <Linea ancho="65%" alto="var(--space-5)" />
    <Linea ancho="90%" />
    <Linea ancho="80%" />
    <div className="esqueleto-detalle__bloques">
      <Linea variante="rounded" alto="var(--space-10)" />
      <Linea variante="rounded" alto="var(--space-10)" />
      <Linea variante="rounded" alto="var(--space-10)" />
    </div>
    <EsqueletoCard />
  </Region>
);

export const EsqueletoPerfil = ({ etiqueta }) => (
  <Region etiqueta={etiqueta} className="esqueleto-perfil">
    <div className="esqueleto-fila">
      <Linea variante="circular" ancho="var(--avatar-size)" alto="var(--avatar-size)" />
      <div className="esqueleto-item__texto">
        <Linea ancho="50%" alto="var(--space-4)" />
        <Linea ancho="35%" />
      </div>
    </div>
    <Linea ancho="95%" />
    <Linea ancho="85%" />
    <div className="esqueleto-fila">
      <Linea variante="rounded" ancho="var(--space-10)" alto="var(--space-4)" />
      <Linea variante="rounded" ancho="var(--space-10)" alto="var(--space-4)" />
      <Linea variante="rounded" ancho="var(--space-10)" alto="var(--space-4)" />
    </div>
  </Region>
);

export const EsqueletoFormulario = ({ campos = 4, etiqueta }) => (
  <Region etiqueta={etiqueta} className="esqueleto-formulario">
    {Array.from({ length: campos }, (_, i) => (
      <div className="esqueleto-campo" key={i}>
        <Linea ancho="30%" />
        <Linea variante="rounded" alto="var(--field-min-height)" />
      </div>
    ))}
    <Linea variante="rounded" ancho="var(--space-10)" alto="var(--control-min-height)" />
  </Region>
);

export const EsqueletoPagina = ({ etiqueta, mensaje }) => (
  <Region etiqueta={etiqueta} mensajeVisible={mensaje} className="esqueleto-pagina">
    <Linea ancho="40%" alto="var(--space-5)" />
    <Linea ancho="70%" />
    <div className="esqueleto-detalle__bloques">
      <Linea variante="rounded" alto="var(--space-10)" />
      <Linea variante="rounded" alto="var(--space-10)" />
    </div>
  </Region>
);

Region.propTypes = {
  etiqueta: PropTypes.string,
  mensajeVisible: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node
};
Linea.propTypes = {
  ancho: PropTypes.string,
  alto: PropTypes.string,
  variante: PropTypes.oneOf(['text', 'rounded', 'rectangular', 'circular'])
};
EsqueletoGrilla.propTypes = { ...conEtiqueta, cantidad: PropTypes.number };
EsqueletoLista.propTypes = { ...conEtiqueta, cantidad: PropTypes.number };
EsqueletoDetalle.propTypes = conEtiqueta;
EsqueletoPerfil.propTypes = conEtiqueta;
EsqueletoFormulario.propTypes = { ...conEtiqueta, campos: PropTypes.number };
EsqueletoPagina.propTypes = { ...conEtiqueta, mensaje: PropTypes.node };
