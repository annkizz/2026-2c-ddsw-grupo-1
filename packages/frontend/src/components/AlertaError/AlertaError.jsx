import React, { useContext } from "react";
import { Alert, AlertTitle, Button } from "@mui/material";
import { FiLogIn, FiRefreshCw } from "react-icons/fi";
import { AuthContext } from "../../hooks/authContexto";
import { describirError } from "../../utils/mensajeDeError";
import { t } from "../../i18n/t";

import PropTypes from "prop-types";
// Error de servidor o de red con lenguaje claro: qué pasó (titulo) + cómo seguir (mensaje y acción).
// - error: el objeto capturado en el catch (nunca se muestra su texto).
// - titulo: qué no se pudo hacer, en voz del producto ("No pudimos cargar los proyectos").
// - onReintentar: si existe, se ofrece "Reintentar" cuando el tipo de error lo admite.
const AlertaError = ({
  error,
  titulo,
  mensaje: mensajePropio,
  onReintentar,
  reintentando = false,
  className,
  children,
}) => {
  // Sin AuthProvider (tests aislados) no se ofrece la acción de iniciar sesión.
  const auth = useContext(AuthContext);
  const descripcion = describirError(error);
  // Sin objeto de error (estado inválido conocido), el texto lo define quien llama.
  const mensaje = mensajePropio ?? descripcion.mensaje;
  const accion = error ? descripcion.accion : null;

  const botonIniciarSesion =
    accion === "iniciarSesion" && auth?.iniciarSesion ? (
      <Button
        variant="outlined"
        startIcon={<FiLogIn aria-hidden="true" />}
        onClick={auth.iniciarSesion}
      >
        {t("comun.iniciarSesion")}
      </Button>
    ) : null;

  const botonReintentar =
    !botonIniciarSesion &&
    onReintentar &&
    (!error || accion === "reintentar") ? (
      <Button
        variant="outlined"
        startIcon={<FiRefreshCw aria-hidden="true" />}
        onClick={onReintentar}
        loading={reintentando}
      >
        {t("comun.reintentar")}
      </Button>
    ) : null;

  const acciones = botonIniciarSesion || botonReintentar;

  return (
    <Alert severity="error" role="alert" className={className}>
      {titulo && <AlertTitle>{titulo}</AlertTitle>}
      <span>{mensaje}</span>
      {error && descripcion.codigo && (
        <span className="alerta-codigo">
          {" "}
          ({t("errores.etiquetaCodigo", { codigo: descripcion.codigo })})
        </span>
      )}
      {children}
      {acciones && <div className="alerta-acciones">{acciones}</div>}
    </Alert>
  );
};

AlertaError.propTypes = {
  error: PropTypes.any,
  titulo: PropTypes.node,
  mensaje: PropTypes.node,
  onReintentar: PropTypes.func,
  reintentando: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default AlertaError;
