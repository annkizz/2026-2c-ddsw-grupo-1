import React from "react";
import { Breadcrumbs } from "@mui/material";
import { FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { t } from "../../i18n/t";
import "./EncabezadoPagina.css";

import PropTypes from "prop-types";
// Encabezado único de pantalla: migas (opcional) → h1 → línea guía → acción principal a la derecha.
// migas: [{ texto, to }]; el último elemento es la página actual (sin enlace).
const EncabezadoPagina = ({
  titulo,
  subtitulo,
  antetitulo,
  accion,
  migas,
  id,
  className = "",
  children,
}) => (
  <div className={`encabezado-pagina ${className}`.trim()}>
    {migas?.length > 0 && (
      <Breadcrumbs
        aria-label={t("navegacion.migas")}
        separator={<FiChevronRight aria-hidden="true" />}
        className="encabezado-pagina__migas"
      >
        {migas.map(({ texto, to }, indice) =>
          to && indice < migas.length - 1 ? (
            <Link key={`${texto}-${indice}`} to={to}>
              {texto}
            </Link>
          ) : (
            <span key={`${texto}-${indice}`} aria-current="page">
              {texto}
            </span>
          ),
        )}
      </Breadcrumbs>
    )}
    <div className="encabezado-pagina__fila">
      <div className="encabezado-pagina__textos">
        {antetitulo && (
          <p className="encabezado-pagina__antetitulo">{antetitulo}</p>
        )}
        <h1 id={id} className="encabezado-pagina__titulo">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="encabezado-pagina__subtitulo">{subtitulo}</p>
        )}
      </div>
      {accion && <div className="encabezado-pagina__accion">{accion}</div>}
    </div>
    {children}
  </div>
);

EncabezadoPagina.propTypes = {
  titulo: PropTypes.node.isRequired,
  subtitulo: PropTypes.node,
  antetitulo: PropTypes.node,
  accion: PropTypes.node,
  migas: PropTypes.arrayOf(
    PropTypes.shape({ texto: PropTypes.node.isRequired, to: PropTypes.string }),
  ),
  id: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default EncabezadoPagina;
