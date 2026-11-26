import React from "react";
import PropTypes from "prop-types";
import { Link, Navigate } from "react-router-dom";
import { Alert, AlertTitle, Button } from "@mui/material";
import { FiHome, FiLogIn, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { t } from "../i18n/t";
import "./Acceso.css";
import { useAuth } from "../hooks/useAuth.jsx";
import LoadingSplash from "./LoadingSplash/LoadingSplash.jsx";
import PaginaError from "./PaginaError/PaginaError.jsx";
import { leerTipo } from "../features/registro/tipoElegido";

const RequiereAuth = ({ children, exigirPerfil = true, tipoRegistro }) => {
  const {
    isAuthenticated,
    cargando,
    sesion,
    errorSesion,
    tipoErrorSesion,
    recargarSesion,
    cerrarSesion,
    iniciarSesion,
  } = useAuth();

  if (cargando) {
    return <LoadingSplash message={t("acceso.verificandoSesion")} />;
  }

  // Sin sesión no se redirige en silencio: se muestra el 401 y cómo seguir.
  if (!isAuthenticated) {
    return (
      <PaginaError
        codigo={401}
        id="sesion-requerida-titulo"
        accion={
          <>
            <Button
              variant="contained"
              startIcon={<FiLogIn aria-hidden="true" />}
              onClick={iniciarSesion}
            >
              {t("comun.iniciarSesion")}
            </Button>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              startIcon={<FiHome aria-hidden="true" />}
            >
              {t("comun.volverAlInicio")}
            </Button>
          </>
        }
      />
    );
  }

  if (errorSesion || !sesion) {
    return (
      <section className="acceso-estado" aria-labelledby="acceso-error-titulo">
        <Alert severity="error" role="alert">
          <AlertTitle id="acceso-error-titulo" component="h1">
            {t("acceso.errorSesionTitulo")}
          </AlertTitle>
          {t(`errores.${tipoErrorSesion ?? "inesperado"}`)}
        </Alert>
        <div className="acceso-estado__acciones">
          <Button
            variant="contained"
            startIcon={<FiRefreshCw aria-hidden="true" />}
            onClick={recargarSesion}
          >
            {t("comun.reintentar")}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiLogOut aria-hidden="true" />}
            onClick={cerrarSesion}
          >
            {t("navegacion.salir")}
          </Button>
        </div>
      </section>
    );
  }

  if (sesion.rol === "ADMINISTRADOR") {
    return exigirPerfil ? (
      children
    ) : (
      <Navigate to="/administrador/destacados" replace />
    );
  }

  if (sesion.tienePerfil) {
    if (!exigirPerfil) {
      return <Navigate to="/" replace />;
    }

    return children;
  }

  if (exigirPerfil || (tipoRegistro && leerTipo() !== tipoRegistro)) {
    return <Navigate to="/registro/tipo" replace />;
  }

  return children;
};

RequiereAuth.propTypes = {
  children: PropTypes.node,
  exigirPerfil: PropTypes.bool,
  tipoRegistro: PropTypes.string,
};

export default RequiereAuth;
