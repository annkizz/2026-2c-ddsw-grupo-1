import React from "react";
import { FiInbox } from "react-icons/fi";
import "./EstadoVacio.css";

import PropTypes from "prop-types";
// Estado vacío: ícono + título + una línea explicativa + acción opcional.
const EstadoVacio = ({
  icono: Icono = FiInbox,
  titulo,
  descripcion,
  accion,
  nivelTitulo = "h2",
  className = "",
}) => {
  const Titulo = nivelTitulo;
  return (
    <div className={`estado-vacio ${className}`.trim()}>
      <span className="estado-vacio__icono" aria-hidden="true">
        <Icono />
      </span>
      <Titulo className="estado-vacio__titulo">{titulo}</Titulo>
      {descripcion && (
        <p className="estado-vacio__descripcion">{descripcion}</p>
      )}
      {accion && <div className="estado-vacio__accion">{accion}</div>}
    </div>
  );
};

EstadoVacio.propTypes = {
  icono: PropTypes.elementType,
  titulo: PropTypes.node.isRequired,
  descripcion: PropTypes.node,
  accion: PropTypes.node,
  nivelTitulo: PropTypes.oneOf(["h2", "h3", "p"]),
  className: PropTypes.string,
};

export default EstadoVacio;
