import React, { useId, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { FiCheckCircle, FiGithub, FiMail } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth.jsx";
import { invitarAColaborar } from "../../service/proyectosService";
import { mensajeDeError } from "../../utils/mensajeDeError";
import "../Card.css";
import { markdownATextoPlano } from "../../utils/markdown";
import { t } from "../../i18n/t";
import { listarHabilidades } from "../../utils/perfiles";

function nombreVisible(colaboradora) {
  return (
    colaboradora.nombreFantasia ??
    colaboradora.usuarioGitHub ??
    t("tarjetas.sinNombre")
  );
}

const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

export default function CardColaboradora({
  colaboradora,
  idProyecto,
  idPerfil,
  nombreProyecto,
  descripcionPerfil,
}) {
  const nombre = nombreVisible(colaboradora);
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const dialogTitleId = `${id}-dialogo`;
  const { getAccessToken } = useAuth();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [invitacionEnviada, setInvitacionEnviada] = useState(false);

  const cerrarDialogo = () => {
    if (enviando) return;
    setDialogoAbierto(false);
    setContenido("");
    setError("");
    setResultado(null);
  };

  const enviarMensaje = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const token = await getAccessToken();
      const respuesta = await invitarAColaborar(
        token,
        idProyecto,
        idPerfil,
        colaboradora.id,
        contenido.trim(),
      );
      setInvitacionEnviada(true);
      setResultado(respuesta);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <li className="tarjeta" aria-labelledby={idTitulo}>
      <div
        className="tarjeta__media tarjeta__media--persona"
        aria-hidden="true"
      >
        <span className="tarjeta__avatar">{iniciales(nombre)}</span>
      </div>

      <div className="tarjeta__cuerpo">
        <div className="tarjeta__encabezado">
          <h3 id={idTitulo}>{nombre}</h3>
          {colaboradora.tieneCoincidencia && (
            <Chip
              color="success"
              icon={<FiCheckCircle aria-hidden="true" />}
              label={t("tarjetas.coincide")}
            />
          )}
        </div>

        {colaboradora.pronombres?.length > 0 && (
          <p className="tarjeta__meta">
            {t("tarjetas.pronombres", {
              pronombres: colaboradora.pronombres.join(", "),
            })}
          </p>
        )}
        {colaboradora.presentacion && (
          <p className="tarjeta__descripcion">
            {markdownATextoPlano(colaboradora.presentacion)}
          </p>
        )}
        {colaboradora.usuarioGitHub && (
          <p className="tarjeta__meta">
            <FiGithub aria-hidden="true" />
            <span>
              GitHub:{" "}
              <a
                href={`https://github.com/${colaboradora.usuarioGitHub}`}
                target="_blank"
                rel="noreferrer"
              >
                @{colaboradora.usuarioGitHub}
                <span className="visualmente-oculto">
                  {" "}
                  {t("comun.nuevaPestana")}
                </span>
              </a>
            </span>
          </p>
        )}

        <div className="tarjeta__metas">
          <p className="tarjeta__meta">
            <span>
              <strong>{t("tarjetas.requeridasEnComun")}</strong>{" "}
              {listarHabilidades(colaboradora.requeridasCoincidentes)}
            </span>
          </p>
          <p className="tarjeta__meta">
            <span>
              <strong>{t("tarjetas.opcionalesEnComun")}</strong>{" "}
              {listarHabilidades(colaboradora.opcionalesCoincidentes)}
            </span>
          </p>
        </div>
      </div>

      <div className="tarjeta__acciones">
        <Button
          variant="outlined"
          type="button"
          startIcon={<FiMail aria-hidden="true" />}
          disabled={
            !colaboradora.aceptaMensajeria ||
            !idProyecto ||
            !idPerfil ||
            invitacionEnviada
          }
          aria-describedby={`${idTitulo}-contacto`}
          onClick={() => setDialogoAbierto(true)}
        >
          {!colaboradora.aceptaMensajeria
            ? t("tarjetas.noAceptaMensajes")
            : invitacionEnviada
              ? t("tarjetas.invitacionEnviada")
              : t("tarjetas.contactar")}
        </Button>
        <span id={`${idTitulo}-contacto`} className="texto-secundario">
          {colaboradora.aceptaMensajeria
            ? t("tarjetas.invitarPerfil")
            : t("tarjetas.noAceptaMensajesDescripcion")}
        </span>
      </div>
      {invitacionEnviada && (
        <Alert severity="success" role="status">
          {t("tarjetas.invitacionBandeja")}
        </Alert>
      )}

      <Dialog
        open={dialogoAbierto}
        onClose={cerrarDialogo}
        fullWidth
        maxWidth="sm"
        aria-labelledby={dialogTitleId}
      >
        <form onSubmit={enviarMensaje}>
          <DialogTitle id={dialogTitleId}>
            {t("tarjetas.contactarNombre", {
              nombre: nombreVisible(colaboradora),
            })}
          </DialogTitle>
          <DialogContent>
            {resultado ? (
              <Alert severity="success" role="status">
                {t("tarjetas.invitacionPlataforma")}
              </Alert>
            ) : (
              <>
                <p>{t("tarjetas.invitacionDescripcion")}</p>
                {nombreProyecto && (
                  <p>
                    {t("tarjetas.proyectoInvitacion", {
                      proyecto: nombreProyecto,
                    })}
                  </p>
                )}
                {descripcionPerfil && (
                  <p>
                    {t("tarjetas.perfilInvitacion", {
                      perfil: descripcionPerfil,
                    })}
                  </p>
                )}
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={4}
                  label={t("tarjetas.mensajeOpcional")}
                  value={contenido}
                  onChange={(event) => setContenido(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  helperText={`${contenido.length}/500`}
                  disabled={enviando}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            {resultado ? (
              <Button onClick={cerrarDialogo}>{t("proyectos.cerrar")}</Button>
            ) : (
              <>
                <Button onClick={cerrarDialogo} disabled={enviando}>
                  {t("comun.cancelar")}
                </Button>
                <Button type="submit" variant="contained" disabled={enviando}>
                  {enviando
                    ? t("tarjetas.enviando")
                    : t("tarjetas.enviarInvitacion")}
                </Button>
              </>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </li>
  );
}

CardColaboradora.propTypes = {
  idProyecto: PropTypes.string,
  idPerfil: PropTypes.string,
  nombreProyecto: PropTypes.string,
  descripcionPerfil: PropTypes.string,
  colaboradora: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombreFantasia: PropTypes.string,
    usuarioGitHub: PropTypes.string,
    pronombres: PropTypes.arrayOf(PropTypes.string),
    presentacion: PropTypes.string,
    aceptaMensajeria: PropTypes.bool,
    tieneCoincidencia: PropTypes.bool,
    requeridasCoincidentes: PropTypes.arrayOf(PropTypes.string),
    opcionalesCoincidentes: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
