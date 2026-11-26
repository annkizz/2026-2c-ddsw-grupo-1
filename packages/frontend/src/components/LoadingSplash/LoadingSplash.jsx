import React from "react";
import PropTypes from "prop-types";
import { EsqueletoPagina } from "../Esqueletos/Esqueletos.jsx";
import "./LoadingSplash.css";

// Carga de pantalla completa (sesión, permisos, callbacks): esqueleto con la forma de una página
// y un mensaje que explica qué está pasando. Sin spinner fuera de botones.
const LoadingSplash = ({ message = "Cargando…" }) => (
  <div className="loading-splash">
    <EsqueletoPagina mensaje={message} />
  </div>
);

LoadingSplash.propTypes = { message: PropTypes.node };

export default LoadingSplash;
