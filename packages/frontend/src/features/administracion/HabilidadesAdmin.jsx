import React, { useState } from "react";
import { Alert, Button, CircularProgress, TextField } from "@mui/material";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import AlertaError from "../../components/AlertaError/AlertaError.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useListado } from "../../hooks/useListado";
import { crearHabilidad } from "../../service/habilidadesService";
import { codigoDeError } from "../../service/api";
import { t } from "../../i18n/t";
import "./HabilidadesAdmin.css";

export default function HabilidadesAdmin() {
  const { getAccessToken } = useAuth();
  const listado = useListado("/habilidades");
  const [nombre, setNombre] = useState("");
  const [validacion, setValidacion] = useState("");
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (evento) => {
    evento.preventDefault();
    const titulo = nombre.trim();
    setMensaje("");
    setError(null);
    if (!titulo) {
      setValidacion(t("administracionHabilidades.nombreRequerido"));
      return;
    }
    setValidacion("");
    setGuardando(true);
    try {
      const token = await getAccessToken();
      await crearHabilidad(token, { titulo });
      setNombre("");
      setMensaje(t("administracionHabilidades.exito", { titulo }));
      listado.recargar();
    } catch (fallo) {
      setError(fallo);
    } finally {
      setGuardando(false);
    }
  };

  const codigo = error ? codigoDeError(error) : null;
  const mensajeError =
    codigo === "HABILIDAD_YA_EXISTE"
      ? t("administracionHabilidades.duplicada")
      : codigo === "HABILIDAD_TITULO_INVALIDO"
        ? t("administracionHabilidades.nombreInvalido")
        : undefined;

  return (
    <div className="contenedor-pagina habilidades-admin">
      <EncabezadoPagina
        antetitulo={t("destacados.administracion")}
        titulo={t("administracionHabilidades.titulo")}
        subtitulo={t("administracionHabilidades.descripcion")}
      />
      <form
        className="panel habilidades-admin__formulario"
        onSubmit={guardar}
        noValidate
      >
        <h2>{t("administracionHabilidades.nueva")}</h2>
        <TextField
          label={t("administracionHabilidades.nombre")}
          value={nombre}
          onChange={(evento) => {
            setNombre(evento.target.value);
            setValidacion("");
          }}
          error={Boolean(validacion)}
          helperText={validacion}
          disabled={guardando}
          required
          fullWidth
        />
        {error && (
          <AlertaError
            error={error}
            titulo={t("administracionHabilidades.errorGuardar")}
            mensaje={mensajeError}
          />
        )}
        {mensaje && (
          <Alert severity="success" role="status">
            {mensaje}
          </Alert>
        )}
        <div>
          <Button type="submit" variant="contained" loading={guardando}>
            {guardando
              ? t("administracionHabilidades.guardando")
              : t("administracionHabilidades.guardar")}
          </Button>
        </div>
      </form>

      <section
        className="panel habilidades-admin__catalogo"
        aria-labelledby="catalogo-habilidades-titulo"
      >
        <h2 id="catalogo-habilidades-titulo">
          {t("administracionHabilidades.catalogo")}
        </h2>
        {listado.cargando ? (
          <div role="status">
            <CircularProgress size={20} />{" "}
            {t("administracionHabilidades.cargando")}
          </div>
        ) : listado.error ? (
          <AlertaError
            error={listado.error}
            titulo={t("administracionHabilidades.errorCargar")}
            onReintentar={listado.recargar}
          />
        ) : listado.datos.length === 0 ? (
          <p>{t("administracionHabilidades.vacio")}</p>
        ) : (
          <ul className="habilidades-admin__lista">
            {listado.datos.map((habilidad) => (
              <li key={habilidad.codigo}>{habilidad.titulo}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
