import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertTitle, Button } from "@mui/material";
import { FiArrowLeft } from "react-icons/fi";
import "./Acceso.css";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  completarConexionLinkedin,
  CLAVE_VOLVER_A,
} from "../service/linkedinService";
import { mensajeDeError } from "../utils/mensajeDeError";
import { t } from "../i18n/t";
import LoadingSplash from "./LoadingSplash/LoadingSplash.jsx";
import { useNotificar } from "./Notificador/Notificador.jsx";

const LinkedinCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const notificar = useNotificar();
  const [error, setError] = useState("");
  const yaEnviado = useRef(false);

  const volverA = sessionStorage.getItem(CLAVE_VOLVER_A) ?? "/perfil";

  useEffect(() => {
    if (yaEnviado.current) return;
    yaEnviado.current = true;

    const code = params.get("code");
    const state = params.get("state");
    if (params.get("error") || !code || !state) {
      setError(t("linkedin.callbackError"));
      return;
    }

    (async () => {
      try {
        const token = await getAccessToken();
        await completarConexionLinkedin(token, code, state);
        sessionStorage.removeItem(CLAVE_VOLVER_A);
        notificar({ mensaje: t("linkedin.exitoConectado") });
        navigate(volverA, { replace: true });
      } catch (err) {
        setError(mensajeDeError(err));
      }
    })();
  }, [params, getAccessToken, navigate, volverA, notificar]);

  if (error) {
    return (
      <section
        className="acceso-estado"
        aria-labelledby="linkedin-error-titulo"
      >
        <Alert severity="error" role="alert">
          <AlertTitle id="linkedin-error-titulo" component="h1">
            {t("linkedin.errorConectarContexto")}
          </AlertTitle>
          {error}
        </Alert>
        <div className="acceso-estado__acciones">
          <Button
            variant="outlined"
            startIcon={<FiArrowLeft aria-hidden="true" />}
            onClick={() => navigate(volverA, { replace: true })}
          >
            {t("linkedin.volver")}
          </Button>
        </div>
      </section>
    );
  }

  return <LoadingSplash message={t("linkedin.callbackConectando")} />;
};

export default LinkedinCallback;
